"use client";

import * as format from "@/lib/format";
import { useTimeZone } from "@/lib/use-time-zone";

/** Subscribe every timestamp display without resetting page or form state. */
export function useFormat() {
  const zone = useTimeZone();
  return {
    ...format,
    clock: (value: string | Date) => format.clock(value, zone),
    time: (value: string | Date) => format.time(value, zone),
    day: (value: string | Date) => format.day(value, zone),
    dayShort: (value: string | Date) => format.dayShort(value, zone),
    dateTime: (value: string | Date) => format.dateTime(value, zone),
    slot: (start: string | Date, end: string | Date) => format.slot(start, end, zone),
  };
}
