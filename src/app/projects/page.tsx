"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import {
  assignAuditorToProject,
  createProject,
  deleteProject,
  getProjects,
  updateProject,
} from "@/lib/projects";
import { getAuditors } from "@/lib/users";
import type { AuthUser } from "@/types/auth";
import type { Project, ProjectStatus } from "@/types/project";
import type { AppUser } from "@/types/user";

const statuses: ProjectStatus[] = [
  "DRAFT",
  "ACTIVE",
  "IN_REVIEW",
  "COMPLETED",
  "ARCHIVED",
];

function isValidProjectStatus(value: string | null): value is ProjectStatus {
  return value !== null && statuses.includes(value as ProjectStatus);
}

function getValidNumber(value: string | null): number | null {
  if (!value) return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const draftName = searchParams.get("projectDraftName") ?? "";
  const draftTarget = searchParams.get("projectDraftTarget") ?? "";
  const draftDescription = searchParams.get("projectDraftDescription") ?? "";
  const draftStatus = searchParams.get("projectDraftStatus");

  const editProjectId = getValidNumber(searchParams.get("editProjectId"));
  const editName = searchParams.get("editProjectName") ?? "";
  const editTarget = searchParams.get("editProjectTarget") ?? "";
  const editDescription = searchParams.get("editProjectDescription") ?? "";
  const editStatusParam = searchParams.get("editProjectStatus");

  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [auditors, setAuditors] = useState<AppUser[]>([]);

  const [name, setName] = useState(draftName);
  const [target, setTarget] = useState(draftTarget);
  const [description, setDescription] = useState(draftDescription);
  const [status, setStatus] = useState<ProjectStatus>(
    isValidProjectStatus(draftStatus) ? draftStatus : "ACTIVE"
  );

  const [editingProjectId, setEditingProjectId] = useState<number | null>(
    editProjectId
  );
  const [editFormName, setEditFormName] = useState(editName);
  const [editFormTarget, setEditFormTarget] = useState(editTarget);
  const [editFormDescription, setEditFormDescription] =
    useState(editDescription);
  const [editFormStatus, setEditFormStatus] = useState<ProjectStatus>(
    isValidProjectStatus(editStatusParam) ? editStatusParam : "ACTIVE"
  );

  const [selectedAuditorByProject, setSelectedAuditorByProject] = useState<
    Record<number, string>
  >({});

  const [error, setError] = useState<string | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingProjectId, setSavingProjectId] = useState<number | null>(null);
  const [deletingProjectId, setDeletingProjectId] = useState<number | null>(
    null
  );
  const [assigningProjectId, setAssigningProjectId] = useState<number | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  function replaceProjectsUrl(params: URLSearchParams) {
    const query = params.toString();

    router.replace(query ? `/projects?${query}` : "/projects", {
      scroll: false,
    });
  }

  function updateUrlField(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    replaceProjectsUrl(params);
  }

  function clearCreateDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("projectDraftName");
    params.delete("projectDraftTarget");
    params.delete("projectDraftDescription");
    params.delete("projectDraftStatus");

    replaceProjectsUrl(params);
  }

  function clearEditDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("editProjectId");
    params.delete("editProjectName");
    params.delete("editProjectTarget");
    params.delete("editProjectDescription");
    params.delete("editProjectStatus");

    replaceProjectsUrl(params);
  }

  function handlePageError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        router.replace("/login");
        return;
      }

      if (err.status === 403) {
        setError("No tienes permiso para gestionar proyectos.");
        return;
      }

      if (err.status === 404) {
        setError("El recurso no existe o no pertenece a tu organización.");
        return;
      }

      if (err.status === 409) {
        setError(
          "No se puede completar la operación porque hay información relacionada."
        );
        return;
      }

      setError(err.message);
      return;
    }

    setError("No se pudo conectar con el servidor.");
  }

  async function loadProjects() {
    setError(null);
    setIsLoading(true);

    try {
      const currentUser = await getMe();
      const projectsData = await getProjects();

      setUser(currentUser);
      setProjects(projectsData);

      if (currentUser.role === "ADMIN") {
        try {
          const auditorsData = await getAuditors();
          setAuditors(auditorsData);
        } catch (err) {
          setAuditors([]);

          if (err instanceof ApiError && err.status === 404) {
            setError(
              "Falta el endpoint GET /api/users/auditors en el backend para listar auditores."
            );
            return;
          }

          handlePageError(err);
        }
      }
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setSecurityWarning(null);
    setIsCreating(true);

    try {
      await createProject({
        name,
        target,
        description: description || undefined,
        status,
      });

      setName("");
      setTarget("");
      setDescription("");
      setStatus("ACTIVE");

      clearCreateDraft();
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(project: Project) {
    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a editar el proyecto "${project.name}".\n\nEsto puede afectar los hallazgos y auditores relacionados.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    setSecurityWarning(
      `Estás editando el proyecto "${project.name}". Verifica nombre, cliente/target y estado antes de guardar.`
    );

    setEditingProjectId(project.id);
    setEditFormName(project.name);
    setEditFormTarget(project.target);
    setEditFormDescription(project.description ?? "");
    setEditFormStatus(project.status);

    const params = new URLSearchParams(searchParams.toString());

    params.set("editProjectId", String(project.id));
    params.set("editProjectName", project.name);
    params.set("editProjectTarget", project.target);
    params.set("editProjectStatus", project.status);

    if (project.description) {
      params.set("editProjectDescription", project.description);
    } else {
      params.delete("editProjectDescription");
    }

    replaceProjectsUrl(params);
  }

  function cancelEditing() {
    setSecurityWarning(null);
    setEditingProjectId(null);
    setEditFormName("");
    setEditFormTarget("");
    setEditFormDescription("");
    setEditFormStatus("ACTIVE");

    clearEditDraft();
  }

  async function handleUpdateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProjectId) {
      setError("Selecciona un proyecto para editar.");
      return;
    }

    const confirmed = window.confirm(
      "Advertencia de seguridad:\n\nEstás a punto de guardar cambios en un proyecto de auditoría.\n\nVerifica que el cliente/target, estado y descripción sean correctos.\n\n¿Confirmas la actualización?"
    );

    if (!confirmed) return;

    setError(null);
    setSavingProjectId(editingProjectId);

    try {
      await updateProject(editingProjectId, {
        name: editFormName,
        target: editFormTarget,
        description: editFormDescription || undefined,
        status: editFormStatus,
      });

      cancelEditing();
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setSavingProjectId(null);
    }
  }

  async function handleDeleteProject(project: Project) {
    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a eliminar el proyecto "${project.name}".\n\nEsta acción puede afectar hallazgos, asignaciones de auditores y evidencias relacionadas.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      `Confirmación final:\n\nEliminarás definitivamente el proyecto "${project.name}".\n\nPresiona Aceptar solo si estás completamente seguro.`
    );

    if (!secondConfirmation) return;

    setError(null);
    setSecurityWarning(null);
    setDeletingProjectId(project.id);

    try {
      await deleteProject(project.id);

      if (editingProjectId === project.id) {
        cancelEditing();
      }

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setDeletingProjectId(null);
    }
  }

  async function handleAssignAuditor(project: Project) {
    const auditorId = selectedAuditorByProject[project.id];

    if (!auditorId) {
      setError("Selecciona un auditor para asignar.");
      return;
    }

    const selectedAuditor = auditors.find(
      (auditor) => String(auditor.id) === auditorId
    );

    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a asignar el auditor "${
        selectedAuditor?.fullName ?? "seleccionado"
      }" al proyecto "${project.name}".\n\nEl auditor podrá interactuar con este proyecto.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    setError(null);
    setSecurityWarning(null);
    setAssigningProjectId(project.id);

    try {
      await assignAuditorToProject(project.id, {
        auditorId: Number(auditorId),
      });

      setSelectedAuditorByProject((currentValue) => ({
        ...currentValue,
        [project.id]: "",
      }));

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setAssigningProjectId(null);
    }
  }

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">Cargando proyectos...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav title="Proyectos" />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Crear proyecto</h2>

            <p className="mt-2 text-sm text-slate-400">
              Solo usuarios ADMIN pueden crear proyectos. El formulario se
              conserva en la URL al recargar. No se usa localStorage ni
              sessionStorage.
            </p>

            {user?.role !== "ADMIN" ? (
              <div className="mt-6 rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-sm text-yellow-100">
                Tu rol actual es {user?.role}. Puedes ver proyectos asignados,
                pero no crear, editar, eliminar ni asignar auditores.
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Nombre
                  </label>

                  <input
                    id="name"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      updateUrlField("projectDraftName", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="target"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Cliente / Target
                  </label>

                  <input
                    id="target"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={target}
                    onChange={(event) => {
                      setTarget(event.target.value);
                      updateUrlField("projectDraftTarget", event.target.value);
                    }}
                    placeholder="Cliente o URL objetivo"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Descripción
                  </label>

                  <textarea
                    id="description"
                    className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={description}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      updateUrlField(
                        "projectDraftDescription",
                        event.target.value
                      );
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="status"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Estado
                  </label>

                  <select
                    id="status"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={status}
                    onChange={(event) => {
                      const nextStatus = event.target.value as ProjectStatus;
                      setStatus(nextStatus);
                      updateUrlField("projectDraftStatus", nextStatus);
                    }}
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "Creando..." : "Crear proyecto"}
                </button>
              </form>
            )}
          </section>

          {user?.role === "ADMIN" && editingProjectId && (
            <section className="rounded-2xl border border-yellow-900 bg-yellow-950/20 p-6">
              <div className="rounded-xl border border-yellow-800 bg-yellow-950/50 p-4 text-sm text-yellow-100">
                Advertencia: estás editando un proyecto de auditoría. Revisa
                cuidadosamente los datos antes de guardar.
              </div>

              <h2 className="mt-5 text-xl font-semibold">Editar proyecto</h2>

              <p className="mt-2 text-sm text-slate-400">
                El formulario de edición también se conserva en la URL.
              </p>

              <form onSubmit={handleUpdateProject} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Nombre
                  </label>

                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormName}
                    onChange={(event) => {
                      setEditFormName(event.target.value);
                      updateUrlField("editProjectName", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Cliente / Target
                  </label>

                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormTarget}
                    onChange={(event) => {
                      setEditFormTarget(event.target.value);
                      updateUrlField("editProjectTarget", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Descripción
                  </label>

                  <textarea
                    className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormDescription}
                    onChange={(event) => {
                      setEditFormDescription(event.target.value);
                      updateUrlField(
                        "editProjectDescription",
                        event.target.value
                      );
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Estado
                  </label>

                  <select
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormStatus}
                    onChange={(event) => {
                      const nextStatus = event.target.value as ProjectStatus;
                      setEditFormStatus(nextStatus);
                      updateUrlField("editProjectStatus", nextStatus);
                    }}
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="submit"
                    disabled={savingProjectId === editingProjectId}
                    className="rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingProjectId === editingProjectId
                      ? "Guardando..."
                      : "Guardar cambios"}
                  </button>

                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Cancelar edición
                  </button>
                </div>
              </form>
            </section>
          )}
        </aside>

        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Listado de proyectos</h2>

            <p className="mt-1 text-sm text-slate-400">
              ADMIN gestiona proyectos de su organización. AUDITOR solo ve
              proyectos asignados.
            </p>
          </div>

          {securityWarning && (
            <div className="mb-4 rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-sm text-yellow-100">
              {securityWarning}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {projects.map((project) => (
              <article
                key={project.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {project.description || "Sin descripción"}
                    </p>

                    <p className="mt-3 text-sm text-slate-300">
                      Cliente / Target: {project.target}
                    </p>

                    <p className="mt-2 text-sm text-slate-400">
                      Auditores asignados: {project.auditors.length}
                    </p>

                    {project.auditors.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        {project.auditors
                          .map(
                            (auditor) =>
                              `${auditor.fullName} (${auditor.email})`
                          )
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 md:items-end">
                    <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-200">
                      {project.status}
                    </span>

                    {user?.role === "ADMIN" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(project)}
                          className="rounded-xl border border-yellow-800 px-3 py-2 text-sm text-yellow-100 hover:bg-yellow-950/40"
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          disabled={deletingProjectId === project.id}
                          onClick={() => void handleDeleteProject(project)}
                          className="rounded-xl border border-red-900 px-3 py-2 text-sm text-red-200 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingProjectId === project.id
                            ? "Eliminando..."
                            : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {user?.role === "ADMIN" && (
                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <p className="mb-3 text-sm font-medium text-slate-200">
                      Asignar auditor
                    </p>

                    <div className="flex flex-col gap-3 md:flex-row">
                      <select
                        className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                        value={selectedAuditorByProject[project.id] ?? ""}
                        onChange={(event) =>
                          setSelectedAuditorByProject((currentValue) => ({
                            ...currentValue,
                            [project.id]: event.target.value,
                          }))
                        }
                      >
                        <option value="">Selecciona auditor</option>

                        {auditors.map((auditor) => (
                          <option key={auditor.id} value={auditor.id}>
                            {auditor.fullName} — {auditor.email}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        disabled={
                          assigningProjectId === project.id ||
                          !selectedAuditorByProject[project.id]
                        }
                        onClick={() => void handleAssignAuditor(project)}
                        className="rounded-xl border border-cyan-900 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {assigningProjectId === project.id
                          ? "Asignando..."
                          : "Asignar auditor"}
                      </button>
                    </div>

                    {auditors.length === 0 && (
                      <p className="mt-3 text-xs text-yellow-200">
                        No hay auditores disponibles o falta el endpoint de
                        usuarios en backend.
                      </p>
                    )}
                  </div>
                )}
              </article>
            ))}

            {projects.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                No hay proyectos disponibles.
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p className="text-sm text-slate-300">Cargando proyectos...</p>
        </main>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}