// lib/mock-data.ts

export type User = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "admin" | "member";
};

export type Task = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: "low" | "medium" | "high";
  dueDate: string | null; // ISO string
  tags: string[];
  createdAt: string;
};

export type Column = {
  id: string;
  title: string;
  taskIds: string[]; // order matters for drag-and-drop
};

export type Resource = {
  id: string;
  name: string;
  type: "gpu" | "sensor" | "room" | "workstation";
  location: string;
  bookings: ResourceBooking[];
};

export type ResourceBooking = {
  id: string;
  resourceId: string;
  userId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  purpose: string;
};

export const mockUsers: User[] = [
  { id: "u1", name: "Kamsan Perera", email: "kamsan@corta.dev", avatarUrl: "/avatars/u1.png", role: "admin" },
  { id: "u2", name: "Nadia Silva", email: "nadia@corta.dev", avatarUrl: "/avatars/u2.png", role: "member" },
  { id: "u3", name: "Ruwan Fernando", email: "ruwan@corta.dev", avatarUrl: "/avatars/u3.png", role: "member" },
];

export const mockColumns: Column[] = [
  { id: "col-todo", title: "To Do", taskIds: ["1", "3"] },
  { id: "col-inprogress", title: "In Progress", taskIds: ["2"] },
  { id: "col-done", title: "Done", taskIds: [] },
];

export const mockTasks: Task[] = [
  {
    id: "1",
    columnId: "col-todo",
    title: "Calibrate GPU cluster",
    description: "Run calibration script on the A100 node before next benchmark round.",
    assigneeId: "u1",
    priority: "high",
    dueDate: "2026-07-22T00:00:00.000Z",
    tags: ["hardware", "urgent"],
    createdAt: "2026-07-15T09:00:00.000Z",
  },
  {
    id: "2",
    columnId: "col-inprogress",
    title: "Draft manuscript section 3",
    description: "Methodology write-up for the privacy-preserving architecture.",
    assigneeId: "u2",
    priority: "medium",
    dueDate: "2026-07-25T00:00:00.000Z",
    tags: ["writing"],
    createdAt: "2026-07-14T11:30:00.000Z",
  },
  {
    id: "3",
    columnId: "col-todo",
    title: "Review encryption benchmark results",
    description: "Compare AES-256 overhead vs baseline for the performance report.",
    assigneeId: null,
    priority: "low",
    dueDate: null,
    tags: ["research"],
    createdAt: "2026-07-16T14:00:00.000Z",
  },
];

export const mockResources: Resource[] = [
  {
    id: "gpu-1",
    name: "NVIDIA A100",
    type: "gpu",
    location: "Lab B - Rack 2",
    bookings: [
      {
        id: "bk-1",
        resourceId: "gpu-1",
        userId: "u1",
        startTime: "2026-07-19T09:00:00.000Z",
        endTime: "2026-07-19T13:00:00.000Z",
        purpose: "Model training run",
      },
    ],
  },
  {
    id: "room-1",
    name: "Conference Room A",
    type: "room",
    location: "Level 3",
    bookings: [],
  },
];