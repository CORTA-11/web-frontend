import { http, HttpResponse, type HttpResponseResolver } from "msw";
import { db, now } from "@/mocks/db";
import { actorFrom } from "@/mocks/session";
import type { OrgStatus } from "@/lib/types";

/**
 * The platform tier governs tenancy — approving, suspending and counting
 * organisations. It deliberately exposes no route into a tenant's teams, chat,
 * documents or files: operating the deployment is not a licence to read what
 * runs on it.
 */
const platformOnly =
  (resolver: HttpResponseResolver): HttpResponseResolver =>
  (info) => {
    const actor = actorFrom(info.request);
    if (!actor) return new HttpResponse("Unauthorized", { status: 401 });
    if (actor.platform_role !== "SUPER_ADMIN") {
      return new HttpResponse("Platform operators only", { status: 403 });
    }
    return resolver(info);
  };

export const platformHandlers = [
  http.get("/api/platform/orgs", platformOnly(() => HttpResponse.json(db.organizations))),

  http.patch(
    "/api/platform/orgs/:orgId",
    platformOnly(async ({ request, params }) => {
      const org = db.organizations.find((entry) => entry.id === String(params.orgId));
      if (!org) return new HttpResponse("Organisation not found", { status: 404 });

      const { status } = (await request.json()) as { status: OrgStatus };
      org.status = status;
      org.decided_at = now();
      if (org.id === db.settings.org_id) db.settings.status = status;
      return HttpResponse.json(org);
    })
  ),
];
