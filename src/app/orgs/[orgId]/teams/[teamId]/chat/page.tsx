"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { ChatRoom } from "@/features/chat/components/ChatRoom";
import { ChatSummaryDialog } from "@/features/ai/components/ChatSummaryDialog";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { useTeamContext } from "@/features/teams/queries";

export default function ChatPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const { team, actor } = useTeamContext(teamId);
  const isMember = Boolean(team.data?.my_role);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <PageHeader
        eyebrow={team.data?.name ?? "Team"}
        title="Chat"
        actions={isMember ? <ChatSummaryDialog teamId={teamId} actor={actor} /> : null}
      />
      <TeamMembersOnly teamId={teamId}>
        <ChatRoom teamId={teamId} />
      </TeamMembersOnly>
    </div>
  );
}
