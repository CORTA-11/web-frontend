"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Field } from "@/components/common/Field";
import { useUpdateOrgSettings } from "@/features/settings/queries";
import type { AiSettings } from "@/lib/types";


/** Which model the context service uses, or a self-hosted endpoint — SRS 3.1.9. */
export function AiSettingsForm({ orgId, ai }: { orgId: string; ai: AiSettings }) {
  const [form, setForm] = useState(ai);
  const update = useUpdateOrgSettings(orgId);

  return (
    <form
      className="flex max-w-lg flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate({ ai: form });
      }}
    >
      <label className="flex items-center gap-2.5 text-sm">
        <Switch
          checked={form.enabled}
          onCheckedChange={(enabled) => setForm({ ...form, enabled })}
        />
        AI-assisted summaries and task extraction
      </label>

      <Field label="Provider" htmlFor="ai-provider">
        <select
          id="ai-provider"
          className="select-field"
          disabled={!form.enabled}
          value={form.provider}
          onChange={(event) => setForm({ ...form, provider: event.target.value as AiSettings["provider"] })}
        >
          <option value="builtin">Bundled models</option>
          <option value="custom">Custom endpoint</option>
        </select>
      </Field>

      {form.provider === "builtin" ? (
        <Field label="Model" htmlFor="ai-model">
          <select
            id="ai-model"
            className="select-field"
            disabled={!form.enabled}
            value={form.model}
            onChange={(event) => setForm({ ...form, model: event.target.value })}
          >
            {form.available_models.map((model) => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
        </Field>
      ) : (
        <>
          <Field
            label="Endpoint"
            htmlFor="ai-endpoint"
            hint="An OpenAI-compatible URL reachable from the context service."
          >
            <Input
              id="ai-endpoint"
              className="font-mono text-xs"
              disabled={!form.enabled}
              value={form.custom_endpoint ?? ""}
              onChange={(event) => setForm({ ...form, custom_endpoint: event.target.value })}
            />
          </Field>
          <Field label="Model name" htmlFor="ai-custom-model">
            <Input
              id="ai-custom-model"
              className="font-mono text-xs"
              disabled={!form.enabled}
              value={form.model}
              onChange={(event) => setForm({ ...form, model: event.target.value })}
            />
          </Field>
        </>
      )}

      <div>
        <Button type="submit" size="sm" disabled={update.isPending}>
          Save AI settings
        </Button>
      </div>
    </form>
  );
}
