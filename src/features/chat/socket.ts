"use client";

import { useEffect } from "react";
import { WS_URL } from "@/lib/env";
import type { ChatMessage } from "@/lib/types";
import { useChatCacheWriter } from "@/features/chat/queries";
import { chatApi } from "@/features/chat/api";

type Event = { type: "message.created" | "message.deleted"; data: ChatMessage };

const backoff = (attempt: number) => Math.min(1000 * 2 ** attempt, 30_000);

export function useChatSocket(teamId: string, orgId: string) {
  const write = useChatCacheWriter(teamId);

  useEffect(() => {
    if (!WS_URL) return;

    let cancelled = false;
    let socket: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = async () => {
      try {
        const { token } = await chatApi.socketTicket(orgId, teamId);
        if (cancelled) return;

        socket = new WebSocket(
          `${WS_URL}/ws?token=${encodeURIComponent(token)}&team_id=${encodeURIComponent(teamId)}`
        );
        socket.onopen = () => {
          attempt = 0;
        };
        socket.onmessage = (event) => {
          const parsed = JSON.parse(event.data) as Event;
          if (parsed.data?.channel_id === teamId) write(parsed.data);
        };
        socket.onclose = () => {
          if (cancelled) return;
          attempt += 1;
          timer = setTimeout(connect, backoff(attempt));
        };
        socket.onerror = () => socket?.close();
      } catch {
        if (cancelled) return;
        attempt += 1;
        timer = setTimeout(connect, backoff(attempt));
      }
    };

    connect();

    return () => {
      cancelled = true;
      socket?.close();
      if (timer) clearTimeout(timer);
    };
  }, [teamId, orgId, write]);
}