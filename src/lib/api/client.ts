import { getAccessToken, setAccessToken } from "@/lib/api/token";
import type { User } from "@/lib/types/user";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/api";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type BackendAuthUser = {
  id: number;
  org_id: number;
  email: string;
  name: string;
  org_role: string;
  avatar_url?: string;
};

export type RefreshResult = {
  accessToken: string;
  user: User;
};

function mapUser(user: BackendAuthUser): User {
  return {
    id: String(user.id),
    orgId: String(user.org_id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url ?? "",
    role: user.org_role === "ORG_ADMIN" ? "admin" : "member",
  };
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = (await res.text()).trim();
  return text || res.statusText || "Request failed.";
}

let refreshInFlight: Promise<RefreshResult | null> | null = null;

export async function refreshAccessToken(): Promise<RefreshResult | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });

      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const data = (await res.json()) as {
        access_token: string;
        user: BackendAuthUser;
      };

      setAccessToken(data.access_token);
      return {
        accessToken: data.access_token,
        user: mapUser(data.user),
      };
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  options?: { auth?: boolean; retry?: boolean }
): Promise<ApiResponse<T>> {
  try {
    const headers = new Headers(init.headers);
    if (!headers.has("Content-Type") && init.body) {
      headers.set("Content-Type", "application/json");
    }

    if (options?.auth !== false) {
      const token = getAccessToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
      credentials: "include",
    });

    if (
      res.status === 401 &&
      options?.auth !== false &&
      options?.retry !== false
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        // Keep zustand in sync after silent refresh.
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().setSession(refreshed);
        return apiFetch<T>(path, init, { ...options, retry: false });
      }
      const { useAuthStore } = await import("@/stores/auth-store");
      useAuthStore.getState().clearAuth();
    }

    if (!res.ok) {
      return { success: false, error: await readErrorMessage(res) };
    }

    if (res.status === 204) {
      return { success: true, data: null as T };
    }

    return { success: true, data: (await res.json()) as T };
  } catch {
    return {
      success: false,
      error: "Unable to reach the server. Is the API running?",
    };
  }
}
