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
