"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, type SendMessage } from "@/features/chat/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { ChatMessage } from "@/lib/types";

type History = { messages: ChatMessage[] };

export const useChatHistory = (teamId: string, orgId: string) =>
  useQuery({ queryKey: qk.chat(teamId), queryFn: () => chatApi.history(teamId, orgId) });

/** Applied by both the send mutation and the socket, so ordering stays consistent. */
export function useChatCacheWriter(teamId: string) {
  const client = useQueryClient();
  return (message: ChatMessage) =>
    client.setQueryData<History>(qk.chat(teamId), (current) => {
      if (!current) return { messages: [message] };
      const existing = current.messages.findIndex((m) => m.id === message.id);
      if (existing < 0) return { messages: [...current.messages, message] };
      const messages = [...current.messages];
      messages[existing] = message;
      return { messages };
    });
}

export function useSendMessage(teamId: string, orgId: string) {
  const write = useChatCacheWriter(teamId);
  return useMutation({
    mutationFn: (body: SendMessage) => chatApi.send(teamId, orgId, body),
    onSuccess: write,
    onError: notifyError,
  });
}

export function useDeleteMessage(teamId: string, orgId: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => chatApi.remove(teamId, orgId, messageId),
    onSuccess: ({ id, deleted_at }) =>
      client.setQueryData<History>(qk.chat(teamId), (current) =>
        current
          ? { messages: current.messages.map((m) => (m.id === id ? { ...m, deleted_at } : m)) }
          : current
      ),
    onError: notifyError,
  });
}
