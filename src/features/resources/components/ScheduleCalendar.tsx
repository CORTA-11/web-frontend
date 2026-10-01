"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enGB } from "date-fns/locale";
import type { Booking, Resource } from "@/lib/types";
import { dateTimeInput, fromDateTimeInput, zonedDate } from "@/lib/time-zone";
import { useTimeZone } from "@/lib/use-time-zone";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/features/resources/calendar.css";

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales: { "en-GB": enGB },
});

type Slot = { start: Date; end: Date; resourceId?: string };

type Props = {
  resources: Resource[];
  bookings: Booking[];
  onPickSlot?: (slot: Slot) => void;
};

export function ScheduleCalendar({ resources, bookings, onPickSlot }: Props) {
  const zone = useTimeZone();
  const [view, setView] = useState<View>(Views.DAY);
  const [date, setDate] = useState<Date | null>(null);

  const bookable = resources.filter((resource) => resource.enabled);

  const events = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: booking.details_visible ? `${booking.team_name} · ${booking.purpose}` : "Reserved",
        start: zonedDate(booking.start_time, zone),
        end: zonedDate(booking.end_time, zone),
        resourceId: booking.resource_id,
      })),
    [bookings, zone]
  );

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return (
    <div className="min-w-0">
      <p className="data-mono mb-2 text-muted-foreground">Time zone: {zone}</p>
      <div className="h-[32rem]">
      <Calendar
        localizer={localizer}
        culture="en-GB"
        events={events}
        resources={view === Views.DAY ? bookable.map((r) => ({ id: r.id, title: r.name })) : undefined}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        view={view}
        onView={setView}
        date={date ?? zonedDate(new Date(), zone)}
        getNow={() => zonedDate(new Date(), zone)}
        onNavigate={setDate}
        views={[Views.DAY, Views.WEEK, Views.AGENDA]}
        step={30}
        timeslots={2}
        min={dayStart}
        max={dayEnd}
        selectable={Boolean(onPickSlot)}
        onSelectSlot={(slot) =>
          onPickSlot?.({
            start: fromDateTimeInput(dateTimeInput(slot.start, Intl.DateTimeFormat().resolvedOptions().timeZone), zone),
            end: fromDateTimeInput(dateTimeInput(slot.end, Intl.DateTimeFormat().resolvedOptions().timeZone), zone),
            resourceId: slot.resourceId as string,
          })
        }
        popup
      />
      </div>
    </div>
  );
}
