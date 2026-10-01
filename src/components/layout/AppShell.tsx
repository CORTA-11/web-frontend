import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh overflow-hidden">
      <aside className="hidden w-64 shrink-0 bg-sidebar lg:block">
        <Sidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="min-w-0 flex-1 overflow-y-auto p-6 md:p-12">{children}</main>
      </div>
    </div>
  );
}
