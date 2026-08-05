// lib/api.ts
import { mockColumns, mockTasks, mockResources, mockUsers, Task, ResourceBooking } from "./mock-data";

// Simulates network latency so loading states actually get exercised
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

// Matches the shape your real API_Contract.md defines — every response
// is { success, data } or { success: false, error }, so components never
// need to change when you swap mocks for axios calls.
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

export const api = {
  // ---- Kanban ----
  getBoard: async (): Promise<ApiResponse<{ columns: typeof mockColumns; tasks: Task[] }>> => {
    await delay();
    return {
      success: true,
      data: {
        columns: mockColumns,
        tasks: mockTasks,
      },
    };
  },

  moveTask: async (
    taskId: string,
    fromColumnId: string,
    toColumnId: string
  ): Promise<ApiResponse<{ taskId: string; toColumnId: string }>> => {
    await delay(150);
    // Real implementation will PATCH the task's columnId server-side.
    return {
      success: true,
      data: { taskId, toColumnId },
    };
  },

  createTask: async (task: Omit<Task, "id" | "createdAt">): Promise<ApiResponse<Task>> => {
    await delay();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    return { success: true, data: newTask };
  },

  // ---- Resources ----
  getResources: async (): Promise<ApiResponse<typeof mockResources>> => {
    await delay();
    return { success: true, data: mockResources };
  },

  bookResource: async (
    booking: Omit<ResourceBooking, "id">
  ): Promise<ApiResponse<ResourceBooking>> => {
    await delay();
    // Real implementation enforces the resource-locking algorithm server-side
    // (reject overlapping bookings). Mock just echoes back success.
    const newBooking: ResourceBooking = {
      ...booking,
      id: crypto.randomUUID(),
    };
    return { success: true, data: newBooking };
  },

  // ---- Users / Auth ----
  getCurrentUser: async (): Promise<ApiResponse<(typeof mockUsers)[number]>> => {
    await delay(100);
    return { success: true, data: mockUsers[0] };
  },

  getTeamMembers: async (): Promise<ApiResponse<typeof mockUsers>> => {
    await delay();
    return { success: true, data: mockUsers };
  },
};