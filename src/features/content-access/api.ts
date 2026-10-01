import { api } from "@/lib/http";

export type ContentKind = "file" | "document";
export type ContentAccess = {
  kind: ContentKind; resource_id: string; creator_id: string; can_access: boolean;
};
export type AccessRequest = {
  public_id: string; kind: ContentKind; resource_id: string; requested_by: string;
  requester_name: string; status: "pending" | "granted" | "denied"; updated_at: string;
};
export type AccessSnapshot = { items: ContentAccess[]; requests: AccessRequest[] };
const base = (orgId: string, teamId: string) => `/v1/orgs/${orgId}/teams/${teamId}/content-access`;

export const contentAccessApi = {
  list: (orgId: string, teamId: string) => api<AccessSnapshot>(base(orgId, teamId)),
  request: (orgId: string, teamId: string, kind: ContentKind, resourceId: string) =>
    api<void>(`${base(orgId, teamId)}/requests`, { method: "POST", json: { kind, resource_id: resourceId } }),
  decide: (orgId: string, teamId: string, requestId: string, decision: "approve" | "deny") =>
    api<void>(`${base(orgId, teamId)}/requests/${requestId}/${decision}`, { method: "POST" }),
  grant: (orgId: string, teamId: string, kind: ContentKind, resourceId: string, memberId: string) =>
    api<void>(`${base(orgId, teamId)}/grants`, {
      method: "POST", json: { kind, resource_id: resourceId, member_id: memberId },
    }),
};
