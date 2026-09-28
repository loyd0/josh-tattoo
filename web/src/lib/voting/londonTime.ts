const LONDON = "Europe/London";

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

type Clock = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function londonClock(date: Date): Clock {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "NaN");
  let hour = read("hour");
  if (hour === 24) hour = 0;
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour,
    minute: read("minute"),
    second: read("second"),
  };
}

export function formatLondonLocal(date: Date): string {
  const clock = londonClock(date);
  return `${clock.year}-${pad(clock.month)}-${pad(clock.day)}T${pad(clock.hour)}:${pad(clock.minute)}`;
}

export function formatLondonLong(date: Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Interpret `YYYY-MM-DDTHH:mm` as Europe/London. Returns null for a DST gap or junk. */
export function parseLondonLocal(local: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  const desired = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utc = desired;
  for (let i = 0; i < 4; i++) {
    const clock = londonClock(new Date(utc));
    const asUtc = Date.UTC(
      clock.year,
      clock.month - 1,
      clock.day,
      clock.hour,
      clock.minute,
      clock.second,
    );
    const offset = asUtc - utc;
    const next = desired - offset;
    if (next === utc) break;
    utc = next;
  }

  const date = new Date(utc);
  if (Number.isNaN(date.getTime())) return null;
  if (formatLondonLocal(date) !== local.trim()) return null;
  return date;
}
