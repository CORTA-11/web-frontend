"use client";

import { useState } from "react";
import { availableBlocks } from "@/features/resources/available-blocks";
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

  const [tag, setTag] = useState("");
  const resource = resources.find((item) => item.code === tag);
  const events = bookings.filter((booking) => booking.resource_id === resource?.id).map((booking) => ({
    id: booking.id,
    title: booking.details_visible ? `${booking.team_name} · ${booking.purpose}` : "Reserved",
    start: zonedDate(booking.start_time, zone),
    end: zonedDate(booking.end_time, zone),
  }));
  const displayedDate = date ?? zonedDate(new Date(), zone);
  const backgroundEvents = resource ? availableBlocks(resource, bookings, displayedDate, zone) : [];

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date();
  dayEnd.setHours(23, 59, 59, 999);

  return (
    <div className="min-w-0">
      <div className="mb-4 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="label-eyebrow">Resource tag</span>
          <select className="select-field" aria-label="Resource tag" value={tag} onChange={(event) => setTag(event.target.value)}>
            <option value="">Select a tag from inventory</option>
            {resources.map((item) => <option key={item.id} value={item.code}>{item.code}</option>)}
          </select>
        </label>
        {resource && <span className="text-sm">{resource.name}</span>}
        <span className="data-mono text-xs text-muted-foreground">{zone}</span>
        <span className="schedule-available-key text-xs">Available</span>
        <span className="schedule-booked-key text-xs">Booked</span>
      </div>
      {resource && <div className="h-[32rem]">
      <Calendar
        localizer={localizer}
        culture="en-GB"
        events={events}
        backgroundEvents={backgroundEvents}
        eventPropGetter={() => ({ className: "schedule-booked" })}
        view={view}
        onView={setView}
        date={displayedDate}
        getNow={() => zonedDate(new Date(), zone)}
        onNavigate={setDate}
        views={[Views.DAY, Views.WEEK, Views.AGENDA]}
        step={30}
        timeslots={2}
        min={dayStart}
        max={dayEnd}
        selectable={resource.enabled && Boolean(onPickSlot)}
        onSelectSlot={(slot) =>
          onPickSlot?.({
            start: fromDateTimeInput(dateTimeInput(slot.start, Intl.DateTimeFormat().resolvedOptions().timeZone), zone),
            end: fromDateTimeInput(dateTimeInput(slot.end, Intl.DateTimeFormat().resolvedOptions().timeZone), zone),
            resourceId: resource.id,
          })
        }
        popup
      />
      </div>}
    </div>
  );
}
