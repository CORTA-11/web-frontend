"use client";

import { EmptyState } from "@/components/common/EmptyState";
import { duration, slot } from "@/lib/format";
import type { Booking, Resource } from "@/lib/types";

export function UpcomingBookings({
  bookings, resources,
}: {
  bookings: Booking[];
  resources: Resource[];
}) {
  if (!bookings.length) {
    return <EmptyState title="No bookings coming up" hint="Approved resource slots appear here." />;
  }

  return (
    <ul className="flex flex-col gap-px">
      {bookings.map((booking) => {
        const resource = resources.find((entry) => entry.id === booking.resource_id);
        return (
          <li key={booking.id} className="flex items-baseline gap-3 border-l-2 border-primary/50 bg-card px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm">{resource?.name ?? "Resource"}</span>
            <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
              {booking.team_name} · {booking.purpose}
            </span>
            <span className="data-mono shrink-0 text-muted-foreground">
              {slot(booking.start_time, booking.end_time)} · {duration(booking.start_time, booking.end_time)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
