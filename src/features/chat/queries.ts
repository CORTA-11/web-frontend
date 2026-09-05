"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi, type SendMessage } from "@/features/chat/api";
import { qk } from "@/lib/query-keys";
import { notifyError } from "@/lib/query";
import type { ChatMessage } from "@/lib/types";

type History = { messages: ChatMessage[] };

export const useChatHistory = (orgId: string, teamId: string) =>
  useQuery({ queryKey: qk.chat(teamId), queryFn: () => chatApi.history(orgId, teamId) });

/** Applied by both the send mutation and the socket, so ordering stays consistent. */
export function useChatCacheWriter(teamId: string) {
  const client = useQueryClient();
  return useCallback((message: ChatMessage) =>
    client.setQueryData<History>(qk.chat(teamId), (current) => {
      if (!current) return { messages: [message] };
      const existing = current.messages.findIndex((m) => m.id === message.id);
      if (existing < 0) return { messages: [...current.messages, message] };
      const messages = [...current.messages];
      messages[existing] = message;
      return { messages };
    }), [client, teamId]);
}

export function useSendMessage(orgId: string, teamId: string) {
  const write = useChatCacheWriter(teamId);
  return useMutation({
    mutationFn: (body: SendMessage) => chatApi.send(orgId, teamId, body),
    onSuccess: write,
    onError: notifyError,
  });
}

export function useDeleteMessage(orgId: string, teamId: string) {
  const client = useQueryClient();
  const write = useChatCacheWriter(teamId);
  return useMutation({
    mutationFn: (messageId: string) => chatApi.remove(orgId, teamId, messageId),
    onSuccess: (result) => {
      if ("message" in result) {
        write(result);
        return;
      }
      client.setQueryData<History>(qk.chat(teamId), (current) =>
        current ? { messages: current.messages.map((m) => (m.id === result.id ? { ...m, deleted_at: result.deleted_at } : m)) } : current
      );
    },
    onError: notifyError,
  });
}
