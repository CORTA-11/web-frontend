import { API_BASE } from "@/lib/env";
import { getCSRFToken } from "@/lib/token";

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

const UNSAFE = ["POST", "PUT", "PATCH", "DELETE"];
const hasOwn = (object: object, key: string) =>
  Object.prototype.hasOwnProperty.call(object, key);
const isProblem = (object: unknown, key: string): object is Record<string, unknown> =>
  typeof object === "object" && object !== null && hasOwn(object, key);

/**
 * The only place the app touches fetch. Auth is an httpOnly session cookie
 * (sent via credentials: "include"); state-changing requests also attach the
 * CSRF token core-api returned with the session. core-api returns RFC 7807
 * problem+json on failure, so the message is extracted and normalised into
 * ApiError — React Query owns the loading and error state from there.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { json, headers, ...rest } = options;
  const method = (rest.method ?? "GET").toUpperCase();
  const csrf = getCSRFToken();

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...(csrf && UNSAFE.includes(method) && { "X-CSRF-Token": csrf }),
      ...headers,
    },
    ...(json !== undefined && { body: JSON.stringify(json) }),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await messageFrom(response));
  }

  if (response.status === 204) return undefined as T;
  return response.headers.get("content-type")?.includes("json")
    ? response.json()
    : ((await response.text()) as T);
}

/** Picks the most specific problem detail: title, then the first violation. */
async function messageFrom(response: Response): Promise<string> {
  if (!response.headers.get("content-type")?.includes("json")) {
    return (await response.text()).trim() || response.statusText;
  }
  try {
    const body: unknown = await response.json();
    if (isProblem(body, "title")) return String(body.title);
    if (isProblem(body, "violations")) {
      const violations = body.violations;
      if (Array.isArray(violations) && violations.length && isProblem(violations[0], "detail")) {
        return String(violations[0].detail);
      }
    }
    return response.statusText;
  } catch {
    return response.statusText;
  }
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
