import { http, HttpResponse } from "msw";
import { db, now, uid } from "@/mocks/db";
import { actorFrom } from "@/mocks/session";
import type { Booking, Resource, ResourceRequest } from "@/lib/types";

const overlaps = (a: { start: string; end: string }, b: { start: string; end: string }) =>
  a.start < b.end && b.start < a.end;

/** Server-side conflict check — the double-booking guard from SRS 2.4. */
const clashOf = (resourceId: string, start: string, end: string, ignore?: string) =>
  db.bookings.find(
    (booking) =>
      booking.resource_id === resourceId &&
      booking.id !== ignore &&
      overlaps({ start, end }, { start: booking.start_time, end: booking.end_time })
  );

export const resourceHandlers = [
  http.get("/api/orgs/:orgId/resources", () => HttpResponse.json(db.resources)),
  http.get("/api/orgs/:orgId/bookings", () => HttpResponse.json(db.bookings)),

  http.post("/api/orgs/:orgId/resources", async ({ request, params }) => {
    const body = (await request.json()) as Partial<Resource>;
    const resource: Resource = {
      id: uid("r"),
      org_id: String(params.orgId),
      name: (body.name ?? "").trim(),
      code: (body.code ?? "").trim().toUpperCase(),
      kind: body.kind ?? "instrument",
      location: body.location ?? "",
      enabled: body.enabled ?? true,
      availability: body.availability ?? [],
    };
    if (!resource.name) return new HttpResponse("A resource needs a name", { status: 400 });
    db.resources.push(resource);
    return HttpResponse.json(resource, { status: 201 });
  }),

  http.patch("/api/orgs/:orgId/resources/:resourceId", async ({ request, params }) => {
    const resource = db.resources.find((r) => r.id === params.resourceId);
    if (!resource) return new HttpResponse("Resource not found", { status: 404 });
    Object.assign(resource, await request.json());
    return HttpResponse.json(resource);
  }),

  http.delete("/api/orgs/:orgId/resources/:resourceId", ({ params }) => {
    const index = db.resources.findIndex((r) => r.id === params.resourceId);
    if (index < 0) return new HttpResponse("Resource not found", { status: 404 });
    db.resources.splice(index, 1);
    db.bookings = db.bookings.filter((b) => b.resource_id !== params.resourceId);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post("/api/orgs/:orgId/resources/:resourceId/requests", async ({ request, params }) => {
    const actor = actorFrom(request);
    const resource = db.resources.find((r) => r.id === params.resourceId);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (!resource) return new HttpResponse("Resource not found", { status: 404 });
    if (!resource.enabled) return new HttpResponse("That resource is currently disabled", { status: 409 });

    const body = (await request.json()) as {
      team_public_id: string; start_time: string; end_time: string; purpose: string;
    };
    if (body.start_time >= body.end_time) {
      return new HttpResponse("The end time must be after the start time", { status: 400 });
    }
    const team = db.teams.find((t) => t.public_id === body.team_public_id);
    const entry: ResourceRequest = {
      id: uid("rq"),
      resource_id: resource.id,
      resource_name: resource.name,
      team_public_id: body.team_public_id,
      team_name: team?.name ?? "Unknown team",
      requested_by: actor.id,
      requested_by_name: actor.name,
      start_time: body.start_time,
      end_time: body.end_time,
      purpose: body.purpose.trim(),
      status: "pending",
      created_at: now(),
    };
    db.requests.unshift(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  http.get("/api/orgs/:orgId/resource-requests", () => HttpResponse.json(db.requests)),

  http.patch("/api/orgs/:orgId/resource-requests/:requestId", async ({ request, params }) => {
    const entry = db.requests.find((r) => r.id === params.requestId);
    if (!entry) return new HttpResponse("Request not found", { status: 404 });

    const { status } = (await request.json()) as { status: "approved" | "rejected" };
    if (status === "approved") {
      const clash = clashOf(entry.resource_id, entry.start_time, entry.end_time);
      if (clash) {
        return new HttpResponse(
          `That slot clashes with an existing booking by ${clash.team_name}`,
          { status: 409 }
        );
      }
      const booking: Booking = {
        id: uid("bk"),
        resource_id: entry.resource_id,
        team_public_id: entry.team_public_id,
        team_name: entry.team_name,
        requested_by_name: entry.requested_by_name,
        start_time: entry.start_time,
        end_time: entry.end_time,
        purpose: entry.purpose,
      };
      db.bookings.push(booking);
    }
    entry.status = status;
    entry.decided_at = now();
    return HttpResponse.json(entry);
  }),
];
