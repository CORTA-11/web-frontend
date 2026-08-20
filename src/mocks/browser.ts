import { setupWorker } from "msw/browser";
import { handlers } from "@/mocks/handlers";

export const startMocks = () =>
  setupWorker(...handlers).start({
    onUnhandledRequest: "bypass",
    quiet: true,
  });
