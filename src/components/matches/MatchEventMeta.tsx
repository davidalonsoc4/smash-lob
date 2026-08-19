import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale, translateLeagueText } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

type MatchEventMetaProps = {
  eventAt: string | null
  dateFallback?: string | null
  locationText?: string | null
  locationFallback?: string | null
  hideMissingRows?: boolean
}

function capitalizeFirst(value: string, locale: Locale) {
  return value
    ? value.charAt(0).toLocaleUpperCase(getIntlLocale(locale)) + value.slice(1)
    : value
}

export function formatMatchEventDateTime(
  value: string | null,
  fallback: string | null = null,
  locale: Locale = "es",
) {
  if (!value) return fallback || translateLeagueText(locale, "Fecha y hora pendientes")

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback || translateLeagueText(locale, "Fecha y hora pendientes")
  }

  const weekday = capitalizeFirst(
    new Intl.DateTimeFormat(getIntlLocale(locale), { weekday: "long" }).format(date),
    locale,
  )
  const dateLabel = new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
  const timeLabel = new Intl.DateTimeFormat(getIntlLocale(locale), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  return `${weekday} · ${dateLabel} · ${timeLabel}`
}

export function MatchEventMeta({
  eventAt,
  dateFallback = null,
  locationText = null,
  locationFallback = null,
  hideMissingRows = false,
}: MatchEventMetaProps) {
  const { locale, tx } = useI18n()
  const normalizedLocation =
    getScheduleLocationDisplayText(locationText) ??
    getScheduleLocationDisplayText(locationFallback)
  const hasDate = Boolean(eventAt || dateFallback)
  const dateText = hasDate
    ? formatMatchEventDateTime(eventAt, dateFallback, locale)
    : hideMissingRows
      ? null
      : formatMatchEventDateTime(eventAt, dateFallback, locale)
  const location = normalizedLocation ?? (hideMissingRows ? null : tx("Ubicación no indicada"))

  if (!dateText && !location) return null

  return (
    <div className="mt-2 border-t border-neutral-100 pt-2">
      {dateText ? (
        <p className="type-caption font-semibold text-neutral-500">{dateText}</p>
      ) : null}
      {location ? (
        <p className={`${dateText ? "mt-0.5" : ""} truncate type-caption font-semibold text-neutral-600`}>
          {location}
        </p>
      ) : null}
    </div>
  )
}
