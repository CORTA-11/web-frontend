"use client";

import { useSession } from "@/features/auth/session";
import { useContentAccess } from "@/features/content-access/queries";
import type { ContentKind } from "@/features/content-access/api";

export function AccessStatus({ orgId, teamId, kind, resourceId }: {
  orgId: string; teamId: string; kind: ContentKind; resourceId: string;
}) {
  const { user } = useSession();
  const query = useContentAccess(orgId, teamId);
  const userId = user ? user.public_id ?? String(user.id) : "";
  const item = query.data?.items.find((entry) => entry.kind === kind && entry.resource_id === resourceId);
  const own = query.data?.requests.find((entry) => entry.kind === kind && entry.resource_id === resourceId && entry.requested_by === userId);
  const status = !item ? query.isError ? "Access unavailable" : "Checking access…"
    : item.creator_id === userId ? "Creator"
    : item.can_access ? "Access granted"
    : own?.status === "pending" ? "Requested"
    : own?.status === "denied" ? "Denied" : "Restricted";

  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-muted-foreground">
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-muted-foreground" />
      {status}
    </span>
  );
}
