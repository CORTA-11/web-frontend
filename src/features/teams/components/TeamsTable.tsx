"use client";

import Link from "next/link";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusDot } from "@/components/common/StatusDot";
import { useDeleteTeam } from "@/features/teams/queries";
import { day } from "@/lib/format";
import type { Team } from "@/lib/types";

const ROLE_LABEL = { TEAM_LEADER: "Leader", TEAM_MEMBER: "Member" };

export function TeamsTable({ orgId, teams, canDelete }: { orgId: string; teams: Team[]; canDelete: boolean }) {
  const remove = useDeleteTeam(orgId);

  if (!teams.length) {
    return <EmptyState title="No teams yet" hint="An organisation admin creates teams and assigns a leader." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="hidden md:table-cell">Members</TableHead>
          <TableHead className="hidden sm:table-cell">Your role</TableHead>
          <TableHead className="hidden lg:table-cell">Created</TableHead>
          {canDelete && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {teams.map((team) => (
          <TableRow key={team.public_id}>
            <TableCell>
              {team.my_role ? (
                <Link
                  href={`/orgs/${orgId}/teams/${team.public_id}/board`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {team.name}
                </Link>
              ) : (
                <span className="font-medium">{team.name}</span>
              )}
              {team.description && (
                <p className="max-w-prose text-xs text-muted-foreground">{team.description}</p>
              )}
            </TableCell>
            <TableCell className="hidden md:table-cell" data-numeric>
              {team.member_count}
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {team.my_role ? (
                <StatusDot tone={team.my_role === "TEAM_LEADER" ? "info" : "muted"}>
                  {ROLE_LABEL[team.my_role]}
                </StatusDot>
              ) : (
                <span className="text-xs text-muted-foreground">Not a member</span>
              )}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
              {day(team.created_at)}
            </TableCell>
            {canDelete && (
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${team.name}`} />}
                  >
                    <MoreHorizontalIcon />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => remove.mutate(team.public_id)}
                    >
                      <Trash2Icon />
                      Delete team
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
