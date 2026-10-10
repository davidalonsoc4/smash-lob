// Resolve saved wall-clock intervals without using the server/browser time zone.
// Ambiguous or nonexistent DST endpoints fail closed instead of inventing coverage.
export function createAvailabilityInstantResolver(timezone: string) {
  let formatter: Intl.DateTimeFormat
  try {
    formatter = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
  } catch {
    return () => null
  }
  const representedUtc = (instant: number) => {
    const parts = new Map(formatter.formatToParts(instant).map((part) => [part.type, Number(part.value)]))
    return Date.UTC(parts.get("year")!, parts.get("month")! - 1, parts.get("day")!, parts.get("hour")!, parts.get("minute")!, parts.get("second")!)
  }
  return (date: string, time: string) => {
    const nominal = Date.parse(`${date}T${time}:00Z`)
    const offsets = new Set([-36, 0, 36].map((hours) => {
      const probe = nominal + hours * 3_600_000
      return representedUtc(probe) - probe
    }))
    const candidates = [...offsets].map((offset) => nominal - offset).filter((instant) => representedUtc(instant) === nominal)
    return candidates.length === 1 ? candidates[0] : null
  }
}
