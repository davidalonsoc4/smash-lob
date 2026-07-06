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
