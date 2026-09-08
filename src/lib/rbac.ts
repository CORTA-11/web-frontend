import type { OrgRole, PlatformRole, TeamRole } from "@/lib/types";

export type Actor = {
  orgRole: OrgRole;
  teamRole?: TeamRole | null;
  platformRole?: PlatformRole | null;
};

/**
 * UI-side permission map, one entry per SRS rule it enforces. The server stays
 * the authority (SRS 3.5.2) — this only decides what is worth showing.
 */
const RULES = {
  // Platform tier: governs tenancy, never tenant content.
  "platform:manage": (a) => a.platformRole === "SUPER_ADMIN",
  "org:manage": (a) => a.orgRole === "ORG_ADMIN", // 3.1.1.3, 3.1.9
  "org:manage_users": (a) => a.orgRole === "ORG_ADMIN",
  "team:create": (a) => a.orgRole === "ORG_ADMIN", // 3.1.2.1
  "team:assign_leader": (a) => a.orgRole === "ORG_ADMIN", // 3.1.2.2
  "team:delete": (a) => a.orgRole === "ORG_ADMIN", // 3.1.2.6
  "team:rename": (a) => a.teamRole === "TEAM_LEADER", // 3.1.2.5
  "team:manage_members": (a) => a.teamRole === "TEAM_LEADER", // 3.1.2.3-4
  "team:leave": (a) => a.teamRole === "TEAM_MEMBER", // 3.1.2.7
  "resource:manage": (a) => a.orgRole === "ORG_ADMIN", // 3.1.3.1-3
  "resource:request": (a) => a.teamRole === "TEAM_LEADER", // 3.1.3.4
  "resource:decide": (a) => a.orgRole === "ORG_ADMIN", // 3.1.3.5
  "chat:delete_any": (a) => a.teamRole === "TEAM_LEADER", // 3.1.4.4
  "doc:delete": (a) => a.teamRole === "TEAM_LEADER", // 3.1.8.4
  "file:delete_any": (a) => a.teamRole === "TEAM_LEADER", // 3.1.6.3
"file:access_decide": (a) => a.teamRole === "TEAM_LEADER", // 3.1.6.4 previous-file access
  "ai:extract_tasks": (a) => a.teamRole === "TEAM_LEADER", // 3.1.9.3
} satisfies Record<string, (actor: Actor) => boolean>;

export type Permission = keyof typeof RULES;

export const can = (actor: Actor | null, permission: Permission) =>
  actor ? RULES[permission](actor) : false;
