"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invitationsApi } from "@/features/invitations/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";

export const useInvitations = (orgId: string) =>
  useQuery({ queryKey: qk.invitations(orgId), queryFn: () => invitationsApi.list(orgId) });

export function useCreateInvitation(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => invitationsApi.create(orgId, email),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.invitations(orgId) }),
    onError: notifyError,
  });
}

export function useRevokeInvitation(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invitationsApi.revoke(orgId, id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: qk.invitations(orgId) });
      toast.success("Invitation revoked");
    },
    onError: notifyError,
  });
}
