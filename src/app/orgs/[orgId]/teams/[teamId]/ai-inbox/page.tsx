"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { AiInboxPage } from "@/features/ai/components/AiInboxPage";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { useTeamContext } from "@/features/teams/queries";

export default function InboxPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const { team } = useTeamContext(teamId);
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow={team.data?.name ?? "Team"} title="AI inbox" meta="Completed chat summaries and suggested tasks." />
      <TeamMembersOnly teamId={teamId}>
        <AiInboxPage orgId={orgId} teamId={teamId} />
      </TeamMembersOnly>
    </div>
  );
}
