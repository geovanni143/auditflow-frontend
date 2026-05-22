export type ProjectStatus =
  | "DRAFT"
  | "ACTIVE"
  | "IN_REVIEW"
  | "COMPLETED"
  | "ARCHIVED";

export type ProjectAuditor = {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "AUDITOR";
};

export type Project = {
  id: number;
  organizationId: number;
  organizationName: string;
  createdById: number;
  createdByName: string;
  name: string;
  description: string | null;
  target: string;
  status: ProjectStatus;
  auditors: ProjectAuditor[];
  createdAt: string;
  updatedAt: string;
};

export type ProjectCreateRequest = {
  name: string;
  description?: string;
  target: string;
  status?: ProjectStatus;
};

export type ProjectUpdateRequest = {
  name?: string;
  description?: string;
  target?: string;
  status?: ProjectStatus;
};

export type AssignAuditorRequest = {
  auditorId: number;
};