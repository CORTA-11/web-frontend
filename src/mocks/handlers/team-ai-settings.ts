import { http, HttpResponse } from "msw";
import { db } from "@/mocks/db";
import { actorFrom, teamRoleOf } from "@/mocks/session";

const path = "/api/v1/orgs/:orgId/teams/:teamId/ai/settings";
const view = (teamId: string) => {
  const saved = db.teamAISettings[teamId];
  return { endpoint_url: saved?.endpoint_url ?? "", model: saved?.model ?? "", has_api_token: Boolean(saved?.api_token) };
};
const allowed = (request: Request, teamId: string, orgId: string) => {
  const actor = actorFrom(request);
  return actor && db.teams.some((team) => team.public_id === teamId && String(team.org_id) === orgId)
    && teamRoleOf(teamId, actor.id) === "TEAM_LEADER";
};

export const teamAISettingsHandlers = [
  http.get(path, ({ request, params }) => {
    const teamId = String(params.teamId);
    if (!allowed(request, teamId, String(params.orgId))) return new HttpResponse("Only the team admin can access these settings", { status: 403 });
    return HttpResponse.json(view(teamId));
  }),
  http.put(path, async ({ request, params }) => {
    const teamId = String(params.teamId);
    if (!allowed(request, teamId, String(params.orgId))) return new HttpResponse("Only the team admin can access these settings", { status: 403 });
    const body = await request.json() as { endpoint_url: string; model: string; api_token?: string };
    const token = body.api_token?.trim() || db.teamAISettings[teamId]?.api_token;
    if (!body.endpoint_url?.trim() || !body.model?.trim() || !token) return new HttpResponse("Endpoint, model and API token are required", { status: 400 });
    db.teamAISettings[teamId] = { endpoint_url: body.endpoint_url.trim(), model: body.model.trim(), api_token: token };
    return HttpResponse.json(view(teamId));
  }),
];
