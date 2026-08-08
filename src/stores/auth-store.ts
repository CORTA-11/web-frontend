"use client";

import { create } from "zustand";
import { authApi, type AuthPayload, type RegisterMode } from "@/lib/api/auth";
import { refreshAccessToken, type ApiResponse } from "@/lib/api/client";
import { setAccessToken } from "@/lib/api/token";
import type { User } from "@/lib/types/user";

type RegisterInput = {
  name: string;
  email: string;
  password: string;
  mode: RegisterMode;
  orgName?: string;
  orgPublicId?: string;
};

type AuthState = {
  user: User | null;
  accessToken: string | null;
  isReady: boolean;
  setSession: (payload: AuthPayload) => void;
  clearAuth: () => void;
  bootstrap: () => Promise<void>;
  login: (
    email: string,
    password: string
  ) => Promise<ApiResponse<AuthPayload>>;
  register: (input: RegisterInput) => Promise<ApiResponse<AuthPayload>>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  isReady: false,

  setSession: (payload) => {
    setAccessToken(payload.accessToken);
    set({
      user: payload.user,
      accessToken: payload.accessToken,
    });
  },

  clearAuth: () => {
    setAccessToken(null);
    set({
      user: null,
      accessToken: null,
    });
  },

  bootstrap: async () => {
    if (get().isReady) return;

    const refreshed = await refreshAccessToken();
    if (refreshed) {
      set({
        user: refreshed.user,
        accessToken: refreshed.accessToken,
      });
    }

    set({ isReady: true });
  },

  login: async (email, password) => {
    const result = await authApi.login({ email, password });
    if (result.success) {
      get().setSession(result.data);
    }
    return result;
  },

  register: async (input) => {
    const result = await authApi.register(input);
    if (result.success) {
      get().setSession(result.data);
    }
    return result;
  },

  logout: async () => {
    await authApi.logout();
    get().clearAuth();
  },
}));

export type { RegisterMode };
