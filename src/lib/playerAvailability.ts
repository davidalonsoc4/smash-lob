export type WeekdayId =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type AvailabilitySlot = {
  start: string;
  end: string;
};

export type WeeklyAvailability = Record<WeekdayId, AvailabilitySlot[]>;

export type DateAvailabilityOverrides = Record<string, AvailabilitySlot[]>;

export type PlayerAvailability = {
  leagueId: string;
  seasonId: string;
  playerId: string;
  userId?: string | null;
  timezone: string;
  weeklySlots: WeeklyAvailability;
  dateOverrides: DateAvailabilityOverrides;
  updatedAt?: string | null;
};

export const weekdayIds: WeekdayId[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const weekdayLabels: Record<WeekdayId, string> = {
  monday: "Lunes",
  tuesday: "Martes",
  wednesday: "Miércoles",
  thursday: "Jueves",
  friday: "Viernes",
  saturday: "Sábado",
  sunday: "Domingo",
};

const availabilityStorageKey = "smash-lob-player-availability";
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const supabaseUuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSupabaseBackedAvailabilityId(id: string) {
  return supabaseUuidPattern.test(id);
}

export function getBrowserTimezone() {
  if (typeof Intl === "undefined") {
    return "Europe/Madrid";
  }

  return Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Madrid";
}

export function createEmptyWeeklyAvailability(): WeeklyAvailability {
  return {
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  };
}

export function createEmptyPlayerAvailability({
  leagueId,
  seasonId,
  playerId,
  userId = null,
  timezone = getBrowserTimezone(),
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
  userId?: string | null;
  timezone?: string;
}): PlayerAvailability {
  return {
    leagueId,
    seasonId,
    playerId,
    userId,
    timezone,
    weeklySlots: createEmptyWeeklyAvailability(),
    dateOverrides: {},
    updatedAt: null,
  };
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);

  return hours * 60 + minutes;
}

function isValidSlot(value: unknown): value is AvailabilitySlot {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const slot = value as Record<string, unknown>;

  if (typeof slot.start !== "string" || typeof slot.end !== "string") {
    return false;
  }

  return (
    timePattern.test(slot.start) &&
    timePattern.test(slot.end) &&
    timeToMinutes(slot.end) > timeToMinutes(slot.start)
  );
}

export function normalizeAvailabilitySlots(value: unknown): AvailabilitySlot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(isValidSlot)
    .map((slot) => ({
      start: slot.start,
      end: slot.end,
    }))
    .sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
}

export function normalizeWeeklyAvailability(value: unknown): WeeklyAvailability {
  const weeklySlots = createEmptyWeeklyAvailability();

  if (typeof value !== "object" || value === null) {
    return weeklySlots;
  }

  const item = value as Record<string, unknown>;

  weekdayIds.forEach((weekdayId) => {
    weeklySlots[weekdayId] = normalizeAvailabilitySlots(item[weekdayId]);
  });

  return weeklySlots;
}

export function normalizeDateAvailabilityOverrides(
  value: unknown,
): DateAvailabilityOverrides {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .map(([date, slots]) => [date, normalizeAvailabilitySlots(slots)]),
  );
}

export function normalizePlayerAvailability(value: unknown): PlayerAvailability | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const item = value as Record<string, unknown>;

  if (
    typeof item.leagueId !== "string" ||
    typeof item.seasonId !== "string" ||
    typeof item.playerId !== "string"
  ) {
    return null;
  }

  return {
    leagueId: item.leagueId,
    seasonId: item.seasonId,
    playerId: item.playerId,
    userId:
      typeof item.userId === "string"
        ? item.userId
        : null,
    timezone: typeof item.timezone === "string" ? item.timezone : "Europe/Madrid",
    weeklySlots: normalizeWeeklyAvailability(item.weeklySlots),
    dateOverrides: normalizeDateAvailabilityOverrides(item.dateOverrides),
    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : null,
  };
}

export function getAvailabilityStorageId({
  leagueId,
  seasonId,
  playerId,
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
}) {
  return `${leagueId}:${seasonId}:${playerId}`;
}

export function readStoredPlayerAvailabilities() {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(availabilityStorageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map(normalizePlayerAvailability)
      .filter((item): item is PlayerAvailability => Boolean(item));
  } catch {
    return [];
  }
}

export function findStoredPlayerAvailability({
  leagueId,
  seasonId,
  playerId,
}: {
  leagueId: string;
  seasonId: string;
  playerId: string;
}) {
  const storageId = getAvailabilityStorageId({ leagueId, seasonId, playerId });

  return (
    readStoredPlayerAvailabilities().find(
      (availability) =>
        getAvailabilityStorageId(availability) === storageId,
    ) ?? null
  );
}

