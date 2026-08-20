"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { platformApi } from "@/features/platform/api";
import { notifyError } from "@/lib/query";
import type { OrgStatus } from "@/lib/types";

const KEY = ["platform", "orgs"];

export const useOrganizations = () => useQuery({ queryKey: KEY, queryFn: platformApi.orgs });

export function useSetOrgStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ orgId, status }: { orgId: string; status: OrgStatus }) =>
      platformApi.setStatus(orgId, status),
    onSuccess: (org) => {
      client.invalidateQueries({ queryKey: KEY });
      toast.success(`${org.name} is now ${org.status}`);
    },
    onError: notifyError,
  });
}
