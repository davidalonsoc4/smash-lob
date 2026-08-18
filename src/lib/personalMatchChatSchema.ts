export function isPersonalMatchChatSchemaMissingError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const source = error as {
    code?: unknown
    message?: unknown
    details?: unknown
    hint?: unknown
  }
  const code = typeof source.code === "string" ? source.code : ""
  const description = [source.message, source.details, source.hint]
    .filter((value): value is string => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("en-US")
  const referencesPersonalChat =
    description.includes("personal_match_chat_messages") ||
    description.includes("personal_match_chat_reads") ||
    description.includes("cleanup_expired_personal_match_chat")

  return referencesPersonalChat && (
    code === "42P01" ||
    code === "PGRST202" ||
    code === "PGRST204" ||
    code === "PGRST205" ||
    description.includes("does not exist") ||
    description.includes("schema cache") ||
    description.includes("could not find")
  )
}
