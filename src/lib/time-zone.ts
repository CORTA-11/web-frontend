const STORAGE_KEY = "synodus.time-zone";
let selected = "UTC";
const listeners = new Set<() => void>();

export const getTimeZone = () => selected;
export const serverTimeZone = () => "UTC";
export const subscribeTimeZone = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

export function isTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function setTimeZone(value: string) {
  if (!isTimeZone(value)) return;
  selected = value;
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* Preferences work without storage. */ }
  listeners.forEach((listener) => listener());
}

export function initialiseTimeZone() {
  let saved: string | null = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* Use the device default. */ }
  setTimeZone(saved && isTimeZone(saved) ? saved : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    selected = event.newValue && isTimeZone(event.newValue)
      ? event.newValue : Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    listeners.forEach((listener) => listener());
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function wallParts(date: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((entry) => entry.type === type)?.value);
  return [part("year"), part("month") - 1, part("day"), part("hour"), part("minute"), part("second"), date.getMilliseconds()] as const;
}

/** Calendar widgets require browser-local Date objects representing selected-zone wall time. */
export function zonedDate(value: string | Date, zone = getTimeZone()) {
  const date = typeof value === "string" ? new Date(value) : value;
  return Number.isFinite(date.getTime()) ? new Date(...wallParts(date, zone)) : new Date(NaN);
}

export function dateTimeInput(value: Date, zone = getTimeZone()) {
  const [year, month, day, hour, minute] = wallParts(value, zone);
  const pad = (number: number) => String(number).padStart(2, "0");
  return `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** Reject DST gaps; repeated wall times deterministically resolve to one valid instant. */
export function fromDateTimeInput(value: string, zone = getTimeZone()) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?$/.test(value)) return new Date(NaN);
  const target = new Date(`${value}Z`).getTime();
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0, 16) !== value.slice(0, 16)) return new Date(NaN);
  let instant = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const represented = Date.UTC(...wallParts(new Date(instant), zone));
    const adjustment = target - represented;
    if (!adjustment) return new Date(instant);
    instant += adjustment;
  }
  return new Date(NaN);
}
