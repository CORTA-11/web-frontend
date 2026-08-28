export type User = { id: string; email: string; display_name: string };

export type Session = {
  id: string;
  user_agent?: string;
  created_at: string;
  last_seen_at: string;
  idle_expires_at: string;
  absolute_expires_at: string;
  revoked_at?: string | null;
  current: boolean;
};

export type AuthResponse = {
  user: User;
  session: Session;
  csrf_token: string;
};

export type OrganizationState =
  | "provisioning" | "active" | "deleting" | "deleted"
  | "restoring" | "failed";

export type Organization = {
  id: string;
  name: string;
  lifecycle_state: OrganizationState;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  my_role: "owner" | "administrator" | "member";
};

export type Team = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type Task = {
  id: string;
  description: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
};

export type CursorPage<T> = {
  items: T[];
  next_cursor: string | null;
  previous_cursor: string | null;
};

export type Violation = { field: string; code: string; message: string };
export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  request_id: string;
  violations?: Violation[];
};
