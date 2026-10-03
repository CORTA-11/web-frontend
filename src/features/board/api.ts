import { isLive } from "@/lib/env";
import { api } from "@/lib/http";
import { numericKey } from "@/features/teams/api";
import type { Board, Column, Task, TeamMember } from "@/lib/types";

export type TaskDraft = Partial<Omit<Task, "id" | "created_at">>;
export type TaskMove = TaskDraft & { position?: number };

/**
 * core-api v1 stores a task as { id, description (title), details, status, assignee_id } under
 * /orgs/{org_id}/teams/{team_id}/tasks. There is no priority or tags,
 * and a canonical status set of todo/in_progress/done. The adapter folds that
 * flat list into the board columns, maps assignees between the backend user
 * UUID and the roster numeric key, and reports the missing fields rather than
 * pretending they exist.
 */

type Status = "todo" | "in_progress" | "done";

const COLUMN_BY_STATUS: Record<Status, string> = {
  todo: "backlog",
  in_progress: "in_progress",
  done: "done",
};

const STATE_BY_COLUMN = { backlog: "todo", in_progress: "in_progress", done: "done" } as const;

type LiveTask = { id: string; description: string; details?: string; status: string; assignee_id: string | null; created_at: string; start_date?: string | null; due_date?: string | null };

/**
 * Live mode exposes only the three statuses core-api v1 can store. Review is a
 * frontend idea the backend cannot represent; offering the column and then
 * silently collapsing it into in_progress on read would read as a drag that
 * fails, so the live board omits that column.
 */
const LIVE_COLUMNS: Column[] = [
  { id: "backlog", title: "Backlog", task_ids: [] },
  { id: "in_progress", title: "In progress", task_ids: [] },
  { id: "done", title: "Done", task_ids: [] },
];

const fromLive = (task: LiveTask): Task => ({
  id: task.id,
  column_id: COLUMN_BY_STATUS[task.status as Status] ?? "backlog",
  title: task.description,
  description: task.details ?? "",
  assignee_id: task.assignee_id ? numericKey(task.assignee_id) : null,
  priority: "medium",
  start_date: task.start_date ?? null,
  due_date: task.due_date ?? null,
  tags: [],
  created_at: task.created_at,
});

/**
 * Resolves a roster numeric assignee back to the backend user UUID. undefined
 * means the field was not part of the patch (the backend keeps the current
 * assignee), null means an explicit unassign, and a numeric value is looked up
 * through the team roster. An unmatched id degrades to "keep" rather than
 * corrupting an existing assignment.
 */
const resolveAssignee = (assignee: number | null | undefined, members: TeamMember[]) => {
  if (assignee === undefined) return undefined;
  if (assignee === null) return null;
  return members.find((member) => member.user_id === assignee)?.public_id ?? undefined;
};

/**
 * Returns only the patch fields core-api understands. A pure column move
 * carries no title or description, so the task's existing description is echoed
 * back — the backend PATCH performs a full write and rejects an empty
 * description.
 */
const liveBody = (patch: TaskMove, current?: Task, members: TeamMember[] = []) => {
  const body: { description: string; details?: string; status: string; assignee_id?: string | null; start_date?: string | null; due_date?: string | null } = {
    // A pure column move carries no text, so echo the task's own text back —
    // in live mode that lives in title (fromLive maps backend description into
    // it) and the backend PATCH rejects an empty description.
    description:
      patch.title ?? current?.title ?? "",
    ...(patch.description !== undefined ? { details: patch.description } : {}),
    status: STATE_BY_COLUMN[(patch.column_id ?? current?.column_id ?? "backlog") as keyof typeof STATE_BY_COLUMN] ?? "todo",
  };
  const assignee = resolveAssignee(patch.assignee_id, members);
  if (assignee !== undefined) body.assignee_id = assignee;
  if (patch.start_date !== undefined) body.start_date = patch.start_date;
  if (patch.due_date !== undefined) body.due_date = patch.due_date;
  return body;
};

export const boardApi = {
  get: async (teamId: string, orgId: string): Promise<Board> => {
    if (!isLive("board")) return api<Board>(`/teams/${teamId}/board`);
    const page = await api<{ items: LiveTask[] }>(`/v1/orgs/${orgId}/teams/${teamId}/tasks`);
    const tasks = page.items.map(fromLive);
    return {
      columns: LIVE_COLUMNS.map((column) => ({
        ...column,
        task_ids: tasks.filter((task) => task.column_id === column.id).map((task) => task.id),
      })),
      tasks,
    };
  },

  create: (teamId: string, orgId: string, draft: TaskDraft, members: TeamMember[] = []) =>
    isLive("board")
      ? (() => {
          const assignee = resolveAssignee(draft.assignee_id, members);
          return api<LiveTask>(`/v1/orgs/${orgId}/teams/${teamId}/tasks`, {
            method: "POST",
            json: {
              description: draft.title ?? "",
              details: draft.description ?? "",
              status: "todo",
              ...(assignee !== undefined ? { assignee_id: assignee } : {}),
              ...(draft.start_date !== undefined ? { start_date: draft.start_date } : {}),
              ...(draft.due_date !== undefined ? { due_date: draft.due_date } : {}),
            },
          }).then(fromLive);
        })()
      : api<Task>(`/teams/${teamId}/board/tasks`, { method: "POST", json: draft }),

  update: (teamId: string, orgId: string, taskId: string, patch: TaskMove, current?: Task, members: TeamMember[] = []) =>
    isLive("board")
      ? api<LiveTask>(`/v1/orgs/${orgId}/teams/${teamId}/tasks/${taskId}`, {
          method: "PATCH",
          json: liveBody(patch, current, members),
        }).then(fromLive)
      : api<Task>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "PATCH", json: patch }),

  remove: (teamId: string, orgId: string, taskId: string) =>
    isLive("board")
      ? api<void>(`/v1/orgs/${orgId}/teams/${teamId}/tasks/${taskId}`, { method: "DELETE" })
      : api<void>(`/teams/${teamId}/board/tasks/${taskId}`, { method: "DELETE" }),
};
