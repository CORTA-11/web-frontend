import type { AvailabilityWindow, Booking } from "@/lib/types";

const LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ORDER = [1, 2, 3, 4, 5, 6, 0];

/** "Mon–Fri 08:00–22:00, Sat 09:00–13:00" rather than seven separate rows. */
export function summariseAvailability(windows: AvailabilityWindow[]) {
  if (!windows.length) return "Not bookable";

  const byHours = new Map<string, number[]>();
  for (const window of windows) {
    const key = `${window.start}–${window.end}`;
    byHours.set(key, [...(byHours.get(key) ?? []), window.weekday]);
  }

  return [...byHours.entries()]
    .map(([hours, days]) => {
      const positions = days.map((day) => ORDER.indexOf(day)).sort((a, b) => a - b);
      const contiguous = positions.every((position, index) => index === 0 || position === positions[index - 1] + 1);
      const names =
        contiguous && positions.length > 2
          ? `${LABELS[ORDER[positions[0]]]}–${LABELS[ORDER[positions.at(-1)!]]}`
          : positions.map((position) => LABELS[ORDER[position]]).join(", ");
      return `${names} ${hours}`;
    })
    .join(" · ");
}

const clockParts = (clock: string) => clock.split(":").map(Number) as [number, number];

/** Converts the UTC recurrence into the browser's timezone for the selected week. */
export function summariseAvailabilityLocal(windows: AvailabilityWindow[], anchor = new Date()) {
  if (!windows.length) return "Not bookable";
  const weekStart = new Date(Date.UTC(
    anchor.getUTCFullYear(), anchor.getUTCMonth(), anchor.getUTCDate() - anchor.getUTCDay()
  ));
  const formatter = new Intl.DateTimeFormat(undefined, {
    weekday: "short", hour: "numeric", minute: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
  return [...windows]
    .sort((a, b) => a.weekday - b.weekday)
    .map((window) => {
      const [startHour, startMinute] = clockParts(window.start);
      const [endHour, endMinute] = clockParts(window.end);
      const start = new Date(weekStart);
      start.setUTCDate(weekStart.getUTCDate() + window.weekday);
      start.setUTCHours(startHour, startMinute, 0, 0);
      const end = new Date(weekStart);
      end.setUTCDate(weekStart.getUTCDate() + window.weekday);
      end.setUTCHours(endHour, endMinute, 0, 0);
      const endLabel = start.getDay() === end.getDay() ? timeFormatter.format(end) : formatter.format(end);
      return `${formatter.format(start)}–${endLabel}`;
    })
    .join(" · ");
}

export const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";

/** Advisory only — the server rejects the real clash (SRS 2.4). */
export const findClash = (bookings: Booking[], resourceId: string, start: string, end: string) =>
  bookings.find(
    (booking) =>
      booking.resource_id === resourceId && start < booking.end_time && booking.start_time < end
  );

export function fitsAvailability(windows: AvailabilityWindow[], start: Date, end: Date) {
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start >= end) return false;
  const startDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());
  const endDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  if (startDay !== endDay) return false;
  const clock = (date: Date) => date.toISOString().slice(11, 16);
  return windows.some((window) =>
    window.weekday === start.getUTCDay() && clock(start) >= window.start && clock(end) <= window.end
  );
}
