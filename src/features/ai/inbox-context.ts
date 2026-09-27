import { createContext } from "react";
import type { InboxItem } from "@/features/ai/inbox-store";

export type InboxContextValue = {
  items: InboxItem[];
  submit: (request: Pick<InboxItem, "orgId" | "teamId" | "from" | "to">) => void;
  markRead: (id: string) => void;
  markTasksAdded: (id: string) => void;
  dismiss: (id: string) => void;
};

export const AiInboxContext = createContext<InboxContextValue | null>(null);
