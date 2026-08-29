"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateTask } from "@/features/board/queries";
import { dayShort } from "@/lib/format";
import type { ExtractedTask, TeamMember } from "@/lib/types";


type Props = {
  teamId: string;
  orgId: string;
  members: TeamMember[];
  tasks: ExtractedTask[];
  onAdded: () => void;
};

/** Suggestions stay editable until someone accepts them — SRS 3.1.9.3. */
export function ExtractedTasks({ teamId, orgId, members, tasks, onAdded }: Props) {
  const [draft, setDraft] = useState(tasks);
  const [chosen, setChosen] = useState(() => new Set(tasks.map((_, index) => index)));
  const create = useCreateTask(teamId, orgId, members);

  const patch = (index: number, changes: Partial<ExtractedTask>) =>
    setDraft((current) => current.map((task, at) => (at === index ? { ...task, ...changes } : task)));

  const add = async () => {
    const picked = draft.filter((_, index) => chosen.has(index));
    for (const task of picked) {
      await create.mutateAsync({ ...task, column_id: "backlog", tags: ["from-chat"] });
    }
    onAdded();
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="label-eyebrow">Suggested tasks</p>
      <ul className="flex flex-col divide-y divide-border border border-border">
        {draft.map((task, index) => (
          <li key={index} className="flex items-start gap-2.5 p-2.5">
            <Checkbox
              className="mt-0.5"
              checked={chosen.has(index)}
              aria-label={`Include ${task.title}`}
              onCheckedChange={(checked) =>
                setChosen((current) => {
                  const next = new Set(current);
                  if (checked) next.add(index);
                  else next.delete(index);
                  return next;
                })
              }
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <p className="text-sm">{task.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Assignee"
                  className="select-field select-field-sm w-auto"
                  value={task.assignee_id ?? ""}
                  onChange={(event) =>
                    patch(index, { assignee_id: event.target.value ? Number(event.target.value) : null })
                  }
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>{member.name}</option>
                  ))}
                </select>
                <select
                  aria-label="Priority"
                  className="select-field select-field-sm w-auto"
                  value={task.priority}
                  onChange={(event) => patch(index, { priority: event.target.value as ExtractedTask["priority"] })}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {task.due_date && (
                  <span className="data-mono text-muted-foreground">due {dayShort(task.due_date)}</span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <Button size="sm" disabled={!chosen.size || create.isPending} onClick={add}>
        Add {chosen.size} to the board
      </Button>
    </div>
  );
}
