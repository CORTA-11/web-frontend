/** Every cache key in one place, so invalidation is auditable. */
export const qk = {
  session: ["session"] as const,
  orgUsers: (orgId: string) => ["orgs", orgId, "users"] as const,
  orgInvitations: (orgId: string) => ["orgs", orgId, "invitations"] as const,
  orgSettings: (orgId: string) => ["orgs", orgId, "settings"] as const,
  teams: (orgId: string) => ["orgs", orgId, "teams"] as const,
  resources: (orgId: string) => ["orgs", orgId, "resources"] as const,
  bookings: (orgId: string) => ["orgs", orgId, "bookings"] as const,
  requests: (orgId: string) => ["orgs", orgId, "resource-requests"] as const,
  team: (teamId: string) => ["teams", teamId] as const,
  members: (teamId: string) => ["teams", teamId, "members"] as const,
  board: (teamId: string) => ["teams", teamId, "board"] as const,
  chat: (teamId: string) => ["teams", teamId, "chat"] as const,
  docs: (teamId: string) => ["teams", teamId, "docs"] as const,
  doc: (teamId: string, docId: string) => ["teams", teamId, "docs", docId] as const,
  files: (teamId: string) => ["teams", teamId, "files"] as const,
  notifications: ["notification-prefs"] as const,
};
