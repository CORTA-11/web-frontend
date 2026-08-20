"use client";

import { DownloadIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { useDeleteFile, useDownloadFile } from "@/features/files/queries";
import { dateTime, fileSize } from "@/lib/format";
import type { StoredFile } from "@/lib/types";

type Props = {
  teamId: string;
  orgId: string;
  files: StoredFile[];
  currentUserId?: number;
  canDeleteAny: boolean;
};

export function FileTable({ teamId, orgId, files, currentUserId, canDeleteAny }: Props) {
  const download = useDownloadFile(teamId, orgId);
  const remove = useDeleteFile(teamId);

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
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <TableRow key={file.id}>
            <TableCell className="font-mono text-xs">{file.name}</TableCell>
            <TableCell className="hidden sm:table-cell text-muted-foreground" data-numeric>
              {fileSize(file.size)}
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {file.uploaded_by_name}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
              {dateTime(file.uploaded_at)}
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-0.5">
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Download ${file.name}`}
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
