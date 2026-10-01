"use client";

import { useTimeZone } from "@/lib/use-time-zone";
import { setTimeZone } from "@/lib/time-zone";

export function TimeZoneSelector() {
  const zone = useTimeZone();
  const zones = Array.from(new Set(["UTC", zone, ...Intl.supportedValuesOf("timeZone")])).sort();

  return (
    <label className="flex flex-col gap-1 px-2 py-1.5">
      <span className="label-eyebrow">Time zone</span>
      <select
        aria-label="Time zone"
        className="select-field w-full text-xs"
        value={zone}
        onChange={(event) => setTimeZone(event.target.value)}
      >
        {zones.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}
      </select>
      <span className="text-xs text-muted-foreground">Dates and times use this zone.</span>
    </label>
  );
}
