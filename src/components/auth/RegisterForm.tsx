"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth-store";

type FieldErrors = Partial<Record<"display_name" | "email" | "password" | "password_confirmation", string>>;

export function RegisterForm() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const displayName = String(form.get("display_name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const confirmation = String(form.get("password_confirmation") ?? "");
    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: "Passwords do not match." });
      return;
    }
    setPending(true);
    const problem = await register(displayName, email, password);
    setPending(false);
    if (problem) {
      const nextErrors: FieldErrors = {};
      for (const violation of problem.violations ?? []) {
        if (["display_name", "email", "password"].includes(violation.field)) {
          nextErrors[violation.field as keyof FieldErrors] = violation.message;
        }
      }
      setFieldErrors(nextErrors);
      if (Object.keys(nextErrors).length === 0) setError(problem.detail);
      return;
    }
    router.push("/orgs");
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <CardTitle className="text-xl">Create your CORTA account</CardTitle>
        <CardDescription>Set up your account to join or create an organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" aria-busy={pending}>
          <Field id="display_name" label="Display name" autoComplete="name" error={fieldErrors.display_name} disabled={pending} />
          <Field id="email" label="Email" type="email" autoComplete="email" error={fieldErrors.email} disabled={pending} />
          <Field id="password" label="Password" type="password" autoComplete="new-password" error={fieldErrors.password} disabled={pending} />
          <Field id="password_confirmation" label="Confirm password" type="password" autoComplete="new-password" error={fieldErrors.password_confirmation} disabled={pending} />
          {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Creating account…" : "Create account"}</Button>
          <p className="text-center text-sm text-zinc-600">Already have an account? <Link href="/login" className="font-medium underline">Sign in</Link></p>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ id, label, error, ...props }: { id: keyof FieldErrors; label: string; error?: string } & React.ComponentProps<typeof Input>) {
  const errorID = `${id}-error`;
  return <div className="flex flex-col gap-1.5">
    <label htmlFor={id} className="text-sm font-medium">{label}</label>
    <Input id={id} name={id} required disabled={props.disabled} aria-invalid={Boolean(error)} aria-describedby={error ? errorID : undefined} {...props} />
    {error ? <p id={errorID} role="alert" className="text-sm text-rose-600">{error}</p> : null}
  </div>;
}
