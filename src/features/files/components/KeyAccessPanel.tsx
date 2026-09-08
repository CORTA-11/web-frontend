"use client";

import { useState } from "react";
import { LockKeyholeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isLive } from "@/lib/env";
import { can, type Actor } from "@/lib/rbac";
import { grantMemberAccess } from "@/features/files/keystore";
import {
  useDecideKeyAccess,
  useKeyAccessRequests,
  useRequestKeyAccess,
} from "@/features/files/queries";
import { notifyError } from "@/lib/query";

/**
 * A member who joined after the team's files were uploaded cannot decrypt the
 * earlier versions (SRS 3.1.6): the over-the-air re-wrap happens in their own
 * browser under the leader's key, so it is only allowed after the leader
 * approves a request. Members request, the leader approves/denies.
 */
export function KeyAccessPanel({
  teamId,
  orgId,
  currentUserId,
  actor,
  hasFiles,
}: {
  teamId: string;
  orgId: string;
  currentUserId?: string;
  actor: Actor | null;
  hasFiles: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const requests = useKeyAccessRequests(teamId, orgId);
  const request = useRequestKeyAccess(teamId, orgId);
  const decide = useDecideKeyAccess(teamId, orgId);
  const isLeader = can(actor, "file:access_decide");
  if (!isLive("files") || !hasFiles) return null;

  const onApprove = async (requesterId: string, requestId: string) => {
    setBusy(true);
    try {
      await grantMemberAccess(orgId, teamId, requesterId);
      decide.mutate({ requestId, approve: true });
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(false);
    }
  };

  const myLatest = requests.data?.filter((entry) => entry.requested_by === currentUserId).at(-1);
  const pending = requests.data?.filter((entry) => entry.requested_by !== currentUserId && entry.status === "pending");
  const showStatus = !isLeader && myLatest !== undefined;
  const showMemberRequest = !isLeader && myLatest === undefined && requests.data !== undefined;

  if (!showStatus && !showMemberRequest && (pending?.length ?? 0) === 0) return null;

  return (
    <div className="border-l-2 pl-3 flex flex-col gap-2 text-sm">
      <p className="label-eyebrow">Access to previous files</p>
      {showStatus && (
        <div className="flex items-center justify-between gap-3">
          {myLatest.status === "pending" ? (
            <>
              <span className="text-muted-foreground">Waiting for the team leader to approve access to earlier files.</span>
              <Button size="sm" variant="outline" disabled>
                Pending
              </Button>
            </>
          ) : (
            <span className="text-muted-foreground">Previous-file access {myLatest.status}.</span>
          )}
        </div>
      )}
      {showMemberRequest && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            Files uploaded before you joined can only be opened after the team leader approves.
          </span>
          <Button size="sm" variant="outline" disabled={request.isPending} onClick={() => request.mutate()}>
            {request.isPending ? "Requesting…" : "Request access to previous files"}
          </Button>
        </div>
      )}
      {isLeader && pending !== undefined && pending.length > 0 && (
        <ul className="flex flex-col gap-2">
          {pending.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <LockKeyholeIcon className="size-3.5" />
                {entry.requested_by_name} requested previous-file access
              </span>
              <span className="flex items-center gap-2">
                <Button size="sm" disabled={busy || decide.isPending} onClick={() => onApprove(entry.requested_by, entry.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="outline" disabled={decide.isPending} onClick={() => decide.mutate({ requestId: entry.id, approve: false })}>
                  Deny
                </Button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}