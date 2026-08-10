export type ChatWsEvent =
  | { type: "message.created"; data: unknown }
  | { type: "message.deleted"; data: unknown }
  | { type: string; data: unknown };

/**
 * Realtime socket is disabled while the frontend uses the mock API contract.
 * Returns a no-op disconnect so chat UI can keep the same wiring.
 */
export function connectTeamChatWs(
  _teamPublicId: string,
  _onEvent: (event: ChatWsEvent) => void
): () => void {
  return () => {};
}
