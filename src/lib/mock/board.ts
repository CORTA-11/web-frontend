import type { BoardColumn, BoardTask } from "@/lib/types/board";

export const mockColumns: BoardColumn[] = [
  { id: "col-todo", title: "To Do", taskIds: ["task-1", "task-3"] },
  { id: "col-inprogress", title: "In Progress", taskIds: ["task-2"] },
  { id: "col-done", title: "Done", taskIds: [] },
];

export const mockTasks: BoardTask[] = [
  {
    id: "task-1",
    columnId: "col-todo",
    title: "Calibrate GPU cluster",
    description:
      "Run calibration script on the A100 node before next benchmark round.",
    assigneeId: "1",
    priority: "high",
    dueDate: "2026-08-15T00:00:00.000Z",
    tags: ["hardware", "urgent"],
    createdAt: "2026-08-01T09:00:00.000Z",
  },
  {
    id: "task-2",
    columnId: "col-inprogress",
    title: "Draft manuscript section 3",
    description:
      "Methodology write-up for the privacy-preserving architecture.",
    assigneeId: "2",
    priority: "medium",
    dueDate: "2026-08-20T00:00:00.000Z",
    tags: ["writing"],
    createdAt: "2026-07-28T11:30:00.000Z",
  },
  {
    id: "task-3",
    columnId: "col-todo",
    title: "Review encryption benchmark results",
    description:
      "Compare AES-256 overhead vs baseline for the performance report.",
    assigneeId: null,
    priority: "low",
    dueDate: null,
    tags: ["research"],
    createdAt: "2026-08-05T14:00:00.000Z",
  },
];
