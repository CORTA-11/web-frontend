import { isLive } from "@/lib/env";
import { API_BASE } from "@/lib/env";
import { api, ApiError } from "@/lib/http";
import { getAccessToken } from "@/lib/token";
import type { StoredFile } from "@/lib/types";

/** core-api serves files under /{teamSlug}/files and keys downloads by filename. */
const livePath = (teamId: string, suffix = "") => `/${teamId}/files${suffix}`;
const orgHeader = (orgId: string) => ({ "X-Org-ID": orgId });

type LiveFile = { name: string; size: number; content_type?: string; uploaded_at?: string };

const fromLive = (file: LiveFile): StoredFile => ({
  id: file.name,
  name: file.name,
  size: file.size,
  content_type: file.content_type ?? "application/octet-stream",
  uploaded_by: 0,
  uploaded_by_name: "—",
  uploaded_at: file.uploaded_at ?? new Date().toISOString(),
});

export const filesApi = {
  list: (teamId: string, orgId: string) =>
    isLive("files")
      ? api<LiveFile[]>(livePath(teamId), { headers: orgHeader(orgId) }).then((files) => files.map(fromLive))
      : api<StoredFile[]>(`/teams/${teamId}/files`),

  upload: (teamId: string, orgId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return isLive("files")
      ? api<LiveFile>(livePath(teamId, "/upload"), { method: "POST", headers: orgHeader(orgId), body: form }).then(fromLive)
      : api<StoredFile>(`/teams/${teamId}/files/upload`, { method: "POST", body: form });
  },

  remove: (teamId: string, fileId: string) =>
    isLive("files")
      ? Promise.reject(new ApiError(501, "core-api cannot delete files yet — see PLAN.md §10"))
      : api<void>(`/teams/${teamId}/files/${fileId}`, { method: "DELETE" }),

  /** Streams through fetch so the bearer token travels with the request. */
  download: async (teamId: string, orgId: string, file: StoredFile) => {
    const path = isLive("files")
      ? livePath(teamId, `/download/${encodeURIComponent(file.name)}`)
      : `/teams/${teamId}/files/download/${file.id}`;
    const response = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        ...(isLive("files") ? orgHeader(orgId) : {}),
        ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      },
    });
    if (!response.ok) throw new ApiError(response.status, "Could not download that file");

    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    URL.revokeObjectURL(url);
  },
};
