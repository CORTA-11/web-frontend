import { isLive } from "@/lib/env";
import { api } from "@/lib/http";
import { orgRoleOf } from "@/features/auth/api";
import type { OrgUser, Team, TeamMember, TeamRole } from "@/lib/types";

/**
 * core-api v1 scopes teams under /orgs/{org_id}/teams and identifies them by
 * UUID. In live mode Team.public_id is set to the backend team UUID, so the
 * sub-routes (board/tasks) resolve without a slug→UUID lookup. The backend
 * returns no description or per-team member counts, so those stay blank/zero.
 *
 * Only listing, creation, member-list and add-member exist on the backend;
 * remove/leader/leave have no live routes yet.
 */

type LiveTeam = { id: string; name: string; slug: string; created_at: string; my_role: string };

const roleOf = (role: string): TeamRole | undefined => (role === "team_admin" ? "TEAM_LEADER" : "TEAM_MEMBER");

const fromLive = (orgId: string) => (team: LiveTeam): Team => ({
  id: 0,
  public_id: team.id,
  org_id: orgId,
  name: team.name,
  member_count: 0,
  created_at: team.created_at,
  my_role: team.my_role ? roleOf(team.my_role) : undefined,
});

export type CreateTeam = { name: string; description?: string; leader_user_id: number };

type LiveMember = { user_id: string; name?: string; email?: string; role: string; joined_at: string };

type LiveOrgMember = { user_id: string; display_name: string; email: string; role: string; joined_at: string };

/** Stable numeric key from a UUID so the roster table keeps a usable id. */
const numericKey = (uuid: string) => Number(`0x${uuid.replace(/-/g, "").slice(0, 15)}`);

const memberFromLive = (entry: LiveMember): TeamMember => ({
  user_id: numericKey(entry.user_id),
  name: entry.name ?? "",
  email: entry.email ?? "",
  role: roleOf(entry.role) ?? "TEAM_MEMBER",
  joined_at: entry.joined_at,
});

export const teamsApi = {
  list: (orgId: string) =>
    isLive("teams")
      ? api<{ items: LiveTeam[] }>(`/v1/orgs/${orgId}/teams`).then((page) => page.items.map(fromLive(orgId)))
      : api<Team[]>(`/orgs/${orgId}/teams`),

  create: (orgId: string, body: CreateTeam & { leaderEmail?: string }) =>
    isLive("teams")
      ? api<LiveTeam>(`/v1/orgs/${orgId}/teams`, {
          method: "POST",
          json: { name: body.name, leader_email: body.leaderEmail },
        }).then(fromLive(orgId))
      : api<Team>(`/orgs/${orgId}/teams`, { method: "POST", json: body }),

  get: (teamId: string, orgId?: string) =>
    isLive("teams") && orgId
      ? teamsApi.list(orgId).then((teams) => {
          const team = teams.find((t) => t.public_id === teamId);
          if (!team) throw new Error("Team not found");
          return team;
        })
      : api<Team>(`/teams/${teamId}`),

  update: (teamId: string, body: { name?: string; description?: string }) =>
    api<Team>(`/teams/${teamId}`, { method: "PATCH", json: body }),

  remove: (teamId: string) => api<void>(`/teams/${teamId}`, { method: "DELETE" }),

  members: (teamId: string, orgId: string) =>
    isLive("teams")
      ? api<{ items: LiveMember[] }>(`/v1/orgs/${orgId}/teams/${teamId}/members`).then((page) =>
          page.items.map(memberFromLive)
        )
      : api<TeamMember[]>(`/teams/${teamId}/members`),

  addMember: (teamId: string, orgId: string, email: string) =>
    isLive("teams")
      ? api<LiveMember>(`/v1/orgs/${orgId}/teams/${teamId}/members`, { method: "POST", json: { email } }).then(
          memberFromLive
        )
      : api<TeamMember>(`/teams/${teamId}/members`, { method: "POST", json: { email } }),

  removeMember: (teamId: string, userId: number) =>
    api<void>(`/teams/${teamId}/members/${userId}`, { method: "DELETE" }),

  setLeader: (teamId: string, userId: number) =>
    api<TeamMember[]>(`/teams/${teamId}/leader`, { method: "PUT", json: { user_id: userId } }),

  leave: (teamId: string) => api<void>(`/teams/${teamId}/leave`, { method: "POST" }),

  orgUsers: (orgId: string) =>
    isLive("teams")
      ? api<{ items: LiveOrgMember[] }>(`/v1/orgs/${orgId}/members`).then((page) =>
          page.items.map((entry) => ({
            id: numericKey(entry.user_id),
            name: entry.display_name,
            email: entry.email,
            org_role: orgRoleOf(entry.role),
          }))
        )
      : api<OrgUser[]>(`/orgs/${orgId}/users`),
};
