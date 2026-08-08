"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function useAuthHydration() {
  useEffect(() => {
    const finish = () => {
      useAuthStore.getState().setHydrated();
    };

    const unsub = useAuthStore.persist.onFinishHydration(finish);
    if (useAuthStore.persist.hasHydrated()) {
      finish();
    }

    return unsub;
  }, []);
}
