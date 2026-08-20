"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { teamsApi, type CreateTeam } from "@/features/teams/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import { useSession } from "@/features/auth/session";

export const useTeams = (orgId: string) =>
  useQuery({ queryKey: qk.teams(orgId), queryFn: () => teamsApi.list(orgId) });

export const useTeam = (teamId: string) =>
  useQuery({ queryKey: qk.team(teamId), queryFn: () => teamsApi.get(teamId) });

export const useMembers = (teamId: string) =>
  useQuery({ queryKey: qk.members(teamId), queryFn: () => teamsApi.members(teamId) });

export const useOrgUsers = (orgId: string) =>
  useQuery({ queryKey: qk.orgUsers(orgId), queryFn: () => teamsApi.orgUsers(orgId) });

export function useCreateTeam(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTeam) => teamsApi.create(orgId, body),
    onSuccess: (team) => {
      client.invalidateQueries({ queryKey: qk.teams(orgId) });
      toast.success(`${team.name} created`);
    },
    onError: notifyError,
  });
}

export function useUpdateTeam(orgId: string, teamId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string }) => teamsApi.update(teamId, body),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.team(teamId) });
      client.invalidateQueries({ queryKey: qk.teams(orgId) });
      toast.success("Team updated");
    },
    onError: notifyError,
  });
}

export function useDeleteTeam(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (teamId: string) => teamsApi.remove(teamId),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.teams(orgId) });
      toast.success("Team deleted");
    },
    onError: notifyError,
  });
}

/** Roster changes all invalidate the same two keys, so they share one factory. */
function useRosterMutation<TArgs>(
  teamId: string,
  mutationFn: (args: TArgs) => Promise<unknown>,
  message: string
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.members(teamId) });
      client.invalidateQueries({ queryKey: qk.team(teamId) });
      toast.success(message);
    },
    onError: notifyError,
  });
}

export const useAddMember = (teamId: string) =>
  useRosterMutation(teamId, (userId: number) => teamsApi.addMember(teamId, userId), "Member added");

export const useRemoveMember = (teamId: string) =>
  useRosterMutation(teamId, (userId: number) => teamsApi.removeMember(teamId, userId), "Member removed");

export const useSetLeader = (teamId: string) =>
  useRosterMutation(teamId, (userId: number) => teamsApi.setLeader(teamId, userId), "Team leader updated");

export const useLeaveTeam = (teamId: string) =>
  useRosterMutation(teamId, () => teamsApi.leave(teamId), "You left the team");

/** Team plus the caller's effective roles — the input every team page needs. */
export function useTeamContext(teamId: string) {
  const { user } = useSession();
  const team = useTeam(teamId);
  return {
    user,
    team,
    actor: user ? { orgRole: user.org_role, teamRole: team.data?.my_role ?? null } : null,
  };
}
