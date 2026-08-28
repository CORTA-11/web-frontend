import { apiRequest } from "@/lib/api/client";
import type { AuthResponse } from "@/lib/types/api";

export const authApi = {
  register(displayName: string, email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ display_name: displayName.trim(), email: email.trim(), password }),
    });
  },
  login(email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.trim(), password }),
    });
  },
  session: () => apiRequest<AuthResponse>("/auth/session"),
  logout: () => apiRequest<void>("/auth/session", { method: "DELETE" }),
};
