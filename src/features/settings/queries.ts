"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { settingsApi } from "@/features/settings/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { NotificationPrefs, OrgSettings } from "@/lib/types";

export const useOrgSettings = (orgId: string) =>
  useQuery({ queryKey: qk.orgSettings(orgId), queryFn: () => settingsApi.org(orgId), staleTime: 300_000 });

export function useUpdateOrgSettings(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<OrgSettings>) => settingsApi.updateOrg(orgId, body),
    onSuccess: (settings) => {
      client.setQueryData(qk.orgSettings(orgId), settings);
      toast.success("Settings saved");
    },
    onError: notifyError,
  });
}

export const useNotificationPrefs = () =>
  useQuery({ queryKey: qk.notifications, queryFn: settingsApi.notifications });

export function useUpdateNotificationPrefs() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: NotificationPrefs) => settingsApi.updateNotifications(body),
    onSuccess: (prefs) => {
      client.setQueryData(qk.notifications, prefs);
      toast.success("Notification preferences saved");
    },
    onError: notifyError,
  });
}
