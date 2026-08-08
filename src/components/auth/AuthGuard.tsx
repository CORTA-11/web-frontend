"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isReady = useAuthBootstrap();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isReady && (!accessToken || !user)) {
      router.replace("/login");
    }
  }, [isReady, accessToken, user, router]);

  if (!isReady || !accessToken || !user) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return children;
}
