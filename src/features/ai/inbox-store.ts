import type { AiProcessResponse, AiSummary } from "@/lib/types";

export type InboxItem = {
  id: string;
  orgId: string;
  teamId: string;
  from: string;
  to: string;
  createdAt: string;
  status: "pending" | "ready" | "error";
  result?: AiProcessResponse | AiSummary;
  error?: string;
  read: boolean;
  tasksAdded: boolean;
};

const key = (accountId: string) => `ai-inbox:${accountId}`;

const isItem = (value: unknown): value is InboxItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.orgId === "string" &&
    typeof item.teamId === "string" && typeof item.from === "string" &&
    typeof item.to === "string" && typeof item.createdAt === "string" &&
    Number.isFinite(Date.parse(item.from)) && Number.isFinite(Date.parse(item.to)) &&
    Number.isFinite(Date.parse(item.createdAt)) &&
    typeof item.read === "boolean" && typeof item.tasksAdded === "boolean" &&
    (item.status === "ready" ? typeof item.result === "object" && item.result !== null : item.status === "error");
};

export function loadInbox(accountId: string): InboxItem[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key(accountId)) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter(isItem).slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function saveInbox(accountId: string, items: InboxItem[]) {
  try {
    localStorage.setItem(key(accountId), JSON.stringify(items.filter((item) => item.status !== "pending").slice(0, 30)));
  } catch {
    // A full or disabled browser store leaves results available for this session.
  }
}
