import { setAccessToken } from "@/lib/api/token";
import { mockDelay } from "@/lib/mock/delay";
import {
  issueMockToken,
  loadMockSessionUserId,
} from "@/lib/mock/session";
import { findAccountById, toUser } from "@/lib/mock/users";
import type { User } from "@/lib/types/user";

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type RefreshResult = {
  accessToken: string;
  user: User;
};

/** Restores mock session from sessionStorage (stand-in for refresh cookie). */
export async function refreshAccessToken(): Promise<RefreshResult | null> {
  await mockDelay(50);
  const userId = loadMockSessionUserId();
  if (!userId) {
    setAccessToken(null);
    return null;
  }
  const account = findAccountById(userId);
  if (!account) {
    setAccessToken(null);
    return null;
  }
  const accessToken = issueMockToken(account.id);
  setAccessToken(accessToken);
  return { accessToken, user: toUser(account) };
}
