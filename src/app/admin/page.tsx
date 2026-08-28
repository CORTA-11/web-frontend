"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { Stat } from "@/features/overview/components/Stat";
import { OrgTable } from "@/features/platform/components/OrgTable";
import { useOrganizations } from "@/features/platform/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";

export default function PlatformPage() {
  const { user } = useSession();
  const orgs = useOrganizations();

  if (!can(user && { orgRole: user.org_role, platformRole: user.platform_role }, "platform:manage")) {
    return <p className="text-sm text-muted-foreground">This console is for platform operators.</p>;
  }

  const all = orgs.data ?? [];
  const counted = (status: string) => all.filter((org) => org.status === status).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Platform"
        title="Organisations"
        meta="Approve, suspend and reinstate tenants. Their teams, chats, documents and files are not readable from here."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Tenants" value={all.length} />
        <Stat label="Awaiting approval" value={counted("pending")} />
        <Stat label="Active" value={counted("active")} />
        <Stat
          label="People"
          value={all.reduce((total, org) => total + org.user_count, 0)}
          hint="across all tenants"
        />
      </div>

      <QueryBoundary query={orgs} rows={5}>
        {(data) => <OrgTable orgs={data} />}
      </QueryBoundary>
    </div>
  );
}
