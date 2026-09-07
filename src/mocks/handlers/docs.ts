import { HttpResponse } from "msw";
import { teamRoute } from "@/mocks/guard";
import { db, now, uid } from "@/mocks/db";
import { actorFrom } from "@/mocks/session";
import type { Doc, DocSummary } from "@/lib/types";

const summary = (doc: Doc): DocSummary => ({
  id: doc.id,
  team_public_id: doc.team_public_id,
  title: doc.title,
  updated_at: doc.updated_at,
  updated_by: doc.updated_by,
});

export const docHandlers = [
  teamRoute.post(
    "/api/v1/orgs/:orgId/teams/:teamId/documents/:docId/socket-ticket",
    () => HttpResponse.json({ token: "mock-document-ticket-is-not-valid-outside-isolated-ui-tests" }),
  ),

  teamRoute.get("/api/teams/:teamId/docs", ({ params }) =>
    HttpResponse.json(
      db.docs
        .filter((d) => d.team_public_id === params.teamId)
        .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
        .map(summary)
    )
  ),

  teamRoute.post("/api/teams/:teamId/docs", async ({ request, params }) => {
    const actor = actorFrom(request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    const { title } = (await request.json()) as { title: string };
    const doc: Doc = {
      id: uid("d"),
      team_public_id: String(params.teamId),
      title: title.trim() || "Untitled document",
      updated_at: now(),
      updated_by: actor.name,
      content: "",
    };
    db.docs.unshift(doc);
    return HttpResponse.json(doc, { status: 201 });
  }),

  teamRoute.get("/api/teams/:teamId/docs/:docId", ({ params }) => {
    const doc = db.docs.find((d) => d.id === params.docId);
    return doc ? HttpResponse.json(doc) : new HttpResponse("Document not found", { status: 404 });
  }),

  teamRoute.patch("/api/teams/:teamId/docs/:docId", async ({ request, params }) => {
    const doc = db.docs.find((d) => d.id === params.docId);
    if (!doc) return new HttpResponse("Document not found", { status: 404 });
    const body = (await request.json()) as { title?: string; content?: string };
    if (body.title !== undefined) doc.title = body.title.trim() || "Untitled document";
    if (body.content !== undefined) doc.content = body.content;
    doc.updated_at = now();
    doc.updated_by = actorFrom(request)?.name ?? doc.updated_by;
    return HttpResponse.json(doc);
  }),

  teamRoute.delete("/api/teams/:teamId/docs/:docId", ({ params }) => {
    const index = db.docs.findIndex((d) => d.id === params.docId);
    if (index < 0) return new HttpResponse("Document not found", { status: 404 });
    db.docs.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
