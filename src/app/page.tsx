"use client";

import { GuestOnly } from "@/features/auth/components/SessionGate";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { AuthShell } from "@/features/auth/components/AuthShell";

/** Signed-in visitors bounce to their org; everyone else lands on sign-in. */
export default function HomePage() {
  return (
    <GuestOnly>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </GuestOnly>
  );
}
