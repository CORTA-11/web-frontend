const SESSION_KEY = "corta_mock_user_id";

/** Mock stand-in for the httpOnly refresh cookie (frontend-only). */
export function saveMockSession(userId: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, userId);
}

export function loadMockSessionUserId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

export function clearMockSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export function issueMockToken(userId: string): string {
  return `mock-token-${userId}`;
}

export function userIdFromMockToken(token: string | null): string | null {
  if (!token?.startsWith("mock-token-")) return null;
  return token.slice("mock-token-".length) || null;
}
