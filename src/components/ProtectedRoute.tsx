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

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();

  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function validateSession() {
      try {
        const user = await apiFetch<AuthUser>("/api/auth/me");

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
            router.replace("/login");
            return;
          }
        }

        router.replace("/login");
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    validateSession();

    return () => {
      isMounted = false;
    };
  }, [router, requiredRole]);

  if (isCheckingSession || !isAllowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-xl">
          <p className="mb-2 text-sm font-medium text-cyan-400">AuditFlow</p>
          <h1 className="text-xl font-semibold">Verificando sesión...</h1>
          <p className="mt-2 text-sm text-slate-400">
            Espera un momento.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}