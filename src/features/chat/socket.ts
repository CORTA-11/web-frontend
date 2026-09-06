"use client";

import { useEffect } from "react";
import { isLive, WS_URL } from "@/lib/env";
import { chatApi } from "@/features/chat/api";
import type { ChatMessage } from "@/lib/types";
import { useChatCacheWriter } from "@/features/chat/queries";

type Event = { type: "message.created" | "message.deleted"; data: ChatMessage };

/**
 * Live fan-out from socket-server. Inert until chat live mode and
 * NEXT_PUBLIC_WS_BASE_URL are enabled.
 */
export function useChatSocket(orgId: string, teamId: string) {
  const write = useChatCacheWriter(teamId);

  useEffect(() => {
    if (!WS_URL || !isLive("chat")) return;

    let cancelled = false;
    let socket: WebSocket | undefined;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;

    const connect = async () => {
      try {
        const { token } = await chatApi.socketTicket(orgId, teamId);
        if (cancelled) return;
        const params = new URLSearchParams({ token, team_id: teamId });
        socket = new WebSocket(`${WS_URL.replace(/\/$/, "")}/ws?${params}`);
        socket.onopen = () => {
          attempt = 0;
        };
        socket.onmessage = (event) => {
          const parsed = JSON.parse(event.data) as Event;
          if (parsed.data?.channel_id === teamId) write(parsed.data);
        };
        socket.onclose = () => {
          if (cancelled) return;
          retry = setTimeout(connect, Math.min(500 * 2 ** attempt++, 5000));
        };
      } catch {
        if (!cancelled) retry = setTimeout(connect, Math.min(500 * 2 ** attempt++, 5000));
      }
    };

    void connect();
    return () => {
      cancelled = true;
      if (retry) clearTimeout(retry);
      socket?.close();
    };
  }, [orgId, teamId, write]);
}
