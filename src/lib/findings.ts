import { apiFetch } from "@/lib/api";
import type {
  Finding,
  FindingCreateRequest,
  FindingStatus,
  FindingUpdateRequest,
  PageResponse,
  Severity,
} from "@/types/finding";

export type FindingFilters = {
  projectId?: number;
  severity?: Severity;
  status?: FindingStatus;
  page?: number;
  size?: number;
};

export function getFindings(
  filters: FindingFilters = {}
): Promise<PageResponse<Finding>> {
  const params = new URLSearchParams();

  if (filters.projectId !== undefined) {
    params.set("projectId", String(filters.projectId));
  }

  if (filters.severity) {
    params.set("severity", filters.severity);
  }

  if (filters.status) {
    params.set("status", filters.status);
  }

  params.set("page", String(filters.page ?? 0));
  params.set("size", String(filters.size ?? 10));

  return apiFetch<PageResponse<Finding>>(`/api/findings?${params.toString()}`, {
    method: "GET",
  });
}

export function getFindingById(findingId: number): Promise<Finding> {
  return apiFetch<Finding>(`/api/findings/${findingId}`, {
    method: "GET",
  });
}

export function createFinding(payload: FindingCreateRequest): Promise<Finding> {
  return apiFetch<Finding>("/api/findings", {
    method: "POST",
    body: payload,
  });
}

export function updateFinding(
  findingId: number,
  payload: FindingUpdateRequest
): Promise<Finding> {
  return apiFetch<Finding>(`/api/findings/${findingId}`, {
    method: "PUT",
    body: payload,
  });
}

export function deleteFinding(findingId: number): Promise<void> {
  return apiFetch<void>(`/api/findings/${findingId}`, {
    method: "DELETE",
  });
}