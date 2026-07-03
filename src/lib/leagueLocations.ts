export type LeagueLocation = {
  id: string;
  name: string;
  address?: string | null;
  detail?: string | null;
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

function createLocationId({
  name,
  googlePlaceId,
  address,
}: {
  name: string;
  googlePlaceId?: string | null;
  address?: string | null;
}) {
  if (googlePlaceId) {
    return `google-${slugify(googlePlaceId).slice(0, 64) || Date.now()}`;
  }

  return `${fallbackLocationPrefix}-${slugify(`${name}-${address ?? ""}`) || Date.now()}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

    return {
      id: createLocationId({ name: cleanValue }),
      name: cleanValue,
      address: null,
      detail: null,
      googlePlaceId: null,
      googlePlaceName: null,
      googleMapsUrl: normalizeMapsUrl(cleanValue),
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
  const detail = cleanNullableString(value.detail);
  const googlePlaceId = cleanNullableString(value.googlePlaceId);
  const googlePlaceName = cleanNullableString(value.googlePlaceName);
  const googleMapsUrl =
    cleanNullableString(value.googleMapsUrl) ?? mapsUrlFromAddress;
  const latitude = cleanNullableNumber(value.latitude);
  const longitude = cleanNullableNumber(value.longitude);
  const id =
    cleanNullableString(value.id) ??
    createLocationId({ name, googlePlaceId, address });

  return {
    id,
    name,
    address,
    detail,
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
      location.googlePlaceId ?? `${location.name}|${location.address ?? ""}`
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
  address,
  detail,
  googlePlaceId,
  googlePlaceName,
  googleMapsUrl,
  latitude,
  longitude,
}: Omit<LeagueLocation, "id">): LeagueLocation | null {
  const cleanName = cleanString(name);

  if (!cleanName) {
    return null;
  }

  const rawCleanAddress = cleanNullableString(address);
  const mapsUrlFromAddress = normalizeMapsUrl(rawCleanAddress);
  const cleanAddress = mapsUrlFromAddress ? null : rawCleanAddress;
  const cleanDetail = cleanNullableString(detail);
  const cleanGooglePlaceId = cleanNullableString(googlePlaceId);
  const cleanGooglePlaceName = cleanNullableString(googlePlaceName);
  const cleanGoogleMapsUrl =
    cleanNullableString(googleMapsUrl) ?? mapsUrlFromAddress;

  return {
    id: createLocationId({
      name: cleanName,
      address: cleanAddress,
      googlePlaceId: cleanGooglePlaceId,
    }),
    name: cleanName,
    address: cleanAddress,
    detail: cleanDetail,
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
  return (
    [location.detail, getLocationPlaceText(location)]
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

export function getLeagueLocationCompactText(location: LeagueLocation) {
  const normalizedLocation = normalizeLeagueLocation(location) ?? location;

  return [normalizedLocation.name, normalizedLocation.detail]
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
    return getLeagueLocationLabel(parsedLocation);
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

  const parts = [
    resolvedLocation.name,
    resolvedLocation.detail,
    getLocationPlaceText(resolvedLocation),
  ].filter((item): item is string => Boolean(item?.trim()));

  return parts.join(" - ");
}

export function getLeagueLocationMapsUrl(location: LeagueLocation) {
  if (location.googleMapsUrl) {
    return location.googleMapsUrl;
  }

  const query = encodeURIComponent(
    location.address ?? location.googlePlaceName ?? location.name,
  );
  const placeId = location.googlePlaceId
    ? `&query_place_id=${encodeURIComponent(location.googlePlaceId)}`
    : "";

  return `https://www.google.com/maps/search/?api=1&query=${query}${placeId}`;
}

export function getLeagueLocationWazeUrl(location: LeagueLocation) {
  if (
    typeof location.latitude === "number" &&
    typeof location.longitude === "number"
  ) {
    return `https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`;
  }

  const querySource =
    location.address && !looksLikeUrl(location.address)
      ? location.address
      : (location.googlePlaceName ?? location.name);
  const query = encodeURIComponent(querySource);

  return `https://waze.com/ul?q=${query}&navigate=yes`;
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
    parsedLocation?.detail,
    parsedLocation?.address,
    parsedLocation?.googlePlaceName,
  ]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.trim().toLowerCase());

  return (
    normalizedLocations.find((location) => {
      const locationCandidates = [
        location.id,
        location.name,
        location.detail,
        location.address,
        location.googlePlaceName,
      ]
        .filter((item): item is string => Boolean(item))
        .map((item) => item.trim().toLowerCase());

      return locationCandidates.some((candidate) =>
        normalizedCandidates.includes(candidate),
      );
    }) ??
    parsedLocation ??
    null
  );
}
