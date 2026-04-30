import type { ApiError } from "../types/api";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiClientError extends Error {
  status: number;
  code: ApiError["error"]["code"] | "UNKNOWN";

  constructor(status: number, message: string, code: ApiError["error"]["code"] | "UNKNOWN" = "UNKNOWN") {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function joinPath(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  const normalizedBase = API_BASE_URL.endsWith("/") ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(joinPath(path), {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      response.status,
      payload?.error?.message ?? "リクエストに失敗しました",
      payload?.error?.code ?? "UNKNOWN",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
