const localDateTimePattern =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/;
const timeZoneSuffixPattern = /(Z|[+-]\d{2}:?\d{2})$/i;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function parseLocalDateTime(value: string) {
  const match = value.trim().match(localDateTimePattern);

  if (!match) {
    return null;
  }

  const [, year, month, day, hour, minute, second = "00"] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function parseMatchScheduleDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const date = timeZoneSuffixPattern.test(trimmed)
    ? new Date(trimmed)
    : parseLocalDateTime(trimmed) ?? new Date(trimmed);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function dateTimeLocalToUtcIso(value: string) {
  const trimmed = value.trim();
  const date = timeZoneSuffixPattern.test(trimmed)
    ? parseMatchScheduleDate(trimmed)
    : parseLocalDateTime(trimmed) ?? parseMatchScheduleDate(trimmed);

  if (!date) {
    return trimmed;
  }

  return date.toISOString();
}

export function formatScheduleForDateTimeInput(value: string | null | undefined) {
  const date = parseMatchScheduleDate(value);

  if (!date) {
    return value ?? "";
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}


export function formatNextFullHourForDateTimeInput(now = new Date()) {
  const nextHour = new Date(now);
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);

  return `${nextHour.getFullYear()}-${pad(nextHour.getMonth() + 1)}-${pad(
    nextHour.getDate(),
  )}T${pad(nextHour.getHours())}:00`;
}


export function toCalendarFloatingDate(value: Date) {
  return `${value.getFullYear()}${pad(value.getMonth() + 1)}${pad(
    value.getDate(),
  )}T${pad(value.getHours())}${pad(value.getMinutes())}${pad(
    value.getSeconds(),
  )}`;
}
