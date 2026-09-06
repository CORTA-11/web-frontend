"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";
import { useUnlockUserKeys } from "@/features/auth/session";
import { errorMessage } from "@/lib/http";

/**
 * Shown only when this device has no stored copy of the private key: the key is
 * sealed with the account password, so a new device enters it once and keeps
 * files unlocked here afterwards.
 */
export function UnlockGate() {
  const [password, setPassword] = useState("");
  const unlock = useUnlockUserKeys();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (password) unlock.mutate(password);
  };

  return (
    <div className="mx-auto flex h-svh max-w-sm flex-col justify-center gap-5 px-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Unlock encryption keys</h1>
        <p className="text-xs text-muted-foreground">
          Enter the account password once — files stay unlocked on this device afterwards.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={submit}>
        <Field label="Password" htmlFor="unlock-password" error={undefined}>
          <Input
            id="unlock-password"
            type="password"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </Field>

        {unlock.isError && (
          <p role="alert" className="border-l-2 border-danger pl-2.5 text-xs text-danger">
            {errorMessage(unlock.error)}
          </p>
        )}

        <Button type="submit" disabled={unlock.isPending}>
          {unlock.isPending ? "Unlocking…" : "Unlock"}
        </Button>
      </form>
    </div>
  );
}