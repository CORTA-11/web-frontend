import type { ApiResponse } from "@/lib/api/client";
import { mockColumns, mockTasks } from "@/lib/mock/board";
import { mockDelay } from "@/lib/mock/delay";
import type {
  Board,
  BoardTask,
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/types/board";

// In-memory copy so create/move feel stateful during UI work.
let columns = mockColumns.map((c) => ({ ...c, taskIds: [...c.taskIds] }));
let tasks = mockTasks.map((t) => ({ ...t }));

export const boardApi = {
  getBoard: async (_teamPublicId: string): Promise<ApiResponse<Board>> => {
    await mockDelay();
    return {
      success: true,
      data: {
        columns: columns.map((c) => ({ ...c, taskIds: [...c.taskIds] })),
        tasks: tasks.map((t) => ({ ...t })),
      },
    };
  },

  createTask: async (
    _teamPublicId: string,
    input: CreateTaskInput
  ): Promise<ApiResponse<BoardTask>> => {
    await mockDelay();
    const task: BoardTask = {
      id: crypto.randomUUID(),
      columnId: input.columnId,
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      assigneeId: input.assigneeId ?? null,
      priority: input.priority ?? "medium",
      dueDate: input.dueDate ?? null,
      tags: input.tags ?? [],
      createdAt: new Date().toISOString(),
    };
    tasks = [...tasks, task];
    columns = columns.map((c) =>
      c.id === task.columnId
        ? { ...c, taskIds: [...c.taskIds, task.id] }
        : c
    );
    return { success: true, data: task };
  },

  updateTask: async (
    _teamPublicId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<ApiResponse<BoardTask>> => {
    await mockDelay(150);
    const existing = tasks.find((t) => t.id === taskId);
    if (!existing) {
      return { success: false, error: "Task not found." };
    }

    const next: BoardTask = {
      ...existing,
      ...input,
      id: existing.id,
      createdAt: existing.createdAt,
    };

    if (input.columnId && input.columnId !== existing.columnId) {
      columns = columns.map((c) => {
        if (c.id === existing.columnId) {
          return { ...c, taskIds: c.taskIds.filter((id) => id !== taskId) };
        }
        if (c.id === input.columnId) {
          return { ...c, taskIds: [...c.taskIds, taskId] };
        }
        return c;
      });
    }

    tasks = tasks.map((t) => (t.id === taskId ? next : t));
    return { success: true, data: next };
  },

  removeTask: async (
    _teamPublicId: string,
    taskId: string
  ): Promise<ApiResponse<null>> => {
    await mockDelay(150);
    tasks = tasks.filter((t) => t.id !== taskId);
    columns = columns.map((c) => ({
      ...c,
      taskIds: c.taskIds.filter((id) => id !== taskId),
    }));
    return { success: true, data: null };
  },
};
