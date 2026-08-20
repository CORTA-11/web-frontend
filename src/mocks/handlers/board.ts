import { HttpResponse } from "msw";
import { teamRoute } from "@/mocks/guard";
import { db, now, uid } from "@/mocks/db";
import { columns } from "@/mocks/seed";
import type { Task } from "@/lib/types";

const boardOf = (teamId: string) => (db.tasks[teamId] ??= []);

const shape = (teamId: string) => {
  const tasks = boardOf(teamId);
  return {
    columns: columns.map((column) => ({
      ...column,
      task_ids: tasks.filter((t) => t.column_id === column.id).map((t) => t.id),
    })),
    tasks,
  };
};

export const boardHandlers = [
  teamRoute.get("/api/teams/:teamId/board", ({ params }) =>
    HttpResponse.json(shape(String(params.teamId)))
  ),

  teamRoute.post("/api/teams/:teamId/board/tasks", async ({ request, params }) => {
    const teamId = String(params.teamId);
    const body = (await request.json()) as Partial<Task>;
    const task: Task = {
      id: uid("t"),
      column_id: body.column_id ?? "backlog",
      title: (body.title ?? "").trim(),
      description: body.description ?? "",
      assignee_id: body.assignee_id ?? null,
      priority: body.priority ?? "medium",
      start_date: body.start_date ?? null,
      due_date: body.due_date ?? null,
      tags: body.tags ?? [],
      created_at: now(),
    };
    if (!task.title) return new HttpResponse("A task needs a title", { status: 400 });
    boardOf(teamId).push(task);
    return HttpResponse.json(task, { status: 201 });
  }),

  teamRoute.patch("/api/teams/:teamId/board/tasks/:taskId", async ({ request, params }) => {
    const tasks = boardOf(String(params.teamId));
    const index = tasks.findIndex((t) => t.id === params.taskId);
    if (index < 0) return new HttpResponse("Task not found", { status: 404 });

    const body = (await request.json()) as Partial<Task> & { position?: number };
    const { position, ...fields } = body;
    const task = { ...tasks[index], ...fields };
    tasks.splice(index, 1);

    if (position === undefined) {
      tasks.push(task);
    } else {
      const siblings = tasks.filter((t) => t.column_id === task.column_id);
      const anchor = siblings[Math.min(position, siblings.length - 1)];
      const target = anchor ? tasks.indexOf(anchor) + (position >= siblings.length ? 1 : 0) : tasks.length;
      tasks.splice(target, 0, task);
    }
    return HttpResponse.json(task);
  }),

  teamRoute.delete("/api/teams/:teamId/board/tasks/:taskId", ({ params }) => {
    const tasks = boardOf(String(params.teamId));
    const index = tasks.findIndex((t) => t.id === params.taskId);
    if (index < 0) return new HttpResponse("Task not found", { status: 404 });
    tasks.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
