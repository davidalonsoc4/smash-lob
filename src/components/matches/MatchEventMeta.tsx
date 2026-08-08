type MatchEventMetaProps = {
  eventAt: string | null
  dateFallback?: string | null
  locationText?: string | null
  locationFallback?: string | null
  hideMissingRows?: boolean
}

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

export function formatMatchEventDateTime(
  value: string | null,
  fallback: string | null = null,
) {
  if (!value) return fallback || "Fecha y hora pendientes"

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return fallback || "Fecha y hora pendientes"
  }

  const weekday = capitalizeFirst(
    new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date),
  )
  const dateLabel = new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
  const timeLabel = new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)

  return `${weekday} · ${dateLabel} · ${timeLabel}`
}

export function MatchEventMeta({
  eventAt,
  dateFallback = null,
  locationText = null,
  locationFallback = "Ubicación no indicada",
  hideMissingRows = false,
}: MatchEventMetaProps) {
  const normalizedLocation = locationText?.trim() || locationFallback?.trim() || null
  const hasDate = Boolean(eventAt || dateFallback)
  const dateText = hasDate
    ? formatMatchEventDateTime(eventAt, dateFallback)
    : hideMissingRows
      ? null
      : formatMatchEventDateTime(eventAt, dateFallback)
  const location = normalizedLocation ?? (hideMissingRows ? null : "Ubicación no indicada")

  if (!dateText && !location) return null

  return (
    <div className="mt-2 border-t border-neutral-100 pt-2">
      {dateText ? (
        <p className="text-[11px] font-semibold text-neutral-500">{dateText}</p>
      ) : null}
      {location ? (
        <p className={`${dateText ? "mt-0.5" : ""} truncate text-[11px] font-semibold text-neutral-600`}>
          {location}
        </p>
      ) : null}
    </div>
  )
}
