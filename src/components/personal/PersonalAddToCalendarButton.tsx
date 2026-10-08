import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
import { getPersonalMatchTeamNames, type PersonalMatchItem } from "@/lib/personalMatches"
export function PersonalAddToCalendarButton({ match, className }: { match: PersonalMatchItem; className?: string }) {
  if (!match.scheduledAt) return null
  const teamA = getPersonalMatchTeamNames(match.participants, 1), teamB = getPersonalMatchTeamNames(match.participants, 2)
  return <CalendarEventButton className={`inline-flex w-full rounded-lg border border-neutral-950 bg-neutral-950 px-2.5 py-2 text-center text-xs !font-semibold text-white transition active:scale-[0.99] items-center justify-center ${className ?? ""}`} event={{ uid: match.id + "@smashandlob.com", title: "Amistoso: " + teamA + " vs " + teamB, description: "Amistoso registrado en Smash & Lob\n" + teamA + " vs " + teamB, start: match.scheduledAt, location: match.locationName }} />
}
