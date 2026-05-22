"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api";
import {
  createFinding,
  deleteFinding,
  getFindings,
  updateFinding,
} from "@/lib/findings";
import { getProjects } from "@/lib/projects";
import { AppNav } from "@/components/AppNav";
import type { Finding, FindingStatus, Severity } from "@/types/finding";
import type { Project } from "@/types/project";

const severities: Severity[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const statuses: FindingStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
  "FALSE_POSITIVE",
];

function isValidSeverity(value: string | null): value is Severity {
  return value !== null && severities.includes(value as Severity);
}

function isValidStatus(value: string | null): value is FindingStatus {
  return value !== null && statuses.includes(value as FindingStatus);
}

function getValidPage(value: string | null): number {
  if (!value) return 1;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

function getValidProjectId(value: string | null): number | undefined {
  if (!value) return undefined;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}

function FindingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectIdParam = searchParams.get("projectId");
  const severityParam = searchParams.get("severity");
  const statusParam = searchParams.get("status");
  const pageParam = searchParams.get("page");

  const selectedProjectId = getValidProjectId(projectIdParam);
  const selectedSeverity = isValidSeverity(severityParam) ? severityParam : "";
  const selectedStatus = isValidStatus(statusParam) ? statusParam : "";
  const selectedPage = getValidPage(pageParam);

  const draftProjectId = searchParams.get("draftProjectId") ?? "";
  const draftTitle = searchParams.get("draftTitle") ?? "";
  const draftDescription = searchParams.get("draftDescription") ?? "";
  const draftRecommendation = searchParams.get("draftRecommendation") ?? "";
  const draftEvidence = searchParams.get("draftEvidence") ?? "";
  const draftSeverity = searchParams.get("draftSeverity");
  const draftStatus = searchParams.get("draftStatus");

  const editFindingIdParam = searchParams.get("editFindingId");
  const editTitle = searchParams.get("editTitle") ?? "";
  const editDescription = searchParams.get("editDescription") ?? "";
  const editRecommendation = searchParams.get("editRecommendation") ?? "";
  const editEvidence = searchParams.get("editEvidence") ?? "";
  const editSeverityParam = searchParams.get("editSeverity");
  const editStatusParam = searchParams.get("editStatus");

  const dataQueryKey = useMemo(
    () =>
      JSON.stringify({
        projectId: selectedProjectId,
        severity: selectedSeverity,
        status: selectedStatus,
        page: selectedPage,
      }),
    [selectedProjectId, selectedSeverity, selectedStatus, selectedPage]
  );

  const filters = useMemo(
    () => ({
      page: selectedPage - 1,
      size: 10,
      projectId: selectedProjectId,
      severity: selectedSeverity || undefined,
      status: selectedStatus || undefined,
    }),
    [selectedPage, selectedProjectId, selectedSeverity, selectedStatus]
  );

  const [projects, setProjects] = useState<Project[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);

  const [createProjectId, setCreateProjectId] = useState(draftProjectId);
  const [title, setTitle] = useState(draftTitle);
  const [description, setDescription] = useState(draftDescription);
  const [recommendation, setRecommendation] = useState(draftRecommendation);
  const [evidence, setEvidence] = useState(draftEvidence);
  const [severity, setSeverity] = useState<Severity>(
    isValidSeverity(draftSeverity) ? draftSeverity : "HIGH"
  );
  const [status, setStatus] = useState<FindingStatus>(
    isValidStatus(draftStatus) ? draftStatus : "OPEN"
  );

  const [editingFindingId, setEditingFindingId] = useState<number | null>(
    editFindingIdParam ? Number(editFindingIdParam) : null
  );
  const [editFormTitle, setEditFormTitle] = useState(editTitle);
  const [editFormDescription, setEditFormDescription] =
    useState(editDescription);
  const [editFormRecommendation, setEditFormRecommendation] =
    useState(editRecommendation);
  const [editFormEvidence, setEditFormEvidence] = useState(editEvidence);
  const [editFormSeverity, setEditFormSeverity] = useState<Severity>(
    isValidSeverity(editSeverityParam) ? editSeverityParam : "HIGH"
  );
  const [editFormStatus, setEditFormStatus] = useState<FindingStatus>(
    isValidStatus(editStatusParam) ? editStatusParam : "OPEN"
  );

  const [error, setError] = useState<string | null>(null);
  const [filterWarning, setFilterWarning] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [savingFindingId, setSavingFindingId] = useState<number | null>(null);
  const [deletingFindingId, setDeletingFindingId] = useState<number | null>(
    null
  );
  const [refreshKey, setRefreshKey] = useState(0);

  function replaceFindingsUrl(params: URLSearchParams) {
    const query = params.toString();

    router.replace(query ? `/findings?${query}` : "/findings", {
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

    replaceFindingsUrl(params);
  }

  function updateUrlFilters(next: {
    projectId?: string;
    severity?: string;
    status?: string;
    page?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());

    if (next.projectId !== undefined) {
      if (next.projectId) {
        params.set("projectId", next.projectId);
      } else {
        params.delete("projectId");
      }
    }

    if (next.severity !== undefined) {
      if (next.severity) {
        params.set("severity", next.severity);
      } else {
        params.delete("severity");
      }
    }

    if (next.status !== undefined) {
      if (next.status) {
        params.set("status", next.status);
      } else {
        params.delete("status");
      }
    }

    if (next.page !== undefined) {
      const safePage = Math.max(next.page, 1);

      if (safePage > 1) {
        params.set("page", String(safePage));
      } else {
        params.delete("page");
      }
    }

    replaceFindingsUrl(params);
  }

  function clearFilters() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("projectId");
    params.delete("severity");
    params.delete("status");
    params.delete("page");

    replaceFindingsUrl(params);
  }

  function clearCreateDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("draftProjectId");
    params.delete("draftTitle");
    params.delete("draftDescription");
    params.delete("draftRecommendation");
    params.delete("draftEvidence");
    params.delete("draftSeverity");
    params.delete("draftStatus");

    replaceFindingsUrl(params);
  }

  function clearEditDraft() {
    const params = new URLSearchParams(searchParams.toString());

    params.delete("editFindingId");
    params.delete("editTitle");
    params.delete("editDescription");
    params.delete("editRecommendation");
    params.delete("editEvidence");
    params.delete("editSeverity");
    params.delete("editStatus");

    replaceFindingsUrl(params);
  }

  function handlePageError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        router.replace("/login");
        return;
      }

      if (err.status === 403) {
        setError("No tienes permiso para gestionar estos hallazgos.");
        return;
      }

      if (err.status === 404) {
        setError("El hallazgo no existe o no pertenece a tu organización.");
        return;
      }

      setError(err.message);
      return;
    }

    setError("No se pudo conectar con el servidor.");
  }

  async function loadData() {
    setError(null);
    setFilterWarning(null);
    setIsLoading(true);

    if (severityParam && !isValidSeverity(severityParam)) {
      setFilterWarning(
        `La severidad "${severityParam}" no es válida. Usa LOW, MEDIUM, HIGH o CRITICAL.`
      );
    }

    if (statusParam && !isValidStatus(statusParam)) {
      setFilterWarning(
        `El estado "${statusParam}" no es válido. Usa OPEN, IN_PROGRESS, RESOLVED, CLOSED o FALSE_POSITIVE.`
      );
    }

    try {
      const [projectsData, findingsPage] = await Promise.all([
        getProjects(),
        getFindings(filters),
      ]);

      setProjects(projectsData);
      setFindings(findingsPage.content);
      setTotalElements(findingsPage.totalElements);
      setTotalPages(findingsPage.totalPages);
      setCurrentPage(findingsPage.page);

      if (!createProjectId && projectsData.length > 0) {
        setCreateProjectId(String(projectsData[0].id));
      }
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!createProjectId) {
      setError("Selecciona un proyecto.");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await createFinding({
        projectId: Number(createProjectId),
        title,
        description,
        recommendation: recommendation || undefined,
        evidence: evidence || undefined,
        severity,
        status,
      });

      setTitle("");
      setDescription("");
      setRecommendation("");
      setEvidence("");
      setSeverity("HIGH");
      setStatus("OPEN");

      clearCreateDraft();
      updateUrlFilters({ page: 1 });
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsCreating(false);
    }
  }

  function startEditing(finding: Finding) {
    const confirmed = window.confirm(
      `Vas a editar el hallazgo "${finding.title}".\n\nEsta acción modificará información de auditoría. ¿Deseas continuar?`
    );

    if (!confirmed) return;

    setEditingFindingId(finding.id);
    setEditFormTitle(finding.title);
    setEditFormDescription(finding.description);
    setEditFormRecommendation(finding.recommendation ?? "");
    setEditFormEvidence(finding.evidence ?? "");
    setEditFormSeverity(finding.severity);
    setEditFormStatus(finding.status);

    const params = new URLSearchParams(searchParams.toString());

    params.set("editFindingId", String(finding.id));
    params.set("editTitle", finding.title);
    params.set("editDescription", finding.description);
    params.set("editSeverity", finding.severity);
    params.set("editStatus", finding.status);

    if (finding.recommendation) {
      params.set("editRecommendation", finding.recommendation);
    } else {
      params.delete("editRecommendation");
    }

    if (finding.evidence) {
      params.set("editEvidence", finding.evidence);
    } else {
      params.delete("editEvidence");
    }

    replaceFindingsUrl(params);
  }

  function cancelEditing() {
    setEditingFindingId(null);
    setEditFormTitle("");
    setEditFormDescription("");
    setEditFormRecommendation("");
    setEditFormEvidence("");
    setEditFormSeverity("HIGH");
    setEditFormStatus("OPEN");

    clearEditDraft();
  }

  async function handleUpdateFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingFindingId) {
      setError("Selecciona un hallazgo para editar.");
      return;
    }

    const confirmed = window.confirm(
      "Advertencia de seguridad:\n\nEstás a punto de guardar cambios en un hallazgo de auditoría. Verifica que la evidencia, severidad y estado sean correctos.\n\n¿Confirmas la actualización?"
    );

    if (!confirmed) return;

    setError(null);
    setSavingFindingId(editingFindingId);

    try {
      await updateFinding(editingFindingId, {
        title: editFormTitle,
        description: editFormDescription,
        recommendation: editFormRecommendation || undefined,
        evidence: editFormEvidence || undefined,
        severity: editFormSeverity,
        status: editFormStatus,
      });

      cancelEditing();
      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setSavingFindingId(null);
    }
  }

  async function handleDeleteFinding(finding: Finding) {
    const confirmed = window.confirm(
      `Advertencia de seguridad:\n\nVas a eliminar el hallazgo "${finding.title}".\n\nEsta acción puede ser irreversible y debe estar autorizada.\n\n¿Deseas continuar?`
    );

    if (!confirmed) return;

    const secondConfirmation = window.confirm(
      `Confirmación final:\n\nEliminarás definitivamente el hallazgo "${finding.title}".\n\nPresiona Aceptar solo si estás seguro.`
    );

    if (!secondConfirmation) return;

    setError(null);
    setDeletingFindingId(finding.id);

    try {
      await deleteFinding(finding.id);

      if (editingFindingId === finding.id) {
        cancelEditing();
      }

      setRefreshKey((currentValue) => currentValue + 1);
    } catch (err) {
      handlePageError(err);
    } finally {
      setDeletingFindingId(null);
    }
  }

  useEffect(() => {
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataQueryKey, refreshKey]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-sm text-slate-300">Cargando findings...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav title="Findings" />

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[420px_1fr]">
        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-xl font-semibold">Crear nuevo finding</h2>

            <p className="mt-2 text-sm text-slate-400">
              El formulario conserva datos en la URL al recargar. No se usa
              localStorage ni sessionStorage.
            </p>

            <form onSubmit={handleCreateFinding} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="createProjectId"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Proyecto
                </label>

                <select
                  id="createProjectId"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={createProjectId}
                  onChange={(event) => {
                    setCreateProjectId(event.target.value);
                    updateUrlField("draftProjectId", event.target.value);
                  }}
                  required
                >
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Título
                </label>

                <input
                  id="title"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    updateUrlField("draftTitle", event.target.value);
                  }}
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
                    updateUrlField("draftDescription", event.target.value);
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="recommendation"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Recomendación
                </label>

                <textarea
                  id="recommendation"
                  className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={recommendation}
                  onChange={(event) => {
                    setRecommendation(event.target.value);
                    updateUrlField("draftRecommendation", event.target.value);
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="evidence"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Evidencia
                </label>

                <textarea
                  id="evidence"
                  className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={evidence}
                  onChange={(event) => {
                    setEvidence(event.target.value);
                    updateUrlField("draftEvidence", event.target.value);
                  }}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="severity"
                    className="mb-2 block text-sm text-slate-300"
                  >
                    Severidad
                  </label>

                  <select
                    id="severity"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={severity}
                    onChange={(event) => {
                      const nextSeverity = event.target.value as Severity;
                      setSeverity(nextSeverity);
                      updateUrlField("draftSeverity", nextSeverity);
                    }}
                  >
                    {severities.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
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
                      const nextStatus = event.target.value as FindingStatus;
                      setStatus(nextStatus);
                      updateUrlField("draftStatus", nextStatus);
                    }}
                  >
                    {statuses.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating || projects.length === 0}
                className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Creando..." : "Crear finding"}
              </button>
            </form>
          </section>

          {editingFindingId && (
            <section className="rounded-2xl border border-yellow-900 bg-yellow-950/20 p-6">
              <div className="rounded-xl border border-yellow-800 bg-yellow-950/50 p-4 text-sm text-yellow-100">
                Advertencia: estás editando un hallazgo de auditoría. Revisa
                cuidadosamente la severidad, estado, evidencia y recomendación
                antes de guardar.
              </div>

              <h2 className="mt-5 text-xl font-semibold">Editar finding</h2>

              <p className="mt-2 text-sm text-slate-400">
                El formulario de edición también se conserva en la URL.
              </p>

              <form onSubmit={handleUpdateFinding} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Título
                  </label>

                  <input
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormTitle}
                    onChange={(event) => {
                      setEditFormTitle(event.target.value);
                      updateUrlField("editTitle", event.target.value);
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
                      updateUrlField("editDescription", event.target.value);
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Recomendación
                  </label>

                  <textarea
                    className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormRecommendation}
                    onChange={(event) => {
                      setEditFormRecommendation(event.target.value);
                      updateUrlField("editRecommendation", event.target.value);
                    }}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-slate-300">
                    Evidencia
                  </label>

                  <textarea
                    className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                    value={editFormEvidence}
                    onChange={(event) => {
                      setEditFormEvidence(event.target.value);
                      updateUrlField("editEvidence", event.target.value);
                    }}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Severidad
                    </label>

                    <select
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                      value={editFormSeverity}
                      onChange={(event) => {
                        const nextSeverity = event.target.value as Severity;
                        setEditFormSeverity(nextSeverity);
                        updateUrlField("editSeverity", nextSeverity);
                      }}
                    >
                      {severities.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-slate-300">
                      Estado
                    </label>

                    <select
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                      value={editFormStatus}
                      onChange={(event) => {
                        const nextStatus = event.target.value as FindingStatus;
                        setEditFormStatus(nextStatus);
                        updateUrlField("editStatus", nextStatus);
                      }}
                    >
                      {statuses.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <button
                    type="submit"
                    disabled={savingFindingId === editingFindingId}
                    className="rounded-xl bg-yellow-400 px-4 py-3 font-semibold text-slate-950 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingFindingId === editingFindingId
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
          <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Filtros y listado de findings
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Los filtros se guardan en la URL y se mantienen al recargar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
                value={selectedProjectId ? String(selectedProjectId) : ""}
                onChange={(event) =>
                  updateUrlFilters({
                    projectId: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">Todos los proyectos visibles</option>

                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
                value={selectedSeverity}
                onChange={(event) =>
                  updateUrlFilters({
                    severity: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">Todas las severidades</option>

                {severities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
                value={selectedStatus}
                onChange={(event) =>
                  updateUrlFilters({
                    status: event.target.value,
                    page: 1,
                  })
                }
              >
                <option value="">Todos los estados</option>

                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400 hover:text-cyan-300"
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-400">
            Total encontrado: {totalElements}
          </div>

          {filterWarning && (
            <div className="mb-4 rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-sm text-yellow-100">
              {filterWarning}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl border border-red-900 bg-red-950/40 p-4 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {findings.map((finding) => (
              <article
                key={finding.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{finding.title}</h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {finding.description}
                    </p>

                    <p className="mt-3 text-sm text-slate-300">
                      Proyecto: {finding.projectName}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      Reportado por: {finding.reportedByName}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full border border-red-900 bg-red-950/40 px-3 py-1 text-xs text-red-200">
                      {finding.severity}
                    </span>

                    <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs text-cyan-200">
                      {finding.status}
                    </span>
                  </div>
                </div>

                {finding.recommendation && (
                  <p className="mt-4 text-sm text-slate-400">
                    Recomendación: {finding.recommendation}
                  </p>
                )}

                {finding.evidence && (
                  <p className="mt-3 text-sm text-slate-500">
                    Evidencia: {finding.evidence}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(finding)}
                    className="rounded-xl border border-yellow-800 px-4 py-2 text-sm text-yellow-100 hover:bg-yellow-950/40"
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    disabled={deletingFindingId === finding.id}
                    onClick={() => void handleDeleteFinding(finding)}
                    className="rounded-xl border border-red-900 px-4 py-2 text-sm text-red-200 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingFindingId === finding.id
                      ? "Eliminando..."
                      : "Eliminar"}
                  </button>
                </div>
              </article>
            ))}

            {findings.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                No hay findings disponibles con los filtros actuales.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={currentPage <= 0}
              onClick={() => updateUrlFilters({ page: currentPage })}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            <p className="text-sm text-slate-400">
              Página {currentPage + 1} de {Math.max(totalPages, 1)}
            </p>

            <button
              type="button"
              disabled={currentPage + 1 >= totalPages}
              onClick={() => updateUrlFilters({ page: currentPage + 2 })}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}

export default function FindingsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <p className="text-sm text-slate-300">Cargando findings...</p>
        </main>
      }
    >
      <FindingsContent />
    </Suspense>
  );
}