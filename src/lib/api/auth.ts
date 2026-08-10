import type { ApiResponse } from "@/lib/api/client";
import { getAccessToken, setAccessToken } from "@/lib/api/token";
import { mockDelay } from "@/lib/mock/delay";
import {
  clearMockSession,
  issueMockToken,
  loadMockSessionUserId,
  saveMockSession,
  userIdFromMockToken,
} from "@/lib/mock/session";
import {
  MOCK_ORG_ID,
  MOCK_ORG_PUBLIC_ID,
  addMockAccount,
  findAccountByEmail,
  findAccountById,
  toUser,
  type MockAccount,
} from "@/lib/mock/users";
import type { User } from "@/lib/types/user";

export type AuthPayload = {
  accessToken: string;
  user: User;
};

export type RegisterMode = "create_org" | "join_org";

function sessionPayload(account: MockAccount): AuthPayload {
  const accessToken = issueMockToken(account.id);
  setAccessToken(accessToken);
  saveMockSession(account.id);
  return { accessToken, user: toUser(account) };
}

export const authApi = {
  login: async (input: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthPayload>> => {
    await mockDelay();
    const email = input.email.trim();
    const password = input.password;
    if (!email || !password) {
      return { success: false, error: "Email and password are required." };
    }

    const account = findAccountByEmail(email);
    if (!account || account.password !== password) {
      return { success: false, error: "Invalid email or password." };
    }
    return { success: true, data: sessionPayload(account) };
  },

  register: async (input: {
    name: string;
    email: string;
    password: string;
    mode: RegisterMode;
    orgName?: string;
    orgPublicId?: string;
  }): Promise<ApiResponse<AuthPayload>> => {
    await mockDelay();
    const name = input.name.trim();
    const email = input.email.trim();
    const password = input.password;
    const orgName = input.orgName?.trim() ?? "";
    const orgPublicId = input.orgPublicId?.trim() ?? "";

    if (!name || !email || !password) {
      return {
        success: false,
        error: "Name, email, and password are required.",
      };
    }
    if (input.mode === "create_org" && !orgName) {
      return { success: false, error: "Organization name is required." };
    }
    if (input.mode === "join_org" && !orgPublicId) {
      return { success: false, error: "Organization ID is required." };
    }
    if (findAccountByEmail(email)) {
      return { success: false, error: "Email is already registered." };
    }
    if (
      input.mode === "join_org" &&
      orgPublicId !== MOCK_ORG_PUBLIC_ID
    ) {
      return { success: false, error: "Organization not found." };
    }

    const account: MockAccount = {
      id: String(Date.now()),
      orgId: MOCK_ORG_ID,
      name,
      email,
      avatarUrl: "",
      role: input.mode === "create_org" ? "admin" : "member",
      password,
    };
    addMockAccount(account);
    return { success: true, data: sessionPayload(account) };
  },

  logout: async (): Promise<ApiResponse<null>> => {
    await mockDelay(100);
    clearMockSession();
    setAccessToken(null);
    return { success: true, data: null };
  },

  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    await mockDelay(100);
    const userId =
      userIdFromMockToken(getAccessToken()) ?? loadMockSessionUserId();
    const account = userId ? findAccountById(userId) : undefined;
    if (!account) {
      return { success: false, error: "Unauthorized" };
    }
    return { success: true, data: toUser(account) };
  },
};
