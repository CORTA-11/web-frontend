"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useLogin } from "@/features/auth/session";
import { errorMessage } from "@/lib/http";

const schema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit((values) => login.mutate(values))}>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="text-xs text-muted-foreground">
          Use the account your organisation admin registered.
        </p>
      </div>

      <Field label="Email" htmlFor="email" error={formState.errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus {...register("email")} />
      </Field>

      <Field label="Password" htmlFor="password" error={formState.errors.password?.message}>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </Field>

      {login.isError && (
        <p role="alert" className="border-l-2 border-danger pl-2.5 text-xs text-danger">
          {errorMessage(login.error)}
        </p>
      )}

      <Button type="submit" disabled={login.isPending} className="w-full">
        {login.isPending ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-xs text-muted-foreground">
        No account yet?{" "}
        <Link href="/register" className="text-primary underline-offset-4 hover:underline">
          Register or join an organisation
        </Link>
      </p>
    </form>
  );
}
