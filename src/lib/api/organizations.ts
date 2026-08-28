import { apiRequest } from "@/lib/api/client";
import type { CursorPage, Organization } from "@/lib/types/api";

function pageQuery(cursor?: string | null) {
  const query = new URLSearchParams({ page_size: "20" });
  if (cursor) query.set("cursor", cursor);
  return query.toString();
}

export const organizationsApi = {
  list: (cursor?: string | null) =>
    apiRequest<CursorPage<Organization>>(`/orgs?${pageQuery(cursor)}`),
  get: (orgId: string) =>
    apiRequest<Organization>(`/orgs/${encodeURIComponent(orgId)}`),
  create: (name: string) =>
    apiRequest<Organization>("/orgs", {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    }),
};
