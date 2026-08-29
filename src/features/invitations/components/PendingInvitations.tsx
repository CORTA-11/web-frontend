"use client";

import { XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { dateTime } from "@/lib/format";
import { useInvitations, useRevokeInvitation } from "@/features/invitations/queries";

export function PendingInvitations({ orgId }: { orgId: string }) {
  const invitations = useInvitations(orgId);
  const revoke = useRevokeInvitation(orgId);

  return (
    <section className="flex flex-col gap-2">
      <h2 className="label-eyebrow">Pending invitations</h2>
      <QueryBoundary query={invitations}>
        {(items) => items.length ? (
          <div className="divide-y divide-border border border-border">
            {items.map((invitation) => (
              <div key={invitation.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="data-mono truncate">{invitation.id}</span>
                  <span className="text-muted-foreground">Expires {dateTime(invitation.expires_at)}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" disabled={revoke.isPending} onClick={() => revoke.mutate(invitation.id)}>
                  <XIcon />Revoke
                </Button>
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-muted-foreground">No invitations are waiting to be accepted.</p>}
      </QueryBoundary>
    </section>
  );
}
