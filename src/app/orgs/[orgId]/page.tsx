"use client";

import { useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { addDays, isAfter, isBefore } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";
import { Stat } from "@/features/overview/components/Stat";
import { AssignedTasks, type TeamTask } from "@/features/overview/components/AssignedTasks";
import { UpcomingBookings } from "@/features/overview/components/UpcomingBookings";
import { boardApi } from "@/features/board/api";
import Link from "next/link";
import { ArrowRightIcon, BuildingIcon } from "lucide-react";
import { useBookings, useResourceRequests, useResources } from "@/features/resources/queries";
import { useTeams } from "@/features/teams/queries";
import { useSession, useUserOrgs } from "@/features/auth/session";
import { qk } from "@/lib/query-keys";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WINDOW_DAYS = 7;

export default function OrgOverviewPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { user } = useSession();
  const teams = useTeams(orgId);
  const bookings = useBookings(orgId);
  const resources = useResources(orgId);
  const requests = useResourceRequests(orgId);

  const myTeams = teams.data?.filter((team) => team.my_role) ?? [];
  const isAdmin = can(user && { orgRole: user.org_role }, "org:manage");

  const boards = useQueries({
    queries: myTeams.map((team) => ({
      queryKey: qk.board(team.public_id),
      queryFn: () => boardApi.get(team.public_id, orgId),
    })),
  });

  const assigned: TeamTask[] = boards.flatMap((board, index) => {
    const team = myTeams[index];
    if (!board.data || !team) return [];
    return board.data.tasks
      .filter((task) => task.assignee_id === user?.id && task.column_id !== "done")
      .map((task) => ({
        ...task,
        teamName: team.name,
        teamId: team.public_id,
        columnTitle: board.data.columns.find((column) => column.id === task.column_id)?.title ?? "",
      }));
  });

  assigned.sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"));

  const horizon = addDays(new Date(), WINDOW_DAYS);
  const mine = new Set(myTeams.map((team) => team.public_id));
  const upcoming = (bookings.data ?? [])
    .filter((booking) => booking.team_public_id !== null && mine.has(booking.team_public_id))
    .filter((booking) => isAfter(new Date(booking.end_time), new Date()))
    .filter((booking) => isBefore(new Date(booking.start_time), horizon))
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const pending = requests.data?.filter((request) => request.status === "pending").length ?? 0;
  const overdue = assigned.filter((task) => task.due_date && new Date(task.due_date) < new Date()).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Overview"
        title={`Good to see you, ${user?.name.split(" ")[0] ?? ""}`.trim()}
        meta="What is on your plate across the teams you belong to."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Your teams" value={myTeams.length} />
        <Stat
          label="Assigned to you"
          value={assigned.length}
          hint={overdue ? `${overdue} past due` : "none past due"}
        />
        <Stat label="Bookings this week" value={upcoming.length} />
        {isAdmin && (
          <Stat
            label="Awaiting approval"
            value={pending}
            hint={pending ? "resource requests" : "nothing to review"}
          />
        )}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="label-eyebrow">Assigned to you</h2>
        <AssignedTasks orgId={orgId} tasks={assigned.slice(0, 8)} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="label-eyebrow">Next {WINDOW_DAYS} days</h2>
        <UpcomingBookings bookings={upcoming.slice(0, 6)} resources={resources.data ?? []} />
      </section>

      <DashboardOrgsSection orgId={orgId} />
    </div>
  );
}

function DashboardOrgsSection({ orgId }: { orgId: string }) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const { data: orgsPage, isPending, error } = useUserOrgs();

  if (!isMounted) return null;

  if (isPending) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="label-eyebrow">Your Organisations</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="p-4 flex flex-row items-center gap-4">
                <div className="size-9 bg-muted rounded animate-pulse" />
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="label-eyebrow">Your Organisations</h2>
        <div className="border border-border p-4 text-sm text-destructive bg-destructive/10">
          Failed to load organisations: {error instanceof Error ? error.message : "Unknown error"}
        </div>
      </section>
    );
  }

  const orgs = orgsPage?.items ?? [];
  if (orgs.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <h2 className="label-eyebrow">Your Organisations</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {orgs.map((org) => (
          <Card
            key={org.id}
            className={cn(
              "border-border hover:bg-muted/50 transition-colors",
              org.id === orgId && "border-primary/30 bg-muted/20"
            )}
          >
            <Link href={`/orgs/${org.id}`} className="block">
              <CardHeader className="p-4 flex flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex size-9 items-center justify-center border border-border bg-background">
                    <BuildingIcon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <CardTitle className="text-sm font-medium truncate">{org.name}</CardTitle>
                    <CardDescription className="text-xs truncate">
                      {org.id === orgId ? "Active organisation" : "Switch organisation"}
                    </CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" className="shrink-0 pointer-events-none">
                  <ArrowRightIcon className="size-4" />
                </Button>
              </CardHeader>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
