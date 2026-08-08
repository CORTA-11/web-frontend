"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthBootstrap } from "@/hooks/use-auth-bootstrap";
import { useAuthStore } from "@/stores/auth-store";

export default function HomePage() {
  const isReady = useAuthBootstrap();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!isReady) return;
    if (accessToken && user) {
      router.replace(`/orgs/${user.orgId}`);
    } else {
      router.replace("/login");
    }
  }, [isReady, accessToken, user, router]);

  return (
    <div className="flex min-h-full items-center justify-center text-sm text-zinc-500">
      Loading…
    </div>
  );
}
