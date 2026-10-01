"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useRotateTeamKey } from "@/features/team-settings/queries";

export function TeamKeyRotation({ orgId, teamId }: { orgId: string; teamId: string }) {
  const [confirming, setConfirming] = useState(false);
  const rotation = useRotateTeamKey(orgId, teamId);

  return (
    <section className="flex flex-col gap-4 border border-border p-4">
      <h2 className="label-eyebrow">Team encryption</h2>
      <p className="text-sm text-muted-foreground">
        Rotate the encryption key used for future file uploads. Existing files keep their
        original keys and access permissions. This does not revoke access to previously shared files.
      </p>
      <p className="text-sm text-muted-foreground">
        The new key is shared with current members who have registered encryption keys.
        Members without keys must unlock them before they can receive access.
      </p>
      {confirming ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm">Generate a new team encryption key now?</p>
          <div className="flex gap-2">
            <Button size="sm" disabled={rotation.isPending} onClick={() => rotation.mutate(undefined, {
              onSuccess: () => setConfirming(false),
            })}>
              {rotation.isPending ? "Rotating…" : "Confirm rotation"}
            </Button>
            <Button size="sm" variant="outline" disabled={rotation.isPending} onClick={() => setConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant="outline" onClick={() => setConfirming(true)}>Rotate encryption key</Button>
        </div>
      )}
      {rotation.isError && (
        <p role="alert" className="text-sm text-destructive">
          {rotation.error instanceof Error ? rotation.error.message : "Key rotation failed. Please try again."}
        </p>
      )}
    </section>
  );
}
