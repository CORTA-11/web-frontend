import { api } from "@/lib/http";
import { isLive } from "@/lib/env";
import type { Doc, DocSummary } from "@/lib/types";

type LiveDocument = {
  id: string;
  team_id: string;
  title: string;
  updated_by: string;
  updated_at: string;
};

type LiveDocumentProjection = LiveDocument & { body_html: string };

const liveBase = (orgId: string, teamId: string) => `/v1/orgs/${orgId}/teams/${teamId}/documents`;
const fromLive = (document: LiveDocument): DocSummary => ({
  id: document.id,
  team_public_id: document.team_id,
  title: document.title,
  updated_at: document.updated_at,
  updated_by: document.updated_by,
});

export const docsApi = {
  list: (orgId: string, teamId: string) =>
    isLive("docs")
      ? api<{ items: LiveDocument[] }>(liveBase(orgId, teamId)).then((page) => page.items.map(fromLive))
      : api<DocSummary[]>(`/teams/${teamId}/docs`),
  get: (orgId: string, teamId: string, docId: string) =>
    isLive("docs")
      // core-api calls the persisted rich-text projection body_html; the existing editor contract calls it content.
      ? api<LiveDocumentProjection>(`${liveBase(orgId, teamId)}/${docId}`).then((document) => ({ ...fromLive(document), content: document.body_html }))
      : api<Doc>(`/teams/${teamId}/docs/${docId}`),
  create: (orgId: string, teamId: string, title: string) =>
    isLive("docs")
      ? api<LiveDocument>(liveBase(orgId, teamId), { method: "POST", json: { title } }).then(fromLive)
      : api<Doc>(`/teams/${teamId}/docs`, { method: "POST", json: { title } }),
  update: (teamId: string, docId: string, body: { title?: string; content?: string }) =>
    api<Doc>(`/teams/${teamId}/docs/${docId}`, { method: "PATCH", json: body }),
  remove: (teamId: string, docId: string) =>
    api<void>(`/teams/${teamId}/docs/${docId}`, { method: "DELETE" }),
};
