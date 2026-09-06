import { api } from "@/lib/http";
import { isLive } from "@/lib/env";
import type { ChatMessage } from "@/lib/types";

export type SendMessage = {
  message: string;
  reply_to_id?: string | null;
  mentions?: Array<number | string>;
};

export type DeleteMessageResult = ChatMessage | { id: string; deleted_at: string };

const liveBase = (orgId: string, teamId: string) => `/v1/orgs/${orgId}/teams/${teamId}/chat`;

export const chatApi = {
  history: (orgId: string, teamId: string, limit = 100) =>
    isLive("chat")
      ? api<{ messages: ChatMessage[] }>(`${liveBase(orgId, teamId)}/messages?limit=${limit}`)
      : api<{ messages: ChatMessage[] }>(`/teams/${teamId}/chat/messages?limit=${limit}`),

  send: (orgId: string, teamId: string, body: SendMessage) =>
    isLive("chat")
      ? api<ChatMessage>(`${liveBase(orgId, teamId)}/messages`, { method: "POST", json: body })
      : api<ChatMessage>(`/teams/${teamId}/chat/messages`, { method: "POST", json: body }),

  remove: (orgId: string, teamId: string, messageId: string) =>
    isLive("chat")
      ? api<ChatMessage>(`${liveBase(orgId, teamId)}/messages/${messageId}`, { method: "DELETE" })
      : api<DeleteMessageResult>(`/teams/${teamId}/chat/messages/${messageId}`, { method: "DELETE" }),

  socketTicket: (orgId: string, teamId: string) =>
    api<{ token: string }>(`${liveBase(orgId, teamId)}/socket-ticket`, { method: "POST" }),
};
