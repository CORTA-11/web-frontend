import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

/** The operator console has no tenant sidebar — there is nothing to browse into. */
export function PlatformShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <header className="flex h-20 shrink-0 items-center gap-4 border-b-3 border-border px-6 md:px-12">
        <Wordmark />
        <span className="label-eyebrow border-l border-border pl-3">Platform</span>
        <div className="ml-auto">
          <ProfileMenu />
        </div>
      </header>
      <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-12">{children}</main>
    </div>
  );
}
