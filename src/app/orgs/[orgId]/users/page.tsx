"use client";

import { useParams } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { StatusDot } from "@/components/common/StatusDot";
import { useOrgUsers } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { initials } from "@/lib/format";
import { can } from "@/lib/rbac";
import { InviteMemberDialog } from "@/features/invitations/components/InviteMemberDialog";
import { PendingInvitations } from "@/features/invitations/components/PendingInvitations";

export default function PeoplePage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useSession();
  const users = useOrgUsers(orgId);

  if (!can(user && { orgRole: user.org_role }, "org:manage_users")) {
    return <p className="text-sm text-muted-foreground">Only an organisation admin can see this page.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Organisation"
        title="People"
        meta={users.data ? `${users.data.length} registered` : undefined}
        actions={<InviteMemberDialog orgId={orgId} />}
      />
      <QueryBoundary query={users}>
        {(data) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Person</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-6">
                        <AvatarFallback className="text-2xs">{initials(person.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{person.name}</span>
                        <span className="data-mono truncate text-muted-foreground">{person.email}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusDot tone={person.org_role === "ORG_ADMIN" ? "info" : "muted"}>
                      {person.org_role === "ORG_ADMIN" ? "Organisation admin" : "Member"}
                    </StatusDot>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </QueryBoundary>
      <PendingInvitations orgId={orgId} />
    </div>
  );
}
