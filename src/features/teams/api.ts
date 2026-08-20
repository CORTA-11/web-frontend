import { isLive } from "@/lib/env";
import { api } from "@/lib/http";
import type { OrgUser, Team, TeamMember } from "@/lib/types";

const orgHeader = (orgId: string) => ({ "X-Org-ID": orgId });

/**
 * core-api scopes teams by an X-Org-ID header and returns { id, name, slug }
 * with no membership data. Mapping it to the contract shape happens here and
 * nowhere else.
 */
type LiveTeam = { id: number; name: string; slug: string; created_at: string };

const fromLive = (orgId: string) => (team: LiveTeam): Team => ({
  id: team.id,
  public_id: team.slug,
  org_id: orgId,
  name: team.name,
  member_count: 0,
  created_at: team.created_at,
});

export type CreateTeam = { name: string; description?: string; leader_user_id: number };

export const teamsApi = {
  list: (orgId: string) =>
    isLive("teams")
      ? api<LiveTeam[]>("/teams", { headers: orgHeader(orgId) }).then((teams) => teams.map(fromLive(orgId)))
      : api<Team[]>(`/orgs/${orgId}/teams`),

  create: (orgId: string, body: CreateTeam) =>
    isLive("teams")
      ? api<LiveTeam>("/teams", { method: "POST", headers: orgHeader(orgId), json: { name: body.name } }).then(fromLive(orgId))
      : api<Team>(`/orgs/${orgId}/teams`, { method: "POST", json: body }),

  get: (teamId: string) => api<Team>(`/teams/${teamId}`),

  update: (teamId: string, body: { name?: string; description?: string }) =>
    api<Team>(`/teams/${teamId}`, { method: "PATCH", json: body }),

  remove: (teamId: string) => api<void>(`/teams/${teamId}`, { method: "DELETE" }),

  members: (teamId: string) => api<TeamMember[]>(`/teams/${teamId}/members`),

  addMember: (teamId: string, userId: number) =>
    api<TeamMember>(`/teams/${teamId}/members`, { method: "POST", json: { user_id: userId } }),

  removeMember: (teamId: string, userId: number) =>
    api<void>(`/teams/${teamId}/members/${userId}`, { method: "DELETE" }),

  setLeader: (teamId: string, userId: number) =>
    api<TeamMember[]>(`/teams/${teamId}/leader`, { method: "PUT", json: { user_id: userId } }),

  leave: (teamId: string) => api<void>(`/teams/${teamId}/leave`, { method: "POST" }),

  orgUsers: (orgId: string) => api<OrgUser[]>(`/orgs/${orgId}/users`),
};
