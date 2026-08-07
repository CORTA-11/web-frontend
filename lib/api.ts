// lib/api.ts
import {
  mockColumns,
  mockTasks,
  mockResources,
  mockUsers,
  Task,
  ResourceBooking,
  User,
} from "./mock-data";
import { clearSession, readSession, writeSession } from "./auth-session";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") || "/api";

// Simulates network latency so loading states actually get exercised
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Matches the shape your real API_Contract.md defines — every response
// is { success, data } or { success: false, error }, so components never
// need to change when you swap mocks for axios calls.
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type AuthPayload = {
  user: User;
  token: string;
  refreshToken: string;
};

type BackendAuthUser = {
  id: number;
  org_id: number;
  email: string;
  name: string;
  org_role: string;
  avatar_url?: string;
};

type BackendAuthResponse = {
  token: string;
  refresh_token: string;
  user: BackendAuthUser;
};

function mapAuthUser(user: BackendAuthUser): User {
  return {
    id: String(user.id),
    orgId: String(user.org_id),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatar_url ?? "",
    role: user.org_role === "ORG_ADMIN" ? "admin" : "member",
  };
}

function toAuthPayload(data: BackendAuthResponse): AuthPayload {
  return {
    token: data.token,
    refreshToken: data.refresh_token,
    user: mapAuthUser(data.user),
  };
}

function persistAuthPayload(payload: AuthPayload) {
  writeSession(payload);

  // Keep zustand in sync when the store is available (dynamic import avoids cycles).
  void import("@/stores/auth-store").then(({ useAuthStore }) => {
    useAuthStore.setState({
      user: payload.user,
      token: payload.token,
      refreshToken: payload.refreshToken,
    });
  });
}

async function readErrorMessage(res: Response): Promise<string> {
  const text = (await res.text()).trim();
  return text || res.statusText || "Request failed.";
}

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const session = readSession();
    if (!session?.refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: session.refreshToken }),
      });

      if (!res.ok) {
        clearSession();
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().clearAuth();
        return false;
      }

      const data = (await res.json()) as BackendAuthResponse;
      persistAuthPayload(toAuthPayload(data));
      return true;
    } catch {
      clearSession();
      try {
        const { useAuthStore } = await import("@/stores/auth-store");
        useAuthStore.getState().clearAuth();
      } catch {
        // ignore store load failures during teardown
      }
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

async function apiFetch<T>(
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
      const session = readSession();
      if (session?.token) {
        headers.set("Authorization", `Bearer ${session.token}`);
      }
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers,
    });

    if (
      res.status === 401 &&
      options?.auth !== false &&
      options?.retry !== false
    ) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, init, { ...options, retry: false });
      }
    }

    if (!res.ok) {
      return { success: false, error: await readErrorMessage(res) };
    }

    if (res.status === 204) {
      return { success: true, data: null as T };
    }

    const data = (await res.json()) as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      error: "Unable to reach the server. Is the API running?",
    };
  }
}

export const api = {
  // ---- Kanban ----
  getBoard: async (): Promise<
    ApiResponse<{ columns: typeof mockColumns; tasks: Task[] }>
  > => {
    await delay();
    return {
      success: true,
      data: {
        columns: mockColumns,
        tasks: mockTasks,
      },
    };
  },

  moveTask: async (
    taskId: string,
    fromColumnId: string,
    toColumnId: string
  ): Promise<ApiResponse<{ taskId: string; toColumnId: string }>> => {
    await delay(150);
    return {
      success: true,
      data: { taskId, toColumnId },
    };
  },

  createTask: async (
    task: Omit<Task, "id" | "createdAt">
  ): Promise<ApiResponse<Task>> => {
    await delay();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newTask };
  },

  // ---- Resources ----
  getResources: async (): Promise<ApiResponse<typeof mockResources>> => {
    await delay();
    return { success: true, data: mockResources };
  },

  bookResource: async (
    booking: Omit<ResourceBooking, "id">
  ): Promise<ApiResponse<ResourceBooking>> => {
    await delay();
    const newBooking: ResourceBooking = {
      ...booking,
      id: crypto.randomUUID(),
    };
    return { success: true, data: newBooking };
  },

  // ---- Users / Auth (wired to core-api) ----
  login: async (input: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthPayload>> => {
    const email = input.email.trim();
    const password = input.password;

    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const result = await apiFetch<BackendAuthResponse>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
      { auth: false }
    );

    if (!result.success) return result;

    const payload = toAuthPayload(result.data);
    writeSession(payload);
    return { success: true, data: payload };
  },

  signup: async (input: {
    name: string;
    email: string;
    password: string;
    mode: "create_org" | "join_org";
    orgName?: string;
    orgPublicId?: string;
  }): Promise<ApiResponse<AuthPayload>> => {
    const name = input.name.trim();
    const email = input.email.trim();
    const password = input.password;
    const orgName = input.orgName?.trim() ?? "";
    const orgPublicId = input.orgPublicId?.trim() ?? "";

    if (!name || !email || !password) {
      return {
        success: false,
        error: "Name, email, and password are required.",
      };
    }

    if (input.mode === "create_org" && !orgName) {
      return {
        success: false,
        error: "Organization name is required.",
      };
    }

    if (input.mode === "join_org" && !orgPublicId) {
      return {
        success: false,
        error: "Organization ID is required.",
      };
    }

    const result = await apiFetch<BackendAuthResponse>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify({
          mode: input.mode,
          name,
          email,
          password,
          org_name: orgName || undefined,
          org_public_id: orgPublicId || undefined,
        }),
      },
      { auth: false }
    );

    if (!result.success) return result;

    const payload = toAuthPayload(result.data);
    writeSession(payload);
    return { success: true, data: payload };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const session = readSession();
    if (session?.refreshToken) {
      await apiFetch<null>(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        },
        { auth: false, retry: false }
      );
    }
    clearSession();
    return { success: true, data: null };
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const result = await apiFetch<BackendAuthUser>("/me");
    if (!result.success) return result;
    return { success: true, data: mapAuthUser(result.data) };
  },

  getTeamMembers: async (): Promise<ApiResponse<typeof mockUsers>> => {
    await delay();
    return { success: true, data: mockUsers };
  },
};
