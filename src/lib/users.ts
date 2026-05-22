import { apiFetch } from "@/lib/api";
import type {
  AppUser,
  CreateAdminRequest,
  CreateAuditorRequest,
  UpdateUserRequest,
} from "@/types/user";

export function getUsers(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>("/api/users", {
    method: "GET",
  });
}

export function getAuditors(): Promise<AppUser[]> {
  return apiFetch<AppUser[]>("/api/users/auditors", {
    method: "GET",
  });
}

export function createAdmin(payload: CreateAdminRequest): Promise<AppUser> {
  return apiFetch<AppUser>("/api/users/admins", {
    method: "POST",
    body: payload,
  });
}

export function createAuditor(payload: CreateAuditorRequest): Promise<AppUser> {
  return apiFetch<AppUser>("/api/users/auditors", {
    method: "POST",
    body: payload,
  });
}

export function updateUser(
  userId: number,
  payload: UpdateUserRequest
): Promise<AppUser> {
  return apiFetch<AppUser>(`/api/users/${userId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deactivateUser(userId: number): Promise<AppUser> {
  return apiFetch<AppUser>(`/api/users/${userId}`, {
    method: "DELETE",
  });
}