export type User = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: "admin" | "member";
};
