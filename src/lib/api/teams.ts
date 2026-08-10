import type { ApiResponse } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/token";
import { mockDelay } from "@/lib/mock/delay";
import {
  loadMockSessionUserId,
  userIdFromMockToken,
} from "@/lib/mock/session";
import {
  membersFor,
  mockTeams,
  orgUsersFor,
  teamWithRole,
  type MockTeamRecord,
} from "@/lib/mock/teams";
import { findAccountById } from "@/lib/mock/users";
import type { OrgUser, Team, TeamMember } from "@/lib/types/team";

export type { OrgUser, Team, TeamMember };

function currentUserId(): string | null {
  return userIdFromMockToken(getAccessToken()) ?? loadMockSessionUserId();
}

function findTeam(teamPublicId: string): MockTeamRecord | undefined {
  return mockTeams.find((t) => t.publicId === teamPublicId);
}

export const teamsApi = {
  list: async (orgId: string): Promise<ApiResponse<Team[]>> => {
    await mockDelay();
    const userId = currentUserId();
    const account = userId ? findAccountById(userId) : undefined;
    const inOrg = mockTeams.filter((t) => t.orgId === orgId);

    if (account?.role === "admin") {
      return {
        success: true,
        data: inOrg.map((t) => teamWithRole(t, userId)),
      };
    }

    return {
      success: true,
      data: inOrg
        .filter((t) => userId && t.memberUserIds.includes(userId))
        .map((t) => teamWithRole(t, userId)),
    };
  },

  get: async (teamPublicId: string): Promise<ApiResponse<Team>> => {
    await mockDelay();
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    return { success: true, data: teamWithRole(team, currentUserId()) };
  },

  create: async (
    orgId: string,
    input: { name: string; description?: string; leaderUserId?: number }
  ): Promise<ApiResponse<Team>> => {
    await mockDelay();
    const name = input.name.trim();
    if (!name) return { success: false, error: "Team name is required." };

    const leaderId = input.leaderUserId
      ? String(input.leaderUserId)
      : null;
    const publicId = `team-${crypto.randomUUID().slice(0, 8)}`;
    const record: MockTeamRecord = {
      id: publicId,
      publicId,
      orgId,
      name,
      description: input.description,
      myRole: null,
      createdAt: new Date().toISOString(),
      memberUserIds: leaderId ? [leaderId] : [],
      leaderUserId: leaderId,
    };
    mockTeams.push(record);
    return { success: true, data: teamWithRole(record, currentUserId()) };
  },

  listMembers: async (
    teamPublicId: string
  ): Promise<ApiResponse<TeamMember[]>> => {
    await mockDelay();
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    return { success: true, data: membersFor(team) };
  },

  addMember: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<TeamMember>> => {
    await mockDelay();
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    const id = String(userId);
    if (!team.memberUserIds.includes(id)) {
      team.memberUserIds = [...team.memberUserIds, id];
    }
    const member = membersFor(team).find((m) => m.userId === userId);
    if (!member) return { success: false, error: "User not found." };
    return { success: true, data: member };
  },

  removeMember: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<null>> => {
    await mockDelay(150);
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    const id = String(userId);
    if (team.leaderUserId === id) {
      return { success: false, error: "Cannot remove the team leader." };
    }
    team.memberUserIds = team.memberUserIds.filter((m) => m !== id);
    return { success: true, data: null };
  },

  assignLeader: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<TeamMember>> => {
    await mockDelay();
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    const id = String(userId);
    if (!team.memberUserIds.includes(id)) {
      team.memberUserIds = [...team.memberUserIds, id];
    }
    team.leaderUserId = id;
    const member = membersFor(team).find((m) => m.userId === userId);
    if (!member) return { success: false, error: "User not found." };
    return { success: true, data: member };
  },

  leave: async (teamPublicId: string): Promise<ApiResponse<null>> => {
    await mockDelay(150);
    const team = findTeam(teamPublicId);
    if (!team) return { success: false, error: "Team not found." };
    const userId = currentUserId();
    if (!userId) return { success: false, error: "Unauthorized" };
    if (team.leaderUserId === userId) {
      return { success: false, error: "Team leader cannot leave the team." };
    }
    team.memberUserIds = team.memberUserIds.filter((m) => m !== userId);
    return { success: true, data: null };
  },

  listOrgUsers: async (orgId: string): Promise<ApiResponse<OrgUser[]>> => {
    await mockDelay();
    return { success: true, data: orgUsersFor(orgId) };
  },
};
