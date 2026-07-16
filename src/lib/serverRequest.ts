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
