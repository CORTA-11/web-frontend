import { isLive } from "@/lib/env";
import { api, ApiError } from "@/lib/http";
import type { Board, Task } from "@/lib/types";

export type TaskDraft = Partial<Omit<Task, "id" | "created_at">>;
export type TaskMove = TaskDraft & { position?: number };

/**
 * core-api stores a task as { id, team_id, description } only — no status,
 * assignee, priority or dates, and no update or delete route. Live mode is
 * therefore read-plus-create; the rest reports the gap instead of failing
 * silently. Tracked in PLAN.md §10.
 */
type LiveTask = { id: number; description: string; created_at: string };

const fromLive = (task: LiveTask): Task => ({
  id: String(task.id),
  column_id: "backlog",
  title: task.description,
  description: "",
  assignee_id: null,
  priority: "medium",
  start_date: null,
  due_date: null,
  tags: [],
  created_at: task.created_at,
});

const LIVE_COLUMNS = [
  { id: "backlog", title: "Backlog" },
  { id: "in_progress", title: "In progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" },
];

const unsupported = () =>
  Promise.reject(new ApiError(501, "core-api cannot edit tasks yet — see PLAN.md §10"));

export const boardApi = {
  get: async (teamId: string, orgId: string): Promise<Board> => {
    if (!isLive("board")) return api<Board>(`/teams/${teamId}/board`);
    const tasks = (await api<LiveTask[]>(`/${teamId}/tasks`, { headers: { "X-Org-ID": orgId } })).map(fromLive);
    return {
      columns: LIVE_COLUMNS.map((column) => ({
        ...column,
        task_ids: tasks.filter((task) => task.column_id === column.id).map((task) => task.id),
      })),
      tasks,
    };
  },

  create: (teamId: string, orgId: string, draft: TaskDraft) =>
    isLive("board")
      ? api<LiveTask>(`/${teamId}/tasks`, {
          method: "POST",
          headers: { "X-Org-ID": orgId },
          json: { description: draft.title },
        }).then(fromLive)
      : api<Task>(`/teams/${teamId}/board/tasks`, { method: "POST", json: draft }),

  update: (teamId: string, taskId: string, patch: TaskMove) =>
    isLive("board")
      ? unsupported()
      : api<Task>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "PATCH", json: patch }),

  remove: (teamId: string, taskId: string) =>
    isLive("board")
      ? unsupported()
      : api<void>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "DELETE" }),
};
