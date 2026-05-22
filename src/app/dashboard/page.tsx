"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/api";
import { getMe, logout } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    async function loadUser() {
      try {
        const currentUser = await getMe();
        setUser(currentUser);
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

    loadUser();
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <p className="text-sm text-slate-300">Validando sesión...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <section className="w-full max-w-md rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Acceso restringido</h1>
          <p className="mt-3 text-sm text-red-200">{error}</p>
          <button
            onClick={() => router.replace("/login")}
            className="mt-6 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
          >
            Volver al login
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-white">
      <section className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium text-cyan-400">AuditFlow</p>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-slate-400">
              Sesión activa usando cookie HTTPOnly.
            </p>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingOut ? "Cerrando..." : "Cerrar sesión"}
          </button>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Usuario autenticado</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>
                <span className="text-slate-500">Nombre:</span>{" "}
                {user?.fullName}
              </p>
              <p>
                <span className="text-slate-500">Correo:</span> {user?.email}
              </p>
              <p>
                <span className="text-slate-500">Rol:</span> {user?.role}
              </p>
              <p>
                <span className="text-slate-500">Organización:</span>{" "}
                {user?.organizationName}
              </p>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Estado de seguridad</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>[OK] Token no visible en JavaScript</p>
              <p>[OK] Cookie enviada con credentials include</p>
              <p>[OK] Auth/me validado desde backend</p>
              <p>[OK] Logout limpia cookie desde backend</p>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}