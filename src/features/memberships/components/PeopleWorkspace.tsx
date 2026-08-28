"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/common/PageHeader";
import { errorMessage } from "@/lib/http";
import { useCreateInvitation, useInvitations, useOrganizationMembers, useRevokeInvitation } from "@/features/memberships/queries";

export function PeopleWorkspace({ orgId }: { orgId: string }) {
  const members = useOrganizationMembers(orgId);
  const invitations = useInvitations(orgId);
  const create = useCreateInvitation(orgId);
  const revoke = useRevokeInvitation(orgId);
  const [email, setEmail] = useState("");
  const [link, setLink] = useState<string | null>(null);
  const invite = () => create.mutate(email, { onSuccess: (value) => {
    setLink(`${location.origin}/invite#token=${value.token}`); setEmail("");
  }});

  return <div className="flex w-full flex-col gap-6">
    <PageHeader eyebrow="Organisation" title="People" meta={members.data ? `${members.data.items.length} members` : undefined} />
    <section className="flex max-w-xl flex-col gap-3 border p-4">
      <h2 className="font-medium">Invite someone</h2>
      <div className="flex gap-2"><Input aria-label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Button onClick={invite} disabled={!email || create.isPending}>Create invitation</Button></div>
      {create.isError && <p role="alert" className="text-sm text-danger">{errorMessage(create.error)}</p>}
      {link && <div className="border-l-2 border-primary pl-3 text-sm">
        <p>This link is shown once and expires in seven days.</p><code className="data-mono break-all">{link}</code>
        <Button variant="outline" className="mt-2" onClick={() => navigator.clipboard.writeText(link)}>Copy link</Button>
      </div>}
    </section>
    <section><h2 className="mb-2 font-medium">Current members</h2>
      {members.isError ? <p role="alert">{errorMessage(members.error)}</p> : <ul className="divide-y border">{members.data?.items.map((member) =>
        <li key={member.user_id} className="flex justify-between p-3"><span>{member.display_name}<span className="data-mono ml-2 text-muted-foreground">{member.email}</span></span><span>{member.role}</span></li>)}</ul>}
    </section>
    <section><h2 className="mb-2 font-medium">Pending invitations</h2><ul className="divide-y border">
      {invitations.data?.items.map((item) => <li key={item.id} className="flex items-center justify-between p-3">
        <span><span className="data-mono">{item.id}</span><span className="ml-2 text-muted-foreground">Expires {new Date(item.expires_at).toLocaleString()}</span></span>
        <Button variant="outline" onClick={() => revoke.mutate(item.id)}>Revoke</Button></li>)}
    </ul></section>
  </div>;
}
