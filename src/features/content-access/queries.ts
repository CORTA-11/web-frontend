"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { contentAccessApi, type ContentKind } from "@/features/content-access/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import { prepareFileAccess } from "@/features/content-access/prepare-file-access";

type Action =
  | { action: "request"; kind: ContentKind; resourceId: string }
  | { action: "decide"; requestId: string; decision: "approve" | "deny"; kind: ContentKind; resourceId: string; memberId: string }
  | { action: "grant"; kind: ContentKind; resourceId: string; memberId: string };

export function useContentAccess(orgId: string, teamId: string, enabled = true) {
  const { user } = useSession();
  return useQuery({
    queryKey: qk.contentAccess(orgId, teamId, user ? user.public_id ?? String(user.id) : ""),
    queryFn: () => contentAccessApi.list(orgId, teamId),
    enabled: enabled && !!user && !!teamId,
  });
}

export function useContentAccessAction(orgId: string, teamId: string) {
  const client = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: async (input: Action) => {
      if (input.kind === "file" && (input.action === "grant" || (input.action === "decide" && input.decision === "approve")))
        await prepareFileAccess(orgId, teamId, input.resourceId, input.memberId);
      if (input.action === "request") return contentAccessApi.request(orgId, teamId, input.kind, input.resourceId);
      if (input.action === "grant") return contentAccessApi.grant(orgId, teamId, input.kind, input.resourceId, input.memberId);
      return contentAccessApi.decide(orgId, teamId, input.requestId, input.decision);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: qk.contentAccess(orgId, teamId, user ? user.public_id ?? String(user.id) : "") }),
    onError: notifyError,
  });
}
