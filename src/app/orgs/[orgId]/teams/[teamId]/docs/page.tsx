"use client";

import { useParams, useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { DocList } from "@/features/docs/components/DocList";
import { useCreateDoc, useDocs } from "@/features/docs/queries";
import { TranscriptSummaryDialog } from "@/features/ai/components/TranscriptSummaryDialog";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";

export default function DocsPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const router = useRouter();
  const { team, actor } = useTeamContext(teamId);
  const isMember = Boolean(team.data?.my_role);
  const docs = useDocs(orgId, teamId);
  const create = useCreateDoc(orgId, teamId);
  const basePath = `/orgs/${orgId}/teams/${teamId}/docs`;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={team.data?.name ?? "Team"}
        title="Documents"
        meta="Shared notes and meeting minutes. Everyone in the team can edit."
        actions={
          isMember ? (
            <div className="flex items-center gap-2">
              <TranscriptSummaryDialog teamId={teamId} actor={actor} />
              <Button
                size="sm"
                disabled={create.isPending}
                onClick={() =>
                  create.mutate("Untitled document", {
                    onSuccess: (doc) => router.push(`${basePath}/${doc.id}`),
                  })
                }
              >
                <PlusIcon />
                New document
              </Button>
            </div>
          ) : null
        }
      />
      <TeamMembersOnly teamId={teamId}>
        <QueryBoundary query={docs}>
          {(data) => (
            <DocList
              basePath={basePath}
              orgId={orgId}
              teamId={teamId}
              docs={data}
              canDelete={can(actor, "doc:delete")}
            />
          )}
        </QueryBoundary>
      </TeamMembersOnly>
    </div>
  );
}
