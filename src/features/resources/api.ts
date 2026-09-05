import { api } from "@/lib/http";
import { isLive } from "@/lib/env";
import type { Booking, Resource, ResourceRequest } from "@/lib/types";

export type ResourceDraft = Omit<Resource, "id" | "org_id">;
export type RequestDraft = {
  team_public_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
};
const pathFor = (path: string) => `${isLive("resources") ? "/v1" : ""}${path}`;
const withOrg = (orgId: string) => (resource: Omit<Resource, "org_id">): Resource => ({ ...resource, org_id: orgId });

const mockActorId = () =>
  Number(
    document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith("corta_refresh="))
      ?.split("=")[1]
  );

async function mockRequest(resourceId: string, body: RequestDraft): Promise<ResourceRequest> {
  const { db, now, uid } = await import("@/mocks/db");
  const actor = db.people.find((person) => person.id === mockActorId());
  const resource = db.resources.find((item) => item.id === resourceId);
  if (!actor || !resource?.enabled) throw new Error("Resource cannot be requested");
  const team = db.teams.find((item) => item.public_id === body.team_public_id);
  const entry: ResourceRequest = {
    id: uid("rq"), resource_id: resource.id, resource_name: resource.name,
    team_public_id: body.team_public_id, team_name: team?.name ?? "Unknown team",
    requested_by: actor.id, requested_by_name: actor.name,
    start_time: body.start_time, end_time: body.end_time, purpose: body.purpose.trim(),
    status: "pending", created_at: now(),
  };
  db.requests.unshift(entry);
  return entry;
}

async function mockDecide(requestId: string, status: "approved" | "rejected"): Promise<ResourceRequest> {
  const { db, now } = await import("@/mocks/db");
  const entry = db.requests.find((request) => request.id === requestId);
  if (!entry) throw new Error("Request not found");
  entry.status = status;
  entry.decided_at = now();
  if (status === "approved") {
    db.bookings.push({
      id: entry.id, resource_id: entry.resource_id, resource_name: entry.resource_name,
      details_visible: true, team_public_id: entry.team_public_id, team_name: entry.team_name,
      requested_by_name: entry.requested_by_name, start_time: entry.start_time,
      end_time: entry.end_time, purpose: entry.purpose,
    });
  }
  return entry;
}

export const resourcesApi = {
  list: (orgId: string) => isLive("resources")
    ? api<{ items: Omit<Resource, "org_id">[] }>(`/v1/orgs/${orgId}/resources`).then(({ items }) =>
        items.map(withOrg(orgId)))
    : api<Resource[]>(`/orgs/${orgId}/resources`),
  bookings: (orgId: string) => isLive("resources")
    ? api<{ items: Booking[] }>(`/v1/orgs/${orgId}/bookings`).then(({ items }) => items)
    : api<Booking[]>(`/orgs/${orgId}/bookings`),
  requests: (orgId: string) => isLive("resources")
    ? api<{ items: ResourceRequest[] }>(`/v1/orgs/${orgId}/resource-requests`).then(({ items }) => items)
    : api<ResourceRequest[]>(`/orgs/${orgId}/resource-requests`),

  create: (orgId: string, body: ResourceDraft) =>
    api<Omit<Resource, "org_id"> | Resource>(pathFor(`/orgs/${orgId}/resources`), { method: "POST", json: body })
      .then(withOrg(orgId)),

  update: (orgId: string, resourceId: string, body: Partial<ResourceDraft>) =>
    api<Omit<Resource, "org_id"> | Resource>(pathFor(`/orgs/${orgId}/resources/${resourceId}`), { method: "PATCH", json: body })
      .then(withOrg(orgId)),

  remove: (orgId: string, resourceId: string) =>
    api<void>(pathFor(`/orgs/${orgId}/resources/${resourceId}`), { method: "DELETE" }),

  request: (orgId: string, resourceId: string, body: RequestDraft) =>
    isLive("resources")
      ? api<ResourceRequest>(pathFor(`/orgs/${orgId}/resources/${resourceId}/requests`), {
          method: "POST",
          json: body,
        })
      : mockRequest(resourceId, body),

  decide: (orgId: string, requestId: string, status: "approved" | "rejected") =>
    isLive("resources")
      ? api<ResourceRequest>(pathFor(`/orgs/${orgId}/resource-requests/${requestId}`), {
          method: "PATCH",
          json: { status },
        })
      : mockDecide(requestId, status),
};
