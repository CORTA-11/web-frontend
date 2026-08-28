import { api } from "@/lib/http";
import type { Booking, Resource, ResourceRequest } from "@/lib/types";

export type ResourceDraft = Omit<Resource, "id" | "org_id">;
export type RequestDraft = {
  team_public_id: string;
  start_time: string;
  end_time: string;
  purpose: string;
};

export const resourcesApi = {
  list: (orgId: string) => api<Resource[]>(`/orgs/${orgId}/resources`),
  bookings: (orgId: string) => api<Booking[]>(`/orgs/${orgId}/bookings`),
  requests: (orgId: string) => api<ResourceRequest[]>(`/orgs/${orgId}/resource-requests`),

  create: (orgId: string, body: ResourceDraft) =>
    api<Resource>(`/orgs/${orgId}/resources`, { method: "POST", json: body }),

  update: (orgId: string, resourceId: string, body: Partial<ResourceDraft>) =>
    api<Resource>(`/orgs/${orgId}/resources/${resourceId}`, { method: "PATCH", json: body }),

  remove: (orgId: string, resourceId: string) =>
    api<void>(`/orgs/${orgId}/resources/${resourceId}`, { method: "DELETE" }),

  request: (orgId: string, resourceId: string, body: RequestDraft) =>
    api<ResourceRequest>(`/orgs/${orgId}/resources/${resourceId}/requests`, {
      method: "POST",
      json: body,
    }),

  decide: (orgId: string, requestId: string, status: "approved" | "rejected") =>
    api<ResourceRequest>(`/orgs/${orgId}/resource-requests/${requestId}`, {
      method: "PATCH",
      json: { status },
    }),
};
