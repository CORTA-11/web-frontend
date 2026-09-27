"use client";

import Link from "next/link";
import { InboxIcon } from "lucide-react";
import { useAiInbox } from "@/features/ai/useAiInbox";
import { useTeams } from "@/features/teams/queries";

export function AiInboxIndicator({ orgId }: { orgId: string }) {
  const { items } = useAiInbox();
  const teams = useTeams(orgId);
  const memberTeams = new Set(teams.data?.filter((team) => team.my_role).map((team) => team.public_id) ?? []);
  const visible = items.filter((item) => item.orgId === orgId && memberTeams.has(item.teamId));
  const unread = visible.filter((item) => item.status === "ready" && !item.read);
  const pending = visible.find((item) => item.status === "pending");
  const target = unread[0] ?? pending;

  if (!target) return null;

  return (
    <Link
      href={`/orgs/${orgId}/teams/${target.teamId}/ai-inbox`}
      className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-label={unread.length ? `AI inbox, ${unread.length} new ${unread.length === 1 ? "summary" : "summaries"}` : "AI inbox, processing summary"}
    >
      <InboxIcon className="size-4" />
      <span aria-live="polite" className="flex items-center gap-1.5">
        <span className={`size-1.5 rounded-full ${unread.length ? "bg-primary" : "bg-muted-foreground"}`} />
        {unread.length ? `${unread.length} new` : "Working…"}
      </span>
    </Link>
  );
}
