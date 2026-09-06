/** Modules whose requests go to the real core-api instead of the mock server. */
const live = new Set(
  (process.env.NEXT_PUBLIC_LIVE_MODULES ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean)
);
const mocksForced = process.env.NEXT_PUBLIC_MOCKS === "on";

export type ApiModule =
  | "auth"
  | "teams"
  | "board"
  | "chat"
  | "docs"
  | "files"
  | "resources"
  | "ai"
  | "settings";

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api";
export const WS_URL = process.env.NEXT_PUBLIC_WS_BASE_URL?.trim() || "";

export const isLive = (module: ApiModule) =>
  !mocksForced && (live.has("all") || live.has(module));

/** The mock server runs unless every module has been switched to live. */
export const MOCKS_ENABLED =
  process.env.NEXT_PUBLIC_MOCKS !== "off" && (mocksForced || !live.has("all"));
