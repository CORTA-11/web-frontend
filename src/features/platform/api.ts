import { api } from "@/lib/http";
import type { Organization, OrgStatus } from "@/lib/types";

export const platformApi = {
  orgs: () => api<Organization[]>("/platform/orgs"),
  setStatus: (orgId: string, status: OrgStatus) =>
    api<Organization>(`/platform/orgs/${orgId}`, { method: "PATCH", json: { status } }),
};
