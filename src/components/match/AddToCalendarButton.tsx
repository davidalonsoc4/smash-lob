import type { ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { CalendarEventButton } from "@/components/calendar/CalendarEventButton"
import { getTeamDisplayName } from "@/lib/players"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import type { PlayerProfile } from "@/data/fakeData"
type AddToCalendarButtonProps = { leagueName: string; seasonName: string; round: number; teamA: string[]; teamB: string[]; players: PlayerProfile[]; scheduledAt: string | null; location: string | null; className?: string; triggerClassName?: string; children?: ReactNode }
export function AddToCalendarButton(props: AddToCalendarButtonProps) {
  const { tx } = useI18n()
  if (!props.scheduledAt) return null
  const teamA = getTeamDisplayName(props.teamA, props.players), teamB = getTeamDisplayName(props.teamB, props.players)
  return <div className={props.className ?? "mt-2"}><CalendarEventButton event={{ title: props.leagueName + ": " + teamA + " vs " + teamB, description: props.leagueName + " - " + props.seasonName + "\n" + tx(`Jornada ${props.round}`) + "\n" + teamA + " vs " + teamB, start: props.scheduledAt, location: getScheduleLocationDisplayText(props.location) }} className={props.triggerClassName}>{props.children}</CalendarEventButton></div>
}
