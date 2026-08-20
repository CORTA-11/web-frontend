"use client";

import { CrownIcon, MoreHorizontalIcon, UserMinusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusDot } from "@/components/common/StatusDot";
import { useRemoveMember, useSetLeader } from "@/features/teams/queries";
import { day, initials } from "@/lib/format";
import type { Actor } from "@/lib/rbac";
import { can } from "@/lib/rbac";
import type { TeamMember } from "@/lib/types";

type Props = { teamId: string; members: TeamMember[]; actor: Actor | null; currentUserId?: number };

export function MembersTable({ teamId, members, actor, currentUserId }: Props) {
  const remove = useRemoveMember(teamId);
  const setLeader = useSetLeader(teamId);
  const canManage = can(actor, "team:manage_members");
  const canPromote = can(actor, "team:assign_leader");
  const showActions = canManage || canPromote;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead className="hidden sm:table-cell">Role</TableHead>
          <TableHead className="hidden lg:table-cell">Joined</TableHead>
          {showActions && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => {
          const isLeader = member.role === "TEAM_LEADER";
          return (
            <TableRow key={member.user_id}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-6">
                    <AvatarFallback className="text-2xs">{initials(member.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-medium">
                      {member.name}
                      {member.user_id === currentUserId && (
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">you</span>
                      )}
                    </span>
                    <span className="data-mono truncate text-muted-foreground">{member.email}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <StatusDot tone={isLeader ? "info" : "muted"}>
                  {isLeader ? "Team leader" : "Member"}
                </StatusDot>
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
                {day(member.joined_at)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-xs" aria-label={`Actions for ${member.name}`} />}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canPromote && !isLeader && (
                        <DropdownMenuItem onClick={() => setLeader.mutate(member.user_id)}>
                          <CrownIcon />
                          Make team leader
                        </DropdownMenuItem>
                      )}
                      {canManage && !isLeader && (
                        <DropdownMenuItem variant="destructive" onClick={() => remove.mutate(member.user_id)}>
                          <UserMinusIcon />
                          Remove from team
                        </DropdownMenuItem>
                      )}
                      {isLeader && (
                        <DropdownMenuItem disabled>The leader cannot be removed</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
