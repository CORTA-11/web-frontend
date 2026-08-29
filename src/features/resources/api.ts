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
    api<ResourceRequest>(pathFor(`/orgs/${orgId}/resources/${resourceId}/requests`), {
      method: "POST",
      json: body,
    }),

  decide: (orgId: string, requestId: string, status: "approved" | "rejected") =>
    api<ResourceRequest>(pathFor(`/orgs/${orgId}/resource-requests/${requestId}`), {
      method: "PATCH",
      json: { status },
    }),
};
