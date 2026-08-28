"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isPast } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { dayShort, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Task, TeamMember } from "@/lib/types";

const PRIORITY_RULE = {
  high: "border-l-danger",
  medium: "border-l-warn",
  low: "border-l-border",
};

type Props = {
  task: Task;
  member?: TeamMember;
  onOpen?: (task: Task) => void;
  dragging?: boolean;
};

export function TaskCard({ task, member, onOpen, dragging }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const overdue = task.due_date && task.column_id !== "done" && isPast(new Date(task.due_date));

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(task)}
      className={cn(
        "flex cursor-grab flex-col gap-2 border border-l-2 border-border bg-card p-2.5 text-left outline-none",
        "hover:border-primary/40 focus-visible:ring-3 focus-visible:ring-ring/50",
        PRIORITY_RULE[task.priority],
        isDragging && "opacity-40",
        dragging && "cursor-grabbing shadow-md"
      )}
    >
      <p className="text-sm leading-snug text-pretty">{task.title}</p>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        {member ? (
          <span className="flex items-center gap-1.5">
            <Avatar className="size-4">
              <AvatarFallback className="text-[9px]">{initials(member.name)}</AvatarFallback>
            </Avatar>
            {member.name.split(" ")[0]}
          </span>
        ) : (
          <span>Unassigned</span>
        )}

        {task.due_date && (
          <time
            dateTime={task.due_date}
            className={cn(overdue && "font-medium text-danger")}
            title={overdue ? "Past its due date" : undefined}
          >
            {dayShort(task.due_date)}
          </time>
        )}

        {task.tags.map((tag) => (
          <span key={tag} className="data-mono text-muted-foreground">
            #{tag}
          </span>
        ))}
      </div>
    </article>
  );
}
