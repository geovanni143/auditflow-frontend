import { apiFetch } from "@/lib/api";
import type { AuthUser, LoginRequest, RegisterRequest } from "@/types/auth";

export function login(payload: LoginRequest): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function register(payload: RegisterRequest): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  });
}

export function getMe(): Promise<AuthUser> {
  return apiFetch<AuthUser>("/api/auth/me", {
    method: "GET",
  });
}