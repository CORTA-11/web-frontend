import { http, HttpResponse } from "msw";
import { rosterRoute, teamRoute } from "@/mocks/guard";
import { db, now, uid } from "@/mocks/db";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import type { Team, TeamMember } from "@/lib/types";

const withRole = (team: Team, userId: number | undefined): Team => ({
  ...team,
  my_role: userId ? teamRoleOf(team.public_id, userId) : undefined,
  member_count: db.members[team.public_id]?.length ?? 0,
});

const findTeam = (publicId: string) => db.teams.find((t) => t.public_id === publicId);

export const teamHandlers = [
  http.get("/api/orgs/:orgId/teams", ({ request, params }) => {
    const actor = actorFrom(request);
    const inOrg = db.teams.filter((team) => team.org_id === String(params.orgId));
    const visible =
      actor?.org_role === "ORG_ADMIN"
        ? inOrg
        : inOrg.filter((t) => teamRoleOf(t.public_id, actor?.id ?? -1));
    return HttpResponse.json(visible.map((t) => withRole(t, actor?.id)));
  }),

  http.post("/api/orgs/:orgId/teams", async ({ request, params }) => {
    const body = (await request.json()) as { name: string; description?: string; leader_user_id: number };
    const leader = db.people.find((p) => p.id === Number(body.leader_user_id));
    if (!leader) return new HttpResponse("Unknown team leader", { status: 400 });

    const team: Team = {
      id: db.teams.length + 1,
      public_id: uid("team"),
      org_id: String(params.orgId),
      name: body.name.trim(),
      description: body.description?.trim(),
      member_count: 1,
      created_at: now(),
    };
    db.teams.push(team);
    db.members[team.public_id] = [
      { user_id: leader.id, name: leader.name, email: leader.email, role: "TEAM_LEADER", joined_at: now() },
    ];
    db.tasks[team.public_id] = [];
    db.chat[team.public_id] = [];
    db.files[team.public_id] = [];
    return HttpResponse.json(withRole(team, actorFrom(request)?.id), { status: 201 });
  }),

  http.get("/api/teams/:teamId", ({ request, params }) => {
    const team = findTeam(String(params.teamId));
    if (!team) return new HttpResponse("Team not found", { status: 404 });
    return HttpResponse.json(withRole(team, actorFrom(request)?.id));
  }),

  http.patch("/api/teams/:teamId", async ({ request, params }) => {
    const team = findTeam(String(params.teamId));
    if (!team) return new HttpResponse("Team not found", { status: 404 });
    const actor = actorFrom(request);
    if (!actor || teamRoleOf(team.public_id, actor.id) !== "TEAM_LEADER") {
      return new HttpResponse("Only the team leader can rename this team", { status: 403 });
    }
    const body = (await request.json()) as { name?: string; description?: string };
    Object.assign(team, body.name ? { name: body.name.trim() } : {}, body.description !== undefined ? { description: body.description } : {});
    return HttpResponse.json(withRole(team, actorFrom(request)?.id));
  }),

  http.delete("/api/teams/:teamId", ({ request, params }) => {
    if (actorFrom(request)?.org_role !== "ORG_ADMIN") {
      return new HttpResponse("Only an organisation admin can delete a team", { status: 403 });
    }
    const index = db.teams.findIndex((t) => t.public_id === String(params.teamId));
    if (index < 0) return new HttpResponse("Team not found", { status: 404 });
    db.teams.splice(index, 1);
    delete db.members[String(params.teamId)];
    return new HttpResponse(null, { status: 204 });
  }),

  rosterRoute.get("/api/teams/:teamId/members", ({ params }) =>
    HttpResponse.json(db.members[String(params.teamId)] ?? [])
  ),

  rosterRoute.post("/api/teams/:teamId/members", async ({ request, params }) => {
    const teamId = String(params.teamId);
    const { user_id } = (await request.json()) as { user_id: number };
    const person = db.people.find((p) => p.id === Number(user_id));
    if (!person) return new HttpResponse("Unknown user", { status: 400 });
    if (teamRoleOf(teamId, person.id)) return new HttpResponse("Already a member", { status: 409 });

    const entry: TeamMember = {
      user_id: person.id, name: person.name, email: person.email,
      role: "TEAM_MEMBER", joined_at: now(),
    };
    db.members[teamId] = [...(db.members[teamId] ?? []), entry];
    return HttpResponse.json(entry, { status: 201 });
  }),

  rosterRoute.delete("/api/teams/:teamId/members/:userId", ({ params }) => {
    const teamId = String(params.teamId);
    const userId = Number(params.userId);
    if (teamRoleOf(teamId, userId) === "TEAM_LEADER") {
      return new HttpResponse("The team leader cannot be removed", { status: 409 });
    }
    db.members[teamId] = (db.members[teamId] ?? []).filter((m) => m.user_id !== userId);
    return new HttpResponse(null, { status: 204 });
  }),

  rosterRoute.put("/api/teams/:teamId/leader", async ({ request, params }) => {
    const teamId = String(params.teamId);
    const { user_id } = (await request.json()) as { user_id: number };
    const roster = db.members[teamId] ?? [];
    if (!roster.some((m) => m.user_id === Number(user_id))) {
      return new HttpResponse("That user is not in this team", { status: 400 });
    }
    db.members[teamId] = roster.map((m) => ({
      ...m,
      role: m.user_id === Number(user_id) ? "TEAM_LEADER" : "TEAM_MEMBER",
    }));
    return HttpResponse.json(db.members[teamId]);
  }),

  teamRoute.post("/api/teams/:teamId/leave", ({ request, params }) => {
    const teamId = String(params.teamId);
    const actor = actorFrom(request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (teamRoleOf(teamId, actor.id) === "TEAM_LEADER") {
      return new HttpResponse("A team leader cannot leave the team", { status: 409 });
    }
    db.members[teamId] = (db.members[teamId] ?? []).filter((m) => m.user_id !== actor.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/orgs/:orgId/users", () =>
    HttpResponse.json(
      db.people.map(({ id, email, name, org_role }) => ({ id, email, name, org_role }))
    )
  ),
];
