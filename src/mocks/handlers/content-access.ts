import { HttpResponse } from "msw";
import { teamRoute } from "@/mocks/guard";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import { contentPermissions } from "@/mocks/content-permissions";
import type { ContentKind } from "@/features/content-access/api";

const base = "/api/v1/orgs/:orgId/teams/:teamId/content-access";
const missing = () => new HttpResponse("Content or request unavailable", { status: 404 });
const valid = <T extends { kind?: string; resource_id?: string }>(body: T): body is T & { kind: ContentKind; resource_id: string } =>
  (body.kind === "file" || body.kind === "document") && typeof body.resource_id === "string";

export const contentAccessHandlers = [
  teamRoute.get(base, ({ request, params }) => {
    const actor = actorFrom(request);
    return actor ? HttpResponse.json(contentPermissions.snapshot(String(params.teamId), actor.id)) : missing();
  }),
  teamRoute.post(`${base}/requests`, async ({ request, params }) => {
    const actor = actorFrom(request);
    const body = await request.json() as { kind?: string; resource_id?: string };
    return actor && valid(body) && contentPermissions.request(String(params.teamId), actor.id, body.kind, body.resource_id)
      ? new HttpResponse(null, { status: 204 }) : missing();
  }),
  teamRoute.post(`${base}/grants`, async ({ request, params }) => {
    const actor = actorFrom(request);
    const body = await request.json() as { kind?: string; resource_id?: string; member_id?: string };
    return actor && valid(body) && typeof body.member_id === "string" && contentPermissions.grant(String(params.teamId), actor.id, body.kind, body.resource_id, body.member_id)
      ? new HttpResponse(null, { status: 204 }) : missing();
  }),
  ...(["approve", "deny"] as const).map((decision) => teamRoute.post(`${base}/requests/:requestId/${decision}`, ({ request, params }) => {
    const actor = actorFrom(request);
    return actor && contentPermissions.decide(String(params.teamId), actor.id, String(params.requestId), decision === "approve" ? "granted" : "denied")
      ? new HttpResponse(null, { status: 204 }) : missing();
  })),
  teamRoute.get(`${base}/events`, ({ request, params }) => {
    const actor = actorFrom(request);
    if (!actor) return missing();
    let stop: (close?: boolean) => void = () => {};
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        let previous = "";
        const emit = () => {
          if (!teamRoleOf(String(params.teamId), actor.id)) { stop(); return; }
          const current = JSON.stringify(contentPermissions.snapshot(String(params.teamId), actor.id));
          controller.enqueue(encoder.encode(current === previous ? ": heartbeat\n\n" : `event: content-access\ndata: ${current}\n\n`));
          previous = current;
        };
        const timer = setInterval(emit, 2000);
        const expiry = setTimeout(() => stop(), 30000);
        let closed = false;
        const abort = () => stop();
        stop = (close = true) => {
          if (closed) return;
          closed = true; clearInterval(timer); clearTimeout(expiry);
          request.signal.removeEventListener("abort", abort);
          if (close) controller.close();
        };
        request.signal.addEventListener("abort", abort, { once: true });
        emit();
      },
      cancel() { stop(false); },
    });
    return new HttpResponse(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  }),
];
