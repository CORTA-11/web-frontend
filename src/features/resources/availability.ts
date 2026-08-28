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

/** Advisory only — the server rejects the real clash (SRS 2.4). */
export const findClash = (bookings: Booking[], resourceId: string, start: string, end: string) =>
  bookings.find(
    (booking) =>
      booking.resource_id === resourceId && start < booking.end_time && booking.start_time < end
  );
