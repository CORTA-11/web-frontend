"use client";

import { useSyncExternalStore } from "react";
import { getTimeZone, serverTimeZone, subscribeTimeZone } from "@/lib/time-zone";

export function useTimeZone() {
  return useSyncExternalStore(subscribeTimeZone, getTimeZone, serverTimeZone);
}
