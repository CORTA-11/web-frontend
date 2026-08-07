"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, type ApiResponse, type AuthPayload } from "@/lib/api";
import type { User } from "@/lib/mock-data";
import { clearSession, writeSession } from "@/lib/auth-session";

export type SignupMode = "create_org" | "join_org";

type SignupInput = {
  name: string;
  email: string;
  password: string;
  mode: SignupMode;
  orgName?: string;
  orgPublicId?: string;
};

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  setHydrated: () => void;
  login: (
    email: string,
    password: string
  ) => Promise<ApiResponse<AuthPayload>>;
  signup: (input: SignupInput) => Promise<ApiResponse<AuthPayload>>;
  logout: () => Promise<void>;
  syncSession: (payload: AuthPayload) => void;
  clearAuth: () => void;
};

function applySession(
  set: (partial: Partial<AuthState>) => void,
  payload: AuthPayload
) {
  writeSession(payload);
  set({
    user: payload.user,
    token: payload.token,
    refreshToken: payload.refreshToken,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      syncSession: (payload) => applySession(set, payload),

      clearAuth: () => {
        clearSession();
        set({ user: null, token: null, refreshToken: null });
      },

      login: async (email, password) => {
        const result = await api.login({ email, password });
        if (result.success) {
          applySession(set, result.data);
        }
        return result;
      },

      signup: async (input) => {
        const result = await api.signup(input);
        if (result.success) {
          applySession(set, result.data);
        }
        return result;
      },

      logout: async () => {
        await api.logout();
        clearSession();
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: "corta-auth",
      version: 2,
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
      migrate: (persisted) => {
        const state = persisted as Partial<AuthState> | undefined;
        if (!state?.token || !state?.refreshToken || !state?.user) {
          return { user: null, token: null, refreshToken: null };
        }
        return {
          user: state.user,
          token: state.token,
          refreshToken: state.refreshToken,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (!error && state?.user && state?.token && state?.refreshToken) {
          writeSession({
            user: state.user,
            token: state.token,
            refreshToken: state.refreshToken,
          });
        } else {
          clearSession();
        }
        state?.setHydrated();
      },
    }
  )
);
