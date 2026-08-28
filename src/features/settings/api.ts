import { api } from "@/lib/http";
import type { NotificationPrefs, OrgSettings } from "@/lib/types";

export const settingsApi = {
  org: (orgId: string) => api<OrgSettings>(`/orgs/${orgId}/settings`),
  updateOrg: (orgId: string, body: Partial<OrgSettings>) =>
    api<OrgSettings>(`/orgs/${orgId}/settings`, { method: "PATCH", json: body }),
  notifications: () => api<NotificationPrefs>("/notification-prefs"),
  updateNotifications: (body: NotificationPrefs) =>
    api<NotificationPrefs>("/notification-prefs", { method: "PUT", json: body }),
};
