"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isLive } from "@/lib/env";
import { subscribe } from "@/lib/http";
import { qk } from "@/lib/query-keys";

/** The team header owns one stream shared by status and notification consumers. */
export function useKeyAccessEvents(orgId: string, teamId: string, userId?: string) {
  const client = useQueryClient();
  useEffect(() => {
    if (!userId || !isLive("files")) return;
    return subscribe(`/v1/orgs/${orgId}/teams/${teamId}/key-access-requests/events`, "key-access-requests", () => {
      void client.invalidateQueries({ queryKey: qk.keyAccessRequests(teamId) });
    });
  }, [client, orgId, teamId, userId]);
}
