"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { AiSettingsForm } from "@/features/settings/components/AiSettingsForm";
import { RegistrationFieldsEditor } from "@/features/settings/components/RegistrationFieldsEditor";
import { useOrgSettings, useUpdateOrgSettings } from "@/features/settings/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";

function OrgProfile({ orgId, name, publicId }: { orgId: string; name: string; publicId: string }) {
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
      <Field
        label="Join ID"
        htmlFor="org-public-id"
        hint="People enter this when registering to join your organisation."
      >
        <Input id="org-public-id" readOnly value={publicId} className="font-mono" />
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
          <Tabs defaultValue="profile">
            <TabsList>
              <TabsTrigger value="profile">Organisation</TabsTrigger>
              <TabsTrigger value="registration">Registration</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="pt-4">
              <OrgProfile orgId={orgId} name={data.name} publicId={data.public_id} />
            </TabsContent>

            <TabsContent value="registration" className="flex flex-col gap-3 pt-4">
              <p className="max-w-prose text-xs text-muted-foreground">
                Fields added here appear on the registration form for anyone joining with your
                organisation ID.
              </p>
              <RegistrationFieldsEditor orgId={orgId} fields={data.registration_fields} />
            </TabsContent>

            <TabsContent value="ai" className="pt-4">
              <AiSettingsForm orgId={orgId} ai={data.ai} />
            </TabsContent>
          </Tabs>
        )}
      </QueryBoundary>
    </div>
  );
}
