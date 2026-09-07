"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { DocEditor } from "@/features/docs/components/DocEditor";
import { useDeleteDoc, useDoc } from "@/features/docs/queries";
import { useTeamContext } from "@/features/teams/queries";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { can } from "@/lib/rbac";

export default function DocPage() {
  const { orgId, teamId, docId } = useParams<{ orgId: string; teamId: string; docId: string }>();
  const router = useRouter();
  const { actor } = useTeamContext(teamId);
  const doc = useDoc(orgId, teamId, docId);
  const remove = useDeleteDoc(orgId, teamId);
  const docsPath = `/orgs/${orgId}/teams/${teamId}/docs`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button size="xs" variant="ghost" render={<Link href={docsPath} />}>
          <ArrowLeftIcon />
          All documents
        </Button>
        {can(actor, "doc:delete") && (
          <Button
            size="xs"
            variant="ghost"
            className="ml-auto text-danger"
            onClick={() => remove.mutate(docId, { onSuccess: () => router.push(docsPath) })}
          >
            <Trash2Icon />
            Delete
          </Button>
        )}
      </div>

      <TeamMembersOnly teamId={teamId}>
        <QueryBoundary query={doc} rows={8}>
        {(data) => (
          <>
            <Input
              aria-label="Document title"
              value={data.title}
              readOnly
              className="h-auto border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            />
            <DocEditor key={`${orgId}:${teamId}:${data.id}`} orgId={orgId} teamId={teamId} doc={data} />
          </>
        )}
        </QueryBoundary>
      </TeamMembersOnly>
    </div>
  );
}
