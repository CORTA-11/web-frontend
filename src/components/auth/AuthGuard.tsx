"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/stores/auth-store";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isReady = useAuthBootstrap();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (isReady && !user) {
      router.replace("/login");
    }
  }, [isReady, user, router]);

  if (!isReady || !user) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return children;
}
