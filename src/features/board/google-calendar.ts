import type { Task } from "@/lib/types";

type CalendarTask = Pick<Task, "title" | "description" | "start_date" | "due_date">;

// Task editing treats these as date-only values; preserve that date rather than
// converting the stored timestamp into the viewer's timezone.
function calendarDate(value: string | null): string | null {
  if (!value) return null;
  const day = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const parsed = new Date(`${day}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === day ? day : null;
}

export function googleCalendarUrl(task: CalendarTask, boardUrl: string): string | null {
  const start = calendarDate(task.start_date);
  const due = calendarDate(task.due_date);
  if (!start && !due) return null;
  // A reversed range is represented as a deadline, never a negative event.
  const first = start && (!due || start <= due) ? start : due!;
  const last = due ?? first;
  const exclusiveEnd = new Date(`${last}T00:00:00Z`);
  exclusiveEnd.setUTCDate(exclusiveEnd.getUTCDate() + 1);
  const dates = `${first.replaceAll("-", "")}/${exclusiveEnd.toISOString().slice(0, 10).replaceAll("-", "")}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: task.title,
    dates,
    details: [task.description, `Task board: ${boardUrl}`].filter(Boolean).join("\n\n"),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
