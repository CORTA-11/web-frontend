"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { ResourceDialog } from "@/features/resources/components/ResourceDialog";
import { ResourceTable } from "@/features/resources/components/ResourceTable";
import { RequestSlotDialog } from "@/features/resources/components/RequestSlotDialog";
import { RequestsTable } from "@/features/resources/components/RequestsTable";
import { ScheduleCalendar } from "@/features/resources/components/ScheduleCalendar";
import { useBookings, useResourceRequests, useResources } from "@/features/resources/queries";
import { useTeams } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { can } from "@/lib/rbac";
import type { Resource } from "@/lib/types";

type Requesting = { resource: Resource; initial?: { start: Date; end: Date } };

export default function ResourcesPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useSession();
  const resources = useResources(orgId);
  const bookings = useBookings(orgId);
  const requests = useResourceRequests(orgId);
  const teams = useTeams(orgId);

  const [editing, setEditing] = useState<Resource | "new" | null>(null);
  const [requesting, setRequesting] = useState<Requesting | null>(null);

  const canManage = can(user && { orgRole: user.org_role }, "resource:manage");
  const ledTeams = teams.data?.filter((team) => team.my_role === "TEAM_LEADER") ?? [];
  const pending = requests.data?.filter((request) => request.status === "pending").length ?? 0;

  const openRequest = (resource: Resource, initial?: { start: Date; end: Date }) =>
    setRequesting({ resource, initial });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Organisation"
        title="Resources"
        meta="Shared instruments, compute and rooms. Slots are held only once an admin approves them."
        actions={
          canManage ? (
            <Button size="sm" onClick={() => setEditing("new")}>
              <PlusIcon />
              Add resource
            </Button>
          ) : null
        }
      />

      <Tabs defaultValue="schedule">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {pending > 0 && (
              <span className="ml-1.5 data-mono text-warn" data-numeric>{pending}</span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="pt-4">
          <QueryBoundary query={bookings} rows={6}>
            {(data) => (
              <ScheduleCalendar
                resources={resources.data ?? []}
                bookings={data}
                onPickSlot={
                  ledTeams.length
                    ? (picked) => {
                        const resource = resources.data?.find((item) => item.id === picked.resourceId);
                        if (resource) openRequest(resource, { start: picked.start, end: picked.end });
                      }
                    : undefined
                }
              />
            )}
          </QueryBoundary>
        </TabsContent>

        <TabsContent value="inventory" className="pt-4">
          <QueryBoundary query={resources} rows={5}>
            {(data) => (
              <ResourceTable
                orgId={orgId}
                resources={data}
                canManage={canManage}
                canRequest={ledTeams.length > 0}
                onEdit={setEditing}
                onRequest={(resource) => openRequest(resource)}
              />
            )}
          </QueryBoundary>
        </TabsContent>

        <TabsContent value="requests" className="pt-4">
          <QueryBoundary query={requests} rows={4}>
            {(data) => <RequestsTable orgId={orgId} requests={data} canDecide={canManage} />}
          </QueryBoundary>
        </TabsContent>
      </Tabs>

      {editing && (
        <ResourceDialog
          orgId={orgId}
          resource={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      {requesting && (
        <RequestSlotDialog
          orgId={orgId}
          resource={requesting.resource}
          teams={ledTeams}
          bookings={bookings.data ?? []}
          initial={requesting.initial}
          onClose={() => setRequesting(null)}
        />
      )}
    </div>
  );
}
