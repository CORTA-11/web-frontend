"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/common/Field";
import { PageHeader } from "@/components/common/PageHeader";
import { QueryBoundary } from "@/components/common/QueryBoundary";
import { useNotificationPrefs, useUpdateNotificationPrefs } from "@/features/settings/queries";
import { useSession } from "@/features/auth/session";
import type { NotificationPrefs } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODES = [
  { value: "all", label: "Everything", hint: "Task changes, mentions and schedule updates." },
  { value: "mentions", label: "Mentions only", hint: "Just messages that name you." },
  { value: "off", label: "Nothing", hint: "No push or email notifications." },
] as const;

function PrefsForm({ prefs, email }: { prefs: NotificationPrefs; email: string }) {
  const [form, setForm] = useState({ ...prefs, email_address: prefs.email_address || email });
  const update = useUpdateNotificationPrefs();

  return (
    <form
      className="flex max-w-xl flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(form);
      }}
    >
      <fieldset className="flex flex-col gap-2">
        <legend className="label-eyebrow pb-1.5">Send me</legend>
        {MODES.map((mode) => (
          <label
            key={mode.value}
            className={cn(
              "flex cursor-pointer items-start gap-2.5 border border-l-2 p-2.5",
              form.mode === mode.value ? "border-border border-l-primary bg-accent/40" : "border-border border-l-transparent"
            )}
          >
            <input
              type="radio"
              name="mode"
              className="mt-0.5 accent-[var(--primary)]"
              checked={form.mode === mode.value}
              onChange={() => setForm({ ...form, mode: mode.value })}
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{mode.label}</span>
              <span className="text-xs text-muted-foreground">{mode.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <label className="flex items-center gap-2.5 text-sm">
        <Switch
          checked={form.email_enabled}
          disabled={form.mode === "off"}
          onCheckedChange={(email_enabled) => setForm({ ...form, email_enabled })}
        />
        Also send these by email
      </label>

      <Field label="Email address" htmlFor="notify-email">
        <Input
          id="notify-email"
          type="email"
          disabled={!form.email_enabled || form.mode === "off"}
          value={form.email_address}
          onChange={(event) => setForm({ ...form, email_address: event.target.value })}
        />
      </Field>

      <div>
        <Button type="submit" size="sm" disabled={update.isPending}>
          Save preferences
        </Button>
      </div>
    </form>
  );
}

export default function NotificationsPage() {
  const { user } = useSession();
  const prefs = useNotificationPrefs();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        meta="Push notifications are delivered by the Synodus mobile app; email works anywhere."
      />
      <QueryBoundary query={prefs} rows={3}>
        {(data) => <PrefsForm prefs={data} email={user?.email ?? ""} />}
      </QueryBoundary>
    </div>
  );
}
