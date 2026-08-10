import type { ApiResponse } from "@/lib/api/client";
import { getAccessToken } from "@/lib/api/token";
import { channelIdFor, mockMessages } from "@/lib/mock/chat";
import { mockDelay } from "@/lib/mock/delay";
import {
  loadMockSessionUserId,
  userIdFromMockToken,
} from "@/lib/mock/session";
import { findAccountById } from "@/lib/mock/users";
import type { ChatMessage } from "@/lib/types/chat";

export type { ChatMessage, ChatSender } from "@/lib/types/chat";

function currentAccount() {
  const userId =
    userIdFromMockToken(getAccessToken()) ?? loadMockSessionUserId();
  return userId ? findAccountById(userId) : undefined;
}

export const chatApi = {
  list: async (
    teamPublicId: string,
    opts?: { limit?: number; before?: string }
  ): Promise<ApiResponse<ChatMessage[]>> => {
    await mockDelay();
    const channelId = channelIdFor(teamPublicId);
    let list = mockMessages
      .filter((m) => m.channelId === channelId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    if (opts?.before) {
      const pivot = list.find((m) => m.id === opts.before);
      if (pivot) {
        list = list.filter((m) => m.createdAt < pivot.createdAt);
      }
    }

    const limit = opts?.limit ?? 50;
    const slice = list.slice(-limit);
    return { success: true, data: slice.map((m) => ({ ...m })) };
  },

  send: async (
    teamPublicId: string,
    input: { message: string; replyToId?: string }
  ): Promise<ApiResponse<ChatMessage>> => {
    await mockDelay();
    const account = currentAccount();
    if (!account) return { success: false, error: "Unauthorized" };
    const text = input.message.trim();
    if (!text) return { success: false, error: "Message is required." };

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      channelId: channelIdFor(teamPublicId),
      sender: {
        id: Number(account.id),
        name: account.name,
        avatarUrl: account.avatarUrl || undefined,
      },
      replyToId: input.replyToId,
      message: text,
      createdAt: new Date().toISOString(),
    };
    mockMessages.push(msg);
    return { success: true, data: { ...msg } };
  },

  remove: async (
    teamPublicId: string,
    messageId: string
  ): Promise<ApiResponse<{ id: string; deletedAt?: string }>> => {
    await mockDelay(150);
    const channelId = channelIdFor(teamPublicId);
    const idx = mockMessages.findIndex(
      (m) => m.id === messageId && m.channelId === channelId
    );
    if (idx < 0) return { success: false, error: "Message not found." };

    const deletedAt = new Date().toISOString();
    mockMessages[idx] = {
      ...mockMessages[idx],
      message: "",
      deletedAt,
    };
    return { success: true, data: { id: messageId, deletedAt } };
  },
};
