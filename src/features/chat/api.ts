import { api } from "@/lib/http";
import type { ChatMessage } from "@/lib/types";

export type SendMessage = {
  message: string;
  reply_to_id?: string | null;
  /** User UUIDs in live mode (ms: numeric ids in mock mode). */
  mentions?: Array<string | number>;
};

const scoped = (orgId: string, teamId: string) =>
  `/v1/orgs/${orgId}/teams/${teamId}/chat/messages`;

export const chatApi = {
  history: (teamId: string, orgId: string, limit = 100) =>
    api<{ messages: ChatMessage[] }>(`${scoped(orgId, teamId)}?limit=${limit}`),

  send: (teamId: string, orgId: string, body: SendMessage) =>
    api<ChatMessage>(scoped(orgId, teamId), { method: "POST", json: body }),

  remove: (teamId: string, orgId: string, messageId: string) =>
    api<{ id: string; deleted_at: string }>(`${scoped(orgId, teamId)}/${messageId}`, {
      method: "DELETE",
    }),

  socketTicket: (orgId: string, teamId: string) =>
    api<{ token: string }>(`/v1/orgs/${orgId}/teams/${teamId}/chat/socket-ticket`, {
      method: "POST",
    }),
};