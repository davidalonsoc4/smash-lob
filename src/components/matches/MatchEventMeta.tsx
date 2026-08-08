type MatchEventMetaProps = {
  eventAt: string | null
  dateFallback?: string | null
  locationText?: string | null
  locationFallback?: string
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
}: MatchEventMetaProps) {
  return (
    <div className="mt-2 border-t border-neutral-100 pt-2">
      <p className="text-[11px] font-semibold text-neutral-500">
        {formatMatchEventDateTime(eventAt, dateFallback)}
      </p>
      <p className="mt-0.5 truncate text-[11px] font-semibold text-neutral-600">
        {locationText?.trim() || locationFallback}
      </p>
    </div>
  )
}
