import "server-only"

export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function parseJsonBody<T>(request: Request) {
  return (await request.json().catch(() => null)) as T | null
}

export function validateUuid(value: unknown) {
  const cleanValue = typeof value === "string" ? value.trim() : ""

  return uuidPattern.test(cleanValue) ? cleanValue : null
}

export function normalizeBoundedText(value: unknown, maximumLength: number) {
  if (
    typeof value !== "string" ||
    !Number.isInteger(maximumLength) ||
    maximumLength < 1
  ) {
    return ""
  }

  return value.trim().slice(0, maximumLength)
}

export function validateInviteCode(value: unknown) {
  const code = normalizeBoundedText(value, 64).toUpperCase()
  return /^[A-Z0-9](?:[A-Z0-9-]{2,62}[A-Z0-9])?$/.test(code) ? code : null
}

export function validateIsoDateTime(value: unknown) {
  const text = normalizeBoundedText(value, 64)
  const timestamp = Date.parse(text)
  return text && Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null
}

export function validateTimeZone(value: unknown) {
  const timeZone = normalizeBoundedText(value, 64)

  try {
    new Intl.DateTimeFormat("es-ES", { timeZone }).format()
    return timeZone
  } catch {
    return null
  }
}

export function validateMoney(value: unknown, maximum = 1_000_000) {
  const amount =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim()
        ? Number(value)
        : Number.NaN

  return Number.isFinite(amount) && amount >= 0 && amount <= maximum
    ? Math.round(amount * 100) / 100
    : null
}

export function validateHttpUrl(value: unknown) {
  const text = normalizeBoundedText(value, 2048)

  try {
    const url = new URL(text)
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null
  } catch {
    return null
  }
}

export function validateMatchSets(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 5) {
    return null
  }

  const sets = value.map((item) => {
    if (!item || typeof item !== "object") return null
    const a = Number((item as { a?: unknown }).a)
    const b = Number((item as { b?: unknown }).b)
    if (
      !Number.isInteger(a) ||
      !Number.isInteger(b) ||
      a < 0 ||
      b < 0 ||
      a > 99 ||
      b > 99 ||
      a === b
    ) {
      return null
    }
    return { a, b }
  })

  return sets.every((set): set is { a: number; b: number } => Boolean(set))
    ? sets
    : null
}
