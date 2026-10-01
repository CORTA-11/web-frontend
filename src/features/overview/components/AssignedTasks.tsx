"use client";

import Link from "next/link";
import { isPast } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";
import { dayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

export type TeamTask = Task & { teamName: string; teamId: string; columnTitle: string };

export function AssignedTasks({ orgId, tasks }: { orgId: string; tasks: TeamTask[] }) {
  if (!tasks.length) {
    return <EmptyState title="Nothing assigned to you" hint="Tasks you are assigned show up here." />;
  }

  return (
    <ul className="overview-list flex flex-col">
      {tasks.map((task) => {
        const overdue = task.due_date && isPast(new Date(task.due_date));
        return (
          <li key={task.id}>
            <Link
              href={`/orgs/${orgId}/teams/${task.teamId}/board`}
              className="flex items-baseline gap-3 bg-card px-3 py-2 hover:bg-muted"
            >
              <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {task.teamName} · {task.columnTitle}
              </span>
              {task.due_date && (
                <time
                  dateTime={task.due_date}
                  className={cn("data-mono shrink-0", overdue ? "font-medium text-danger" : "text-muted-foreground")}
                >
                  {dayShort(task.due_date)}
                </time>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
