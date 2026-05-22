"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { createFinding, getFindings } from "@/lib/findings";
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

export default function FindingsPage() {
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [severityFilter, setSeverityFilter] = useState<Severity | "">("");
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "">("");

  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [evidence, setEvidence] = useState("");
  const [severity, setSeverity] = useState<Severity>("HIGH");
  const [status, setStatus] = useState<FindingStatus>("OPEN");

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
        setError("No tienes permiso para acceder a findings.");
        return;
      }

      setError(err.message);
      return;
    }

    setError("No se pudo conectar con el servidor.");
  }

  async function loadData(nextPage = page) {
    setError(null);

    try {
      const [projectsData, findingsPage] = await Promise.all([
        getProjects(),
        getFindings({
          page: nextPage,
          size: 10,
          severity: severityFilter || undefined,
          status: statusFilter || undefined,
        }),
      ]);

      setProjects(projectsData);
      setFindings(findingsPage.content);
      setPage(findingsPage.page);
      setTotalPages(findingsPage.totalPages);

      if (!projectId && projectsData.length > 0) {
        setProjectId(String(projectsData[0].id));
      }
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectId) {
      setError("Selecciona un proyecto.");
      return;
    }

    setError(null);
    setIsCreating(true);

    try {
      await createFinding({
        projectId: Number(projectId),
        title,
        description,
        recommendation,
        evidence,
        severity,
        status,
      });

      setTitle("");
      setDescription("");
      setRecommendation("");
      setEvidence("");
      setSeverity("HIGH");
      setStatus("OPEN");

      await loadData(0);
    } catch (err) {
      handlePageError(err);
    } finally {
      setIsCreating(false);
    }
  }

  useEffect(() => {
    void loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [severityFilter, statusFilter]);

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
        <aside className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-xl font-semibold">Crear finding</h2>
          <p className="mt-2 text-sm text-slate-400">
            Los auditores solo pueden crear findings en proyectos asignados.
          </p>

          <form onSubmit={handleCreateFinding} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Proyecto
              </label>
              <select
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
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
              <label className="mb-2 block text-sm text-slate-300">
                Título
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Descripción
              </label>
              <textarea
                className="min-h-24 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Recomendación
              </label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                value={recommendation}
                onChange={(event) => setRecommendation(event.target.value)}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Evidencia
              </label>
              <textarea
                className="min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                value={evidence}
                onChange={(event) => setEvidence(event.target.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">
                  Severidad
                </label>
                <select
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  value={severity}
                  onChange={(event) =>
                    setSeverity(event.target.value as Severity)
                  }
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
                  value={status}
                  onChange={(event) =>
                    setStatus(event.target.value as FindingStatus)
                  }
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
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Listado de findings</h2>
              <p className="mt-1 text-sm text-slate-400">
                Filtra por severidad, estado y revisa paginación.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <select
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm"
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value as Severity | "")
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
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as FindingStatus | "")
                }
              >
                <option value="">Todos los estados</option>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>

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
              </article>
            ))}

            {findings.length === 0 && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
                No hay findings disponibles.
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 0}
              onClick={() => void loadData(page - 1)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
            >
              Anterior
            </button>

            <p className="text-sm text-slate-400">
              Página {page + 1} de {Math.max(totalPages, 1)}
            </p>

            <button
              type="button"
              disabled={page + 1 >= totalPages}
              onClick={() => void loadData(page + 1)}
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}