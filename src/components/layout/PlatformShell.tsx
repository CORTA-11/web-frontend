import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

/** The operator console has no tenant sidebar — there is nothing to browse into. */
export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border px-4 sm:px-6">
        <Wordmark />
        <span className="label-eyebrow border-l border-border pl-3">Platform</span>
        <div className="ml-auto">
          <ProfileMenu />
        </div>
      </header>
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
    </div>
  );
}
