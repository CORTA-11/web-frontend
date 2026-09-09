export type EditorPresence = {
  clientId: number;
  color: string;
  id: string;
  name: string;
  sessionId: string;
};

const presenceColor = /^(?:#[0-9a-f]{6}|var\(--presence-[1-6]\))$/i;

export function readPresence(value: unknown): EditorPresence | null {
  if (value === null || typeof value !== "object") return null;
  const state = value as Record<string, unknown>;
  const user = state.user;
  if (user === null || typeof user !== "object") return null;
  const identity = user as Record<string, unknown>;
  if (
    typeof state.clientId !== "number" ||
    typeof identity.color !== "string" || !presenceColor.test(identity.color) ||
    typeof identity.id !== "string" ||
    typeof identity.name !== "string" ||
    typeof identity.sessionId !== "string"
  ) return null;
  return {
    clientId: state.clientId,
    color: identity.color,
    id: identity.id,
    name: identity.name,
    sessionId: identity.sessionId,
  };
}
