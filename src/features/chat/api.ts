import { api } from "@/lib/http";
import type { ChatMessage } from "@/lib/types";

export type SendMessage = {
  message: string;
  reply_to_id?: string | null;
  mentions?: number[];
};

export const chatApi = {
  history: (teamId: string, limit = 100) =>
    api<{ messages: ChatMessage[] }>(`/teams/${teamId}/chat/messages?limit=${limit}`),

  send: (teamId: string, body: SendMessage) =>
    api<ChatMessage>(`/teams/${teamId}/chat/messages`, { method: "POST", json: body }),

  remove: (teamId: string, messageId: string) =>
    api<{ id: string; deleted_at: string }>(`/teams/${teamId}/chat/messages/${messageId}`, {
      method: "DELETE",
    }),
};
