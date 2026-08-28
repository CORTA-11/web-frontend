import { isLive } from "@/lib/env";
import { api } from "@/lib/http";
import type { Board, Column, Task } from "@/lib/types";

export type TaskDraft = Partial<Omit<Task, "id" | "created_at">>;
export type TaskMove = TaskDraft & { position?: number };

/**
 * core-api v1 stores a task as { id, description, status } under
 * /orgs/{org_id}/teams/{team_id}/tasks. There is no assignee, priority, due
 * date or tags, and a canonical status set of todo/in_progress/done. The
 * adapter folds that flat list into the board columns and reports the missing
 * fields rather than pretending they exist.
 */

type Status = "todo" | "in_progress" | "done";

const COLUMN_BY_STATUS: Record<Status, string> = {
  todo: "backlog",
  in_progress: "in_progress",
  done: "done",
};

const STATE_BY_COLUMN = { backlog: "todo", in_progress: "in_progress", review: "in_progress", done: "done" } as const;

type LiveTask = { id: string; description: string; status: string; created_at: string };

const COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", task_ids: [] },
  { id: "in_progress", title: "In progress", task_ids: [] },
  { id: "review", title: "Review", task_ids: [] },
  { id: "done", title: "Done", task_ids: [] },
];

const fromLive = (task: LiveTask): Task => ({
  id: task.id,
  column_id: COLUMN_BY_STATUS[task.status as Status] ?? "backlog",
  title: task.description,
  description: "",
  assignee_id: null,
  priority: "medium",
  start_date: null,
  due_date: null,
  tags: [],
  created_at: task.created_at,
});

/** Returns only the patch fields core-api understands. */
const liveBody = (patch: TaskMove) =>
  patch.column_id
    ? { description: patch.title ?? patch.description, status: STATE_BY_COLUMN[patch.column_id as keyof typeof STATE_BY_COLUMN] ?? "todo" }
    : { description: patch.title ?? patch.description, status: "todo" };

export const boardApi = {
  get: async (teamId: string, orgId: string): Promise<Board> => {
    if (!isLive("board")) return api<Board>(`/teams/${teamId}/board`);
    const page = await api<{ items: LiveTask[] }>(`/v1/orgs/${orgId}/teams/${teamId}/tasks`);
    const tasks = page.items.map(fromLive);
    return {
      columns: COLUMNS.map((column) => ({
        ...column,
        task_ids: tasks.filter((task) => task.column_id === column.id).map((task) => task.id),
      })),
      tasks,
    };
  },

  create: (teamId: string, orgId: string, draft: TaskDraft) =>
    isLive("board")
      ? api<LiveTask>(`/v1/orgs/${orgId}/teams/${teamId}/tasks`, {
          method: "POST",
          json: { description: draft.title ?? draft.description ?? "", status: "todo" },
        }).then(fromLive)
      : api<Task>(`/teams/${teamId}/board/tasks`, { method: "POST", json: draft }),

  update: (teamId: string, orgId: string, taskId: string, patch: TaskMove) =>
    isLive("board")
      ? api<LiveTask>(`/v1/orgs/${orgId}/teams/${teamId}/tasks/${taskId}`, {
          method: "PATCH",
          json: liveBody(patch),
        }).then(fromLive)
      : api<Task>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "PATCH", json: patch }),

  remove: (teamId: string, orgId: string, taskId: string) =>
    isLive("board")
      ? api<void>(`/v1/orgs/${orgId}/teams/${teamId}/tasks/${taskId}`, { method: "DELETE" })
      : api<void>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "DELETE" }),
};
