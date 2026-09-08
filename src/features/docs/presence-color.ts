const colors = [
  "var(--presence-1)",
  "var(--presence-2)",
  "var(--presence-3)",
  "var(--presence-4)",
  "var(--presence-5)",
  "var(--presence-6)",
] as const;

// Keep this hash contract aligned with collaboration/src/server.ts.
export function presenceColor(userId: string): string {
  let hash = 0;
  for (const character of userId) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return colors[hash % colors.length]!;
}
