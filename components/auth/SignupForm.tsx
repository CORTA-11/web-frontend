"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore, type SignupMode } from "@/stores/auth-store";
import { cn } from "@/lib/utils";

export function SignupForm() {
  const router = useRouter();
  const signup = useAuthStore((s) => s.signup);
  const [mode, setMode] = useState<SignupMode>("create_org");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    const orgName = String(form.get("orgName") ?? "");
    const orgPublicId = String(form.get("orgPublicId") ?? "");

    const result = await signup({
      name,
      email,
      password,
      mode,
      orgName: mode === "create_org" ? orgName : undefined,
      orgPublicId: mode === "join_org" ? orgPublicId : undefined,
    });
    setPending(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    router.push("/");
  }

  return (
    <Card>
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-zinc-900 text-sm font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
          C
        </div>
        <CardTitle className="text-xl">Create your account</CardTitle>
        <CardDescription>
          Start a new organization or join one you already belong to.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div
            className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800"
            role="tablist"
            aria-label="Registration type"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "create_org"}
              onClick={() => {
                setMode("create_org");
                setError(null);
              }}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mode === "create_org"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              )}
            >
              New organization
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "join_org"}
              onClick={() => {
                setMode("join_org");
                setError(null);
              }}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                mode === "join_org"
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              )}
            >
              Join organization
            </button>
          </div>

          {mode === "create_org" ? (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="orgName" className="text-sm font-medium">
                Organization name
              </label>
              <Input
                id="orgName"
                name="orgName"
                type="text"
                placeholder="University of Aratuwa"
                autoComplete="organization"
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                You will become the organization admin.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="orgPublicId" className="text-sm font-medium">
                Organization ID
              </label>
              <Input
                id="orgPublicId"
                name="orgPublicId"
                type="text"
                placeholder="Organization public ID from your admin"
                autoComplete="organization"
                required
              />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Ask your organization admin for this ID.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Kamsan Perera"
              autoComplete="name"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@corta.dev"
              autoComplete="email"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending
              ? "Creating…"
              : mode === "create_org"
                ? "Create organization"
                : "Join organization"}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
