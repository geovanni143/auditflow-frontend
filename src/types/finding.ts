export type Severity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type FindingStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED"
  | "FALSE_POSITIVE";

export type Finding = {
  id: number;
  projectId: number;
  projectName: string;
  organizationId: number;
  reportedById: number;
  reportedByName: string;
  title: string;
  description: string;
  recommendation: string | null;
  evidence: string | null;
  severity: Severity;
  status: FindingStatus;
  createdAt: string;
  updatedAt: string;
};

export type FindingCreateRequest = {
  projectId: number;
  title: string;
  description: string;
  recommendation?: string;
  evidence?: string;
  severity: Severity;
  status?: FindingStatus;
};

export type FindingUpdateRequest = {
  title?: string;
  description?: string;
  recommendation?: string;
  evidence?: string;
  severity?: Severity;
  status?: FindingStatus;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};