import type { User } from "@/lib/types/user";
import { apiFetch, type ApiResponse } from "@/lib/api/client";
import { setAccessToken } from "@/lib/api/token";

type BackendAuthUser = {
  id: number;
  org_id: number;
  email: string;
  name: string;
  org_role: string;
  avatar_url?: string;
};

type BackendAuthResponse = {
  access_token: string;
  user: BackendAuthUser;
};

export type AuthPayload = {
  accessToken: string;
  user: User;
};

export type RegisterMode = "create_org" | "join_org";

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

function toPayload(data: BackendAuthResponse): AuthPayload {
  return {
    accessToken: data.access_token,
    user: mapUser(data.user),
  };
}

export const authApi = {
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

    const payload = toPayload(result.data);
    setAccessToken(payload.accessToken);
    return { success: true, data: payload };
  },

  register: async (input: {
    name: string;
    email: string;
    password: string;
    mode: RegisterMode;
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
      return { success: false, error: "Organization name is required." };
    }
    if (input.mode === "join_org" && !orgPublicId) {
      return { success: false, error: "Organization ID is required." };
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

    const payload = toPayload(result.data);
    setAccessToken(payload.accessToken);
    return { success: true, data: payload };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    await apiFetch<null>(
      "/auth/logout",
      { method: "POST", body: "{}" },
      { auth: false, retry: false }
    );
    setAccessToken(null);
    return { success: true, data: null };
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    const result = await apiFetch<BackendAuthUser>("/me");
    if (!result.success) return result;
    return { success: true, data: mapUser(result.data) };
  },
};
