import { api } from "@/lib/http";
import { isLive } from "@/lib/env";
import type { ChatMessage } from "@/lib/types";
import { numericKey } from "@/features/teams/api";

export type SendMessage = {
  message: string;
  reply_to_id?: string | null;
  mentions?: Array<number | string>;
};

type LiveChatMessage = {
  id: string;
  team_id: string;
  sender: { id: string; name: string; avatar?: string | null };
  reply_to_id?: string | null;
  mentions?: string[];
  message: string;
  created_at: string;
  deleted_at?: string | null;
};

const fromLive = (message: LiveChatMessage): ChatMessage => ({
  id: message.id,
  channel_id: message.team_id,
  sender: {
    id: numericKey(message.sender.id),
    name: message.sender.name,
    avatar_url: message.sender.avatar ?? undefined,
  },
  reply_to_id: message.reply_to_id ?? null,
  mentions: message.mentions?.map(numericKey) ?? [],
  message: message.message,
  created_at: message.created_at,
  deleted_at: message.deleted_at ?? null,
});

const liveBase = (orgId: string, teamId: string) => `/v1/orgs/${orgId}/teams/${teamId}/chat`;

export const chatApi = {
  history: (orgId: string, teamId: string, limit = 100) =>
    isLive("chat")
      ? api<{ messages: LiveChatMessage[] }>(`${liveBase(orgId, teamId)}/messages?limit=${limit}`).then((page) => ({
          messages: page.messages.map(fromLive),
        }))
      : api<{ messages: ChatMessage[] }>(`/teams/${teamId}/chat/messages?limit=${limit}`),

  send: (orgId: string, teamId: string, body: SendMessage) =>
    isLive("chat")
      ? api<LiveChatMessage>(`${liveBase(orgId, teamId)}/messages`, { method: "POST", json: body }).then(fromLive)
      : api<ChatMessage>(`/teams/${teamId}/chat/messages`, { method: "POST", json: body }),

  remove: (orgId: string, teamId: string, messageId: string) =>
    isLive("chat")
      ? api<LiveChatMessage>(`${liveBase(orgId, teamId)}/messages/${messageId}`, { method: "DELETE" }).then(fromLive)
      : api<{ id: string; deleted_at: string }>(`/teams/${teamId}/chat/messages/${messageId}`, { method: "DELETE" }),

  socketTicket: (orgId: string, teamId: string) =>
    api<{ token: string }>(`${liveBase(orgId, teamId)}/socket-ticket`, { method: "POST" }),
};
