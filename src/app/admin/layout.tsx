import type { ReactNode } from "react";
import { PlatformShell } from "@/components/layout/PlatformShell";
import { RequireSession } from "@/features/auth/components/SessionGate";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <PlatformShell>{children}</PlatformShell>
    </RequireSession>
  );
}
