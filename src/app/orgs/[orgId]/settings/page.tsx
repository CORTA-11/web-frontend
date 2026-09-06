"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { useOrgSettings, useUpdateOrgSettings } from "@/features/settings/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";

function OrgProfile({ orgId, name }: { orgId: string; name: string }) {
  const [value, setValue] = useState(name);
  const update = useUpdateOrgSettings(orgId);

  return (
    <form
      className="flex max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ name: value });
      }}
    >
      <Field label="Organisation name" htmlFor="org-name">
        <Input id="org-name" value={value} onChange={(event) => setValue(event.target.value)} />
      </Field>
      <div>
        <Button type="submit" size="sm" disabled={value.trim() === name || update.isPending}>
          Save
        </Button>
      </div>
    </form>
  );
}

export default function SettingsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useSession();
  const settings = useOrgSettings(orgId);

  if (!can(user && { orgRole: user.org_role }, "org:manage")) {
    return (
      <p className="text-sm text-muted-foreground">
        Only an organisation admin can change these settings.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Organisation" title="Settings" />
      <QueryBoundary query={settings}>
        {(data) => (
          <div className="pt-4">
            <OrgProfile orgId={orgId} name={data.name} />
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}
