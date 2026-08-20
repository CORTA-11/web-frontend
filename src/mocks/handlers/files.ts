import { HttpResponse } from "msw";
import { teamRoute } from "@/mocks/guard";
import { db, now, uid } from "@/mocks/db";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import type { StoredFile } from "@/lib/types";

const shelfOf = (teamId: string) => (db.files[teamId] ??= []);

export const fileHandlers = [
  teamRoute.get("/api/teams/:teamId/files", ({ params }) =>
    HttpResponse.json(shelfOf(String(params.teamId)))
  ),

  teamRoute.post("/api/teams/:teamId/files/upload", async ({ request, params }) => {
    const actor = actorFrom(request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });

    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File)) return new HttpResponse("No file in the request", { status: 400 });

    const entry: StoredFile = {
      id: uid("f"),
      name: upload.name,
      size: upload.size,
      content_type: upload.type || "application/octet-stream",
      uploaded_by: actor.id,
      uploaded_by_name: actor.name,
      uploaded_at: now(),
    };
    shelfOf(String(params.teamId)).unshift(entry);
    return HttpResponse.json(entry, { status: 201 });
  }),

  teamRoute.get("/api/teams/:teamId/files/download/:fileId", ({ params }) => {
    const entry = shelfOf(String(params.teamId)).find((f) => f.id === params.fileId);
    if (!entry) return new HttpResponse("File not found", { status: 404 });
    return new HttpResponse(`Placeholder contents for ${entry.name}`, {
      headers: {
        "Content-Type": entry.content_type,
        "Content-Disposition": `attachment; filename=${entry.name}`,
      },
    });
  }),

  teamRoute.delete("/api/teams/:teamId/files/:fileId", ({ request, params }) => {
    const teamId = String(params.teamId);
    const actor = actorFrom(request);
    const shelf = shelfOf(teamId);
    const entry = shelf.find((f) => f.id === params.fileId);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (!entry) return new HttpResponse("File not found", { status: 404 });
    if (entry.uploaded_by !== actor.id && teamRoleOf(teamId, actor.id) !== "TEAM_LEADER") {
      return new HttpResponse("You can only delete files you uploaded", { status: 403 });
    }
    db.files[teamId] = shelf.filter((f) => f.id !== entry.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
