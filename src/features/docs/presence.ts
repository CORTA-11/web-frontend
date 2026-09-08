export type EditorPresence = {
  clientId: number;
  color: string;
  id: string;
  name: string;
  sessionId: string;
};

const colors = ["#2563eb", "#7c3aed", "#c026d3", "#db2777", "#ea580c", "#0d9488"] as const;
const hexColor = /^#[0-9a-f]{6}$/i;

export function presenceColor(userId: string): string {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length]!;
}

export function readPresence(value: unknown): EditorPresence | null {
  if (value === null || typeof value !== "object") return null;
  const state = value as Record<string, unknown>;
  const user = state.user;
  if (user === null || typeof user !== "object") return null;
  const identity = user as Record<string, unknown>;
  if (
    typeof state.clientId !== "number" ||
    typeof identity.color !== "string" || !hexColor.test(identity.color) ||
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
