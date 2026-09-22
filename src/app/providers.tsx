"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { NativePushProvider } from "@/components/NativePushProvider";
import { MOCKS_ENABLED } from "@/lib/env";
import { ApiError } from "@/lib/http";

const makeClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          error instanceof ApiError && error.status < 500 ? false : failureCount < 2,
      },
    },
  });

/** Blocks first paint until the mock server is intercepting, so no request escapes. */
function useMockServer() {
  const [ready, setReady] = useState(!MOCKS_ENABLED);

  useEffect(() => {
    if (!MOCKS_ENABLED) return;
    import("@/mocks/browser").then(({ startMocks }) => startMocks().then(() => setReady(true)));
  }, []);

  return ready;
}

export function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(makeClient);
  const ready = useMockServer();

  return (
    <QueryClientProvider client={client}>
      <NativePushProvider />
      {ready ? children : null}
      <Toaster position="bottom-right" toastOptions={{ className: "font-sans text-sm" }} />
    </QueryClientProvider>
  );
}
