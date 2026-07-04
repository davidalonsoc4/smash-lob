export type LeagueLocation = {
  id: string;
  name: string;
  town?: string | null;
  address?: string | null;
  /** Legacy field from v0.7.37 and earlier. Kept only to read old data safely. */
  detail?: string | null;
  courtCount?: number | null;
  selectedCourt?: string | null;
  googlePlaceId?: string | null;
  googlePlaceName?: string | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

const fallbackLocationPrefix = "court";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(value: unknown) {
  const cleanValue = cleanString(value);

  return cleanValue.length > 0 ? cleanValue : null;
}

function cleanNullableNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function cleanNullablePositiveInteger(value: unknown) {
  const parsedValue =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    return null;
  }

  return Math.min(Math.floor(parsedValue), 99);
}

function createLocationId({
  name,
  town,
  googlePlaceId,
  address,
}: {
  name: string;
  town?: string | null;
  googlePlaceId?: string | null;
  address?: string | null;
}) {
  if (googlePlaceId) {
    return `google-${slugify(googlePlaceId).slice(0, 64) || Date.now()}`;
  }

  return `${fallbackLocationPrefix}-${slugify(`${town ?? ""}-${name}-${address ?? ""}`) || Date.now()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanSelectedCourt(value: unknown) {
  const cleanValue = cleanNullableString(value);

  if (!cleanValue) {
    return null;
  }

  return cleanValue;
}

export function getLeagueLocationCourts(location: LeagueLocation) {
  const courtCount = cleanNullablePositiveInteger(location.courtCount);

  if (!courtCount) {
    return [];
  }

  return Array.from({ length: courtCount }, (_, index) => `Pista ${index + 1}`);
}

export function normalizeLeagueLocation(value: unknown): LeagueLocation | null {
  if (typeof value === "string") {
    const cleanValue = value.trim();

    if (!cleanValue) {
      return null;
    }

    const parsedLocation = parseStoredLocationObject(cleanValue);

    if (parsedLocation) {
      return parsedLocation;
    }

    const mapsUrl = normalizeMapsUrl(cleanValue);

    return {
      id: createLocationId({ name: mapsUrl ? "Ubicación en Maps" : cleanValue }),
      name: mapsUrl ? "Ubicación en Maps" : cleanValue,
      town: null,
      address: mapsUrl ? null : cleanValue,
      detail: null,
      courtCount: null,
      selectedCourt: null,
      googlePlaceId: null,
      googlePlaceName: null,
      googleMapsUrl: mapsUrl,
      latitude: null,
      longitude: null,
    };
  }

  if (!isRecord(value)) {
    return null;
  }

  const name = cleanString(value.name);

  if (!name) {
    return null;
  }

  const rawAddress = cleanNullableString(value.address);
  const mapsUrlFromAddress = normalizeMapsUrl(rawAddress);
  const address = mapsUrlFromAddress ? null : rawAddress;
  const town =
    cleanNullableString(value.town) ??
    cleanNullableString(value.locality) ??
    cleanNullableString(value.city);
  const detail = cleanNullableString(value.detail);
  const courtCount = cleanNullablePositiveInteger(
    value.courtCount ?? value.courts ?? value.court_count,
  );
  const selectedCourt = cleanSelectedCourt(
    value.selectedCourt ?? value.court ?? value.courtName,
  );
  const googlePlaceId = cleanNullableString(value.googlePlaceId);
  const googlePlaceName = cleanNullableString(value.googlePlaceName);
  const googleMapsUrl =
    cleanNullableString(value.googleMapsUrl) ?? mapsUrlFromAddress;
  const latitude = cleanNullableNumber(value.latitude);
  const longitude = cleanNullableNumber(value.longitude);
  const id =
    cleanNullableString(value.id) ??
    createLocationId({ name, town, googlePlaceId, address });

  return {
    id,
    name,
    town,
    address,
    detail,
    courtCount,
    selectedCourt,
    googlePlaceId,
    googlePlaceName,
    googleMapsUrl,
    latitude,
    longitude,
  };
}

export function normalizeLeagueLocations(value: unknown): LeagueLocation[] {
  let rawLocations = value;

  if (typeof rawLocations === "string") {
    const cleanValue = rawLocations.trim();

    if (cleanValue.startsWith("[") && cleanValue.endsWith("]")) {
      try {
        rawLocations = JSON.parse(cleanValue);
      } catch {
        rawLocations = [cleanValue];
      }
    } else {
      rawLocations = [cleanValue];
    }
  }

  if (!Array.isArray(rawLocations)) {
    return [];
  }

  const seen = new Set<string>();
  const locations: LeagueLocation[] = [];

  rawLocations.forEach((item) => {
    const location = normalizeLeagueLocation(item);

    if (!location) {
      return;
    }

    const key = (
      location.googlePlaceId ??
      `${location.town ?? ""}|${location.name}|${location.address ?? ""}|${location.googleMapsUrl ?? ""}`
    ).toLowerCase();

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    locations.push(location);
  });

  return locations;
}

export function createLeagueLocation({
  name,
  town,
  address,
  courtCount,
  selectedCourt,
  googlePlaceId,
  googlePlaceName,
  googleMapsUrl,
  latitude,
  longitude,
}: Omit<LeagueLocation, "id" | "detail">): LeagueLocation | null {
  const cleanName = cleanString(name);

  if (!cleanName) {
    return null;
  }

  const cleanTown = cleanNullableString(town);
  const rawCleanAddress = cleanNullableString(address);
  const mapsUrlFromAddress = normalizeMapsUrl(rawCleanAddress);
  const cleanAddress = mapsUrlFromAddress ? null : rawCleanAddress;
  const cleanGooglePlaceId = cleanNullableString(googlePlaceId);
  const cleanGooglePlaceName = cleanNullableString(googlePlaceName);
  const cleanGoogleMapsUrl =
    cleanNullableString(googleMapsUrl) ?? mapsUrlFromAddress;

  return {
    id: createLocationId({
      name: cleanName,
      town: cleanTown,
      address: cleanAddress,
      googlePlaceId: cleanGooglePlaceId,
    }),
    name: cleanName,
    town: cleanTown,
    address: cleanAddress,
    detail: null,
    courtCount: cleanNullablePositiveInteger(courtCount),
    selectedCourt: cleanSelectedCourt(selectedCourt),
    googlePlaceId: cleanGooglePlaceId,
    googlePlaceName: cleanGooglePlaceName,
    googleMapsUrl: cleanGoogleMapsUrl,
    latitude: cleanNullableNumber(latitude),
    longitude: cleanNullableNumber(longitude),
  };
}

function looksLikeUrl(value: string) {
  return /^https?:\/\//i.test(value.trim());
}

function getLocationPlaceText(location: LeagueLocation) {
  return location.address && !looksLikeUrl(location.address)
    ? location.address
    : location.googlePlaceName;
}

export function getLeagueLocationSubtitle(location: LeagueLocation) {
  const placeText = getLocationPlaceText(location);
  const courts = getLeagueLocationCourts(location);
  const courtText = courts.length > 0 ? `${courts.length} pista${courts.length === 1 ? "" : "s"}` : null;

  return (
    [placeText, courtText]
      .filter((item): item is string => Boolean(item?.trim()))
      .join(" · ") || "Ubicación manual"
  );
}

export function normalizeMapsUrl(value: string | null | undefined) {
  const cleanValue = value?.trim();

  if (!cleanValue || !looksLikeUrl(cleanValue)) {
    return null;
  }

  try {
    const url = new URL(cleanValue);
    const host = url.hostname.toLowerCase();

    if (
      host.includes("google.") ||
      host === "maps.app.goo.gl" ||
      host.endsWith(".maps.app.goo.gl") ||
      host.includes("goo.gl")
    ) {
      return cleanValue;
    }
  } catch {
    return null;
  }

  return null;
}

function parseStoredLocationObject(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue.startsWith("{") || !cleanValue.endsWith("}")) {
    return null;
  }

  try {
    return normalizeLeagueLocation(JSON.parse(cleanValue));
  } catch {
    return null;
  }
}

export function normalizeScheduleLocationValue(
  scheduleLocation: string | null | undefined,
) {
  const cleanScheduleLocation = scheduleLocation?.trim();

  if (!cleanScheduleLocation) {
    return null;
  }

  return parseStoredLocationObject(cleanScheduleLocation);
}

export function getLeagueLocationLabel(location: LeagueLocation) {
  return (
    location.name || location.googlePlaceName || location.address || "Pista"
  );
}

export function getLeagueLocationOptionLabel(location: LeagueLocation) {
  const name = getLeagueLocationLabel(location);
  const town = location.town?.trim();

  return town ? `${town} - ${name}` : name;
}

export function sortLeagueLocationsByOptionLabel(locations: LeagueLocation[]) {
  return [...locations].sort((left, right) =>
    getLeagueLocationOptionLabel(left).localeCompare(
      getLeagueLocationOptionLabel(right),
      "es",
      { sensitivity: "base" },
    ),
  );
}


export function getLeagueLocationScheduleText(location: LeagueLocation) {
  const normalizedLocation = normalizeLeagueLocation(location) ?? location;
  const placeText =
    getLocationPlaceText(normalizedLocation) ??
    normalizedLocation.googlePlaceName ??
    normalizedLocation.name;

  return [placeText, normalizedLocation.selectedCourt]
    .filter((item): item is string => Boolean(item?.trim()))
    .join(" · ");
}

export function getLeagueLocationCompactText(location: LeagueLocation) {
  const normalizedLocation = normalizeLeagueLocation(location) ?? location;

  return [
    getLeagueLocationOptionLabel(normalizedLocation),
    normalizedLocation.selectedCourt,
  ]
    .filter((item): item is string => Boolean(item?.trim()))
    .join(" · ");
}

export function getScheduleLocationFallbackText(
  scheduleLocation: string | null | undefined,
) {
  const cleanScheduleLocation = scheduleLocation?.trim();

  if (!cleanScheduleLocation) {
    return null;
  }

  const parsedLocation = parseStoredLocationObject(cleanScheduleLocation);

  if (parsedLocation) {
    return getLeagueLocationCompactText(parsedLocation);
  }

  if (normalizeMapsUrl(cleanScheduleLocation)) {
    return "Ubicación en Maps";
  }

  return cleanScheduleLocation;
}

export function getLeagueLocationCalendarText(
  location: LeagueLocation | null | undefined,
  fallbackLocation?: string | null,
) {
  const resolvedLocation =
    location ?? normalizeScheduleLocationValue(fallbackLocation);

  if (!resolvedLocation) {
    return getScheduleLocationFallbackText(fallbackLocation);
  }

  if (resolvedLocation.address && !looksLikeUrl(resolvedLocation.address)) {
    return resolvedLocation.address;
  }

  const parts = [
    getLeagueLocationOptionLabel(resolvedLocation),
    resolvedLocation.selectedCourt,
    getLocationPlaceText(resolvedLocation),
  ].filter((item): item is string => Boolean(item?.trim()));

  return parts.join(" - ");
}

export function getLeagueLocationMapsUrl(location: LeagueLocation) {
  if (location.googleMapsUrl) {
    return location.googleMapsUrl;
  }

  const query = encodeURIComponent(
    location.address ??
      location.googlePlaceName ??
      [location.name, location.town].filter(Boolean).join(", "),
  );
  const placeId = location.googlePlaceId
    ? `&query_place_id=${encodeURIComponent(location.googlePlaceId)}`
    : "";

  return `https://www.google.com/maps/search/?api=1&query=${query}${placeId}`;
}

