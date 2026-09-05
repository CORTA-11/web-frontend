import { api, ApiError } from "@/lib/http";
import { isLive } from "@/lib/env";
import { setCSRFToken } from "@/lib/token";
import type { OrgRole, User, UserOrganization } from "@/lib/types";

export type RegisterInput = {
  mode: "individual" | "create_org" | "join_org";
  name: string;
  email: string;
  password: string;
  org_name?: string;
  org_public_id?: string;
  fields?: Record<string, string | undefined>;
};

/** backend session user: { id, email, display_name } — tenant scoping is listed separately. */
type SessionUser = { id: string; email: string; display_name: string; platform_role?: User["platform_role"] };

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
type LegacyAuthPayload = { access_token: string; user: User };

/** backend org row as seen in GET /orgs — carries the caller's org role. */
export type OrgRow = {
  id: string;
  name: string;
  lifecycle_state: "provisioning" | "pending" | "active" | "failed" | "suspended" | "rejected" | "deleting" | "deleted";
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
    public_id: user.id,
    org_id: org?.id ?? "",
    name: user.display_name,
    email: user.email,
    org_role: org ? orgRoleOf(org.my_role) : "ORG_MEMBER",
    platform_role: user.platform_role ?? null,
  };
}

async function sessionFrom(payload: AuthPayload): Promise<{ user: User; csrf_token: string }> {
  setCSRFToken(payload.csrf_token);
  const user = await enrich(payload.user);
  return { user, csrf_token: payload.csrf_token };
}

const persistMockSession = (user: User | null) => {
  if (typeof document === "undefined") return;
  document.cookie = user
    ? `corta_refresh=${user.id}; Path=/; SameSite=Lax`
    : "corta_refresh=; Path=/; Max-Age=0";
};

async function setMockCurrentUser(user: User | null) {
  persistMockSession(user);
  const { setCurrentUser } = await import("@/mocks/session");
  setCurrentUser(user?.id ?? null);
}

async function mockSessionFrom(payload: LegacyAuthPayload): Promise<User> {
  setCSRFToken("mock-csrf-token");
  await setMockCurrentUser(payload.user);
  return payload.user;
}

async function mockSession(): Promise<User> {
  const userId = Number(
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("corta_refresh="))
      ?.split("=")[1]
  );
  if (!Number.isFinite(userId)) throw new ApiError(401, "Unauthorized");
  const { db } = await import("@/mocks/db");
  const person = db.people.find((entry) => entry.id === userId);
  if (!person) throw new ApiError(401, "Unauthorized");
  const user = {
    id: person.id,
    public_id: person.public_id,
    org_id: person.org_id,
    name: person.name,
    email: person.email,
    org_role: person.org_role,
    platform_role: person.platform_role ?? null,
  };
  await setMockCurrentUser(user);
  return user;
}

async function mockOrganizations(): Promise<{ items: UserOrganization[] }> {
  const user = await mockSession();
  const { db } = await import("@/mocks/db");
  const items: UserOrganization[] = [];
  const primaryOrg = db.organizations.find((org) => org.id === user.org_id);
  if (primaryOrg) {
    items.push({
      id: primaryOrg.id,
      name: primaryOrg.name,
      lifecycle_state: primaryOrg.status,
      my_role: user.org_role === "ORG_ADMIN" ? "administrator" : "member",
    });
  }
  if (user.email === "admin@aratuwa.edu" || user.email === "member@aratuwa.edu") {
    const additionalOrg = db.organizations.find((org) => org.id === "6a2f4d19-7c05-4b83-a94d-2e1b8f70c645");
    if (additionalOrg) {
      items.push({
        id: additionalOrg.id,
        name: additionalOrg.name,
        lifecycle_state: additionalOrg.status,
        my_role: "member",
      });
    }
  }
  return { items };
}

export const authApi = {
  login: async (email: string, password: string): Promise<User> =>
    isLive("auth")
      ? (await sessionFrom(await api<AuthPayload>("/v1/auth/login", { method: "POST", json: { email, password } }))).user
      : mockSessionFrom(await api<LegacyAuthPayload>("/auth/login", { method: "POST", json: { email, password } })),

  register: async (input: RegisterInput): Promise<User> =>
    isLive("auth")
      ? (
          await sessionFrom(
            await api<AuthPayload>("/v1/auth/register", {
              method: "POST",
              json: { display_name: input.name, email: input.email, password: input.password },
            })
          )
        ).user
      : mockSessionFrom(await api<LegacyAuthPayload>("/auth/register", { method: "POST", json: input })),

  session: async (): Promise<User> =>
    isLive("auth") ? (await sessionFrom(await api<AuthPayload>("/v1/auth/session"))).user : mockSession(),

  logout: async () => {
    await api<void>(isLive("auth") ? "/v1/auth/session" : "/auth/logout", {
      method: isLive("auth") ? "DELETE" : "POST",
    });
    if (!isLive("auth")) await setMockCurrentUser(null);
  },

  organizations: async (): Promise<{ items: UserOrganization[] }> =>
    isLive("auth") ? api<{ items: UserOrganization[] }>("/v1/orgs", { method: "GET" }) : mockOrganizations(),

  createOrganization: (name: string): Promise<OrgRow> =>
    api<OrgRow>("/v1/orgs", { method: "POST", json: { name } }),
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
