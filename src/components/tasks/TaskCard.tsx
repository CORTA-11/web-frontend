"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types/api";
import { Button } from "@/components/ui/button";

type Props = {
  task: Task;
  busy: boolean;
  onUpdate: (task: Task, description: string, status: TaskStatus) => Promise<void>;
  onDelete: (task: Task) => Promise<void>;
};

const labels: Record<TaskStatus, string> = {
  todo: "To do", in_progress: "In progress", done: "Done",
};

export function TaskCard({ task, busy, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState(task.description);

  async function save() {
    const value = description.trim();
    if (!value) return;
    await onUpdate(task, value, task.status);
    setEditing(false);
  }

  return <article className="rounded-lg border bg-white p-3 shadow-sm dark:bg-slate-950">
    {editing ? <div className="space-y-2">
      <textarea aria-label="Task description" className="min-h-20 w-full rounded-md border p-2 text-sm" value={description} onChange={(event) => setDescription(event.target.value)} />
      <div className="flex gap-2"><Button size="sm" onClick={save} disabled={busy || !description.trim()}>Save</Button>
        <Button size="sm" variant="ghost" onClick={() => { setDescription(task.description); setEditing(false); }}>Cancel</Button></div>
    </div> : <button type="button" className="w-full text-left text-sm" onClick={() => setEditing(true)}>{task.description}</button>}
    <div className="mt-3 flex items-center justify-between gap-2">
      <select aria-label="Task status" value={task.status} disabled={busy}
        onChange={(event) => onUpdate(task, task.description, event.target.value as TaskStatus)}
        className="rounded-md border bg-transparent px-2 py-1 text-xs">
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <Button aria-label={`Delete ${task.description}`} variant="ghost" size="icon" disabled={busy} onClick={() => onDelete(task)}>
        <Trash2 className="size-4" />
      </Button>
    </div>
  </article>;
}
