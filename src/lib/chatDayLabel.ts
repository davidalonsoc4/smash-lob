/** Local calendar day key (YYYY-MM-DD) used to decide where a day separator goes. */
export function getChatDayKey(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

/** "Hoy", "Ayer", or a full date with the year; the caller supplies the translated words and the Intl locale. */
export function getChatDayLabel(
  iso: string,
  now: Date,
  intlLocale: string,
  labels: { today: string; yesterday: string },
) {
  const key = getChatDayKey(iso)
  if (!key) return ""
  if (key === getChatDayKey(now.toISOString())) return labels.today
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
  if (key === getChatDayKey(yesterday.toISOString())) return labels.yesterday
  return new Intl.DateTimeFormat(intlLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date(iso))
}
