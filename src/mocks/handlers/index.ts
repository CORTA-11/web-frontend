import { isLive } from "@/lib/env";
import { aiHandlers } from "@/mocks/handlers/ai";
import { authHandlers } from "@/mocks/handlers/auth";
import { boardHandlers } from "@/mocks/handlers/board";
import { chatHandlers } from "@/mocks/handlers/chat";
import { docHandlers } from "@/mocks/handlers/docs";
import { fileHandlers } from "@/mocks/handlers/files";
import { platformHandlers } from "@/mocks/handlers/platform";
import { resourceHandlers } from "@/mocks/handlers/resources";
import { settingsHandlers } from "@/mocks/handlers/settings";
import { invitationHandlers } from "@/mocks/handlers/invitations";
import { teamHandlers } from "@/mocks/handlers/teams";

/**
 * A module listed in NEXT_PUBLIC_LIVE_MODULES registers no handlers, so its
 * requests fall through the worker to the real core-api. That flag is the whole
 * mock-to-live switch.
 */
export const handlers = [
  ...(isLive("auth") ? [] : authHandlers),
  ...(isLive("teams") ? [] : teamHandlers),
  ...(isLive("teams") ? [] : invitationHandlers),
  ...(isLive("board") ? [] : boardHandlers),
  ...(isLive("chat") ? [] : chatHandlers),
  ...(isLive("docs") ? [] : docHandlers),
  ...(isLive("files") ? [] : fileHandlers),
  ...(isLive("resources") ? [] : resourceHandlers),
  ...(isLive("ai") ? [] : aiHandlers),
  ...(isLive("settings") ? [] : settingsHandlers),
  ...(isLive("settings") ? [] : platformHandlers),
];
