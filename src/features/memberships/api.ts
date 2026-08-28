import { apiRequest } from "@/lib/api/client";
import type { InvitationPreview, OrganizationInvitation, OrganizationMember } from "@/lib/types";

type Page<T> = { items: T[]; next_cursor?: string | null };
const path = (value: string) => encodeURIComponent(value);

export const membershipsApi = {
  members: (orgId: string) => apiRequest<Page<OrganizationMember>>(`/orgs/${path(orgId)}/members`),
  invitations: (orgId: string) => apiRequest<Page<OrganizationInvitation>>(`/orgs/${path(orgId)}/invitations`),
  invite: (orgId: string, email: string) => apiRequest<OrganizationInvitation & { token: string }>(
    `/orgs/${path(orgId)}/invitations`, { method: "POST", body: JSON.stringify({ email }) }
  ),
  revoke: (orgId: string, invitationId: string) => apiRequest<void>(
    `/orgs/${path(orgId)}/invitations/${path(invitationId)}`, { method: "DELETE" }
  ),
  preview: (token: string) => apiRequest<InvitationPreview>("/organization-invitations/current", {
    headers: { "X-Invitation-Token": token },
  }),
  accept: (token: string) => apiRequest<{ accepted: true }>("/organization-invitations/current/accept", {
    method: "POST", headers: { "X-Invitation-Token": token },
  }),
  decline: (token: string) => apiRequest<void>("/organization-invitations/current", {
    method: "DELETE", headers: { "X-Invitation-Token": token },
  }),
};
