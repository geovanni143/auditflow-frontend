const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export type ValidationErrors = Record<string, string>;

export class ApiError extends Error {
  status: number;
  error: string;
  validationErrors?: ValidationErrors | null;

  constructor(params: {
    status: number;
    error: string;
    message: string;
    validationErrors?: ValidationErrors | null;
  }) {
    super(params.message);
    this.name = "ApiError";
    this.status = params.status;
    this.error = params.error;
    this.validationErrors = params.validationErrors;
  }
}

type ApiErrorResponse = {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  validationErrors?: ValidationErrors | null;
};

type ApiFetchOptions = Omit<RequestInit, "body" | "credentials"> & {
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  headers.set("Accept", "application/json");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("Content-Type");
  const isJson = contentType?.includes("application/json");

  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | null;

    throw new ApiError({
      status: response.status,
      error: errorData?.error ?? "Request Error",
      message: errorData?.message ?? "Unexpected request error",
      validationErrors: errorData?.validationErrors ?? null,
    });
  }

  return data as T;
}