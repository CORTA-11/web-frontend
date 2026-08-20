"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { Board } from "@/features/board/components/Board";
import { useTeamContext } from "@/features/teams/queries";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";

export default function BoardPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const { team } = useTeamContext(teamId);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <PageHeader
        eyebrow={team.data?.name ?? "Team"}
        title="Board"
        meta="Drag a card between columns, or focus one and use space then the arrow keys."
      />
      <TeamMembersOnly teamId={teamId}>
        <Board teamId={teamId} orgId={orgId} />
      </TeamMembersOnly>
    </div>
  );
}
