import { setupWorker } from "msw/browser";
import { handlers } from "@/mocks/handlers";

const worker = setupWorker(...handlers);
let startup: ReturnType<typeof worker.start> | undefined;

// Strict Mode can run provider effects twice. Multiple workers duplicate writes.
export const startMocks = () =>
  (startup ??= worker.start({
    onUnhandledRequest: "bypass",
    quiet: true,
  }));
