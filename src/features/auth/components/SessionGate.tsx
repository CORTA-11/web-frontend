"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { homeFor, useSession } from "@/features/auth/session";

const Booting = () => (
  <div className="flex h-svh items-center justify-center text-xs text-muted-foreground">
    Restoring session…
  </div>
);

export function RequireSession({ children }: { children: ReactNode }) {
  const { user, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !user) router.replace("/login");
  }, [isPending, user, router]);

  if (isPending) return <Booting />;
  return user ? <>{children}</> : null;
}

export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace(homeFor(user));
  }, [user, router]);

  if (isPending) return <Booting />;
  return user ? null : <>{children}</>;
}
