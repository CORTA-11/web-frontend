import { http, HttpResponse } from "msw";
import { db } from "@/mocks/db";
import type { NotificationPrefs, OrgSettings } from "@/lib/types";

export const settingsHandlers = [
  http.get("/api/orgs/:orgId/settings", ({ params }) => {
    const orgId = String(params.orgId);
    if (orgId === db.settings.org_id) return HttpResponse.json(db.settings);

    const org = db.organizations.find((entry) => entry.id === orgId);
    if (!org) return new HttpResponse("Organisation not found", { status: 404 });
    return HttpResponse.json({
      org_id: org.id,
      name: org.name,
      public_id: org.public_id,
      status: org.status,
      registration_fields: [],
      ai: { enabled: false, provider: "builtin", model: "", available_models: [] },
    });
  }),

  /** Public lookup so the registration form knows which extra fields to ask for. */
  http.get("/api/orgs/lookup/:publicId", ({ params }) => {
    const org = db.organizations.find(
      (entry) => entry.public_id === String(params.publicId) && entry.status === "active"
    );
    if (!org) return new HttpResponse("No organisation found with that ID", { status: 404 });
    return HttpResponse.json({
      name: org.name,
      public_id: org.public_id,
      registration_fields:
        org.id === db.settings.org_id ? db.settings.registration_fields : [],
    });
  }),

  http.patch("/api/orgs/:orgId/settings", async ({ request }) => {
    const body = (await request.json()) as Partial<OrgSettings>;
    db.settings = { ...db.settings, ...body };
    return HttpResponse.json(db.settings);
  }),

  http.get("/api/notification-prefs", () => HttpResponse.json(db.notifications)),

  http.put("/api/notification-prefs", async ({ request }) => {
    db.notifications = (await request.json()) as NotificationPrefs;
    return HttpResponse.json(db.notifications);
  }),
];
