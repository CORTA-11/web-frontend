"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAddMember } from "@/features/teams/queries";

export function AddMemberForm({ orgId, teamId }: { orgId: string; teamId: string }) {
  const [email, setEmail] = useState("");
  const add = useAddMember(teamId, orgId);

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        const target = email.trim();
        if (!target) return;
        add.mutate(target, { onSuccess: () => setEmail("") });
      }}
    >
      <label htmlFor="add-member-email" className="label-eyebrow">
        Add member
      </label>
      <Input
        id="add-member-email"
        type="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="member@example.com"
        className="h-8 w-auto min-w-60"
      />
      <Button type="submit" size="xs" variant="outline" disabled={!email.trim() || add.isPending}>
        <PlusIcon />
        {add.isPending ? "Adding…" : "Add"}
      </Button>
    </form>
  );
}
