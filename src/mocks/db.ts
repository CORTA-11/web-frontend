import * as seed from "@/mocks/seed";
import type { NotificationPrefs } from "@/lib/types";

/** Mutable in-memory copy of the seed, reset on page reload. */
export const db = {
  people: structuredClone(seed.people),
  organizations: structuredClone(seed.organizations),
  teams: structuredClone(seed.teams),
  members: structuredClone(seed.members),
  tasks: structuredClone(seed.tasks),
  chat: structuredClone(seed.chat),
  resources: structuredClone(seed.resources),
  bookings: structuredClone(seed.bookings),
  requests: structuredClone(seed.requests),
  docs: structuredClone(seed.docs),
  files: structuredClone(seed.files),
  /** Uploaded bytes, keyed by file id — ciphertext, exactly as the browser sent it. */
  fileBlobs: {} as Record<string, ArrayBuffer>,
  settings: structuredClone(seed.settings),
  notifications: {
    mode: "all",
    email_enabled: true,
    email_address: "",
  } as NotificationPrefs,
  invitations: [] as Array<{
    id: string; token: string; orgId: string; email: string; createdAt: string; expiresAt: string;
  }>,
};

let counter = 0;
export const uid = (prefix: string) => `${prefix}-${(++counter).toString(36)}${Date.now().toString(36).slice(-4)}`;
export const now = () => new Date().toISOString();
