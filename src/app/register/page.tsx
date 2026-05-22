"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError } from "@/lib/api";
import { register } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string
  > | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError(null);
    setValidationErrors(null);
    setIsSubmitting(true);

    try {
      await register({
        fullName,
        organizationName: organizationName || undefined,
        email,
        password,
      });

      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400 && err.validationErrors) {
          setValidationErrors(err.validationErrors);
          setError("Revisa los campos del formulario.");
          return;
        }

        if (err.status === 409) {
          setError("Ese correo ya está registrado.");
          return;
        }

        setError(err.message);
        return;
      }

      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">AuditFlow</p>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Crear cuenta
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Registra un usuario auditor para acceder al sistema.
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="fullName"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
            {validationErrors?.fullName && (
              <p className="mt-2 text-sm text-red-300">
                {validationErrors.fullName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="organizationName"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Organización
            </label>
            <input
              id="organizationName"
              type="text"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              placeholder="Ej. N3X Security Lab"
            />
            {validationErrors?.organizationName && (
              <p className="mt-2 text-sm text-red-300">
                {validationErrors.organizationName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            {validationErrors?.email && (
              <p className="mt-2 text-sm text-red-300">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-slate-200"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {validationErrors?.password && (
              <p className="mt-2 text-sm text-red-300">
                {validationErrors.password}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Registrando..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-cyan-400">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}