"use client";

import { AuthShell } from "@/features/auth/components/AuthShell";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { GuestOnly } from "@/features/auth/components/SessionGate";

export default function RegisterPage() {
  return (
    <GuestOnly>
      <AuthShell>
        <RegisterForm />
      </AuthShell>
    </GuestOnly>
  );
}
