import { HttpResponse } from "msw";
import { teamRoute } from "@/mocks/guard";
import { db, now, uid } from "@/mocks/db";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import type { ChatMessage } from "@/lib/types";

const roomOf = (teamId: string) => (db.chat[teamId] ??= []);

export const chatHandlers = [
  teamRoute.get("/api/teams/:teamId/chat/messages", ({ request, params }) => {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 50);
    const messages = roomOf(String(params.teamId)).slice(-limit);
    return HttpResponse.json({ messages });
  }),

  teamRoute.post("/api/teams/:teamId/chat/messages", async ({ request, params }) => {
    const actor = actorFrom(request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });

    const body = (await request.json()) as {
      message: string;
      reply_to_id?: string | null;
      mentions?: number[];
    };
    const text = body.message.trim();
    if (!text) return new HttpResponse("Message cannot be empty", { status: 400 });

    const message: ChatMessage = {
      id: uid("m"),
      channel_id: String(params.teamId),
      sender: { id: actor.id, name: actor.name },
      reply_to_id: body.reply_to_id ?? null,
      mentions: body.mentions ?? [],
      message: text,
      created_at: now(),
    };
    roomOf(String(params.teamId)).push(message);
    return HttpResponse.json(message, { status: 201 });
  }),

  teamRoute.delete("/api/teams/:teamId/chat/messages/:messageId", ({ request, params }) => {
    const teamId = String(params.teamId);
    const actor = actorFrom(request);
    const message = roomOf(teamId).find((m) => m.id === params.messageId);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (!message) return new HttpResponse("Message not found", { status: 404 });

    const isOwn = message.sender.id === actor.id;
    const isLeader = teamRoleOf(teamId, actor.id) === "TEAM_LEADER";
    if (!isOwn && !isLeader) {
      return new HttpResponse("You can only delete your own messages", { status: 403 });
    }
    message.deleted_at = now();
    return HttpResponse.json({ id: message.id, channel_id: teamId, deleted_at: message.deleted_at });
  }),
];
