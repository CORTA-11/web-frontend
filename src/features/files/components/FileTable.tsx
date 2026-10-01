"use client";

import { DownloadIcon, LockIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { useDeleteFile, useDownloadFile } from "@/features/files/queries";
import { fileCrypto } from "@/lib/crypto";
import { AccessStatus } from "@/features/content-access/components/AccessStatus";
import { AccessControls } from "@/features/content-access/components/AccessControls";
import { useContentAccess } from "@/features/content-access/queries";
import { useFormat } from "@/lib/use-format";
import type { StoredFile } from "@/lib/types";

type Props = {
  teamId: string;
  orgId: string;
  files: StoredFile[];
  currentUserId?: number;
  canDeleteAny: boolean;
};

export function FileTable({ teamId, orgId, files, currentUserId, canDeleteAny }: Props) {
  const { dateTime, fileSize } = useFormat();
  const download = useDownloadFile(teamId, orgId);
  const remove = useDeleteFile(teamId, orgId);
  const access = useContentAccess(orgId, teamId);

  if (!files.length) {
    return <EmptyState title="No files yet" hint="Drop files onto this page or use Upload." />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead className="hidden sm:table-cell">Size</TableHead>
          <TableHead className="hidden md:table-cell">Uploaded by</TableHead>
          <TableHead className="hidden lg:table-cell">When</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-36">Access</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="font-mono text-xs">
              <span className="inline-flex items-center gap-1.5">
                {file.content_type === fileCrypto.mime && (
                  <>
                    <LockIcon className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="sr-only">Encrypted, </span>
                  </>
                )}
                {file.name}
              </span>
            </TableCell>
            <TableCell className="hidden sm:table-cell text-muted-foreground" data-numeric>
              {fileSize(file.size)}
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {file.uploaded_by_name}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
              {dateTime(file.uploaded_at)}
            </TableCell>
            <TableCell><AccessStatus orgId={orgId} teamId={teamId} kind="file" resourceId={file.id} /></TableCell>
            <TableCell><AccessControls orgId={orgId} teamId={teamId} kind="file" resourceId={file.id} title={file.name} showStatus={false} /></TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-0.5">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Download ${file.name}`}
                  disabled={download.isPending || !access.data?.items.some((entry) => entry.kind === "file" && entry.resource_id === file.id && entry.can_access)}
                  onClick={() => download.mutate(file)}
                >
                  <DownloadIcon />
                </Button>
                {(canDeleteAny || file.uploaded_by === currentUserId) && (
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    aria-label={`Delete ${file.name}`}
                    onClick={() => remove.mutate(file.id)}
                  >
                    <Trash2Icon />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
