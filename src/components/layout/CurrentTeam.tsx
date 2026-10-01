"use client";

import Link from "next/link";
import { CheckIcon, ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTeams } from "@/features/teams/queries";

export function CurrentTeam({ orgId, teamId }: { orgId: string; teamId?: string }) {
  const teams = useTeams(orgId);
  // Administrative rights never make another team's workspace navigable.
  const myTeams = teams.data?.filter((entry) => entry.my_role) ?? [];
  const team = myTeams.find((entry) => entry.public_id === teamId);
  const name = !teamId ? "No team selected"
    : team?.name ?? (teams.isPending ? "Loading team…" : "Team unavailable");
  const base = `/orgs/${orgId}`;

  return (
    <div role="group" aria-label="Current team" className="flex min-w-0 items-center gap-2 sm:max-w-64 sm:flex-col sm:items-start sm:gap-1">
      <span className="label-eyebrow shrink-0">Team</span>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Select team: ${name}`}
          title={name}
          className="flex min-w-0 max-w-full items-center gap-1 px-1 py-0.5 text-sm font-bold outline-none hover:bg-muted"
        >
          <span className="truncate" title={name}>{name}</span>
          <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="label-eyebrow">Switch team</DropdownMenuLabel>
            {myTeams.map((entry) => (
              <DropdownMenuItem
                key={entry.public_id}
                disabled={entry.public_id === teamId}
                render={<Link href={`${base}/teams/${entry.public_id}/board`} />}
                className="flex items-center gap-2"
              >
                <span className="min-w-0 flex-1 truncate" title={entry.name}>{entry.name}</span>
                {entry.public_id === teamId && <CheckIcon className="size-3.5 shrink-0 text-primary" />}
              </DropdownMenuItem>
            ))}
            {!myTeams.length && (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                {teams.isPending ? "Loading teams…" : teams.isError ? "Unable to load teams." : "You are not in a team yet."}
              </p>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href={base} />}>Organisation overview</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
