import { apiRequest } from "@/lib/api/client";
import type { CursorPage, Team } from "@/lib/types/api";

function base(orgId: string) {
  return `/orgs/${encodeURIComponent(orgId)}/teams`;
}

export const teamsApi = {
  list(orgId: string, cursor?: string | null) {
    const query = new URLSearchParams({ page_size: "20" });
    if (cursor) query.set("cursor", cursor);
    return apiRequest<CursorPage<Team>>(`${base(orgId)}?${query}`);
  },
  create(orgId: string, name: string) {
    return apiRequest<Team>(base(orgId), {
      method: "POST",
      body: JSON.stringify({ name: name.trim() }),
    });
  },
};
