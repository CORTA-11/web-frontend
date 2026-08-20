import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";

const INSTANCE = [
  ["instance", process.env.NEXT_PUBLIC_INSTANCE_HOST ?? "localhost:3000"],
  ["build", "0.1.0 · self-hosted"],
  ["transport", "TLS 1.3"],
  ["session", "access token, in memory"],
];

/** Auth pages are a working panel, not a marketing hero. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,22rem)_1fr]">
      <aside className="hidden flex-col justify-between border-r border-sidebar-border bg-sidebar p-8 lg:flex">
        <Wordmark />
        <dl className="flex flex-col gap-3">
          {INSTANCE.map(([term, value]) => (
            <div key={term} className="flex flex-col gap-0.5">
              <dt className="label-eyebrow">{term}</dt>
              <dd className="data-mono text-sidebar-foreground">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="max-w-[26ch] text-xs text-muted-foreground">
          Collaborative resource and task orchestration for research teams.
        </p>
      </aside>

      <main className="flex items-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
