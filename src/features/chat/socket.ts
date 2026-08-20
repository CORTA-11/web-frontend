"use client";

import { useEffect } from "react";
import { WS_URL } from "@/lib/env";
import { getAccessToken } from "@/lib/token";
import type { ChatMessage } from "@/lib/types";
import { useChatCacheWriter } from "@/features/chat/queries";

type Event = { type: "message.created" | "message.deleted"; data: ChatMessage };

/**
 * Live fan-out from socket-server (`/ws?token=&team_id=`). Inert until
 * NEXT_PUBLIC_WS_BASE_URL is set — core-api does not publish chat events yet, so the
 * REST round-trip remains the source of truth in the meantime.
 */
export function useChatSocket(teamId: string) {
  const write = useChatCacheWriter(teamId);

  useEffect(() => {
    const token = getAccessToken();
    if (!WS_URL || !token) return;

    const socket = new WebSocket(
      `${WS_URL}/ws?token=${encodeURIComponent(token)}&team_id=${encodeURIComponent(teamId)}`
    );
    socket.onmessage = (event) => {
      const parsed = JSON.parse(event.data) as Event;
      if (parsed.data?.channel_id === teamId) write(parsed.data);
    };
    return () => socket.close();
  }, [teamId, write]);
}
