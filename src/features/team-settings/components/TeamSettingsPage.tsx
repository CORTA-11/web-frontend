"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";
import { TeamAISettingsForm } from "./TeamAISettingsForm";

export function TeamSettingsPage({ orgId, teamId }: { orgId: string; teamId: string }) {
  const { team, actor } = useTeamContext(teamId);
  return (
    <div className="space-y-6">
      <PageHeader title="Team settings" meta="Configure AI summarisation for everyone in this team." />
      <QueryBoundary query={team}>
        {() => can(actor, "team:settings")
          ? <TeamAISettingsForm key={teamId} orgId={orgId} teamId={teamId} />
          : <p className="text-sm text-muted-foreground">Only the team admin can access these settings.</p>}
      </QueryBoundary>
    </div>
  );
}
