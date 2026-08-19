export type TaskStatus = "todo" | "in_progress" | "done";

export type BoardTask = {
  id: number;
  team_id: number;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type Board = {
  tasks: BoardTask[];
};

export type CreateTaskInput = {
  description: string;
  status?: TaskStatus;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;
