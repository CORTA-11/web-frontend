"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useRegister } from "@/features/auth/session";
import { errorMessage } from "@/lib/http";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters"),
});

export function RegisterForm() {
  const registration = useRegister();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "" },
  });

  return (
    <form className="flex flex-col gap-5"
      onSubmit={handleSubmit((values) => registration.mutate({ ...values, mode: "individual" }))}>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Create an account</h1>
        <p className="text-xs text-muted-foreground">Enter your details to create an account.</p>
      </div>

      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoFocus autoComplete="name" {...register("name")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" hint="At least 8 characters." error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>

      {registration.isError && (
        <p role="alert" className="border-l-2 border-danger pl-2.5 text-xs text-danger">
          {errorMessage(registration.error)}
        </p>
      )}
      <Button type="submit" disabled={registration.isPending} className="w-full">
        {registration.isPending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </form>
  );
}
