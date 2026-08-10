import { apiFetch, type ApiResponse } from "@/lib/api/client";

export type ChatSender = {
  id: number;
  name: string;
  avatarUrl?: string;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  sender: ChatSender;
  replyToId?: string;
  message: string;
  createdAt: string;
  deletedAt?: string;
};

type BackendSender = {
  id: number;
  name: string;
  avatar_url?: string;
};

type BackendMessage = {
  id: string;
  channel_id: string;
  sender: BackendSender;
  reply_to_id?: string;
  message: string;
  created_at: string;
  deleted_at?: string;
};

type BackendList = {
  messages: BackendMessage[];
};

function mapMessage(msg: BackendMessage): ChatMessage {
  return {
    id: msg.id,
    channelId: msg.channel_id,
    sender: {
      id: msg.sender.id,
      name: msg.sender.name,
      avatarUrl: msg.sender.avatar_url,
    },
    replyToId: msg.reply_to_id,
    message: msg.message,
    createdAt: msg.created_at,
    deletedAt: msg.deleted_at,
  };
}

export const chatApi = {
  list: async (
    teamPublicId: string,
    opts?: { limit?: number; before?: string }
  ): Promise<ApiResponse<ChatMessage[]>> => {
    const params = new URLSearchParams();
    if (opts?.limit) params.set("limit", String(opts.limit));
    if (opts?.before) params.set("before", opts.before);
    const qs = params.toString();
    const path = `/teams/${teamPublicId}/chat/messages${qs ? `?${qs}` : ""}`;
    const result = await apiFetch<BackendList>(path);
    if (!result.success) return result;
    return { success: true, data: result.data.messages.map(mapMessage) };
  },

  send: async (
    teamPublicId: string,
    input: { message: string; replyToId?: string }
  ): Promise<ApiResponse<ChatMessage>> => {
    const result = await apiFetch<BackendMessage>(
      `/teams/${teamPublicId}/chat/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          message: input.message,
          reply_to_id: input.replyToId,
        }),
      }
    );
    if (!result.success) return result;
    return { success: true, data: mapMessage(result.data) };
  },

  remove: async (
    teamPublicId: string,
    messageId: string
  ): Promise<ApiResponse<{ id: string; deletedAt?: string }>> => {
    const result = await apiFetch<{
      id: string;
      channel_id: string;
      deleted_at?: string;
    }>(`/teams/${teamPublicId}/chat/messages/${messageId}`, {
      method: "DELETE",
    });
    if (!result.success) return result;
    return {
      success: true,
      data: { id: result.data.id, deletedAt: result.data.deleted_at },
    };
  },
};
