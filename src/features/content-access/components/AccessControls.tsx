"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useTeamContext } from "@/features/teams/queries";
import { can } from "@/lib/rbac";
import { useContentAccess, useContentAccessAction } from "@/features/content-access/queries";
import { GrantMember } from "@/features/content-access/components/GrantMember";
import type { ContentKind } from "@/features/content-access/api";

export function AccessControls({ orgId, teamId, kind, resourceId, title }: {
  orgId: string; teamId: string; kind: ContentKind; resourceId: string; title: string;
}) {
  const { user, actor } = useTeamContext(teamId);
  const query = useContentAccess(orgId, teamId);
  const mutation = useContentAccessAction(orgId, teamId);
  const [open, setOpen] = useState(false);
  const item = query.data?.items.find((entry) => entry.kind === kind && entry.resource_id === resourceId);
  const requests = query.data?.requests.filter((entry) => entry.kind === kind && entry.resource_id === resourceId) ?? [];
  const userId = user ? user.public_id ?? String(user.id) : "";
  const isCreator = can(actor ? { ...actor, userId, creatorId: item?.creator_id } : null, "content:access_decide");
  const own = requests.find((entry) => entry.requested_by === userId);

  if (!item) return <span className="text-xs text-muted-foreground">{query.isError ? "Access unavailable" : "Checking access…"}</span>;
  if (!isCreator) {
    if (item.can_access) return <span className="text-xs text-muted-foreground">● Access granted</span>;
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">● {own?.status === "pending" ? "Requested" : own?.status === "denied" ? "Denied" : "Restricted"}</span>
        <Button size="xs" variant="outline" disabled={mutation.isPending || own?.status === "pending"}
          onClick={() => mutation.mutate({ action: "request", kind, resourceId })}>
          {own?.status === "denied" ? "Request again" : "Request access"}
        </Button>
      </div>
    );
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="xs" variant="outline" />}>Manage access</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Access to {title}</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Only you, the creator, can grant access to this {kind}. Other team members must request permission.</p>
        <GrantMember orgId={orgId} teamId={teamId} kind={kind} resourceId={resourceId} creatorId={item.creator_id} />
        <div className="flex max-h-72 flex-col gap-3 overflow-auto">
          {!requests.length && <p className="text-sm text-muted-foreground">No requests yet.</p>}
          {requests.map((entry) => (
            <div key={entry.public_id} className="flex items-center justify-between gap-2 border-t pt-3">
              <div className="min-w-0 text-sm">
                <p className="truncate">{entry.requester_name || entry.requested_by}</p>
                <p className="text-xs text-muted-foreground">● {entry.status}</p>
              </div>
              {entry.status === "pending" && <div className="flex gap-2">
                <Button size="xs" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "decide", requestId: entry.public_id, decision: "approve", kind, resourceId, memberId: entry.requested_by })}>Approve</Button>
                <Button size="xs" variant="outline" disabled={mutation.isPending} onClick={() => mutation.mutate({ action: "decide", requestId: entry.public_id, decision: "deny", kind, resourceId, memberId: entry.requested_by })}>Deny</Button>
              </div>}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
