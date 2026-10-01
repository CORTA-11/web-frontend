"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon, Trash2Icon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { DocEditor } from "@/features/docs/components/DocEditor";
import { useDeleteDoc, useDoc } from "@/features/docs/queries";
import { AccessControls } from "@/features/content-access/components/AccessControls";
import { useContentAccess } from "@/features/content-access/queries";
import { useTeamContext } from "@/features/teams/queries";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { can } from "@/lib/rbac";

export function DocDetail({ orgId, teamId, docId }: { orgId: string; teamId: string; docId: string }) {
  const router = useRouter();
  const { actor } = useTeamContext(teamId);
  const access = useContentAccess(orgId, teamId, !!actor?.teamRole);
  const item = access.data?.items.find((entry) => entry.kind === "document" && entry.resource_id === docId);
  const doc = useDoc(orgId, teamId, docId, item?.can_access === true);
  const remove = useDeleteDoc(orgId, teamId);
  const docsPath = `/orgs/${orgId}/teams/${teamId}/docs`;
  const leaveDeletedDocument = useCallback(() => router.replace(docsPath), [docsPath, router]);
  return (
    <div className="flex w-full min-w-0 flex-col gap-4">
      <div className="flex items-center gap-2">
        <Link href={docsPath} className={buttonVariants({ size: "xs", variant: "ghost" })}><ArrowLeftIcon />All documents</Link>
        {item?.can_access && <AccessControls orgId={orgId} teamId={teamId} kind="document" resourceId={docId} title={doc.data?.title ?? "this document"} />}
        {can(actor, "doc:delete") && (
          <Button size="xs" variant="ghost" className="ml-auto text-danger"
            onClick={() => remove.mutate(docId, { onSuccess: () => router.push(docsPath) })}><Trash2Icon />Delete</Button>
        )}
      </div>
      <TeamMembersOnly teamId={teamId}>
        <QueryBoundary query={access} rows={3}>
          {() => item?.can_access ? (
            <QueryBoundary query={doc} rows={8}>
              {(data) => <DocEditor key={`${orgId}:${teamId}:${data.id}`} orgId={orgId} teamId={teamId} doc={data} onDeleted={leaveDeletedDocument} />}
            </QueryBoundary>
          ) : (
            <section className="flex flex-col items-start gap-3 border p-6">
              <h1 className="text-lg font-semibold">{item ? "Permission required" : "Document unavailable"}</h1>
              {item && <><p className="text-sm text-muted-foreground">Ask the creator for permission to open this document.</p>
                <AccessControls orgId={orgId} teamId={teamId} kind="document" resourceId={docId} title="this document" /></>}
            </section>
          )}
        </QueryBoundary>
      </TeamMembersOnly>
    </div>
  );
}
