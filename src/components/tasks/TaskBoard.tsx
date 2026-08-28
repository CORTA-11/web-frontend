"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { tasksApi } from "@/lib/api/tasks";
import { problemMessage } from "@/lib/api/client";
import type { CursorPage, Task, TaskStatus } from "@/lib/types/api";
import { TaskCard } from "@/components/tasks/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const statuses: { value: TaskStatus; label: string }[] = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];
const emptyPage: CursorPage<Task> = { items: [], next_cursor: null, previous_cursor: null };

export function TaskBoard() {
  const { orgId, teamId } = useParams<{ orgId: string; teamId: string }>();
  const [page, setPage] = useState(emptyPage);
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    try { setPage(await tasksApi.list(orgId, teamId, cursor)); setError(null); }
    catch (reason) { setError(problemMessage(reason)); }
    finally { setLoading(false); }
  }, [orgId, teamId]);

  useEffect(() => {
    void tasksApi.list(orgId, teamId).then((result) => {
      setPage(result);
      setError(null);
    }).catch((reason) => setError(problemMessage(reason)))
      .finally(() => setLoading(false));
  }, [orgId, teamId]);

  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    try { await action(); await load(); }
    catch (reason) { setError(problemMessage(reason)); }
    finally { setBusy(false); }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    const value = description.trim();
    if (!value) return;
    await mutate(() => tasksApi.create(orgId, teamId, { description: value, status: "todo" }));
    setDescription("");
  }

  function update(task: Task, nextDescription: string, status: TaskStatus) {
    return mutate(() => tasksApi.update(orgId, teamId, task.id, {
      description: nextDescription, status,
    }));
  }

  function remove(task: Task) {
    return mutate(() => tasksApi.remove(orgId, teamId, task.id));
  }

  return <div className="mx-auto w-full max-w-6xl space-y-6">
    <header><Link href={`/orgs/${orgId}`} className="text-sm text-zinc-500 hover:text-zinc-900">← Teams</Link>
      <h1 className="mt-2 text-2xl font-semibold">Task board</h1>
      <p className="text-sm text-zinc-500">Tasks are stored by the core API.</p></header>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <form onSubmit={create} className="flex gap-2 rounded-xl border bg-white p-4 dark:bg-slate-900">
      <Input aria-label="New task description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the task" disabled={busy} />
      <Button type="submit" disabled={busy || !description.trim()}>Add task</Button>
    </form>
    {loading ? <p className="text-sm text-zinc-500">Loading tasks…</p> :
      <div className="grid gap-4 lg:grid-cols-3">{statuses.map((status) => {
        const tasks = page.items.filter((task) => task.status === status.value);
        return <section key={status.value} className="rounded-xl border bg-zinc-50 p-3 dark:bg-slate-900/60">
          <div className="mb-3 flex justify-between"><h2 className="font-medium">{status.label}</h2><span className="text-sm text-zinc-500">{tasks.length}</span></div>
          <div className="space-y-2">{tasks.map((task) => <TaskCard key={task.id} task={task} busy={busy} onUpdate={update} onDelete={remove} />)}</div>
        </section>;
      })}</div>}
    <div className="flex justify-between">
      <Button variant="outline" disabled={!page.previous_cursor || loading} onClick={() => load(page.previous_cursor)}>Previous</Button>
      <Button variant="outline" disabled={!page.next_cursor || loading} onClick={() => load(page.next_cursor)}>Next</Button>
    </div>
  </div>;
}
