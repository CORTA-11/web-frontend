import { db } from "@/mocks/db";
import type { TeamRole } from "@/lib/types";

export const tokenFor = (userId: number) => `mock.${userId}.${Date.now()}`;

export const userIdFromToken = (token: string | undefined | null) => {
  const id = Number(token?.replace(/^Bearer\s+/, "").split(".")[1]);
  return Number.isFinite(id) ? id : null;
};

export const actorFrom = (request: Request) => {
  const id = userIdFromToken(request.headers.get("Authorization"));
  return db.people.find((person) => person.id === id) ?? null;
};

export const teamRoleOf = (teamId: string, userId: number): TeamRole | undefined =>
  db.members[teamId]?.find((m) => m.user_id === userId)?.role;

export const publicUser = ({
  id, org_id, email, name, org_role, platform_role,
}: (typeof db.people)[number]) => ({
  id, org_id, email, name, org_role, platform_role: platform_role ?? null,
});
