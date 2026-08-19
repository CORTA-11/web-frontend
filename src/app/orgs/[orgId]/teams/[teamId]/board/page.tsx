"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { boardApi, type BoardTask, type TaskStatus } from "@/lib/api/board";
import { teamsApi, type Team } from "@/lib/api/teams";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];

const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

const statusColors: Record<TaskStatus, string> = {
  todo: "bg-slate-500/10 text-slate-700 dark:text-slate-300",
  in_progress: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
};

export default function TeamBoardPage() {
  const params = useParams<{ orgId: string; teamId: string }>();
  const orgId = params.orgId ?? "";
  const teamId = params.teamId ?? "";
  const apiOrgId = process.env.NEXT_PUBLIC_API_ORG_ID ?? orgId;
  const apiTeamSlug = process.env.NEXT_PUBLIC_API_TEAM_SLUG ?? teamId;

  const [team, setTeam] = useState<Team | null>(null);
  const [tasks, setTasks] = useState<BoardTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    description: "",
    status: "todo" as TaskStatus,
  });

  const load = async () => {
    if (!apiOrgId || !apiTeamSlug) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [teamRes, boardRes] = await Promise.all([
      teamsApi.get(teamId),
      boardApi.getBoard(apiTeamSlug, apiOrgId),
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
    setTasks(boardRes.data.tasks);
    setError(null);
  };

  useEffect(() => {
    void load();
  }, [apiOrgId, apiTeamSlug, teamId]);

  const columns = useMemo(
    () => ({
      todo: tasks.filter((task) => task.status === "todo"),
      in_progress: tasks.filter((task) => task.status === "in_progress"),
      done: tasks.filter((task) => task.status === "done"),
    }),
    [tasks]
  );

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!apiOrgId || !apiTeamSlug || !form.description.trim() || busy) return;

    setBusy(true);
    const result = await boardApi.createTask(apiTeamSlug, apiOrgId, {
      description: form.description.trim(),
      status: form.status,
    });
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setForm({ description: "", status: "todo" });
    setTasks((current) => [...current, result.data]);
    setError(null);
  };

  const moveTask = async (task: BoardTask) => {
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[Math.min(currentIndex + 1, statusOrder.length - 1)];

    if (nextStatus === task.status) return;

    setBusy(true);
    const result = await boardApi.updateTask(apiTeamSlug, apiOrgId, task.id, {
      description: task.description,
      status: nextStatus,
    });
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTasks((current) =>
      current.map((item) => (item.id === task.id ? result.data : item))
    );
    setError(null);
  };

  const removeTask = async (task: BoardTask) => {
    setBusy(true);
    const result = await boardApi.removeTask(apiTeamSlug, apiOrgId, task.id);
    setBusy(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setTasks((current) => current.filter((item) => item.id !== task.id));
    setError(null);
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
            <h1 className="text-2xl font-semibold tracking-tight">
              {team?.name ?? "Team board"}
            </h1>
            <p className="text-sm text-zinc-500">
              Keep delivery work visible with the shared team task board.
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
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="Task description"
              disabled={busy}
            />
            <select
              className="h-10 rounded-lg border border-input bg-transparent px-2.5 text-sm"
              value={form.status}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  status: event.target.value as TaskStatus,
                }))
              }
              disabled={busy}
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <Button type="submit" disabled={busy || !form.description.trim()}>
              Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading board…</p>
      ) : (
        <div className="grid gap-4 xl:grid-cols-3">
          {statusOrder.map((status) => {
            const statusTasks = columns[status];
            return (
              <div
                key={status}
                className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold">{statusLabels[status]}</h2>
                  <span className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {statusTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {statusTasks.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700">
                      No tasks yet.
                    </p>
                  ) : null}
                  {statusTasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{task.description}</p>
                        <span className={`rounded-full px-2 py-1 text-[11px] ${statusColors[task.status]}`}>
                          {statusLabels[task.status]}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2 text-xs text-zinc-500">
                        <span>{new Date(task.updated_at).toLocaleDateString()}</span>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy || status === "done"}
                            onClick={() => moveTask(task)}
                          >
                            Advance
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => removeTask(task)}
                          >
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
