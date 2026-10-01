"use client";

import { Input } from "@/components/ui/input";
import { Field } from "@/components/common/Field";

type Props = {
  id: string;
  label: string;
  zone: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export function BookingTimeInput({ id, label, zone, value, onChange, error }: Props) {
  const [date = "", time = ""] = value.split("T");
  return (
    <Field label={`${label} (${zone})`} htmlFor={`${id}-date`} error={error}>
      <div className="flex gap-2">
        <Input
          id={`${id}-date`}
          type="text"
          aria-label={`${label} date`}
          placeholder="YYYY-MM-DD"
          pattern="[0-9]{4}-[0-9]{2}-[0-9]{2}"
          className="min-w-0 flex-[3] tabular-nums"
          autoComplete="off"
          required
          value={date}
          onChange={(event) => onChange(`${event.target.value}T${time}`)}
        />
        <Input
          id={`${id}-time`}
          type="text"
          aria-label={`${label} time`}
          placeholder="HH:mm"
          pattern="([01][0-9]|2[0-3]):[0-5][0-9]"
          className="min-w-0 flex-[2] tabular-nums"
          autoComplete="off"
          required
          value={time}
          onChange={(event) => onChange(`${date}T${event.target.value}`)}
        />
      </div>
    </Field>
  );
}
