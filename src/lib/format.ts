import { differenceInMinutes, formatDistanceToNowStrict } from "date-fns";
import { getTimeZone } from "@/lib/time-zone";

/** Display precision rules from SRS 3.3.4 live here and nowhere else. */

const asDate = (value: string | Date) =>
  typeof value === "string" ? new Date(value) : value;

export const money = (amount: number, currency = "Rs.") =>
  `${currency} ${amount.toFixed(2)}`;

export const percent = (ratio: number) => `${(ratio * 100).toFixed(2)}%`;

export const fileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
};

const display = (value: string | Date, options: Intl.DateTimeFormatOptions, zone = getTimeZone()) =>
  new Intl.DateTimeFormat("en-GB", { ...options, timeZone: zone, hourCycle: "h23" }).format(asDate(value));

export const clock = (value: string | Date, zone?: string) =>
  display(value, { hour: "2-digit", minute: "2-digit", second: "2-digit" }, zone);
export const time = (value: string | Date, zone?: string) =>
  display(value, { hour: "2-digit", minute: "2-digit" }, zone);
export const day = (value: string | Date, zone?: string) =>
  display(value, { day: "numeric", month: "short", year: "numeric" }, zone);
export const dayShort = (value: string | Date, zone?: string) =>
  display(value, { day: "numeric", month: "short" }, zone);
export const dateTime = (value: string | Date, zone?: string) =>
  `${day(value, zone)}, ${time(value, zone)}`;

export const relative = (value: string | Date) =>
  formatDistanceToNowStrict(asDate(value), { addSuffix: true });

export const slot = (start: string | Date, end: string | Date, zone?: string) =>
  `${dayShort(start, zone)}, ${time(start, zone)}–${time(end, zone)}`;

export const duration = (start: string | Date, end: string | Date) => {
  const minutes = differenceInMinutes(asDate(end), asDate(start));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
};

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
