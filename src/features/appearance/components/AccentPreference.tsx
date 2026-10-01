"use client";

import { useAccent } from "@/features/appearance/useAccent";

/** Apply the saved preference even when the account menu is closed. */
export function AccentPreference() {
  useAccent();
  return null;
}
