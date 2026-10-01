"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BellIcon } from "lucide-react";
import { useSession } from "@/features/auth/session";
import { useTeams } from "@/features/teams/queries";
import { useContentAccess } from "@/features/content-access/queries";
import { useNotificationAcknowledgements } from "@/features/content-access/useNotificationAcknowledgements";
import { qk } from "@/lib/query-keys";
import { subscribe } from "@/lib/http";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export function AccessNotifications({ orgId, teamId }: { orgId: string; teamId?: string }) {
  const { user } = useSession();
  const teams = useTeams(orgId);
  if (!user || !teamId || !teams.data?.some((entry) => entry.public_id === teamId && entry.my_role)) return null;
  const userId = user.public_id ?? String(user.id);
  return <TeamNotifications key={`${orgId}:${teamId}:${userId}`} orgId={orgId} teamId={teamId} userId={userId} />;
}

function TeamNotifications({ orgId, teamId, userId }: { orgId: string; teamId: string; userId: string }) {
  const client = useQueryClient();
  const query = useContentAccess(orgId, teamId);
  const [open, setOpen] = useState(false);
  const { read, markRead } = useNotificationAcknowledgements(`content:${orgId}:${teamId}:${userId}`);
  useEffect(() => subscribe(`/v1/orgs/${orgId}/teams/${teamId}/content-access/events`, "content-access", () => {
    void client.invalidateQueries({ queryKey: qk.contentAccess(orgId, teamId, userId) });
  }), [client, orgId, teamId, userId]);
  const notifications = query.data?.requests.filter((entry) => {
    const item = query.data.items.find((item) => item.kind === entry.kind && item.resource_id === entry.resource_id);
    return entry.requested_by === userId ? entry.status !== "pending" : item?.creator_id === userId && entry.status === "pending";
  }) ?? [];
  const keyOf = (entry: typeof notifications[number]) => `${entry.public_id}:${entry.status}:${entry.updated_at}`;
  const unread = notifications.filter((entry) => !read.has(keyOf(entry))).length;
  if (!notifications.length || (!unread && !open)) return null;
  return (
    <DropdownMenu open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen || open) markRead(notifications.map(keyOf));
    }}>
      <DropdownMenuTrigger aria-label={`Document and file permissions, ${unread} unread`}
        className="flex h-7 items-center gap-1.5 rounded-sm px-2 text-xs hover:bg-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <BellIcon className="size-4" /><span aria-live="polite">{unread ? `${unread} new` : "Permissions"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="px-2 py-1 label-eyebrow">Document and file permissions</div>
        {notifications.map((entry) => (
          <DropdownMenuItem key={keyOf(entry)}
            render={<Link href={`/orgs/${orgId}/teams/${teamId}/${entry.kind === "file" ? "files" : "docs"}`} />}
            onClick={() => markRead([keyOf(entry)])}
            className="flex items-start gap-2 whitespace-normal">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${read.has(keyOf(entry)) ? "bg-muted-foreground" : "bg-primary"}`} />
            {entry.requested_by === userId
              ? `Your request for ${entry.kind} ${entry.resource_id.slice(0, 8)} was ${entry.status === "granted" ? "approved" : "denied"}.`
              : `${entry.requester_name || "A member"} requested access to your ${entry.kind} ${entry.resource_id.slice(0, 8)}.`}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
