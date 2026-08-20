"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Field } from "@/components/common/Field";
import { RegistrationFields } from "@/features/auth/components/RegistrationFields";
import { lookupOrg } from "@/features/auth/api";
import { useRegister } from "@/features/auth/session";
import { errorMessage } from "@/lib/http";
import type { RegistrationField } from "@/lib/types";

type Mode = "create_org" | "join_org";

const buildSchema = (mode: Mode, extra: RegistrationField[]) =>
  z.object({
    name: z.string().min(2, "Enter your full name"),
    email: z.email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    org_name: mode === "create_org" ? z.string().min(2, "Name your organisation") : z.string().optional(),
    org_public_id: mode === "join_org" ? z.string().min(2, "Enter the organisation ID") : z.string().optional(),
    fields: z.object(
      Object.fromEntries(
        extra.map((field) => [
          field.key,
          field.required ? z.string().min(1, `${field.label} is required`) : z.string().optional(),
        ])
      )
    ),
  });

export function RegisterForm() {
  const [mode, setMode] = useState<Mode>("join_org");
  const [orgId, setOrgId] = useState("");
  const register_ = useRegister();

  const org = useQuery({
    queryKey: ["org-lookup", orgId],
    queryFn: () => lookupOrg(orgId),
    enabled: mode === "join_org" && orgId.trim().length > 1,
    retry: false,
  });

  const extra = useMemo(() => org.data?.registration_fields ?? [], [org.data]);
  const schema = useMemo(() => buildSchema(mode, extra), [mode, extra]);
  const { register, handleSubmit, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", org_name: "", org_public_id: "", fields: {} },
  });
  const errors = formState.errors;

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit((values) => register_.mutate({ ...values, mode }))}
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Create an account</h1>
        <p className="text-xs text-muted-foreground">
          Start a new organisation, or join one you have the ID for.
        </p>
      </div>

      <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
        <TabsList className="w-full">
          <TabsTrigger value="join_org" className="flex-1">Join organisation</TabsTrigger>
          <TabsTrigger value="create_org" className="flex-1">Create organisation</TabsTrigger>
        </TabsList>
      </Tabs>

      {mode === "join_org" ? (
        <Field
          label="Organisation ID"
          htmlFor="org_public_id"
          error={errors.org_public_id?.message}
          hint={
            org.isError ? undefined : org.data ? `Joining ${org.data.name}` : "Ask your admin for this ID."
          }
        >
          <Input
            id="org_public_id"
            autoFocus
            {...register("org_public_id")}
            onBlur={(event) => setOrgId(event.target.value.trim())}
          />
          {org.isError && <p className="text-xs text-danger">{errorMessage(org.error)}</p>}
        </Field>
      ) : (
        <Field label="Organisation name" htmlFor="org_name" error={errors.org_name?.message}>
          <Input id="org_name" autoFocus {...register("org_name")} />
        </Field>
      )}

      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <Input id="name" autoComplete="name" {...register("name")} />
      </Field>

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>

      <Field label="Password" htmlFor="password" hint="At least 8 characters." error={errors.password?.message}>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
      </Field>

      <RegistrationFields
        fields={extra}
        register={register as never}
        errors={(errors.fields ?? {}) as Record<string, { message?: string }>}
      />

      {register_.isError && (
        <p role="alert" className="border-l-2 border-danger pl-2.5 text-xs text-danger">
          {errorMessage(register_.error)}
        </p>
      )}

      <Button type="submit" disabled={register_.isPending} className="w-full">
        {register_.isPending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Already registered?{" "}
        <Link href="/login" className="text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
