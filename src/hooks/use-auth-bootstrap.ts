"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

/** Restores session from httpOnly refresh cookie on first load. */
export function useAuthBootstrap() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const isReady = useAuthStore((s) => s.isReady);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return isReady;
}
