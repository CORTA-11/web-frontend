"use client";

import Link from "next/link";
import { isPast } from "date-fns";
import { EmptyState } from "@/components/common/EmptyState";
import { dayShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

const PRIORITY_RULE = { high: "border-l-danger", medium: "border-l-warn", low: "border-l-border" };

export type TeamTask = Task & { teamName: string; teamId: string; columnTitle: string };

export function AssignedTasks({ orgId, tasks }: { orgId: string; tasks: TeamTask[] }) {
  if (!tasks.length) {
    return <EmptyState title="Nothing assigned to you" hint="Tasks you are assigned show up here." />;
  }

  return (
    <ul className="flex flex-col gap-px">
      {tasks.map((task) => {
        const overdue = task.due_date && isPast(new Date(task.due_date));
        return (
          <li key={task.id}>
            <Link
              href={`/orgs/${orgId}/teams/${task.teamId}/board`}
              className={cn(
                "flex items-baseline gap-3 border-l-2 bg-card px-3 py-2 hover:bg-muted",
                PRIORITY_RULE[task.priority]
              )}
            >
              <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
              <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                {task.teamName} · {task.columnTitle}
              </span>
              {task.due_date && (
                <time
                  dateTime={task.due_date}
                  className={cn("shrink-0 text-xs", overdue ? "font-medium text-danger" : "text-muted-foreground")}
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
