"use client";

import Link from "next/link";
import { AccessControls } from "@/features/content-access/components/AccessControls";
import { useContentAccess } from "@/features/content-access/queries";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { useDeleteDoc } from "@/features/docs/queries";
import { relative } from "@/lib/format";
import type { DocSummary } from "@/lib/types";

type Props = { basePath: string; orgId: string; teamId: string; docs: DocSummary[]; canDelete: boolean };

export function DocList({ basePath, orgId, teamId, docs, canDelete }: Props) {
  const remove = useDeleteDoc(orgId, teamId);
  const access = useContentAccess(orgId, teamId);

  if (!docs.length) {
    return (
      <EmptyState
        title="No documents yet"
        hint="Meeting minutes and specs live here. Creators control who can open them."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead className="hidden sm:table-cell">Last edited by</TableHead>
          <TableHead>Updated</TableHead>
          <TableHead>Access</TableHead>
          {canDelete && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {docs.map((doc) => (
          <TableRow key={doc.id}>
            <TableCell>
              {access.data?.items.some((entry) => entry.kind === "document" && entry.resource_id === doc.id && entry.can_access) ? (
                <Link href={`${basePath}/${doc.id}`} className="font-medium underline-offset-4 hover:underline">{doc.title}</Link>
              ) : <span className="font-medium">{doc.title}</span>}
            </TableCell>
            <TableCell className="hidden sm:table-cell text-muted-foreground">{doc.updated_by}</TableCell>
            <TableCell className="text-muted-foreground" data-numeric>
              {relative(doc.updated_at)}
            </TableCell>
            <TableCell><AccessControls orgId={orgId} teamId={teamId} kind="document" resourceId={doc.id} title={doc.title} /></TableCell>
            {canDelete && (
              <TableCell>
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Delete ${doc.title}`}
                  onClick={() => remove.mutate(doc.id)}
                >
                  <Trash2Icon />
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
