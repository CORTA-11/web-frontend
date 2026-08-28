"use client";

import type { ReactNode } from "react";
import { LockIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTeamContext } from "@/features/teams/queries";

/**
 * Team content is readable by the team only. An organisation admin administers
 * teams — creates them, assigns leaders, deletes them — but that role carries no
 * read access to a board, chat room, document or file (SRS 3.5.4.2, 3.1.8.2).
 */
export function TeamMembersOnly({ teamId, children }: { teamId: string; children: ReactNode }) {
  const { team } = useTeamContext(teamId);

  if (team.isPending) return <Skeleton className="h-40 w-full rounded-sm" />;
  if (team.data?.my_role) return <>{children}</>;

  return (
    <div className="flex max-w-prose items-start gap-3 border border-border p-4">
      <LockIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium">This team&rsquo;s workspace is private</p>
        <p className="text-xs text-muted-foreground">
          Boards, chat, documents and files are readable by members of{" "}
          {team.data?.name ?? "this team"} only. Administering the organisation does not grant
          access to what its teams are working on.
        </p>
      </div>
    </div>
  );
}
