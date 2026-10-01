"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/board/components/TaskCard";
import { cn } from "@/lib/utils";
import type { Column, Task, TeamMember } from "@/lib/types";

type Props = {
  column: Column;
  tasks: Task[];
  members: TeamMember[];
  onOpen: (task: Task) => void;
  onAdd: (columnId: string) => void;
};

export function BoardColumn({ column, tasks, members, onOpen, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className="flex w-80 shrink-0 flex-col gap-4" aria-label={column.title}>
      <header className="flex items-center justify-between border-b-3 border-border pb-4">
        <div className="flex items-baseline gap-2">
          <h2 className="text-xl font-extrabold uppercase tracking-[0.04em]">{column.title}</h2>
          <span className="data-mono text-muted-foreground" data-numeric>
            {tasks.length}
          </span>
        </div>
        <Button
          size="icon-xs"
          variant="ghost"
          aria-label={`Add task to ${column.title}`}
          onClick={() => onAdd(column.id)}
        >
          <PlusIcon />
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-4 p-0.5",
          isOver && "outline-3 outline-primary"
        )}
      >
        <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              member={members.find((member) => member.user_id === task.assignee_id)}
              onOpen={onOpen}
            />
          ))}
        </SortableContext>
        {!tasks.length && (
          <p className="px-1 py-2 text-xs text-muted-foreground">No tasks in {column.title.toLowerCase()}</p>
        )}
      </div>
    </section>
  );
}
