"use client";

import { CheckIcon, PauseIcon, PlayIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusDot, type Tone } from "@/components/common/StatusDot";
import { useSetOrgStatus } from "@/features/platform/queries";
import { day, relative } from "@/lib/format";
import type { Organization, OrgStatus } from "@/lib/types";

const TONE: Record<OrgStatus, Tone> = {
  pending: "warn",
  active: "ok",
  suspended: "muted",
  rejected: "danger",
};

export function OrgTable({ orgs }: { orgs: Organization[] }) {
  const setStatus = useSetOrgStatus();

  const ordered = [...orgs].sort((a, b) =>
    a.status === b.status ? a.name.localeCompare(b.name) : a.status === "pending" ? -1 : 1
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Organisation</TableHead>
          <TableHead className="hidden md:table-cell">Requested by</TableHead>
          <TableHead className="hidden lg:table-cell">Size</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-40" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((org) => (
          <TableRow key={org.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{org.name}</span>
                <span className="data-mono text-muted-foreground">{org.public_id}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col">
                <span>{org.owner_name}</span>
                <span className="data-mono text-muted-foreground">{org.owner_email}</span>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
              {org.user_count} {org.user_count === 1 ? "person" : "people"} ·{" "}
              {org.team_count} {org.team_count === 1 ? "team" : "teams"}
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <StatusDot tone={TONE[org.status]}>{org.status}</StatusDot>
                <span className="text-2xs text-muted-foreground" data-numeric>
                  {org.status === "pending" ? relative(org.requested_at) : day(org.requested_at)}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex justify-end gap-1">
                {org.status === "pending" && (
                  <>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ orgId: org.id, status: "active" })}
                    >
                      <CheckIcon />
                      Approve
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label={`Reject ${org.name}`}
                      disabled={setStatus.isPending}
                      onClick={() => setStatus.mutate({ orgId: org.id, status: "rejected" })}
                    >
                      <XIcon />
                    </Button>
                  </>
                )}
                {org.status === "active" && (
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ orgId: org.id, status: "suspended" })}
                  >
                    <PauseIcon />
                    Suspend
                  </Button>
                )}
                {(org.status === "suspended" || org.status === "rejected") && (
                  <Button
                    size="xs"
                    variant="ghost"
                    disabled={setStatus.isPending}
                    onClick={() => setStatus.mutate({ orgId: org.id, status: "active" })}
                  >
                    <PlayIcon />
                    Reinstate
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
