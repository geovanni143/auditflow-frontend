export type UserRole = "ADMIN" | "AUDITOR";

export type AppUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  enabled: boolean;
  organizationId: number;
  organizationName?: string;
};

export type CreateUserRequest = {
  fullName: string;
  email: string;
  password: string;
};

export type UpdateUserRequest = {
  fullName: string;
  enabled: boolean;
};

export type CreateAdminRequest = CreateUserRequest;
export type CreateAuditorRequest = CreateUserRequest;