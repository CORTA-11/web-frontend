import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";

/** Auth pages are a working panel, not a marketing hero. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,22rem)_1fr]">
      <aside className="hidden flex-col justify-between bg-sidebar p-12 lg:flex">
        <Wordmark />
        <p className="max-w-[26ch] text-xs text-muted-foreground">
          Collaborative resource and task orchestration for research teams.
        </p>
      </aside>

      <main className="auth-panel flex items-start px-6 py-12 sm:px-12 lg:py-24">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
