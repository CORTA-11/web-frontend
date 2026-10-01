"use client";

import { useEffect } from "react";
import { initialiseTimeZone } from "@/lib/time-zone";

export function TimeZonePreference() {
  useEffect(initialiseTimeZone, []);
  return null;
}
