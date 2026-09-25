"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teamSettingsApi, type TeamAISettingsInput } from "./api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";

export const useTeamAISettings = (orgId: string, teamId: string) =>
  useQuery({ queryKey: qk.teamAISettings(orgId, teamId), queryFn: () => teamSettingsApi.get(orgId, teamId) });

export function useSaveTeamAISettings(orgId: string, teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TeamAISettingsInput) => teamSettingsApi.save(orgId, teamId, body),
    onSuccess: (data) => {
      client.setQueryData(qk.teamAISettings(orgId, teamId), data);
      toast.success("Team settings saved");
    },
    onError: notifyError,
  });
}
