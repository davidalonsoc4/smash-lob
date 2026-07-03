import type { MatchStatus } from "@/context/MatchDataProvider";
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime";

export type MatchDisplayStatus = MatchStatus | "in_progress" | "result_pending";

export const MATCH_IN_PROGRESS_WINDOW_MINUTES = 120;
export const MATCH_IN_PROGRESS_WINDOW_MS =
  MATCH_IN_PROGRESS_WINDOW_MINUTES * 60 * 1000;

export const RESULT_REMINDER_HOURS = [2, 3, 4, 24] as const;
export type ResultReminderHour = (typeof RESULT_REMINDER_HOURS)[number];

function parseScheduledAt(scheduledAt: string | null | undefined) {
  return parseMatchScheduleDate(scheduledAt);
}

export function getMatchDisplayStatus({
  status,
  scheduledAt,
  resultRecordedAt,
  now = new Date(),
}: {
  status: string;
  scheduledAt?: string | null;
  resultRecordedAt?: string | null;
  now?: Date;
}): MatchDisplayStatus {
  if (status === "finished") {
    return "finished";
  }

  if (status === "postponed") {
    return "postponed";
  }

  if (status !== "scheduled") {
    return "scheduling";
  }

  const scheduledDate = parseScheduledAt(scheduledAt);

  if (!scheduledDate) {
    return "scheduled";
  }

  const nowTime = now.getTime();
  const scheduledTime = scheduledDate.getTime();
  const inProgressUntil = scheduledTime + MATCH_IN_PROGRESS_WINDOW_MS;

  if (nowTime >= scheduledTime && nowTime < inProgressUntil) {
    return "in_progress";
  }

  if (nowTime >= inProgressUntil && !resultRecordedAt) {
    return "result_pending";
  }

  return "scheduled";
}

export function isMatchInProgressWindow({
  status,
  scheduledAt,
  resultRecordedAt,
  now = new Date(),
}: {
  status: string;
  scheduledAt?: string | null;
  resultRecordedAt?: string | null;
  now?: Date;
}) {
  return (
    getMatchDisplayStatus({ status, scheduledAt, resultRecordedAt, now }) ===
    "in_progress"
  );
}

export function getDueMatchResultReminderHours({
  status,
  scheduledAt,
  resultRecordedAt,
  now = new Date(),
}: {
  status: string;
  scheduledAt?: string | null;
  resultRecordedAt?: string | null;
  now?: Date;
}): ResultReminderHour[] {
  if (status !== "scheduled" || resultRecordedAt) {
    return [];
  }

  const scheduledDate = parseScheduledAt(scheduledAt);

  if (!scheduledDate) {
    return [];
  }

  const elapsedMs = now.getTime() - scheduledDate.getTime();

  if (elapsedMs < 0) {
    return [];
  }

  return RESULT_REMINDER_HOURS.filter(
    (hour) => elapsedMs >= hour * 60 * 60 * 1000,
  );
}

export function isMatchResultReminderDue({
  status,
  scheduledAt,
  resultRecordedAt,
  now = new Date(),
}: {
  status: string;
  scheduledAt?: string | null;
  resultRecordedAt?: string | null;
  now?: Date;
}) {
  return getDueMatchResultReminderHours({
    status,
    scheduledAt,
    resultRecordedAt,
    now,
  }).length > 0;
}
