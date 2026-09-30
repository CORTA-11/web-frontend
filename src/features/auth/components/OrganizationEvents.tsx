"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/session";
import { isLive } from "@/lib/env";
import { subscribe } from "@/lib/http";
import { qk } from "@/lib/query-keys";

/** One connection per signed-in account, shared by all organization consumers. */
export function OrganizationEvents() {
  const { user } = useSession();
  const client = useQueryClient();
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !isLive("auth")) return;
    return subscribe("/v1/orgs/events", "organizations", () => {
      // Keep the existing live adapter and pagination authoritative.
      void client.invalidateQueries({ queryKey: [...qk.userOrgs, userId] });
    });
  }, [client, userId]);

  return null;
}
