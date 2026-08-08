"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useAuthStore } from "@/stores/auth-store";

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  useAuthHydration();
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isAuthed = Boolean(token && refreshToken);

  useEffect(() => {
    if (!isHydrated) return;

    // Drop incomplete legacy sessions (token without refresh token).
    if ((token && !refreshToken) || (!token && refreshToken)) {
      clearAuth();
      return;
    }

    if (isAuthed) {
      router.replace("/");
    }
  }, [isHydrated, isAuthed, token, refreshToken, clearAuth, router]);

  if (!isHydrated || isAuthed) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return children;
}
