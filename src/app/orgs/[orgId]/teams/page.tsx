"use client";

import { useParams } from "next/navigation";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { CreateTeamDialog } from "@/features/teams/components/CreateTeamDialog";
import { TeamsTable } from "@/features/teams/components/TeamsTable";
import { useTeams } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";

export default function TeamsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useSession();
  const teams = useTeams(orgId);
  const actor = user ? { orgRole: user.org_role } : null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Organisation"
        title="Teams"
        meta="Admins create teams and assign leaders. What a team works on stays with its members."
        actions={can(actor, "team:create") ? <CreateTeamDialog orgId={orgId} /> : null}
      />
      <QueryBoundary query={teams}>
        {(data) => <TeamsTable orgId={orgId} teams={data} canDelete={can(actor, "team:delete")} />}
      </QueryBoundary>
    </div>
  );
}