export function upsertStoredPlayerAvailability(
  availability: PlayerAvailability,
) {
  if (typeof window === "undefined") {
    return;
  }

  const storageId = getAvailabilityStorageId(availability);
  const nextAvailability = {
    ...availability,
    weeklySlots: normalizeWeeklyAvailability(availability.weeklySlots),
    dateOverrides: normalizeDateAvailabilityOverrides(availability.dateOverrides),
    updatedAt: new Date().toISOString(),
  };
  const items = readStoredPlayerAvailabilities();
  const nextItems = [
    ...items.filter((item) => getAvailabilityStorageId(item) !== storageId),
    nextAvailability,
  ];

  window.localStorage.setItem(availabilityStorageKey, JSON.stringify(nextItems));
}

export function countWeeklyAvailabilitySlots(weeklySlots: WeeklyAvailability) {
  return weekdayIds.reduce(
    (total, weekdayId) => total + weeklySlots[weekdayId].length,
    0,
  );
}

export type AvailabilityRecommendation = {
  date: string;
  dateLabel: string;
  timeLabel: string;
  dateTimeLocalValue: string;
  start: string;
  end: string;
  coverage: number;
  configuredPlayerCount: number;
  isCommonForConfiguredPlayers: boolean;
  availablePlayerIds: string[];
  missingPlayerIds: string[];
};

type BuildAvailabilityRecommendationsParams = {
  playerIds: string[];
  availabilities: PlayerAvailability[];
  startsAt: string | null;
  endsAt: string | null;
  slotDurationMinutes?: number;
  stepMinutes?: number;
  maxResults?: number;
};

const weekdayByDateIndex: WeekdayId[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function minutesToTime(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);

  return result;
}

function getDateRange({
  startsAt,
  endsAt,
}: {
  startsAt: string | null;
  endsAt: string | null;
}) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const startDate = startsAt ? parseDateValue(startsAt) : today;
  const endDate = endsAt ? parseDateValue(endsAt) : addDays(startDate, 21);
  const safeStartDate = startDate < today ? today : startDate;

  if (endDate < safeStartDate) {
    return [];
  }

  const dates: Date[] = [];
  const cursor = new Date(safeStartDate);

  while (cursor <= endDate && dates.length < 35) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getWeekdayIdForDate(date: Date) {
  return weekdayByDateIndex[date.getDay()];
}

function getAvailabilitySlotsForDate({
  availability,
  date,
}: {
  availability: PlayerAvailability | null | undefined;
  date: string;
}) {
  if (!availability) {
    return [];
  }

  if (Object.prototype.hasOwnProperty.call(availability.dateOverrides, date)) {
    return normalizeAvailabilitySlots(availability.dateOverrides[date]);
  }

  const weekdayId = getWeekdayIdForDate(parseDateValue(date));

  return normalizeAvailabilitySlots(availability.weeklySlots[weekdayId]);
}

function isSlotCovered({
  slots,
  startMinutes,
  endMinutes,
}: {
  slots: AvailabilitySlot[];
  startMinutes: number;
  endMinutes: number;
}) {
  return slots.some(
    (slot) =>
      timeToMinutes(slot.start) <= startMinutes &&
      timeToMinutes(slot.end) >= endMinutes,
  );
}

function isFutureCandidate(dateTimeLocalValue: string) {
  const candidate = new Date(dateTimeLocalValue);
  const now = new Date();

  return candidate.getTime() > now.getTime() + 30 * 60 * 1000;
}


function getCandidateStartMinutesFromSlots({
  slots,
  slotDurationMinutes,
  stepMinutes,
}: {
  slots: AvailabilitySlot[];
  slotDurationMinutes: number;
  stepMinutes: number;
}) {
  const candidateStartMinutes = new Set<number>();

  slots.forEach((slot) => {
    const slotStart = timeToMinutes(slot.start);
    const slotEnd = timeToMinutes(slot.end);
    const latestStart = slotEnd - slotDurationMinutes;

    if (latestStart < slotStart) {
      return;
    }

    for (
      let startMinutes = slotStart;
      startMinutes <= latestStart;
      startMinutes += stepMinutes
    ) {
      candidateStartMinutes.add(startMinutes);
    }
  });

  return [...candidateStartMinutes].sort((a, b) => a - b);
}


function formatRecommendationDateLabel(date: Date) {
  const weekday = new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
  }).format(date);
  const dayMonth = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
  const capitalizedWeekday =
    weekday.charAt(0).toLocaleUpperCase("es-ES") + weekday.slice(1);

  return `${capitalizedWeekday}, ${dayMonth}`;
}

function hasAnyAvailabilitySlot(availability: PlayerAvailability) {
  return (
    countWeeklyAvailabilitySlots(availability.weeklySlots) > 0 ||
    Object.values(availability.dateOverrides).some(
      (slots) => normalizeAvailabilitySlots(slots).length > 0,
    )
  );
}

