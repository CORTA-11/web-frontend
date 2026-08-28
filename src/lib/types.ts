/**
 * The wire contract, in TypeScript. This file mirrors API_Contract.md one to
 * one and is the only definition of a payload shape — features and mock
 * handlers both import from here, so they cannot drift apart.
 */

export type OrgRole = "ORG_ADMIN" | "ORG_MEMBER" | "owner" | "administrator" | "member";
/** Operator of the whole deployment, above any single tenant. */
export type PlatformRole = "SUPER_ADMIN";
export type OrgStatus = "pending" | "active" | "suspended" | "rejected";
export type TeamRole = "TEAM_LEADER" | "TEAM_MEMBER" | "team_admin" | "research_lead" | "researcher" | "contributor" | "viewer";

export type OrganizationMember = {
  user_id: string;
  display_name: string;
  email: string;
  role: "owner" | "administrator" | "member";
  joined_at: string;
};

export type OrganizationInvitation = { id: string; created_at: string; expires_at: string };
export type InvitationPreview = { organization_id: string; organization_name: string; expires_at: string };
export type Priority = "low" | "medium" | "high";

export type User = {
  id: number;
  org_id: string;
  email: string;
  name: string;
  org_role: OrgRole;
  platform_role?: PlatformRole | null;
  avatar_url?: string;
};

/** A tenant as the platform operator sees it — never its contents. */
export type Organization = {
  id: string;
  name: string;
  public_id: string;
  status: OrgStatus;
  owner_name: string;
  owner_email: string;
  user_count: number;
  team_count: number;
  requested_at: string;
  decided_at?: string | null;
};

export type AuthResponse = { access_token: string; user: User };

export type OrgUser = {
  id: number;
  email: string;
  name: string;
  org_role: OrgRole;
  avatar_url?: string;
};

export type Team = {
  id: number;
  public_id: string;
  org_id: string;
  name: string;
  description?: string;
  my_role?: TeamRole;
  member_count: number;
  created_at: string;
};

export type TeamMember = {
  user_id: number;
  name: string;
  email: string;
  avatar_url?: string;
  role: TeamRole;
  joined_at: string;
};

export type ChatMessage = {
  id: string;
  channel_id: string;
  sender: { id: number; name: string; avatar_url?: string };
  reply_to_id?: string | null;
  mentions?: number[];
  message: string;
  created_at: string;
  deleted_at?: string | null;
};

export type Column = { id: string; title: string; task_ids: string[] };

export type Task = {
  id: string;
  column_id: string;
  title: string;
  description: string;
  assignee_id: number | null;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  tags: string[];
  created_at: string;
};

export type Board = { columns: Column[]; tasks: Task[] };

export type ResourceKind = "gpu" | "instrument" | "room" | "workstation";

/** Weekly usage window an org admin sets per resource — SRS 3.1.3.1. */
export type AvailabilityWindow = {
  weekday: number;
  start: string;
  end: string;
};

export type Resource = {
  id: string;
  org_id: string;
  name: string;
  code: string;
  kind: ResourceKind;
  location: string;
  enabled: boolean;
  availability: AvailabilityWindow[];
};

export type Booking = {
  id: string;
  resource_id: string;
  team_public_id: string;
  team_name: string;
  requested_by_name: string;
  start_time: string;
  end_time: string;
  purpose: string;
};

export type RequestStatus = "pending" | "approved" | "rejected";

export type ResourceRequest = {
  id: string;
  resource_id: string;
  resource_name: string;
  team_public_id: string;
  team_name: string;
  requested_by: number;
  requested_by_name: string;
  start_time: string;
  end_time: string;
  purpose: string;
  status: RequestStatus;
  created_at: string;
  decided_at?: string | null;
};

export type DocSummary = {
  id: string;
  team_public_id: string;
  title: string;
  updated_at: string;
  updated_by: string;
};

export type Doc = DocSummary & { content: string };

export type StoredFile = {
  id: string;
  name: string;
  size: number;
  content_type: string;
  uploaded_by: number;
  uploaded_by_name: string;
  uploaded_at: string;
};

/** Extra registration inputs an org admin defines — SRS 3.1.1.3. */
export type RegistrationField = {
  key: string;
  label: string;
  type: "text" | "email" | "number" | "select";
  required: boolean;
  options?: string[];
};

export type AiSettings = {
  enabled: boolean;
  provider: "builtin" | "custom";
  model: string;
  available_models: string[];
  custom_endpoint?: string;
};

export type OrgSettings = {
  org_id: string;
  name: string;
  public_id: string;
  status: OrgStatus;
  registration_fields: RegistrationField[];
  ai: AiSettings;
};

export type NotificationPrefs = {
  mode: "all" | "mentions" | "off";
  email_enabled: boolean;
  email_address: string;
};

export type AiSummary = {
  id: string;
  headline: string;
  bullets: string[];
  decisions: string[];
  model: string;
  generated_at: string;
  source_count: number;
};

export type ExtractedTask = {
  title: string;
  description: string;
  assignee_id: number | null;
  priority: Priority;
  start_date: string | null;
  due_date: string | null;
  evidence: string;
};
