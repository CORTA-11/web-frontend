"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { boardApi } from "@/lib/api/board";
import { teamsApi, type Team } from "@/lib/api/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Board, BoardTask, TaskPriority } from "@/lib/types/board";

const priorityStyles: Record<TaskPriority, string> = {
  low: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  medium: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  high: "bg-rose-500/10 text-rose-700 dark:text-rose-400",
};

function formatDate(value: string | null) {
  if (!value) return "No date";
  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function TeamBoardPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const orgId = params.orgId;
  const teamId = params.teamId;

  const [team, setTeam] = useState<Team | null>(null);
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium" as TaskPriority,
  });

  const load = async () => {
    setLoading(true);
    const [teamRes, boardRes] = await Promise.all([
      teamsApi.get(teamId),
      boardApi.getBoard(teamId),
    ]);
    setLoading(false);
    if (!teamRes.success) {
      setError(teamRes.error);
      return;
    }
    if (!boardRes.success) {
      setError(boardRes.error);
      return;
    }
    setTeam(teamRes.data);
    setBoard(boardRes.data);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, [teamId]);

  const columns = useMemo(() => board?.columns ?? [], [board]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamId || !form.title.trim() || busy) return;
    setBusy(true);
    const result = await boardApi.createTask(teamId, {
      columnId: columns[0]?.id ?? "col-todo",
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setForm({ title: "", description: "", priority: "medium" });
    await load();
  };

  const moveTask = async (task: BoardTask) => {
    const columnIds = columns.map((column) => column.id);
    const currentIndex = columnIds.indexOf(task.columnId);
    const nextIndex = Math.min(currentIndex + 1, columnIds.length - 1);
    if (nextIndex === currentIndex) return;
    setBusy(true);
    const result = await boardApi.updateTask(teamId, task.id, {
      columnId: columnIds[nextIndex],
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const removeTask = async (task: BoardTask) => {
    setBusy(true);
    const result = await boardApi.removeTask(teamId, task.id);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Link
            href={`/orgs/${orgId}`}
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft className="size-4" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{team?.name ?? "Board"}</h1>
            <p className="text-sm text-zinc-500">
              Keep delivery work visible with a lightweight mock Kanban board.
            </p>
          </div>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-4" />
            Create task
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={onCreate} className="grid gap-3 md:grid-cols-[1.5fr_1fr_auto]">
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              disabled={busy}
            />
            <select
              className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.priority}
              onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value as TaskPriority }))}
              disabled={busy}
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <Button type="submit" disabled={busy || !form.title.trim()}>
              Add
            </Button>
          </form>
          <textarea
            className="min-h-20 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Brief task description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
            disabled={busy}
          />
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading board…</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {columns.map((column) => {
            const tasks = (board?.tasks ?? []).filter((task) => task.columnId === column.id);
            return (
              <div key={column.id} className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{column.title}</h2>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {tasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{task.title}</p>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${priorityStyles[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                      {task.description ? <p className="mt-2 text-sm text-zinc-500">{task.description}</p> : null}
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>{formatDate(task.dueDate)}</span>
                        <div className="flex gap-2">
                          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => moveTask(task)}>
                            Advance
                          </Button>
                          <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => removeTask(task)}>
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
