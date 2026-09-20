"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { DocList } from "@/features/docs/components/DocList";
import { docsApi } from "@/features/docs/api";
import { useDocs } from "@/features/docs/queries";
import { TranscriptSummaryDialog } from "@/features/ai/components/TranscriptSummaryDialog";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";
import { notifyError } from "@/lib/query";

export default function DocsPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const router = useRouter();
  const { team, actor } = useTeamContext(teamId);
  const isMember = Boolean(team.data?.my_role);
  const docs = useDocs(orgId, teamId);
  const basePath = `/orgs/${orgId}/teams/${teamId}/docs`;
  const [creating, setCreating] = useState(false);

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
                disabled={creating}
                onClick={async () => {
                  setCreating(true);
                  try {
                    const doc = await docsApi.create(orgId, teamId, "Untitled document");
                    router.push(`${basePath}/${doc.id}`);
                  } catch (error) {
                    notifyError(error);
                  } finally {
                    setCreating(false);
                  }
                }}
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
