export type LeagueLocation = {
  id: string
  name: string
  address?: string | null
  googlePlaceId?: string | null
  googlePlaceName?: string | null
  googleMapsUrl?: string | null
  latitude?: number | null
  longitude?: number | null
}

const fallbackLocationPrefix = "court"

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanNullableString(value: unknown) {
  const cleanValue = cleanString(value)

  return cleanValue.length > 0 ? cleanValue : null
}

function cleanNullableNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }

  return value
}

function createLocationId({
  name,
  googlePlaceId,
  address,
}: {
  name: string
  googlePlaceId?: string | null
  address?: string | null
}) {
  if (googlePlaceId) {
    return `google-${slugify(googlePlaceId).slice(0, 64) || Date.now()}`
  }

  return `${fallbackLocationPrefix}-${slugify(`${name}-${address ?? ""}`) || Date.now()}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function normalizeLeagueLocation(value: unknown): LeagueLocation | null {
  if (typeof value === "string") {
    const name = value.trim()

    if (!name) {
      return null
    }

    return {
      id: createLocationId({ name }),
      name,
      address: null,
      googlePlaceId: null,
      googlePlaceName: null,
      googleMapsUrl: null,
      latitude: null,
      longitude: null,
    }
  }

  if (!isRecord(value)) {
    return null
  }

  const name = cleanString(value.name)

  if (!name) {
    return null
  }

  const address = cleanNullableString(value.address)
  const googlePlaceId = cleanNullableString(value.googlePlaceId)
  const googlePlaceName = cleanNullableString(value.googlePlaceName)
  const googleMapsUrl = cleanNullableString(value.googleMapsUrl)
  const latitude = cleanNullableNumber(value.latitude)
  const longitude = cleanNullableNumber(value.longitude)
  const id =
    cleanNullableString(value.id) ??
    createLocationId({ name, googlePlaceId, address })

  return {
    id,
    name,
    address,
    googlePlaceId,
    googlePlaceName,
    googleMapsUrl,
    latitude,
    longitude,
  }
}

export function normalizeLeagueLocations(value: unknown): LeagueLocation[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seen = new Set<string>()
  const locations: LeagueLocation[] = []

  value.forEach((item) => {
    const location = normalizeLeagueLocation(item)

    if (!location) {
      return
    }

    const key = (
      location.googlePlaceId ??
      `${location.name}|${location.address ?? ""}`
    ).toLowerCase()

    if (seen.has(key)) {
      return
    }

    seen.add(key)
    locations.push(location)
  })

  return locations
}

export function createLeagueLocation({
  name,
  address,
  googlePlaceId,
  googlePlaceName,
  googleMapsUrl,
  latitude,
  longitude,
}: Omit<LeagueLocation, "id">): LeagueLocation | null {
  const cleanName = cleanString(name)

  if (!cleanName) {
    return null
  }

  const cleanAddress = cleanNullableString(address)
  const cleanGooglePlaceId = cleanNullableString(googlePlaceId)
  const cleanGooglePlaceName = cleanNullableString(googlePlaceName)
  const cleanGoogleMapsUrl = cleanNullableString(googleMapsUrl)

  return {
    id: createLocationId({
      name: cleanName,
      address: cleanAddress,
      googlePlaceId: cleanGooglePlaceId,
    }),
    name: cleanName,
    address: cleanAddress,
    googlePlaceId: cleanGooglePlaceId,
    googlePlaceName: cleanGooglePlaceName,
    googleMapsUrl: cleanGoogleMapsUrl,
    latitude: cleanNullableNumber(latitude),
    longitude: cleanNullableNumber(longitude),
  }
}

export function getLeagueLocationSubtitle(location: LeagueLocation) {
  return location.address ?? location.googlePlaceName ?? "Ubicación manual"
}

function parseStoredLocationObject(value: string) {
  const cleanValue = value.trim()

  if (!cleanValue.startsWith("{") || !cleanValue.endsWith("}")) {
    return null
  }

  try {
    return normalizeLeagueLocation(JSON.parse(cleanValue))
  } catch {
    return null
  }
}

export function normalizeScheduleLocationValue(
  scheduleLocation: string | null | undefined
) {
  const cleanScheduleLocation = scheduleLocation?.trim()

  if (!cleanScheduleLocation) {
    return null
  }

  return parseStoredLocationObject(cleanScheduleLocation)
}

export function getLeagueLocationLabel(location: LeagueLocation) {
  return location.name || location.googlePlaceName || location.address || "Pista"
}

export function getScheduleLocationFallbackText(
  scheduleLocation: string | null | undefined
) {
  const cleanScheduleLocation = scheduleLocation?.trim()

  if (!cleanScheduleLocation) {
    return null
  }

  const parsedLocation = parseStoredLocationObject(cleanScheduleLocation)

  if (parsedLocation) {
    return getLeagueLocationLabel(parsedLocation)
  }

  return cleanScheduleLocation
}

export function getLeagueLocationCalendarText(
  location: LeagueLocation | null | undefined,
  fallbackLocation?: string | null
) {
  const resolvedLocation = location ?? normalizeScheduleLocationValue(fallbackLocation)

  if (!resolvedLocation) {
    return getScheduleLocationFallbackText(fallbackLocation)
  }

  return resolvedLocation.address
    ? `${resolvedLocation.name} - ${resolvedLocation.address}`
    : resolvedLocation.googlePlaceName
      ? `${resolvedLocation.name} - ${resolvedLocation.googlePlaceName}`
      : resolvedLocation.name
}

export function getLeagueLocationMapsUrl(location: LeagueLocation) {
  if (location.googleMapsUrl) {
    return location.googleMapsUrl
  }

  const query = encodeURIComponent(
    location.address ?? location.googlePlaceName ?? location.name
  )
  const placeId = location.googlePlaceId
    ? `&query_place_id=${encodeURIComponent(location.googlePlaceId)}`
    : ""

  return `https://www.google.com/maps/search/?api=1&query=${query}${placeId}`
}

export function getLeagueLocationWazeUrl(location: LeagueLocation) {
  if (typeof location.latitude === "number" && typeof location.longitude === "number") {
    return `https://waze.com/ul?ll=${location.latitude},${location.longitude}&navigate=yes`
  }

  const query = encodeURIComponent(
    location.address ?? location.googlePlaceName ?? location.name
  )

  return `https://waze.com/ul?q=${query}&navigate=yes`
}

export function findLeagueLocationByScheduleLocation({
  locations,
  scheduleLocation,
}: {
  locations: LeagueLocation[]
  scheduleLocation: string | null | undefined
}) {
  const cleanScheduleLocation = scheduleLocation?.trim()

  if (!cleanScheduleLocation) {
    return null
  }

  const parsedLocation = parseStoredLocationObject(cleanScheduleLocation)
  const normalizedCandidates = [
    cleanScheduleLocation,
    parsedLocation?.id,
    parsedLocation?.name,
    parsedLocation?.address,
    parsedLocation?.googlePlaceName,
  ]
    .filter((item): item is string => Boolean(item))
    .map((item) => item.trim().toLowerCase())

  return (
    locations.find((location) => {
      const locationCandidates = [
        location.id,
        location.name,
        location.address,
        location.googlePlaceName,
      ]
        .filter((item): item is string => Boolean(item))
        .map((item) => item.trim().toLowerCase())

      return locationCandidates.some((candidate) =>
        normalizedCandidates.includes(candidate)
      )
    }) ??
    parsedLocation ??
    null
  )
}
