import type { Booking, Resource } from "@/lib/types";
import { zonedDate } from "@/lib/time-zone";

/** Expand UTC recurrence before converting to wall time; bookings never change with the display zone. */
export function availableBlocks(resource: Resource, bookings: Booking[], anchor: Date, zone: string) {
  if (!resource.enabled) return [];
  const blocks: { start: Date; end: Date; title: string }[] = [];
  const reserved = bookings.filter((booking) => booking.resource_id === resource.id);
  // Covers day, week and the calendar's 30-day agenda, including zone rollovers.
  for (let offset = -8; offset <= 40; offset++) {
    const day = new Date(Date.UTC(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + offset));
    for (const window of resource.availability.filter((entry) => entry.weekday === day.getUTCDay())) {
      const at = (clock: string) => new Date(`${day.toISOString().slice(0, 10)}T${clock}:00Z`).getTime();
      let free = [{ start: at(window.start), end: at(window.end) }];
      for (const booking of reserved) {
        const start = new Date(booking.start_time).getTime();
        const end = new Date(booking.end_time).getTime();
        free = free.flatMap((block) => {
          if (end <= block.start || start >= block.end) return [block];
          return [
            { start: block.start, end: Math.min(start, block.end) },
            { start: Math.max(end, block.start), end: block.end },
          ].filter((part) => part.start < part.end);
        });
      }
      blocks.push(...free.filter((block) => block.start < block.end).map((block) => ({
        start: zonedDate(new Date(block.start), zone),
        end: zonedDate(new Date(block.end), zone),
        title: "Available",
      })));
    }
  }
  return blocks;
}
