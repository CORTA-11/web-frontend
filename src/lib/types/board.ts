export type TaskPriority = "low" | "medium" | "high";

export type BoardColumn = {
  id: string;
  title: string;
  taskIds: string[];
};

export type BoardTask = {
  id: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  priority: TaskPriority;
  dueDate: string | null;
  tags: string[];
  createdAt: string;
};

export type Board = {
  columns: BoardColumn[];
  tasks: BoardTask[];
};

export type CreateTaskInput = {
  columnId: string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  priority?: TaskPriority;
  dueDate?: string | null;
  tags?: string[];
};

export type UpdateTaskInput = Partial<
  Omit<BoardTask, "id" | "createdAt">
> & { position?: number };
