import { validateUuid } from "@/lib/serverRequest"

export function parseActivityCursor(value: string | null) {
  if (!value) return null
  const [createdAt, id, extra] = value.split("|")
  // Restrict values before interpolating the PostgREST keyset expression.
  if (extra !== undefined || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}:\d{2})$/.test(createdAt) || !Number.isFinite(Date.parse(createdAt)) || (id !== undefined && !validateUuid(id))) {
    throw new Error("invalid_activity_cursor")
  }
  return { createdAt, id: id ?? null }
}

export function buildActivityCursor(event: { createdAt: string; id: string }) {
  return `${event.createdAt}|${event.id}`
}
