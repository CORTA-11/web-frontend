import type { ApiResponse } from "@/lib/api/client";
import type {
  Board,
  BoardTask,
  CreateTaskInput,
  TaskStatus,
  UpdateTaskInput,
} from "@/lib/types/board";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api").replace(/\/$/, "");

function taskUrl(teamSlug: string, taskId?: number) {
  const suffix = taskId === undefined ? "" : `/${taskId}`;
  return `${API_BASE}/${encodeURIComponent(teamSlug)}/tasks${suffix}`;
}

async function requestJson<T>(
  url: string,
  init: RequestInit,
  orgId: string
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      ...(init.headers ?? {}),
      "X-Org-ID": orgId,
    },
  });

  if (response.status === 204) {
    return null as T;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed with status ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return null as T;
  }

  return (await response.json()) as T;
}

function normalizeStatus(status?: TaskStatus): TaskStatus {
  return status ?? "todo";
}

export type { BoardTask, CreateTaskInput, TaskStatus, UpdateTaskInput };

export const boardApi = {
  getBoard: async (
    teamSlug: string,
    orgId: string
  ): Promise<ApiResponse<Board>> => {
    try {
      const tasks = await requestJson<BoardTask[]>(taskUrl(teamSlug), {
        method: "GET",
      }, orgId);
      return { success: true, data: { tasks: tasks ?? [] } };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch tasks from the API.",
      };
    }
  },

  createTask: async (
    teamSlug: string,
    orgId: string,
    input: CreateTaskInput
  ): Promise<ApiResponse<BoardTask>> => {
    try {
      const task = await requestJson<BoardTask>(
        taskUrl(teamSlug),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: input.description.trim(),
            status: normalizeStatus(input.status),
          }),
        },
        orgId
      );
      return { success: true, data: task };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create task.",
      };
    }
  },

  updateTask: async (
    teamSlug: string,
    orgId: string,
    taskId: number,
    input: UpdateTaskInput
  ): Promise<ApiResponse<BoardTask>> => {
    try {
      const nextPayload = {
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.status !== undefined ? { status: normalizeStatus(input.status) } : {}),
      };

      const task = await requestJson<BoardTask>(
        taskUrl(teamSlug, taskId),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(nextPayload),
        },
        orgId
      );

      return { success: true, data: task };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update task.",
      };
    }
  },

  removeTask: async (
    teamSlug: string,
    orgId: string,
    taskId: number
  ): Promise<ApiResponse<null>> => {
    try {
      await requestJson<null>(taskUrl(teamSlug, taskId), {
        method: "DELETE",
      }, orgId);
      return { success: true, data: null };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete task.",
      };
    }
  },
};
