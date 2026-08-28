import { api } from "@/lib/http";
import type { InvitationPreview, OrganizationInvitation, OrganizationMember } from "@/lib/types";

type Page<T> = { items: T[]; next_cursor?: string | null };
const path = (value: string) => encodeURIComponent(value);

export const membershipsApi = {
  members: (orgId: string) => api<Page<OrganizationMember>>(`/v1/orgs/${path(orgId)}/members`),
  invitations: (orgId: string) => api<Page<OrganizationInvitation>>(`/v1/orgs/${path(orgId)}/invitations`),
  invite: (orgId: string, email: string) => api<OrganizationInvitation & { token: string }>(
    `/v1/orgs/${path(orgId)}/invitations`, { method: "POST", json: { email } }
  ),
  revoke: (orgId: string, invitationId: string) => api<void>(
    `/v1/orgs/${path(orgId)}/invitations/${path(invitationId)}`, { method: "DELETE" }
  ),
  preview: (token: string) => api<InvitationPreview>("/v1/organization-invitations/current", {
    headers: { "X-Invitation-Token": token },
  }),
  accept: (token: string) => api<{ accepted: true }>("/v1/organization-invitations/current/accept", {
    method: "POST", headers: { "X-Invitation-Token": token },
  }),
  decline: (token: string) => api<void>("/v1/organization-invitations/current", {
    method: "DELETE", headers: { "X-Invitation-Token": token },
  }),
};
