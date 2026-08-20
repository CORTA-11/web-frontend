"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddMember, useOrgUsers } from "@/features/teams/queries";
import type { TeamMember } from "@/lib/types";

export function AddMemberForm({
  orgId,
  teamId,
  members,
}: {
  orgId: string;
  teamId: string;
  members: TeamMember[];
}) {
  const [selected, setSelected] = useState("");
  const users = useOrgUsers(orgId);
  const add = useAddMember(teamId);

  const roster = new Set(members.map((m) => m.user_id));
  const candidates = users.data?.filter((user) => !roster.has(user.id)) ?? [];

  if (!candidates.length) {
    return <p className="text-xs text-muted-foreground">Everyone in the organisation is already in this team.</p>;
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected) return;
        add.mutate(Number(selected), { onSuccess: () => setSelected("") });
      }}
    >
      <label htmlFor="add-member" className="label-eyebrow">
        Add member
      </label>
      <select
        id="add-member"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="select-field select-field-sm w-auto min-w-52"
      >
        <option value="">Select a person…</option>
        {candidates.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} — {user.email}
          </option>
        ))}
      </select>
      <Button type="submit" size="xs" variant="outline" disabled={!selected || add.isPending}>
        <PlusIcon />
        Add
      </Button>
    </form>
  );
}
