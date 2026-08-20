"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useUpdateTeam } from "@/features/teams/queries";
import type { Team } from "@/lib/types";

export function TeamNameForm({ orgId, team }: { orgId: string; team: Team }) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description ?? "");
  const update = useUpdateTeam(orgId, team.public_id);
  const dirty = name.trim() !== team.name || description !== (team.description ?? "");

  return (
    <form
      className="flex flex-col gap-4 border border-border p-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ name: name.trim(), description });
      }}
    >
      <p className="label-eyebrow">Team settings</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="team-rename">
          <Input id="team-rename" value={name} onChange={(event) => setName(event.target.value)} />
        </Field>
        <Field label="Description" htmlFor="team-redescribe">
          <Input
            id="team-redescribe"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
      </div>
      <div>
        <Button type="submit" size="sm" variant="outline" disabled={!dirty || update.isPending}>
          {update.isPending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
