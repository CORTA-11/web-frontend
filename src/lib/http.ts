import { API_BASE } from "@/lib/env";
import { getAccessToken } from "@/lib/token";

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

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(json !== undefined && { body: JSON.stringify(json) }),
  });

  if (!response.ok) {
    const body = (await response.text()).trim();
    throw new ApiError(response.status, body || response.statusText);
  }

  if (response.status === 204) return undefined as T;
  return response.headers.get("content-type")?.includes("json")
    ? response.json()
    : ((await response.text()) as T);
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
