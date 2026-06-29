export function normalizeAuthEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? ""
}
