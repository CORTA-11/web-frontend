import { api } from "@/lib/http";
import type { Doc, DocSummary } from "@/lib/types";

export const docsApi = {
  list: (teamId: string) => api<DocSummary[]>(`/teams/${teamId}/docs`),
  get: (teamId: string, docId: string) => api<Doc>(`/teams/${teamId}/docs/${docId}`),
  create: (teamId: string, title: string) =>
    api<Doc>(`/teams/${teamId}/docs`, { method: "POST", json: { title } }),
  update: (teamId: string, docId: string, body: { title?: string; content?: string }) =>
    api<Doc>(`/teams/${teamId}/docs/${docId}`, { method: "PATCH", json: body }),
  remove: (teamId: string, docId: string) =>
    api<void>(`/teams/${teamId}/docs/${docId}`, { method: "DELETE" }),
};
