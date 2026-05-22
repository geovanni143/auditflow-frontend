"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

type AppNavProps = {
  title?: string;
};

export function AppNav({ title = "AuditFlow" }: AppNavProps) {
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.replace("/login");
    }
  }

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 px-6 py-4">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-400">AuditFlow</p>
          <h1 className="text-xl font-bold text-white">{title}</h1>
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Dashboard
          </Link>

          <Link
            href="/projects"
            className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Proyectos
          </Link>

          <Link
            href="/findings"
            className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-slate-800 hover:text-white"
          >
            Findings
          </Link>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Cerrar sesión
          </button>
        </nav>
      </div>
    </header>
  );
}