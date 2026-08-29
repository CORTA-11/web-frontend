import { http, HttpResponse } from "msw";
import { db, now, uid } from "@/mocks/db";
import { actorFrom } from "@/mocks/session";

const tokenOf = (request: Request) => request.headers.get("X-Invitation-Token") ?? "";

export const invitationHandlers = [
  http.get("/api/v1/orgs/:orgId/invitations", ({ params }) =>
    HttpResponse.json({ items: db.invitations.filter((item) => item.orgId === params.orgId).map((item) => ({ id: item.id, created_at: item.createdAt, expires_at: item.expiresAt })) })
  ),
  http.post("/api/v1/orgs/:orgId/invitations", async ({ request, params }) => {
    const actor = actorFrom(request);
    if (!actor || actor.org_id !== params.orgId || actor.org_role !== "ORG_ADMIN") return new HttpResponse("Forbidden", { status: 403 });
    const { email } = (await request.json()) as { email: string };
    const createdAt = now();
    const invitation = { id: uid("invite"), token: uid("token").padEnd(43, "x").slice(0, 43), orgId: String(params.orgId), email: email.trim().toLowerCase(), createdAt, expiresAt: new Date(Date.now() + 7 * 86400000).toISOString() };
    db.invitations.push(invitation);
    return HttpResponse.json({ id: invitation.id, token: invitation.token, created_at: createdAt, expires_at: invitation.expiresAt }, { status: 201 });
  }),
  http.delete("/api/v1/orgs/:orgId/invitations/:id", ({ params }) => {
    const index = db.invitations.findIndex((item) => item.id === params.id && item.orgId === params.orgId);
    if (index < 0) return new HttpResponse("Not found", { status: 404 });
    db.invitations.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
  http.get("/api/v1/organization-invitations/current", ({ request }) => {
    const invitation = db.invitations.find((item) => item.token === tokenOf(request));
    const org = db.organizations.find((item) => item.id === invitation?.orgId);
    return invitation && org ? HttpResponse.json({ organization_id: org.id, organization_name: org.name, expires_at: invitation.expiresAt }) : new HttpResponse("Invitation not found", { status: 404 });
  }),
  http.post("/api/v1/organization-invitations/current/accept", ({ request }) => {
    const actor = actorFrom(request);
    const index = db.invitations.findIndex((item) => item.token === tokenOf(request) && item.email === actor?.email.toLowerCase());
    if (!actor || index < 0) return new HttpResponse("Invitation not found", { status: 404 });
    actor.org_id = db.invitations[index].orgId; actor.org_role = "ORG_MEMBER"; db.invitations.splice(index, 1);
    return HttpResponse.json({ accepted: true });
  }),
  http.delete("/api/v1/organization-invitations/current", ({ request }) => {
    const actor = actorFrom(request);
    const index = db.invitations.findIndex((item) => item.token === tokenOf(request) && item.email === actor?.email.toLowerCase());
    if (!actor || index < 0) return new HttpResponse("Invitation not found", { status: 404 });
    db.invitations.splice(index, 1); return new HttpResponse(null, { status: 204 });
  }),
];
