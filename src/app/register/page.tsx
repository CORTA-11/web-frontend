"use client";

import { Suspense } from "react";
import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GuestOnly } from "@/features/auth/components/SessionGate";

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <GuestOnly>
        <AuthShell>
          <RegisterForm />
        </AuthShell>
      </GuestOnly>
    </Suspense>
  );
}
