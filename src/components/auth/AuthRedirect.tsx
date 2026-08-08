"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/stores/auth-store";

export function AuthRedirect({ children }: { children: React.ReactNode }) {
  const isReady = useAuthBootstrap();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isAuthed = Boolean(accessToken && user);

  useEffect(() => {
    if (isReady && isAuthed && user) {
      router.replace(`/orgs/${user.orgId}`);
    }
  }, [isReady, isAuthed, user, router]);

  if (!isReady || isAuthed) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
        Loading…
      </div>
    );
  }

  return children;
}
