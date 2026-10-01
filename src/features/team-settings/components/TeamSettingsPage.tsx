"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";
import { TeamAISettingsForm } from "@/features/team-settings/components/TeamAISettingsForm";
import { TeamNameForm } from "@/features/team-settings/components/TeamNameForm";
import { TeamKeyRotation } from "@/features/team-settings/components/TeamKeyRotation";

export function TeamSettingsPage({ orgId, teamId }: { orgId: string; teamId: string }) {
  const { team, actor } = useTeamContext(teamId);
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={team.data?.name ?? "Team"} title="Team settings" meta="Manage team details and AI summarisation for everyone in this team." />
      <QueryBoundary query={team}>
        {(data) => can(actor, "team:settings")
          ? (
            <div key={teamId} className="flex flex-col gap-6">
              {can(actor, "team:rename") && <TeamNameForm orgId={orgId} team={data} />}
              <TeamAISettingsForm orgId={orgId} teamId={teamId} />
              <TeamKeyRotation orgId={orgId} teamId={teamId} />
            </div>
          )
          : <p className="text-sm text-muted-foreground">Only the team admin can access these settings.</p>}
      </QueryBoundary>
    </div>
  );
}
