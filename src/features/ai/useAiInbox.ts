"use client";

import { useContext } from "react";
import { AiInboxContext } from "@/features/ai/inbox-context";

export function useAiInbox() {
  const inbox = useContext(AiInboxContext);
  if (!inbox) throw new Error("AI inbox is unavailable");
  return inbox;
}
