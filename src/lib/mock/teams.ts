import {
  MOCK_ORG_ID,
  MOCK_TEAM_PUBLIC_ID,
  mockAccounts,
} from "@/lib/mock/users";
import type { OrgUser, Team, TeamMember } from "@/lib/types/team";

export type MockTeamRecord = Team & {
  memberUserIds: string[];
  leaderUserId: string | null;
};

export let mockTeams: MockTeamRecord[] = [
  {
    id: MOCK_TEAM_PUBLIC_ID,
    publicId: MOCK_TEAM_PUBLIC_ID,
    orgId: MOCK_ORG_ID,
    name: "Lab Alpha",
    description: "Primary research team",
    myRole: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    memberUserIds: ["2", "3"],
    leaderUserId: "2",
  },
];

export function orgUsersFor(orgId: string): OrgUser[] {
  return mockAccounts
    .filter((a) => a.orgId === orgId)
    .map((a) => ({
      id: Number(a.id),
      email: a.email,
      name: a.name,
      orgRole: a.role === "admin" ? "ORG_ADMIN" : "ORG_MEMBER",
      avatarUrl: a.avatarUrl || undefined,
    }));
}

export function membersFor(team: MockTeamRecord): TeamMember[] {
  return team.memberUserIds
    .map((id) => mockAccounts.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))
    .map((a) => ({
      userId: Number(a.id),
      name: a.name,
      email: a.email,
      avatarUrl: a.avatarUrl || undefined,
      role: team.leaderUserId === a.id ? "TEAM_LEADER" : "CONTRIBUTOR",
      joinedAt: "2026-07-01T10:00:00.000Z",
    }));
}

export function teamWithRole(
  team: MockTeamRecord,
  userId: string | null
): Team {
  let myRole: Team["myRole"] = null;
  if (userId && team.memberUserIds.includes(userId)) {
    myRole = team.leaderUserId === userId ? "TEAM_LEADER" : "CONTRIBUTOR";
  }
  return {
    id: team.publicId,
    publicId: team.publicId,
    orgId: team.orgId,
    name: team.name,
    description: team.description,
    myRole,
    createdAt: team.createdAt,
  };
}
