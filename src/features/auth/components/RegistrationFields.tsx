"use client";

import type { UseFormRegister } from "react-hook-form";
import { Field } from "@/components/common/Field";
import { Input } from "@/components/ui/input";
import type { RegistrationField } from "@/lib/types";

type Props = {
  fields: RegistrationField[];
  register: UseFormRegister<never>;
  errors: Record<string, { message?: string } | undefined>;
};

/** Extra inputs the org admin configured — SRS 3.1.1.3. */
export function RegistrationFields({ fields, register, errors }: Props) {
  if (!fields.length) return null;

  return (
    <fieldset className="flex flex-col gap-4 border-t border-border pt-4">
      <legend className="label-eyebrow">Required by this organisation</legend>
      {fields.map((field) => (
        <Field
          key={field.key}
          label={field.required ? field.label : `${field.label} (optional)`}
          htmlFor={field.key}
          error={errors[field.key]?.message}
        >
          {field.type === "select" ? (
            <select
              id={field.key}
              className="select-field"
              {...register(`fields.${field.key}` as never)}
            >
              <option value="">Select…</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : (
            <Input id={field.key} type={field.type} {...register(`fields.${field.key}` as never)} />
          )}
        </Field>
      ))}
    </fieldset>
  );
}
