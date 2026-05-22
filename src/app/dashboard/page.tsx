"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { getMe } from "@/lib/auth";
import { getProjects } from "@/lib/projects";
import { getFindings } from "@/lib/findings";
import { AppNav } from "@/components/AppNav";
import type { AuthUser } from "@/types/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [projectCount, setProjectCount] = useState(0);
  const [findingCount, setFindingCount] = useState(0);
  const [criticalCount, setCriticalCount] = useState(0);
  const [openCount, setOpenCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const currentUser = await getMe();
        const projects = await getProjects();
        const findingsPage = await getFindings({ page: 0, size: 50 });

        setUser(currentUser);
        setProjectCount(projects.length);
        setFindingCount(findingsPage.totalElements);
        setCriticalCount(
          findingsPage.content.filter((finding) => finding.severity === "CRITICAL")
            .length
        );
        setOpenCount(
          findingsPage.content.filter((finding) => finding.status === "OPEN")
            .length
        );
      } catch (err) {
        if (err instanceof ApiError) {
          if (err.status === 401) {
            router.replace("/login");
            return;
          }

          if (err.status === 403) {
            setError("No tienes permiso para acceder a este recurso.");
            return;
          }

          setError(err.message);
          return;
        }

        setError("No se pudo conectar con el servidor.");
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <p className="text-sm text-slate-300">Cargando dashboard...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="rounded-2xl border border-red-900 bg-red-950/40 p-8">
          <h1 className="text-2xl font-bold">Error</h1>
          <p className="mt-2 text-red-200">{error}</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <AppNav title="Dashboard" />

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <p className="text-sm text-cyan-400">Sesión activa</p>
          <h2 className="mt-2 text-3xl font-bold">
            Bienvenido, {user?.fullName}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Rol: {user?.role} · Organización: {user?.organizationName}
          </p>
        </div>

        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Proyectos</p>
            <p className="mt-3 text-3xl font-bold">{projectCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Findings</p>
            <p className="mt-3 text-3xl font-bold">{findingCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Críticos visibles</p>
            <p className="mt-3 text-3xl font-bold">{criticalCount}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">Abiertos visibles</p>
            <p className="mt-3 text-3xl font-bold">{openCount}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <Link
            href="/projects"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"
          >
            <h3 className="text-xl font-semibold">Gestionar proyectos</h3>
            <p className="mt-2 text-sm text-slate-400">
              Crear, revisar y administrar auditorías.
            </p>
          </Link>

          <Link
            href="/findings"
            className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition hover:border-cyan-400"
          >
            <h3 className="text-xl font-semibold">Gestionar findings</h3>
            <p className="mt-2 text-sm text-slate-400">
              Registrar hallazgos, severidades y estados.
            </p>
          </Link>
        </section>
      </section>
    </main>
  );
}