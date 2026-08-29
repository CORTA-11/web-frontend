import { api } from "@/lib/http";

export type Invitation = { id: string; created_at: string; expires_at: string };
export type CreatedInvitation = Invitation & { token: string };
export type InvitationPreview = {
  organization_id: string;
  organization_name: string;
  expires_at: string;
};

const tokenHeader = (token: string) => ({ "X-Invitation-Token": token });

export const invitationsApi = {
  list: (orgId: string) =>
    api<{ items: Invitation[] }>(`/v1/orgs/${orgId}/invitations`).then(({ items }) => items),
  create: (orgId: string, email: string) =>
    api<CreatedInvitation>(`/v1/orgs/${orgId}/invitations`, { method: "POST", json: { email } }),
  revoke: (orgId: string, id: string) =>
    api<void>(`/v1/orgs/${orgId}/invitations/${id}`, { method: "DELETE" }),
  preview: (token: string) =>
    api<InvitationPreview>("/v1/organization-invitations/current", { headers: tokenHeader(token) }),
  accept: (token: string) =>
    api<{ accepted: boolean }>("/v1/organization-invitations/current/accept", {
      method: "POST", headers: tokenHeader(token),
    }),
  decline: (token: string) =>
    api<void>("/v1/organization-invitations/current", { method: "DELETE", headers: tokenHeader(token) }),
};
