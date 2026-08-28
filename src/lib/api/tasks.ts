import { apiRequest } from "@/lib/api/client";
import type { CursorPage, Task, TaskStatus } from "@/lib/types/api";

function base(orgId: string, teamId: string) {
  return `/orgs/${encodeURIComponent(orgId)}/teams/${encodeURIComponent(teamId)}/tasks`;
}

export type TaskWrite = { description: string; status: TaskStatus };

export const tasksApi = {
  list(orgId: string, teamId: string, cursor?: string | null) {
    const query = new URLSearchParams({ page_size: "100" });
    if (cursor) query.set("cursor", cursor);
    return apiRequest<CursorPage<Task>>(`${base(orgId, teamId)}?${query}`);
  },
  create(orgId: string, teamId: string, task: TaskWrite) {
    return apiRequest<Task>(base(orgId, teamId), {
      method: "POST", body: JSON.stringify(task),
    });
  },
  update(orgId: string, teamId: string, taskId: string, task: TaskWrite) {
    return apiRequest<Task>(`${base(orgId, teamId)}/${encodeURIComponent(taskId)}`, {
      method: "PATCH", body: JSON.stringify(task),
    });
  },
  remove(orgId: string, teamId: string, taskId: string) {
    return apiRequest<void>(`${base(orgId, teamId)}/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
    });
  },
};
