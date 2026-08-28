import { api } from "@/lib/http";
import { setCSRFToken } from "@/lib/token";
import type { OrgRole, User, UserOrganization } from "@/lib/types";

export type RegisterInput = {
  mode: "create_org" | "join_org";
  name: string;
  email: string;
  password: string;
  org_name?: string;
  org_public_id?: string;
  fields?: Record<string, string | undefined>;
};

/** backend session user: { id, email, display_name } — no org scoping. */
type SessionUser = { id: string; email: string; display_name: string };

/** backend auth response: sets the session cookie and hands us a CSRF token. */
type AuthPayload = {
  user: SessionUser;
  session: {
    id: string;
    created_at: string;
    last_seen_at: string;
    idle_expires_at: string;
    absolute_expires_at: string;
    current: boolean;
  };
  csrf_token: string;
};

/** backend org row as seen in GET /orgs — carries the caller's org role. */
type OrgRow = {
  id: string;
  name: string;
  lifecycle_state: "pending" | "active" | "deleting" | "deleted";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  my_role: string;
};
type OrgPage = { items: OrgRow[]; next_cursor: string | null; previous_cursor: string | null };

export const orgRoleOf = (role: string): OrgRole => (role === "owner" || role === "administrator" ? "ORG_ADMIN" : "ORG_MEMBER");

/** Stable numeric id from a UUID so the contract's number-typed User holds. */
const numericKey = (uuid: string) => Number(`0x${uuid.replace(/-/g, "").slice(0, 15)}`);

/**
 * Enriches the backend's org-less session user into the contract User the UI
 * expects (org_id + org_role), by listing the caller's organisations and taking
 * the first active one. User flow without an org is a work-in-progress gap.
 */
async function enrich(user: SessionUser): Promise<User> {
  const page = await api<OrgPage>("/v1/orgs", { json: undefined, method: "GET" });
  const org = page.items.find((entry) => entry.lifecycle_state === "active") ?? page.items[0];
  return {
    id: numericKey(user.id),
    org_id: org?.id ?? "",
    name: user.display_name,
    email: user.email,
    org_role: org ? orgRoleOf(org.my_role) : "ORG_MEMBER",
    platform_role: null,
  };
}

async function sessionFrom(payload: AuthPayload): Promise<{ user: User; csrf_token: string }> {
  setCSRFToken(payload.csrf_token);
  const user = await enrich(payload.user);
  return { user, csrf_token: payload.csrf_token };
}

export const authApi = {
  login: async (email: string, password: string): Promise<User> =>
    (await sessionFrom(await api<AuthPayload>("/v1/auth/login", { method: "POST", json: { email, password } }))).user,

  register: async (input: RegisterInput): Promise<User> =>
    (
      await sessionFrom(
        await api<AuthPayload>("/v1/auth/register", {
          method: "POST",
          json: { display_name: input.name, email: input.email, password: input.password },
        })
      )
    ).user,

  session: async (): Promise<User> =>
    (await sessionFrom(await api<AuthPayload>("/v1/auth/session"))).user,

  logout: () => api<void>("/v1/auth/session", { method: "DELETE" }),

  organizations: async (): Promise<{ items: UserOrganization[] }> =>
    api<{ items: UserOrganization[] }>("/v1/orgs", { method: "GET" }),
};

/** Re-fetches only the caller's org context after an organisation becomes active. */
export const refreshOrg = (): Promise<OrgPage> => api<OrgPage>("/v1/orgs", { method: "GET" });

export type OrgLookup = {
  name: string;
  public_id: string;
  registration_fields: import("@/lib/types").RegistrationField[];
};

export const lookupOrg = (publicId: string) =>
  api<OrgLookup>(`/orgs/lookup/${encodeURIComponent(publicId)}`);
