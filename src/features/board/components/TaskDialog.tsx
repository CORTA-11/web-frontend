"use client";

import { useForm } from "react-hook-form";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/common/Field";
import { useCreateTask, useDeleteTask, useUpdateTask } from "@/features/board/queries";
import type { Column, Task, TeamMember } from "@/lib/types";

type Values = {
  title: string;
  description: string;
  column_id: string;
  assignee_id: string;
  priority: Task["priority"];
  start_date: string;
  due_date: string;
  tags: string;
};

const asDateInput = (value: string | null) => (value ? value.slice(0, 10) : "");
const asIso = (value: string) => (value ? new Date(`${value}T09:00:00`).toISOString() : null);


type Props = {
  teamId: string;
  orgId: string;
  columns: Column[];
  members: TeamMember[];
  task: Task | null;
  defaultColumn: string;
  onClose: () => void;
};

export function TaskDialog({ teamId, orgId, columns, members, task, defaultColumn, onClose }: Props) {
  const create = useCreateTask(teamId, orgId);
  const update = useUpdateTask(teamId);
  const remove = useDeleteTask(teamId);

  const { register, handleSubmit } = useForm<Values>({
    values: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      column_id: task?.column_id ?? defaultColumn,
      assignee_id: task?.assignee_id ? String(task.assignee_id) : "",
      priority: task?.priority ?? "medium",
      start_date: asDateInput(task?.start_date ?? null),
      due_date: asDateInput(task?.due_date ?? null),
      tags: task?.tags.join(", ") ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    const patch = {
      title: values.title.trim(),
      description: values.description,
      column_id: values.column_id,
      assignee_id: values.assignee_id ? Number(values.assignee_id) : null,
      priority: values.priority,
      start_date: asIso(values.start_date),
      due_date: asIso(values.due_date),
      tags: values.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
    };
    if (!patch.title) return;
    if (task) await update.mutateAsync({ taskId: task.id, patch });
    else await create.mutateAsync(patch);
    onClose();
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form className="flex flex-col gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{task ? "Edit task" : "New task"}</DialogTitle>
          </DialogHeader>

          <Field label="Title" htmlFor="task-title">
            <Input id="task-title" autoFocus required {...register("title")} />
          </Field>

          <Field label="Description" htmlFor="task-description">
            <Textarea id="task-description" rows={3} {...register("description")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Column" htmlFor="task-column">
              <select id="task-column" className="select-field" {...register("column_id")}>
                {columns.map((column) => (
                  <option key={column.id} value={column.id}>{column.title}</option>
                ))}
              </select>
            </Field>
            <Field label="Assignee" htmlFor="task-assignee">
              <select id="task-assignee" className="select-field" {...register("assignee_id")}>
                <option value="">Unassigned</option>
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>{member.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority" htmlFor="task-priority">
              <select id="task-priority" className="select-field" {...register("priority")}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Starts" htmlFor="task-start">
              <Input id="task-start" type="date" {...register("start_date")} />
            </Field>
            <Field label="Due" htmlFor="task-due">
              <Input id="task-due" type="date" {...register("due_date")} />
            </Field>
            <Field label="Tags" htmlFor="task-tags" hint="Comma separated">
              <Input id="task-tags" {...register("tags")} />
            </Field>
          </div>

          <DialogFooter className="justify-between">
            {task ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove.mutate(task.id, { onSuccess: onClose })}
              >
                <Trash2Icon />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" size="sm" disabled={create.isPending || update.isPending}>
                {task ? "Save task" : "Create task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
