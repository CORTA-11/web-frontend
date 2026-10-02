"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DeleteTeamDialog } from "@/features/teams/components/DeleteTeamDialog";
import type { Team } from "@/lib/types";

export function TeamDeletion({ orgId, team }: { orgId: string; team: Team }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <section className="space-y-3 rounded-lg border border-destructive p-4">
      <h2 className="font-medium">Delete team</h2>
      <p className="text-sm text-muted-foreground">Remove this team from the organisation. Members will lose access to it.</p>
      <Button variant="destructive" onClick={() => setOpen(true)}>Delete team</Button>
      <DeleteTeamDialog orgId={orgId} team={team} open={open} onOpenChange={setOpen}
        onDeleted={() => router.replace(`/orgs/${orgId}/teams`)} />
    </section>
  );
}
