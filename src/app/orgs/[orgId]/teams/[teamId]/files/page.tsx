"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { FileTable } from "@/features/files/components/FileTable";
import { KeyAccessPanel } from "@/features/files/components/KeyAccessPanel";
import { UploadZone } from "@/features/files/components/UploadZone";
import { useFiles } from "@/features/files/queries";
import { useTeamContext } from "@/features/teams/queries";
import { TeamMembersOnly } from "@/features/teams/components/TeamMembersOnly";
import { fileSize } from "@/lib/format";
import { can } from "@/lib/rbac";

export default function FilesPage() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const { team, actor, user } = useTeamContext(teamId);
  const files = useFiles(teamId, orgId);
  const used = files.data?.reduce((total, file) => total + file.size, 0) ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow={team.data?.name ?? "Team"}
        title="Files"
        meta={
          files.data
            ? `${files.data.length} files · ${fileSize(used)} used · AES-256-GCM in this browser`
            : undefined
        }
      />
      <TeamMembersOnly teamId={teamId}>
        <KeyAccessPanel
          teamId={teamId}
          orgId={orgId}
          currentUserId={user?.public_id}
          actor={actor}
          hasFiles={(files.data?.length ?? 0) > 0}
        />
        <UploadZone teamId={teamId} orgId={orgId}>
        <QueryBoundary query={files}>
          {(data) => (
            <FileTable
              teamId={teamId}
              orgId={orgId}
              files={data}
              currentUserId={user?.id}
              canDeleteAny={can(actor, "file:delete_any")}
            />
          )}
        </QueryBoundary>
        </UploadZone>
      </TeamMembersOnly>
    </div>
  );
}
