"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthHydration } from "@/hooks/use-auth-hydration";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuthHydration();
  const router = useRouter();
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;

    if (!token || !refreshToken) {
      setIsVerified(false);
      router.replace("/login");
      return;
    }

    let cancelled = false;
    setIsVerified(false);

    (async () => {
      const result = await api.getCurrentUser();
      if (cancelled) return;

      if (!result.success) {
        clearAuth();
        router.replace("/login");
        return;
      }

      useAuthStore.setState({ user: result.data });
      setIsVerified(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, refreshToken, clearAuth, router]);

  if (!isHydrated || !token || !refreshToken || !isVerified) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return children;
}
