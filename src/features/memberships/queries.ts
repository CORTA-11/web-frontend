import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { membershipsApi } from "@/features/memberships/api";
import { qk } from "@/lib/query-keys";

export const useOrganizationMembers = (orgId: string) => useQuery({
  queryKey: qk.orgUsers(orgId), queryFn: () => membershipsApi.members(orgId),
});

export const useInvitations = (orgId: string) => useQuery({
  queryKey: qk.orgInvitations(orgId), queryFn: () => membershipsApi.invitations(orgId),
});

export function useCreateInvitation(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => membershipsApi.invite(orgId, email),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.orgInvitations(orgId) }),
  });
}

export function useRevokeInvitation(orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => membershipsApi.revoke(orgId, id),
    onSuccess: () => client.invalidateQueries({ queryKey: qk.orgInvitations(orgId) }),
  });
}