export function getScheduleLocationMapsUrl(
  scheduleLocation: string | null | undefined,
) {
  const cleanScheduleLocation = scheduleLocation?.trim();

  if (!cleanScheduleLocation) {
    return null;
  }

  const parsedLocation = parseStoredLocationObject(cleanScheduleLocation);

  if (parsedLocation) {
    return getLeagueLocationMapsUrl(parsedLocation);
  }

  const mapsUrl = normalizeMapsUrl(cleanScheduleLocation);

  if (mapsUrl) {
    return mapsUrl;
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanScheduleLocation)}`;
}

export function createScheduledLeagueLocationValue(
  location: LeagueLocation,
  selectedCourt?: string | null,
) {
  const normalizedLocation = normalizeLeagueLocation(location) ?? location;
  const cleanCourt = cleanSelectedCourt(selectedCourt);

  return JSON.stringify({
    ...normalizedLocation,
    selectedCourt: cleanCourt,
    detail: null,
  });
}

export function findLeagueLocationByScheduleLocation({
  locations,
  scheduleLocation,
}: {
  locations: LeagueLocation[];
  scheduleLocation: string | null | undefined;
}) {
  const cleanScheduleLocation = scheduleLocation?.trim();

  if (!cleanScheduleLocation) {
    return null;
  }

  const normalizedLocations = normalizeLeagueLocations(locations);
  const parsedLocation = parseStoredLocationObject(cleanScheduleLocation);
  const normalizedCandidates = [
    cleanScheduleLocation,
    parsedLocation?.id,
    parsedLocation?.name,
    parsedLocation?.town,
    parsedLocation?.address,
    parsedLocation?.googlePlaceName,
    parsedLocation?.googleMapsUrl,
  ]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.trim().toLowerCase());

  const matchedLocation = normalizedLocations.find((location) => {
    const locationCandidates = [
      location.id,
      location.name,
      location.town,
      location.address,
      location.googlePlaceName,
      location.googleMapsUrl,
    ]
      .filter((item): item is string => Boolean(item))
      .map((item) => item.trim().toLowerCase());

    return locationCandidates.some((candidate) =>
      normalizedCandidates.includes(candidate),
    );
  });

  if (matchedLocation) {
    return {
      ...matchedLocation,
      selectedCourt: parsedLocation?.selectedCourt ?? null,
    };
  }

  return parsedLocation ?? null;
}
