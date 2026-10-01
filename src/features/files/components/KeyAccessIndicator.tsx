"use client";

import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "lucide-react";
import { useSession } from "@/features/auth/session";
import { useTeams } from "@/features/teams/queries";
import { useKeyAccessRequests } from "@/features/files/queries";
import { useKeyAccessEvents } from "@/features/files/useKeyAccessEvents";
import { accessNotifications } from "@/features/files/access-notifications";
import { isLive } from "@/lib/env";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function KeyAccessIndicator({ orgId, teamId }: { orgId: string; teamId?: string }) {
  const { user } = useSession();
  const teams = useTeams(orgId);
  const team = teams.data?.find((entry) => entry.public_id === teamId && entry.my_role);
  if (!user?.public_id || !team || !isLive("files")) return null;
  // Account/team changes must not carry read acknowledgements into another scope.
  return <TeamAccessIndicator key={`${user.id}:${orgId}:${teamId}`} orgId={orgId} teamId={team.public_id} userId={user.public_id} isLeader={team.my_role === "TEAM_LEADER"} />;
}

function TeamAccessIndicator({ orgId, teamId, userId, isLeader }: {
  orgId: string; teamId: string; userId: string; isLeader: boolean;
}) {
  const [read, setRead] = useState<Set<string>>(() => new Set());
  const requests = useKeyAccessRequests(teamId, orgId, true);
  useKeyAccessEvents(orgId, teamId, userId);
  const notifications = accessNotifications(requests.data ?? [], userId, isLeader);
  const unread = notifications.filter((entry) => !read.has(entry.key));
  if (notifications.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`File access notifications, ${unread.length} unread`}
        className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <BellIcon className="size-4" />
        <span aria-live="polite" className="flex items-center gap-1.5">
          <span className={`size-1.5 rounded-full ${unread.length ? "bg-primary" : "bg-muted-foreground"}`} />
          {unread.length ? `${unread.length} new` : "File access"}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1 label-eyebrow">File access notifications</div>
        {notifications.map((entry) => (
          <DropdownMenuItem
            key={entry.key}
            render={<Link href={`/orgs/${orgId}/teams/${teamId}/files`} />}
            onClick={() => setRead((previous) => new Set([...previous, entry.key]))}
            className="flex items-start gap-2 whitespace-normal"
          >
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${read.has(entry.key) ? "bg-muted-foreground" : "bg-primary"}`} />
            {entry.message}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
