import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center shadow-xl">
        <p className="mb-3 text-sm font-medium text-cyan-400">AuditFlow</p>

        <h1 className="text-4xl font-bold tracking-tight">
          Plataforma de gestión de auditorías de seguridad
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          BIENVENIDO
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Iniciar sesión
          </Link>

          <Link
            href="/register"
            className="rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Crear cuenta
          </Link>
        </div>
      </section>
    </main>
  );
}