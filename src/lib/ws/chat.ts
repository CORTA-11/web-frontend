import { getAccessToken } from "@/lib/api/token";

export type ChatWsEvent =
  | { type: "message.created"; data: unknown }
  | { type: "message.deleted"; data: unknown }
  | { type: string; data: unknown };

function wsBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_BASE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  return "ws://localhost:8081";
}

export function connectTeamChatWs(
  teamPublicId: string,
  onEvent: (event: ChatWsEvent) => void
): () => void {
  let closed = false;
  let socket: WebSocket | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let attempt = 0;

  const connect = () => {
    if (closed) return;
    const token = getAccessToken();
    if (!token) {
      retryTimer = setTimeout(connect, 1500);
      return;
    }

    const url = `${wsBaseUrl()}/ws?token=${encodeURIComponent(token)}&team_id=${encodeURIComponent(teamPublicId)}`;
    socket = new WebSocket(url);

    socket.onopen = () => {
      attempt = 0;
    };

    socket.onmessage = (evt) => {
      try {
        const parsed = JSON.parse(String(evt.data)) as ChatWsEvent;
        onEvent(parsed);
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      socket = null;
      if (closed) return;
      const delay = Math.min(1000 * 2 ** attempt, 10000);
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    socket.onerror = () => {
      socket?.close();
    };
  };

  connect();

  return () => {
    closed = true;
    if (retryTimer) clearTimeout(retryTimer);
    socket?.close();
  };
}
