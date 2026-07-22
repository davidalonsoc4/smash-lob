import type { MatchStatus } from "@/context/MatchDataProvider";
import { parseMatchScheduleDate } from "@/lib/matchScheduleTime";

export type MatchDisplayStatus = MatchStatus | "in_progress" | "result_pending";

export const MATCH_IN_PROGRESS_WINDOW_MINUTES = 120;
export const MATCH_IN_PROGRESS_WINDOW_MS =
  MATCH_IN_PROGRESS_WINDOW_MINUTES * 60 * 1000;

export const RESULT_REMINDER_HOURS = [2, 3, 4, 24] as const;
export type ResultReminderHour = (typeof RESULT_REMINDER_HOURS)[number];
export const MVP_VOTE_REMINDER_HOURS = RESULT_REMINDER_HOURS;
export type MvpVoteReminderHour = ResultReminderHour;
export const RESULT_CONFIRMATION_REMINDER_HOURS = [2, 3, 4] as const;
export type ResultConfirmationReminderHour =
  (typeof RESULT_CONFIRMATION_REMINDER_HOURS)[number];
export const RESULT_CONFIRMATION_AUTO_VALIDATION_HOURS = 24;

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
  return (
    getDueMatchResultReminderHours({
      status,
      scheduledAt,
      resultRecordedAt,
      now,
    }).length > 0
  );
}

export function getDueMvpVoteReminderHours({
  resultRecordedAt,
  now = new Date(),
}: {
  resultRecordedAt?: string | null;
  now?: Date;
}): MvpVoteReminderHour[] {
  if (!resultRecordedAt) {
    return [];
  }

  const resultDate = new Date(resultRecordedAt);

  if (Number.isNaN(resultDate.getTime())) {
    return [];
  }

  const elapsedMs = now.getTime() - resultDate.getTime();

  if (elapsedMs < 0) {
    return [];
  }

  return MVP_VOTE_REMINDER_HOURS.filter(
    (hour) => elapsedMs >= hour * 60 * 60 * 1000,
  );
}

export function getDueResultConfirmationReminderHours({
  resultRecordedAt,
  now = new Date(),
}: {
  resultRecordedAt?: string | null;
  now?: Date;
}): ResultConfirmationReminderHour[] {
  if (!resultRecordedAt) {
    return [];
  }

  const resultDate = new Date(resultRecordedAt);

  if (Number.isNaN(resultDate.getTime())) {
    return [];
  }

  const elapsedMs = now.getTime() - resultDate.getTime();

  if (elapsedMs < 0) {
    return [];
  }

  return RESULT_CONFIRMATION_REMINDER_HOURS.filter(
    (hour) => elapsedMs >= hour * 60 * 60 * 1000,
  );
}

export function isResultConfirmationAutoValidationDue({
  resultRecordedAt,
  now = new Date(),
}: {
  resultRecordedAt?: string | null;
  now?: Date;
}) {
  if (!resultRecordedAt) {
    return false;
  }

  const resultDate = new Date(resultRecordedAt);

  if (Number.isNaN(resultDate.getTime())) {
    return false;
  }

  return (
    now.getTime() - resultDate.getTime() >=
    RESULT_CONFIRMATION_AUTO_VALIDATION_HOURS * 60 * 60 * 1000
  );
}

export function isMatchCompetitionComplete(match: {
  status: string
  resultCounts?: boolean
  resolutionType?: string | null
}) {
  if (match.status !== "finished") {
    return false
  }

  if (match.resultCounts !== false) {
    return true
  }

  return (
    match.resolutionType === "cancelled" ||
    match.resolutionType === "no_show" ||
    match.resolutionType === "abandoned" ||
    match.resolutionType === "administrative"
  )
}
