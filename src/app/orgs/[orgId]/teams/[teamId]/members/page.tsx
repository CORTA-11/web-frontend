"use client";

import { useParams } from "next/navigation";
import { LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { AddMemberForm } from "@/features/teams/components/AddMemberForm";
import { MembersTable } from "@/features/teams/components/MembersTable";
import { TeamNameForm } from "@/features/teams/components/TeamNameForm";
import { useLeaveTeam, useMembers, useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";

export default function MembersPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const { team, actor, user } = useTeamContext(teamId);
  const members = useMembers(teamId, orgId);
  const leave = useLeaveTeam(teamId);

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow={team.data?.name ?? "Team"}
        title="Members"
        meta={members.data ? `${members.data.length} in this team` : undefined}
        actions={
          can(actor, "team:leave") ? (
            <Button size="sm" variant="outline" onClick={() => leave.mutate(undefined)}>
              <LogOutIcon />
              Leave team
            </Button>
          ) : null
        }
      />

      {can(actor, "team:manage_members") && members.data && (
        <AddMemberForm orgId={orgId} teamId={teamId} members={members.data} />
      )}

      <QueryBoundary query={members}>
        {(data) => (
          <MembersTable teamId={teamId} members={data} actor={actor} currentUserId={user?.id} />
        )}
      </QueryBoundary>

      {can(actor, "team:rename") && team.data && <TeamNameForm orgId={orgId} team={team.data} />}
    </div>
  );
}
