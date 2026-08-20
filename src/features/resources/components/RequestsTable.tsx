"use client";

import { CheckIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusDot, type Tone } from "@/components/common/StatusDot";
import { useDecideRequest } from "@/features/resources/queries";
import { duration, relative, slot } from "@/lib/format";
import type { RequestStatus, ResourceRequest } from "@/lib/types";

const TONE: Record<RequestStatus, Tone> = {
  pending: "warn",
  approved: "ok",
  rejected: "danger",
};

export function RequestsTable({
  orgId, requests, canDecide,
}: {
  orgId: string;
  requests: ResourceRequest[];
  canDecide: boolean;
}) {
  const decide = useDecideRequest(orgId);

  if (!requests.length) {
    return <EmptyState title="No requests yet" hint="Team leaders request slots from the schedule." />;
  }

  const ordered = [...requests].sort((a, b) =>
    a.status === b.status ? b.created_at.localeCompare(a.created_at) : a.status === "pending" ? -1 : 1
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resource</TableHead>
          <TableHead className="hidden md:table-cell">Team</TableHead>
          <TableHead>Slot</TableHead>
          <TableHead className="hidden lg:table-cell">Requested</TableHead>
          <TableHead>Status</TableHead>
          {canDecide && <TableHead className="w-28" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {ordered.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{request.resource_name}</span>
                <span className="max-w-prose text-xs text-muted-foreground">{request.purpose}</span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell">
              <div className="flex flex-col">
                <span>{request.team_name}</span>
                <span className="text-xs text-muted-foreground">{request.requested_by_name}</span>
              </div>
            </TableCell>
            <TableCell data-numeric>
              <div className="flex flex-col">
                <span>{slot(request.start_time, request.end_time)}</span>
                <span className="text-xs text-muted-foreground">
                  {duration(request.start_time, request.end_time)}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground">
              {relative(request.created_at)}
            </TableCell>
            <TableCell>
              <StatusDot tone={TONE[request.status]}>{request.status}</StatusDot>
            </TableCell>
            {canDecide && (
              <TableCell>
                {request.status === "pending" ? (
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: request.id, status: "approved" })}
                    >
                      <CheckIcon />
                      Approve
                    </Button>
                    <Button
                      size="icon-xs"
                      variant="ghost"
                      aria-label="Reject request"
                      disabled={decide.isPending}
                      onClick={() => decide.mutate({ id: request.id, status: "rejected" })}
                    >
                      <XIcon />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {request.decided_at ? relative(request.decided_at) : "—"}
                  </span>
                )}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
