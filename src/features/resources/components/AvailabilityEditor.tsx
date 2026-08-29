"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { localTimeZone, summariseAvailabilityLocal } from "@/features/resources/availability";
import type { AvailabilityWindow } from "@/lib/types";

const WEEKDAYS = [
  { value: 1, label: "Mon" }, { value: 2, label: "Tue" }, { value: 3, label: "Wed" },
  { value: 4, label: "Thu" }, { value: 5, label: "Fri" }, { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

type Props = {
  value: AvailabilityWindow[];
  onChange: (windows: AvailabilityWindow[]) => void;
};

/** Weekly usage limits an admin sets per resource — SRS 3.1.3.1. */
export function AvailabilityEditor({ value, onChange }: Props) {
  const windowFor = (weekday: number) => value.find((entry) => entry.weekday === weekday);

  const set = (weekday: number, patch: Partial<AvailabilityWindow> | null) => {
    if (patch === null) return onChange(value.filter((entry) => entry.weekday !== weekday));
    const existing = windowFor(weekday);
    const next = { weekday, start: "09:00", end: "17:00", ...existing, ...patch };
    onChange([...value.filter((entry) => entry.weekday !== weekday), next].sort((a, b) => a.weekday - b.weekday));
  };

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="label-eyebrow pb-1">Available windows (UTC)</legend>
      {WEEKDAYS.map((weekday) => {
        const entry = windowFor(weekday.value);
        return (
          <div key={weekday.value} className="flex items-center gap-2.5">
            <Checkbox
              id={`day-${weekday.value}`}
              checked={Boolean(entry)}
              onCheckedChange={(checked) => set(weekday.value, checked ? {} : null)}
            />
            <label htmlFor={`day-${weekday.value}`} className="w-9 text-sm">
              {weekday.label}
            </label>
            <Input
              type="time"
              aria-label={`${weekday.label} opens`}
              className="h-7 w-28"
              disabled={!entry}
              value={entry?.start ?? "09:00"}
              onChange={(event) => set(weekday.value, { start: event.target.value })}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              aria-label={`${weekday.label} closes`}
              className="h-7 w-28"
              disabled={!entry}
              value={entry?.end ?? "17:00"}
              onChange={(event) => set(weekday.value, { end: event.target.value })}
            />
          </div>
        );
      })}
      {value.length > 0 && (
        <p className="pt-1 text-xs text-muted-foreground">
          In {localTimeZone()}: {summariseAvailabilityLocal(value)}
        </p>
      )}
    </fieldset>
  );
}
