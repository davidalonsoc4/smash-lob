"use client"

import { MatchScheduleForm } from "@/components/match/MatchScheduleForm"
import { PersonalAddToCalendarButton } from "@/components/personal/PersonalAddToCalendarButton"
import { getScheduleLocationDisplayText } from "@/lib/leagueLocations"
import { buildPersonalMatchDetailModel } from "@/lib/personalMatchDetailModel"
import type { PersonalMatchItem } from "@/lib/personalMatches"

export function PersonalMatchSchedulePanel({
  match,
  onUpdated,
}: {
  match: PersonalMatchItem
  onUpdated: (match: PersonalMatchItem) => void
}) {
  const detail = buildPersonalMatchDetailModel(match)
  const scheduleStatus =
    match.status === "scheduled" && (!match.scheduledAt || !match.locationName)
      ? "scheduling"
      : match.status

  async function updateSchedule(input: {
    scheduledAt: string
    location: string
  }) {
    try {
      const response = await fetch(
        `/api/personal-matches/${encodeURIComponent(match.id)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "schedule",
            scheduledAt: input.scheduledAt,
            locationName:
              getScheduleLocationDisplayText(input.location) ?? input.location,
          }),
        },
      )
      const payload = (await response.json().catch(() => null)) as {
        item?: PersonalMatchItem
      } | null
      if (!response.ok || !payload?.item) return false
      onUpdated(payload.item)
      return true
    } catch {
      return false
    }
  }

  return (
    <MatchScheduleForm
      matchId={match.id}
      leagueId="personal"
      seasonId={match.id}
      status={scheduleStatus}
      scheduledAt={match.scheduledAt}
      dateLabel={null}
      location={match.locationName}
      availableLocations={[]}
      playerIds={[...detail.teamA, ...detail.teamB]}
      players={detail.players}
      roundStartsAt={null}
      roundEndsAt={null}
      canManage={match.canManage}
      canClearSchedule={false}
      availabilityRecommendationsEnabled={false}
      allowPostpone={false}
      actions={{ update: updateSchedule }}
      calendarAction={
        match.scheduledAt ? (
          <PersonalAddToCalendarButton
            match={match}
            className="min-w-0 flex-1"
          />
        ) : null
      }
    />
  )
}
