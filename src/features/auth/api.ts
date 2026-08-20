import { api } from "@/lib/http";
import { isLive } from "@/lib/env";
import type { AuthResponse, User } from "@/lib/types";

export type RegisterInput = {
  mode: "create_org" | "join_org";
  name: string;
  email: string;
  password: string;
  org_name?: string;
  org_public_id?: string;
  fields?: Record<string, string | undefined>;
};

/**
 * core-api currently exposes POST /users/login returning { token, user } and has
 * no refresh endpoint. The adapter keeps that difference in this one place so
 * the rest of the app only ever sees the contract shape.
 */
const login = async (email: string, password: string): Promise<AuthResponse> => {
  if (!isLive("auth")) return api("/auth/login", { method: "POST", json: { email, password } });
  const legacy = await api<{ token: string; user: User }>("/users/login", {
    method: "POST",
    json: { email, password },
  });
  return { access_token: legacy.token, user: legacy.user };
};

export const authApi = {
  login,
  register: (input: RegisterInput) => api<AuthResponse>("/auth/register", { method: "POST", json: input }),
  refresh: () => api<AuthResponse>("/auth/refresh", { method: "POST" }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
};

export type OrgLookup = {
  name: string;
  public_id: string;
  registration_fields: import("@/lib/types").RegistrationField[];
};

export const lookupOrg = (publicId: string) =>
  api<OrgLookup>(`/orgs/lookup/${encodeURIComponent(publicId)}`);
