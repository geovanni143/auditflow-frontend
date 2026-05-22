"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { AppNav } from "@/components/AppNav";
import { createProject, getProjects } from "@/lib/projects";
import type { AuthUser } from "@/types/auth";
import type { Project, ProjectStatus } from "@/types/project";

const statuses: ProjectStatus[] = [
  "DRAFT",
  "ACTIVE",
  "IN_REVIEW",
  "COMPLETED",
  "ARCHIVED",
];

export default function ProjectsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("ACTIVE");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  function handlePageError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        router.replace("/login");
        return;
      }

      if (err.status === 403) {
        setError("No tienes permiso para acceder a proyectos.");
        return;
      }

      setError(err.message);
      return;
    }

    setError("No se pudo conectar con el servidor.");
  }

  async function loadProjects() {
    setError(null);

    try {
      const currentUser = await getMe();
      const data = await getProjects();

      setUser(currentUser);
      setProjects(data);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setIsCreating(true);

    try {
      await createProject({
        name,
        target,
        description,
        status,
      });

      setName("");
      setTarget("");
      setDescription("");
      setStatus("ACTIVE");

      await loadProjects();
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    void loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <section className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[380px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Crear proyecto</h2>
          <p className="mt-2 text-sm text-slate-400">
            Solo usuarios ADMIN pueden crear proyectos.
          </p>

          {user?.role !== "ADMIN" ? (
            <div className="mt-6 rounded-xl border border-yellow-900 bg-yellow-950/40 p-4 text-sm text-yellow-100">
              Tu rol actual es {user?.role}. Puedes ver proyectos asignados,
              pero no crear nuevos.
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
                  onChange={(event) => setName(event.target.value)}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="target"
                  className="mb-2 block text-sm text-slate-300"
                >
                  Target
                </label>
                <input
                  id="target"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={target}
                  onChange={(event) => setTarget(event.target.value)}
                  placeholder="https://example.com"
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
                  onChange={(event) => setDescription(event.target.value)}
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
                  onChange={(event) =>
                    setStatus(event.target.value as ProjectStatus)
                  }
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
        </aside>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Listado de proyectos</h2>
              <p className="mt-1 text-sm text-slate-400">
                ADMIN ve proyectos de su organización. AUDITOR solo ve
                asignados.
              </p>
            </div>
          </div>

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
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold">{project.name}</h3>
                    <p className="mt-2 text-sm text-slate-400">
                      {project.description || "Sin descripción"}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      Target: {project.target}
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-900 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-200">
                    {project.status}
                  </span>
                </div>

                <div className="mt-4 text-sm text-slate-400">
                  Auditores asignados: {project.auditors.length}
                </div>
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