function getRecommendedDefaultCandidate(
  recommendations: AvailabilityRecommendation[],
  totalPlayers: number,
) {
  return (
    recommendations.find((recommendation) => recommendation.coverage === totalPlayers) ??
    recommendations.find(
      (recommendation) => recommendation.isCommonForConfiguredPlayers,
    ) ??
    null
  );
}

export function getRecommendedDefaultDateTimeLocalValue({
  playerIds,
  availabilities,
  startsAt,
  endsAt,
}: BuildAvailabilityRecommendationsParams) {
  const uniquePlayerIds = [...new Set(playerIds)].filter(Boolean);

  if (uniquePlayerIds.length === 0) {
    return null;
  }

  const recommendations = buildAvailabilityRecommendations({
    playerIds: uniquePlayerIds,
    availabilities,
    startsAt,
    endsAt,
    maxResults: 20,
  });
  const defaultCandidate = getRecommendedDefaultCandidate(
    recommendations,
    uniquePlayerIds.length,
  );

  return defaultCandidate?.dateTimeLocalValue ?? null;
}

export function buildAvailabilityRecommendations({
  playerIds,
  availabilities,
  startsAt,
  endsAt,
  slotDurationMinutes = 120,
  stepMinutes = 30,
  maxResults = 5,
}: BuildAvailabilityRecommendationsParams): AvailabilityRecommendation[] {
  const uniquePlayerIds = [...new Set(playerIds)].filter(Boolean);

  if (uniquePlayerIds.length === 0) {
    return [];
  }

  const availabilityByPlayerId = new Map(
    availabilities.map((availability) => [availability.playerId, availability]),
  );
  const configuredPlayerIds = uniquePlayerIds.filter((playerId) => {
    const availability = availabilityByPlayerId.get(playerId);

    return availability ? hasAnyAvailabilitySlot(availability) : false;
  });

  if (configuredPlayerIds.length === 0) {
    return [];
  }

  const dates = getDateRange({ startsAt, endsAt });
  const recommendations: AvailabilityRecommendation[] = [];

  dates.forEach((date) => {
    const dateValue = formatDateValue(date);
    const playerSlots = uniquePlayerIds.map((playerId) => ({
      playerId,
      slots: getAvailabilitySlotsForDate({
        availability: availabilityByPlayerId.get(playerId),
        date: dateValue,
      }),
    }));
    const candidateStartMinutes = [
      ...new Set(
        playerSlots.flatMap(({ slots }) =>
          getCandidateStartMinutesFromSlots({
            slots,
            slotDurationMinutes,
            stepMinutes,
          }),
        ),
      ),
    ].sort((a, b) => a - b);

    candidateStartMinutes.forEach((startMinutes) => {
      const endMinutes = startMinutes + slotDurationMinutes;
      const availablePlayerIds = playerSlots
        .filter(({ slots }) => isSlotCovered({ slots, startMinutes, endMinutes }))
        .map(({ playerId }) => playerId);
      const isCommonForConfiguredPlayers =
        configuredPlayerIds.length > 0 &&
        configuredPlayerIds.every((playerId) =>
          availablePlayerIds.includes(playerId),
        );
      const isCompleteMatch = availablePlayerIds.length === uniquePlayerIds.length;
      const hasUsefulPartialMatch =
        availablePlayerIds.length >= Math.min(3, uniquePlayerIds.length);

      if (!isCompleteMatch && !isCommonForConfiguredPlayers && !hasUsefulPartialMatch) {
        return;
      }

      const start = minutesToTime(startMinutes);
      const end = minutesToTime(endMinutes);
      const dateTimeLocalValue = `${dateValue}T${start}`;

      if (!isFutureCandidate(dateTimeLocalValue)) {
        return;
      }

      recommendations.push({
        date: dateValue,
        dateLabel: formatRecommendationDateLabel(date),
        timeLabel: `${start} - ${end}`,
        dateTimeLocalValue,
        start,
        end,
        coverage: availablePlayerIds.length,
        configuredPlayerCount: configuredPlayerIds.length,
        isCommonForConfiguredPlayers,
        availablePlayerIds,
        missingPlayerIds: uniquePlayerIds.filter(
          (playerId) => !availablePlayerIds.includes(playerId),
        ),
      });
    });
  });

  return recommendations
    .sort((a, b) => {
      const aIsComplete = a.coverage === uniquePlayerIds.length;
      const bIsComplete = b.coverage === uniquePlayerIds.length;

      if (aIsComplete !== bIsComplete) {
        return aIsComplete ? -1 : 1;
      }

      if (a.isCommonForConfiguredPlayers !== b.isCommonForConfiguredPlayers) {
        return a.isCommonForConfiguredPlayers ? -1 : 1;
      }

      if (b.coverage !== a.coverage) {
        return b.coverage - a.coverage;
      }

      return a.dateTimeLocalValue.localeCompare(b.dateTimeLocalValue);
    })
    .slice(0, maxResults);
}
