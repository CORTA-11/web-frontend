"use client";

import { CalendarPlusIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusDot } from "@/components/common/StatusDot";
import { summariseAvailability } from "@/features/resources/availability";
import { useDeleteResource, useUpdateResource } from "@/features/resources/queries";
import type { Resource } from "@/lib/types";

type Props = {
  orgId: string;
  resources: Resource[];
  canManage: boolean;
  canRequest: boolean;
  onEdit: (resource: Resource) => void;
  onRequest: (resource: Resource) => void;
};

export function ResourceTable({ orgId, resources, canManage, canRequest, onEdit, onRequest }: Props) {
  const update = useUpdateResource(orgId);
  const remove = useDeleteResource(orgId);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Resource</TableHead>
          <TableHead className="hidden md:table-cell">Location</TableHead>
          <TableHead className="hidden lg:table-cell">Available</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-24" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {resources.map((resource) => (
          <TableRow key={resource.id}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{resource.name}</span>
                <span className="data-mono text-muted-foreground">
                  {resource.code} · {resource.kind}
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden md:table-cell text-muted-foreground">
              {resource.location || "—"}
            </TableCell>
            <TableCell className="hidden lg:table-cell text-muted-foreground" data-numeric>
              {summariseAvailability(resource.availability)}
            </TableCell>
            <TableCell>
              <StatusDot tone={resource.enabled ? "ok" : "muted"}>
                {resource.enabled ? "Bookable" : "Disabled"}
              </StatusDot>
            </TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                {canRequest && resource.enabled && (
                  <Button size="xs" variant="outline" onClick={() => onRequest(resource)}>
                    <CalendarPlusIcon />
                    Request
                  </Button>
                )}
                {canManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button size="icon-xs" variant="ghost" aria-label={`Actions for ${resource.name}`} />}
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(resource)}>
                        <PencilIcon />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => update.mutate({ id: resource.id, body: { enabled: !resource.enabled } })}
                      >
                        {resource.enabled ? "Disable" : "Enable"}
                      </DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => remove.mutate(resource.id)}>
                        <Trash2Icon />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
