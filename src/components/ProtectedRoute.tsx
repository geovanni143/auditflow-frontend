"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, apiFetch } from "@/lib/api";

type AuthUser = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "AUDITOR";
  enabled: boolean;
  organizationId: number;
  organizationName: string;
};

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRole?: "ADMIN" | "AUDITOR";
};

function redirectToLogin(router: ReturnType<typeof useRouter>) {
  router.replace("/login");
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          window.setTimeout(() => {
            reject(new Error("Session validation timeout"));
          }, 5000);
        });

        const user = await Promise.race([
          apiFetch<AuthUser>("/api/auth/me"),
          timeoutPromise,
        ]);

        if (!isMounted) {
          return;
        }

        if (requiredRole && user.role !== requiredRole) {
          router.replace("/dashboard");
          return;
        }

        setIsAllowed(true);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiError) {
          if (error.status === 401 || error.status === 403) {
            redirectToLogin(router);
            return;
          }
        }

        redirectToLogin(router);
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [router, requiredRole]);

  if (!isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <p className="mb-2 text-sm font-medium text-cyan-400">AuditFlow</p>
          <h1 className="text-xl font-semibold">Verificando sesión...</h1>
          <p className="mt-2 text-sm text-slate-400">
            Validando acceso seguro.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}