import { http, HttpResponse } from "msw";
import { db, now, uid } from "@/mocks/db";
import { actorFrom, publicUser, tokenFor } from "@/mocks/session";

const REFRESH_COOKIE = "corta_refresh";

const session = (userId: number) => {
  const person = db.people.find((p) => p.id === userId)!;
  return HttpResponse.json(
    { access_token: tokenFor(person.id), user: publicUser(person) },
    { headers: { "Set-Cookie": `${REFRESH_COOKIE}=${person.id}; Path=/; SameSite=Lax` } }
  );
};

type RegisterBody = {
  mode: "create_org" | "join_org";
  name: string;
  email: string;
  password: string;
  org_name?: string;
  org_public_id?: string;
};

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const { email, password } = (await request.json()) as { email: string; password: string };
    const person = db.people.find((p) => p.email === email.trim().toLowerCase());
    if (!person || person.password !== password) {
      return new HttpResponse("Invalid email or password", { status: 401 });
    }
    return session(person.id);
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as RegisterBody;
    const email = body.email.trim().toLowerCase();
    if (db.people.some((p) => p.email === email)) {
      return new HttpResponse("That email is already registered", { status: 409 });
    }

    const nextId = Math.max(...db.people.map((p) => p.id)) + 1;

    if (body.mode === "join_org") {
      const org = db.organizations.find((entry) => entry.public_id === body.org_public_id?.trim());
      if (!org) return new HttpResponse("No organisation found with that ID", { status: 404 });
      if (org.status !== "active") {
        return new HttpResponse("That organisation is not accepting members yet", { status: 409 });
      }
      db.people.push({ id: nextId, org_id: org.id, name: body.name.trim(), email, org_role: "ORG_MEMBER", password: body.password });
      org.user_count += 1;
      return session(nextId);
    }

    // A new tenant starts pending until the platform operator approves it.
    const orgId = uid("org");
    const name = body.org_name?.trim() || `${body.name.trim()}'s organisation`;
    db.organizations.push({
      id: orgId,
      name,
      public_id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24),
      status: "pending",
      owner_name: body.name.trim(),
      owner_email: email,
      user_count: 1,
      team_count: 0,
      requested_at: now(),
    });
    db.people.push({ id: nextId, org_id: orgId, name: body.name.trim(), email, org_role: "ORG_ADMIN", password: body.password });
    return session(nextId);
  }),

  http.post("/api/auth/refresh", ({ cookies }) => {
    const person = db.people.find((p) => String(p.id) === cookies[REFRESH_COOKIE]);
    if (!person) return new HttpResponse("No active session", { status: 401 });
    return session(person.id);
  }),

  http.post("/api/auth/logout", () =>
    new HttpResponse(null, {
      status: 204,
      headers: { "Set-Cookie": `${REFRESH_COOKIE}=; Path=/; Max-Age=0` },
    })
  ),

  http.get("/api/me", ({ request }) => {
    const person = actorFrom(request);
    return person
      ? HttpResponse.json(publicUser(person))
      : new HttpResponse("Unauthorized", { status: 401 });
  }),

  http.get("/api/v1/orgs", ({ request }) => {
    const actor = actorFrom(request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });

    const userOrgs = [];
    const primaryOrg = db.organizations.find((o) => o.id === actor.org_id);
    if (primaryOrg) {
      userOrgs.push({
        id: primaryOrg.id,
        name: primaryOrg.name,
        lifecycle_state: primaryOrg.status,
        my_role: actor.org_role === "ORG_ADMIN" ? "administrator" : "member",
      });
    }

    if (actor.email === "admin@aratuwa.edu" || actor.email === "member@aratuwa.edu") {
      const additionalOrg = db.organizations.find((o) => o.id === "6a2f4d19-7c05-4b83-a94d-2e1b8f70c645");
      if (additionalOrg) {
        userOrgs.push({
          id: additionalOrg.id,
          name: additionalOrg.name,
          lifecycle_state: additionalOrg.status,
          my_role: "member",
        });
      }
    }

    return HttpResponse.json({
      items: userOrgs,
      next_cursor: null,
      previous_cursor: null,
    });
  }),
];
