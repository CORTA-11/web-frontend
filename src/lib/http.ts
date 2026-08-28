import { API_BASE } from "@/lib/env";
import { getAccessToken } from "@/lib/token";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit };

/**
 * The only place the app touches fetch. core-api returns plain-text error
 * bodies, so failures are normalised into ApiError and thrown — React Query
 * owns the loading and error state from there.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const token = getAccessToken();
	const method = (rest.method ?? "GET").toUpperCase();
	const csrf = getCsrfToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
	  ...(csrf && !["GET", "HEAD", "OPTIONS"].includes(method) && { "X-CSRF-Token": csrf }),
      ...headers,
    },
    ...(json !== undefined && { body: JSON.stringify(json) }),
  });

  if (!response.ok) {
    const body = (await response.text()).trim();
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  if (response.headers.get("content-type")?.includes("json")) {
    const value: unknown = await response.json();
    if (value && typeof value === "object" && "csrf_token" in value && typeof value.csrf_token === "string") {
      setCsrfToken(value.csrf_token);
    }
    return value as T;
  }
  return (await response.text()) as T;
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
