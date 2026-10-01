"use client";

import { useSyncExternalStore } from "react";

const changed = "content-notification-acknowledgements";
const fallback = new Map<string, string>();

function snapshot(key: string) {
  const pending = fallback.get(key);
  if (pending) return pending;
  try {
    return localStorage.getItem(key) ?? "[]";
  } catch {
    return fallback.get(key) ?? "[]";
  }
}

function readKeys(serialized: string): Set<string> {
  try {
    const value: unknown = JSON.parse(serialized);
    return new Set(Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : []);
  } catch {
    return new Set();
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changed, listener);
  };
}

/** Store event identities only, scoped to notification type, account, org and
 * team. Server snapshots stay empty to keep hydration deterministic. Storage
 * restrictions fall back to in-memory acknowledgements for this page lifetime.
 */
export function useNotificationAcknowledgements(scope: string) {
  const key = `notification-acknowledgements:${scope}`;
  const serialized = useSyncExternalStore(subscribe, () => snapshot(key), () => "[]");
  return {
    read: readKeys(serialized),
    markRead(keys: string[]) {
      const merged = readKeys(snapshot(key));
      for (const entry of keys) merged.add(entry);
      const next = JSON.stringify([...merged].slice(-2000));
      try {
        localStorage.setItem(key, next);
        fallback.delete(key);
      } catch {
        // A blocked/full store should not prevent dismissing notifications.
        fallback.set(key, next);
      }
      window.dispatchEvent(new Event(changed));
    },
  };
}
