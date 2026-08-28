"use client";

import { create } from "zustand";
import { authApi } from "@/lib/api/auth";
import { ApiError, problemMessage, setCsrfToken, setUnauthenticatedHandler } from "@/lib/api/client";
import type { AuthResponse, ProblemDetails, Session, User } from "@/lib/types/api";

type AuthState = {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<string | null>;
  register: (displayName: string, email: string, password: string) => Promise<ProblemDetails | null>;
  logout: () => Promise<string | null>;
  clear: () => void;
};

function applyAuth(payload: AuthResponse) {
  setCsrfToken(payload.csrf_token);
  useAuthStore.setState({ user: payload.user, session: payload.session });
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isReady: false,
  clear: () => {
    setCsrfToken(null);
    set({ user: null, session: null });
  },
  bootstrap: async () => {
    if (get().isReady) return;
    try { applyAuth(await authApi.session()); }
    catch { get().clear(); }
    finally { set({ isReady: true }); }
  },
  login: async (email, password) => {
    try {
      applyAuth(await authApi.login(email, password));
      set({ isReady: true });
      return null;
    } catch (error) { return problemMessage(error); }
  },
  register: async (displayName, email, password) => {
    try {
      applyAuth(await authApi.register(displayName, email, password));
      set({ isReady: true });
      return null;
    } catch (error) {
      return error instanceof ApiError ? error.problem : {
        type: "/problems/internal-failure", title: "Request failed", status: 0,
        detail: "The request could not be completed.", request_id: "unknown",
      };
    }
  },
  logout: async () => {
    try {
      await authApi.logout();
      get().clear();
      return null;
    } catch (error) { return problemMessage(error); }
  },
}));

setUnauthenticatedHandler(() => useAuthStore.getState().clear());
