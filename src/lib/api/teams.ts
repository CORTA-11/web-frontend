import { apiFetch, type ApiResponse } from "@/lib/api/client";

export type Team = {
  id: string;
  publicId: string;
  orgId: string;
  name: string;
  description?: string;
  myRole?: "TEAM_LEADER" | "CONTRIBUTOR" | string | null;
  createdAt: string;
};

export type TeamMember = {
  userId: number;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "TEAM_LEADER" | "CONTRIBUTOR" | string;
  joinedAt: string;
};

export type OrgUser = {
  id: number;
  email: string;
  name: string;
  orgRole: string;
  avatarUrl?: string;
};

type BackendTeam = {
  id: string;
  public_id: string;
  org_id: number;
  name: string;
  description?: string;
  my_role?: string | null;
  created_at: string;
};

type BackendMember = {
  user_id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  joined_at: string;
};

type BackendOrgUser = {
  id: number;
  email: string;
  name: string;
  org_role: string;
  avatar_url?: string;
};

function mapTeam(team: BackendTeam): Team {
  return {
    id: team.public_id,
    publicId: team.public_id,
    orgId: String(team.org_id),
    name: team.name,
    description: team.description,
    myRole: team.my_role ?? null,
    createdAt: team.created_at,
  };
}

function mapMember(m: BackendMember): TeamMember {
  return {
    userId: m.user_id,
    name: m.name,
    email: m.email,
    avatarUrl: m.avatar_url,
    role: m.role,
    joinedAt: m.joined_at,
  };
}

function mapOrgUser(u: BackendOrgUser): OrgUser {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    orgRole: u.org_role,
    avatarUrl: u.avatar_url,
  };
}

export const teamsApi = {
  list: async (orgId: string): Promise<ApiResponse<Team[]>> => {
    const result = await apiFetch<BackendTeam[]>(`/orgs/${orgId}/teams`);
    if (!result.success) return result;
    return { success: true, data: result.data.map(mapTeam) };
  },

  get: async (teamPublicId: string): Promise<ApiResponse<Team>> => {
    const result = await apiFetch<BackendTeam>(`/teams/${teamPublicId}`);
    if (!result.success) return result;
    return { success: true, data: mapTeam(result.data) };
  },

  create: async (
    orgId: string,
    input: { name: string; description?: string; leaderUserId?: number }
  ): Promise<ApiResponse<Team>> => {
    const result = await apiFetch<BackendTeam>(`/orgs/${orgId}/teams`, {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        description: input.description,
        leader_user_id: input.leaderUserId,
      }),
    });
    if (!result.success) return result;
    return { success: true, data: mapTeam(result.data) };
  },

  listMembers: async (
    teamPublicId: string
  ): Promise<ApiResponse<TeamMember[]>> => {
    const result = await apiFetch<BackendMember[]>(
      `/teams/${teamPublicId}/members`
    );
    if (!result.success) return result;
    return { success: true, data: result.data.map(mapMember) };
  },

  addMember: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<TeamMember>> => {
    const result = await apiFetch<BackendMember>(
      `/teams/${teamPublicId}/members`,
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }
    );
    if (!result.success) return result;
    return { success: true, data: mapMember(result.data) };
  },

  removeMember: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<null>> => {
    return apiFetch<null>(`/teams/${teamPublicId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  assignLeader: async (
    teamPublicId: string,
    userId: number
  ): Promise<ApiResponse<TeamMember>> => {
    const result = await apiFetch<BackendMember>(
      `/teams/${teamPublicId}/leader`,
      {
        method: "PUT",
        body: JSON.stringify({ user_id: userId }),
      }
    );
    if (!result.success) return result;
    return { success: true, data: mapMember(result.data) };
  },

  leave: async (teamPublicId: string): Promise<ApiResponse<null>> => {
    return apiFetch<null>(`/teams/${teamPublicId}/leave`, { method: "POST" });
  },

  listOrgUsers: async (orgId: string): Promise<ApiResponse<OrgUser[]>> => {
    const result = await apiFetch<BackendOrgUser[]>(`/orgs/${orgId}/users`);
    if (!result.success) return result;
    return { success: true, data: result.data.map(mapOrgUser) };
  },
};
