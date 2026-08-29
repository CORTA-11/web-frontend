"use client";

import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { GuestOnly } from "@/features/auth/components/SessionGate";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <GuestOnly>
        <AuthShell>
          <LoginForm />
        </AuthShell>
      </GuestOnly>
    </Suspense>
  );
}
