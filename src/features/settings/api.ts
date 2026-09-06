import { api } from "@/lib/http";
import type { NotificationPrefs, OrgSettings } from "@/lib/types";

/** core-api's organization view — the source of truth for the settings page. */
type BackendOrg = {
  id: string;
  name: string;
  lifecycle_state: OrgSettings["status"];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  my_role: string;
};

const fromBackend = (org: BackendOrg): OrgSettings => ({
  org_id: org.id,
  name: org.name,
  public_id: "",
  status: org.lifecycle_state,
  registration_fields: [],
  ai: { enabled: false, provider: "builtin", model: "", available_models: [] },
});

export const settingsApi = {
  org: (orgId: string) => api<BackendOrg>(`/v1/orgs/${orgId}`).then(fromBackend),

  updateOrg: (orgId: string, body: Partial<OrgSettings>) =>
    api<BackendOrg>(`/v1/orgs/${orgId}`, { method: "PATCH", json: { name: body.name } }).then(fromBackend),

  notifications: () => api<NotificationPrefs>("/notification-prefs"),

  updateNotifications: (body: NotificationPrefs) =>
    api<NotificationPrefs>("/notification-prefs", { method: "PUT", json: body }),
};