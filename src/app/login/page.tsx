"use client";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { GuestOnly } from "@/features/auth/components/SessionGate";

export default function LoginPage() {
  return (
    <GuestOnly>
      <AuthShell>
        <LoginForm />
      </AuthShell>
    </GuestOnly>
  );
}
