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
};

export type Project = {
  id: number;
  name: string;
  target: string;
  description?: string | null;
  status: ProjectStatus;
  auditors: ProjectAuditor[];
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectCreateRequest = {
  name: string;
  target: string;
  description?: string;
  status: ProjectStatus;
};

export type ProjectUpdateRequest = {
  name: string;
  target: string;
  description?: string;
  status: ProjectStatus;
};

export type AssignAuditorRequest = {
  auditorId: number;
};

export type CreateProjectRequest = ProjectCreateRequest;
export type UpdateProjectRequest = ProjectUpdateRequest;