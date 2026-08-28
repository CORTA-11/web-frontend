import type { ProblemDetails } from "@/lib/types/api";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);
let csrfToken: string | null = null;
let onUnauthenticated: (() => void) | null = null;

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetails) {
    super(problem.detail);
    this.name = "ApiError";
  }

  get status() { return this.problem.status; }
}

export function setCsrfToken(token: string | null) { csrfToken = token; }
export function setUnauthenticatedHandler(handler: () => void) {
  onUnauthenticated = handler;
}

function fallbackProblem(response: Response): ProblemDetails {
  return {
    type: "/problems/internal-failure",
    title: "Request failed",
    status: response.status,
    detail: response.statusText || "The request could not be completed.",
    request_id: "unknown",
  };
}

async function parseProblem(response: Response) {
  try { return (await response.json()) as ProblemDetails; }
  catch { return fallbackProblem(response); }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (unsafeMethods.has(method) && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }
  const response = await fetch(`/api/v1${path}`, {
    ...init, method, headers, credentials: "include",
  });
  if (response.status === 401) {
    setCsrfToken(null);
    onUnauthenticated?.();
  }
  if (!response.ok) throw new ApiError(await parseProblem(response));
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export function problemMessage(error: unknown) {
  return error instanceof ApiError
    ? error.problem.detail
    : "The request could not be completed.";
}
