import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { OrgGate } from "@/features/auth/components/OrgGate";
import { RequireSession } from "@/features/auth/components/SessionGate";

export default async function OrgLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <RequireSession>
      <OrgGate orgId={orgId}>
        <AppShell>{children}</AppShell>
      </OrgGate>
    </RequireSession>
  );
}
