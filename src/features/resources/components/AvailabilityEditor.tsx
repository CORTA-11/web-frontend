"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { dateTimeInput, fromDateTimeInput } from "@/lib/time-zone";
import { useTimeZone } from "@/lib/use-time-zone";
import type { AvailabilityWindow } from "@/lib/types";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS = [1, 2, 3, 4, 5, 6, 0];

type Props = {
  value: AvailabilityWindow[];
  onChange: (windows: AvailabilityWindow[]) => void;
};

/** The UTC recurrence remains authoritative; only the editor's wall times are zoned. */
export function AvailabilityEditor({ value, onChange }: Props) {
  const zone = useTimeZone();
  const [anchor] = useState(() => new Date());
  const [error, setError] = useState("");
  const windowFor = (weekday: number) => value.find((entry) => entry.weekday === weekday);
  const display = (entry: AvailabilityWindow) => {
    const day = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(),
      anchor.getUTCDate() - anchor.getUTCDay() + entry.weekday));
    const at = (clock: string) => new Date(`${day.toISOString().slice(0, 10)}T${clock}:00Z`);
    return { start: dateTimeInput(at(entry.start), zone), end: dateTimeInput(at(entry.end), zone) };
  };

  const set = (weekday: number, patch: Partial<AvailabilityWindow> | null) => {
    setError("");
    if (patch === null) return onChange(value.filter((entry) => entry.weekday !== weekday));
    const next = { weekday, start: "09:00", end: "17:00", ...windowFor(weekday), ...patch };
    onChange([...value.filter((entry) => entry.weekday !== weekday), next].sort((a, b) => a.weekday - b.weekday));
  };

  const changeTime = (entry: AvailabilityWindow, field: "start" | "end", clock: string) => {
    const shown = display(entry);
    const instant = fromDateTimeInput(`${shown[field].slice(0, 10)}T${clock}`, zone);
    // The API supports one same-UTC-day window per weekday, not overnight UTC intervals.
    if (!Number.isFinite(instant.getTime()) || instant.getUTCDay() !== entry.weekday) {
      setError("This time is outside the supported daily window.");
      return;
    }
    set(entry.weekday, { [field]: instant.toISOString().slice(11, 16) });
  };

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="label-eyebrow pb-1">Available windows ({zone})</legend>
      {DAYS.map((weekday) => {
        const entry = windowFor(weekday);
        const shown = display(entry ?? { weekday, start: "09:00", end: "17:00" });
        const label = LABELS[new Date(`${shown.start.slice(0, 10)}T12:00:00Z`).getUTCDay()];
        const overnight = shown.start.slice(0, 10) !== shown.end.slice(0, 10);
        return (
          <div key={weekday} className="flex items-center gap-2.5">
            <Checkbox
              id={`day-${weekday}`}
              checked={Boolean(entry)}
              onCheckedChange={(checked) => set(weekday, checked ? {} : null)}
            />
            <label htmlFor={`day-${weekday}`} className="w-9 text-sm">{label}</label>
            <Input
              type="time"
              aria-label={`${label} opens`}
              className="h-7 w-28"
              disabled={!entry}
              value={shown.start.slice(11, 16)}
              onChange={(event) => entry && changeTime(entry, "start", event.target.value)}
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="time"
              aria-label={`${label} closes`}
              className="h-7 w-28"
              disabled={!entry}
              value={shown.end.slice(11, 16)}
              onChange={(event) => entry && changeTime(entry, "end", event.target.value)}
            />
            {overnight && <span className="text-xs text-muted-foreground">+1 day</span>}
          </div>
        );
      })}
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </fieldset>
  );
}
