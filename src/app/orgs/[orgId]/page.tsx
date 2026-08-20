"use client";

import { useParams } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { addDays, isAfter, isBefore } from "date-fns";
import { PageHeader } from "@/components/common/PageHeader";
import { Stat } from "@/features/overview/components/Stat";
import { AssignedTasks, type TeamTask } from "@/features/overview/components/AssignedTasks";
import { UpcomingBookings } from "@/features/overview/components/UpcomingBookings";
import { boardApi } from "@/features/board/api";
import { useBookings, useResourceRequests, useResources } from "@/features/resources/queries";
import { useTeams } from "@/features/teams/queries";
import { useSession } from "@/features/auth/session";
import { qk } from "@/lib/query-keys";
import { can } from "@/lib/rbac";

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
    .filter((booking) => mine.has(booking.team_public_id))
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
    </div>
  );
}
