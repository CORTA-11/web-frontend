"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteTeam } from "@/features/teams/queries";
import type { Team } from "@/lib/types";

export function DeleteTeamDialog({ orgId, team, open, onOpenChange, onDeleted }: {
  orgId: string;
  team: Team;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const remove = useDeleteTeam(orgId);
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!remove.isPending) onOpenChange(next); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {team.name}?</DialogTitle>
          <DialogDescription>
            This team will no longer be available to its members. You cannot undo this action here.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" disabled={remove.isPending} onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={remove.isPending} onClick={() => remove.mutate(team.public_id, {
            onSuccess: () => { onOpenChange(false); onDeleted?.(); },
          })}>
            {remove.isPending ? "Deleting…" : "Delete team"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
