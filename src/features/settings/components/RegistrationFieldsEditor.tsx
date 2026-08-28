"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useUpdateOrgSettings } from "@/features/settings/queries";
import type { RegistrationField } from "@/lib/types";


const slug = (label: string) =>
  label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "field";

/** Extra inputs new members must fill in — SRS 3.1.1.3. */
export function RegistrationFieldsEditor({
  orgId, fields,
}: {
  orgId: string;
  fields: RegistrationField[];
}) {
  const [draft, setDraft] = useState(fields);
  const update = useUpdateOrgSettings(orgId);

  const patch = (index: number, changes: Partial<RegistrationField>) =>
    setDraft((current) => current.map((field, at) => (at === index ? { ...field, ...changes } : field)));

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col divide-y divide-border border border-border">
        {draft.map((field, index) => (
          <li key={index} className="flex flex-wrap items-center gap-2 p-2.5">
            <Input
              aria-label="Field label"
              className="h-7 w-48"
              value={field.label}
              onChange={(event) => patch(index, { label: event.target.value, key: slug(event.target.value) })}
            />
            <select
              aria-label="Field type"
              className="select-field select-field-sm w-auto"
              value={field.type}
              onChange={(event) => patch(index, { type: event.target.value as RegistrationField["type"] })}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="number">Number</option>
              <option value="select">Choice</option>
            </select>
            {field.type === "select" && (
              <Input
                aria-label="Choices, comma separated"
                className="h-7 w-64"
                placeholder="Comma separated choices"
                value={field.options?.join(", ") ?? ""}
                onChange={(event) =>
                  patch(index, { options: event.target.value.split(",").map((option) => option.trim()) })
                }
              />
            )}
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={field.required}
                onCheckedChange={(checked) => patch(index, { required: Boolean(checked) })}
              />
              Required
            </label>
            <Button
              size="icon-xs"
              variant="ghost"
              className="ml-auto"
              aria-label={`Remove ${field.label}`}
              onClick={() => setDraft(draft.filter((_, at) => at !== index))}
            >
              <Trash2Icon />
            </Button>
          </li>
        ))}
        {!draft.length && (
          <li className="p-3 text-xs text-muted-foreground">
            Only name, email and password are asked for at registration.
          </li>
        )}
      </ul>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() =>
            setDraft([...draft, { key: "field", label: "New field", type: "text", required: false }])
          }
        >
          <PlusIcon />
          Add field
        </Button>
        <Button
          size="sm"
          disabled={update.isPending}
          onClick={() => update.mutate({ registration_fields: draft })}
        >
          Save fields
        </Button>
      </div>
    </div>
  );
}
