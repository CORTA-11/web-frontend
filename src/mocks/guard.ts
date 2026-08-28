import { http, HttpResponse, type HttpResponseResolver } from "msw";
import { actorFrom, teamRoleOf } from "@/mocks/session";
import { isLive } from "@/lib/env";

type Verb = "get" | "post" | "patch" | "put" | "delete";

const guarded =
  (allowOrgAdmin: boolean) =>
  (resolver: HttpResponseResolver): HttpResponseResolver =>
  (info) => {
    if (isLive("teams")) {
      return resolver(info);
    }
    const actor = actorFrom(info.request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    const role = teamRoleOf(String(info.params.teamId), actor.id);
    if (!role && !(allowOrgAdmin && actor.org_role === "ORG_ADMIN")) {
      return new HttpResponse("You are not a member of this team", { status: 403 });
    }
    return resolver(info);
  };

const routerFor = (wrap: (resolver: HttpResponseResolver) => HttpResponseResolver) =>
  Object.fromEntries(
    (["get", "post", "patch", "put", "delete"] as Verb[]).map((verb) => [
      verb,
      (path: string, resolver: HttpResponseResolver) => http[verb](path, wrap(resolver)),
    ])
  ) as Record<Verb, (path: string, resolver: HttpResponseResolver) => ReturnType<typeof http.get>>;

/**
 * Team content belongs to the team, not to the organisation. Being an org admin
 * grants no read access to a board, chat room, document or file shelf — only
 * membership does (SRS 3.5.4.2, 3.1.8.2). Admin powers stop at administration:
 * creating teams, assigning leaders, deleting teams.
 */
export const teamRoute = routerFor(guarded(false));

/** The roster is one step wider: org admins manage membership, so they can read it. */
export const rosterRoute = routerFor(guarded(true));
