import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
import type { PreseasonOpening } from "@/lib/preseasonSecrets"
import { useI18n } from "@/i18n/I18nProvider"
export function PreseasonOpeningCalendarButton({ leagueName, seasonName, opening }: { leagueName: string; seasonName: string; opening: PreseasonOpening }) {
  const { tx } = useI18n()
  return <CalendarEventButton label={tx("Añadir Jornada 1 al calendario")} className="mt-4 flex w-full items-center justify-center rounded-2xl bg-white px-3 py-3 text-sm font-black text-neutral-950" event={{ title: tx("Jornada 1") + " · " + leagueName, description: leagueName + " - " + seasonName + "\n" + tx("Jornada 1") + "\n" + tx("Los emparejamientos estarán disponibles cuando comience la temporada."), start: opening.startsAt, end: opening.endsAt, location: opening.calendarLocation }} />
}
