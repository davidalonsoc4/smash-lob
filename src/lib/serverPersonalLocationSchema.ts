import "server-only"

type PostgrestErrorLike = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

export function isMissingPersonalLocationColumnsError(
  error: PostgrestErrorLike | null | undefined,
) {
  if (!error) return false

  const text = [error.message, error.details, error.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("en")
  const mentionsStructuredColumn =
    text.includes("location_id") ||
    text.includes("location_court") ||
    text.includes("location_snapshot")

  return (
    mentionsStructuredColumn &&
    (error.code === "42703" ||
      error.code === "PGRST204" ||
      text.includes("schema cache") ||
      text.includes("column"))
  )
}
