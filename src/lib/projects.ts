import { apiFetch } from "@/lib/api";
import type {
  AssignAuditorRequest,
  Project,
  ProjectCreateRequest,
  ProjectUpdateRequest,
} from "@/types/project";

export function getProjects(): Promise<Project[]> {
  return apiFetch<Project[]>("/api/projects");
}

export function getProjectById(projectId: number): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${projectId}`);
}

export function createProject(payload: ProjectCreateRequest): Promise<Project> {
  return apiFetch<Project>("/api/projects", {
    method: "POST",
    body: payload,
  });
}

export function updateProject(
  projectId: number,
  payload: ProjectUpdateRequest
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${projectId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteProject(projectId: number): Promise<void> {
  return apiFetch<void>(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function assignAuditorToProject(
  projectId: number,
  payload: AssignAuditorRequest
): Promise<Project> {
  return apiFetch<Project>(`/api/projects/${projectId}/auditors`, {
    method: "POST",
    body: payload,
  });
}