"use client";

import { useMemo, useState } from "react";
import { Calendar, dateFnsLocalizer, Views, type View } from "react-big-calendar";
import { format, getDay, parse, startOfWeek } from "date-fns";
import { enGB } from "date-fns/locale";
import type { Booking, Resource } from "@/lib/types";
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

const hourFrom = (times: string[], fallback: number, pick: (values: number[]) => number) =>
  times.length ? pick(times.map((time) => Number(time.slice(0, 2)))) : fallback;

export function ScheduleCalendar({ resources, bookings, onPickSlot }: Props) {
  const [view, setView] = useState<View>(Views.DAY);
  const [date, setDate] = useState(new Date());

  const bookable = resources.filter((resource) => resource.enabled);
  const windows = bookable.flatMap((resource) => resource.availability);

  const events = useMemo(
    () =>
      bookings.map((booking) => ({
        id: booking.id,
        title: booking.details_visible ? `${booking.team_name} · ${booking.purpose}` : "Reserved",
        start: new Date(booking.start_time),
        end: new Date(booking.end_time),
        resourceId: booking.resource_id,
      })),
    [bookings]
  );

  const dayStart = new Date();
  dayStart.setHours(hourFrom(windows.map((w) => w.start), 7, (values) => Math.min(...values)), 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(hourFrom(windows.map((w) => w.end), 22, (values) => Math.max(...values)), 0, 0, 0);

  return (
    <div className="h-[32rem] min-w-0">
      <Calendar
        localizer={localizer}
        culture="en-GB"
        events={events}
        resources={view === Views.DAY ? bookable.map((r) => ({ id: r.id, title: r.name })) : undefined}
        resourceIdAccessor="id"
        resourceTitleAccessor="title"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={[Views.DAY, Views.WEEK, Views.AGENDA]}
        step={30}
        timeslots={2}
        min={dayStart}
        max={dayEnd}
        selectable={Boolean(onPickSlot)}
        onSelectSlot={(slot) =>
          onPickSlot?.({ start: slot.start, end: slot.end, resourceId: slot.resourceId as string })
        }
        popup
      />
    </div>
  );
}
