import { http, HttpResponse } from "msw";
import { fitsAvailability } from "@/features/resources/availability";
import { db, now, uid } from "@/mocks/db";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import type { Booking, Resource, ResourceRequest } from "@/lib/types";

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  a.start < b.end && b.start < a.end;
const clashOf = (resourceId: string, start: string, end: string) =>
  db.bookings.find((booking) => booking.resource_id === resourceId &&
    overlaps({ start, end }, { start: booking.start_time, end: booking.end_time }));
const actorForOrg = (request: Request, orgId: unknown) => {
  const actor = actorFrom(request);
  return actor?.org_id === String(orgId) ? actor : null;
};
const isAdmin = (request: Request, orgId: unknown) => actorForOrg(request, orgId)?.org_role === "ORG_ADMIN";
const canSeeTeam = (request: Request, teamId: string) => {
  const actor = actorFrom(request);
  return Boolean(actor && (actor.org_role === "ORG_ADMIN" || teamRoleOf(teamId, actor.id)));
};
const validResource = (resource: Resource) =>
  Boolean(resource.name.trim()) && /^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(resource.code) &&
  resource.availability.length <= 7 && new Set(resource.availability.map((window) => window.weekday)).size === resource.availability.length &&
  resource.availability.every((window) => window.weekday >= 0 && window.weekday <= 6 && window.start < window.end);

export const resourceHandlers = [
  http.get("/api/orgs/:orgId/resources", ({ request, params }) => actorForOrg(request, params.orgId)
    ? HttpResponse.json(db.resources.filter((resource) => resource.org_id === params.orgId))
    : new HttpResponse("Unauthorized", { status: 401 })),
  http.get("/api/orgs/:orgId/bookings", ({ request, params }) => actorForOrg(request, params.orgId)
    ? HttpResponse.json(db.bookings.map((booking) => {
    if (canSeeTeam(request, booking.team_public_id ?? "")) return { ...booking, details_visible: true };
    return { ...booking, details_visible: false, team_public_id: null, team_name: null,
      requested_by_name: null, purpose: null } satisfies Booking;
    })) : new HttpResponse("Unauthorized", { status: 401 })),
  http.post("/api/orgs/:orgId/resources", async ({ request, params }) => {
    if (!isAdmin(request, params.orgId)) return new HttpResponse("Forbidden", { status: 403 });
    const body = (await request.json()) as Partial<Resource>;
    const resource: Resource = { id: uid("r"), org_id: String(params.orgId), name: (body.name ?? "").trim(),
      code: (body.code ?? "").trim().toUpperCase(), kind: body.kind ?? "instrument",
      location: (body.location ?? "").trim(), enabled: body.enabled ?? true, availability: body.availability ?? [] };
    if (!validResource(resource)) return new HttpResponse("Invalid resource", { status: 400 });
    if (db.resources.some((item) => item.org_id === resource.org_id && item.code === resource.code))
      return new HttpResponse("Resource code already exists", { status: 409 });
    db.resources.push(resource); return HttpResponse.json(resource, { status: 201 });
  }),
  http.patch("/api/orgs/:orgId/resources/:resourceId", async ({ request, params }) => {
    if (!isAdmin(request, params.orgId)) return new HttpResponse("Forbidden", { status: 403 });
    const resource = db.resources.find((item) => item.id === params.resourceId);
    if (!resource) return new HttpResponse("Resource not found", { status: 404 });
    const candidate = { ...resource, ...await request.json() as Partial<Resource> };
    candidate.name = candidate.name.trim(); candidate.code = candidate.code.trim().toUpperCase();
    if (!validResource(candidate)) return new HttpResponse("Invalid resource", { status: 400 });
    Object.assign(resource, candidate); return HttpResponse.json(resource);
  }),
  http.delete("/api/orgs/:orgId/resources/:resourceId", ({ request, params }) => {
    if (!isAdmin(request, params.orgId)) return new HttpResponse("Forbidden", { status: 403 });
    const index = db.resources.findIndex((resource) => resource.id === params.resourceId);
    if (index < 0) return new HttpResponse("Resource not found", { status: 404 });
    if (db.requests.some((entry) => entry.resource_id === params.resourceId))
      return new HttpResponse("Disable resources that have request history", { status: 409 });
    db.resources.splice(index, 1); return new HttpResponse(null, { status: 204 });
  }),
  http.post("/api/orgs/:orgId/resources/:resourceId/requests", async ({ request, params }) => {
    const actor = actorForOrg(request, params.orgId); const resource = db.resources.find((item) => item.id === params.resourceId);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (!resource) return new HttpResponse("Resource not found", { status: 404 });
    if (!resource.enabled) return new HttpResponse("That resource is currently disabled", { status: 409 });
    const body = (await request.json()) as { team_public_id: string; start_time: string; end_time: string; purpose: string };
    if (teamRoleOf(body.team_public_id, actor.id) !== "TEAM_LEADER") return new HttpResponse("Forbidden", { status: 403 });
    const start = new Date(body.start_time); const end = new Date(body.end_time);
    if (!body.purpose.trim() || start < new Date() || !fitsAvailability(resource.availability, start, end))
      return new HttpResponse("Invalid or unavailable UTC slot", { status: 400 });
    if (clashOf(resource.id, body.start_time, body.end_time)) return new HttpResponse("Slot is reserved", { status: 409 });
    const team = db.teams.find((item) => item.public_id === body.team_public_id);
    const entry: ResourceRequest = { id: uid("rq"), resource_id: resource.id, resource_name: resource.name,
      team_public_id: body.team_public_id, team_name: team?.name ?? "Unknown team", requested_by: actor.id,
      requested_by_name: actor.name, start_time: body.start_time, end_time: body.end_time,
      purpose: body.purpose.trim(), status: "pending", created_at: now() };
    db.requests.unshift(entry); return HttpResponse.json(entry, { status: 201 });
  }),
  http.get("/api/orgs/:orgId/resource-requests", ({ request, params }) => {
    const actor = actorForOrg(request, params.orgId); if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    return HttpResponse.json(actor.org_role === "ORG_ADMIN" ? db.requests :
      db.requests.filter((entry) => Boolean(teamRoleOf(entry.team_public_id, actor.id))));
  }),
  http.patch("/api/orgs/:orgId/resource-requests/:requestId", async ({ request, params }) => {
    if (!isAdmin(request, params.orgId)) return new HttpResponse("Forbidden", { status: 403 });
    const entry = db.requests.find((item) => item.id === params.requestId);
    if (!entry) return new HttpResponse("Request not found", { status: 404 });
    if (entry.status !== "pending") return new HttpResponse("Request was already decided", { status: 409 });
    const { status } = (await request.json()) as { status: "approved" | "rejected" };
    if (status !== "approved" && status !== "rejected") return new HttpResponse("Invalid decision", { status: 400 });
    if (status === "approved") {
      const resource = db.resources.find((item) => item.id === entry.resource_id);
      if (!resource?.enabled || !fitsAvailability(resource.availability, new Date(entry.start_time), new Date(entry.end_time)) ||
          clashOf(entry.resource_id, entry.start_time, entry.end_time)) return new HttpResponse("Slot is no longer available", { status: 409 });
      db.bookings.push({ id: entry.id, resource_id: entry.resource_id, resource_name: entry.resource_name,
        details_visible: true, team_public_id: entry.team_public_id, team_name: entry.team_name,
        requested_by_name: entry.requested_by_name, start_time: entry.start_time, end_time: entry.end_time,
        purpose: entry.purpose });
    }
    entry.status = status; entry.decided_at = now(); return HttpResponse.json(entry);
  }),
];
