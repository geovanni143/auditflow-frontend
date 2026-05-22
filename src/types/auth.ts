export type UserRole = "ADMIN" | "AUDITOR";

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  organizationId: number;
  organizationName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  organizationName?: string;
  email: string;
  password: string;
}

export interface ValidationErrorResponse {
  status: number;
  message: string;
  validationErrors?: Record<string, string>;
}