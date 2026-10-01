"use client";

import { useEffect, useSyncExternalStore } from "react";
import { accents } from "@/features/appearance/accents";

type Accent = (typeof accents)[number]["value"];
const STORAGE_KEY = "synodus-accent";
const CHANGE_EVENT = "synodus-accent-change";
let fallback: Accent = "teal";

function snapshot(): Accent {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return accents.find((option) => option.value === stored)?.value ?? fallback;
  } catch {
    return fallback;
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function setAccent(accent: Accent) {
  fallback = accent;
  document.documentElement.dataset.accent = accent;
  try {
    localStorage.setItem(STORAGE_KEY, accent);
  } catch {
    // Private/restricted browsers can still change the accent for this session.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useAccent() {
  const accent = useSyncExternalStore(subscribe, snapshot, () => "teal" as const);
  useEffect(() => {
    document.documentElement.dataset.accent = accent;
  }, [accent]);
  return { accent, setAccent };
}
