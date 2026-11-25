"use client"

import { useMemo, useState } from "react"
import { useSessionResource } from "@/hooks/useSessionResource"
import { PersonalProfileView } from "@/components/personal/PersonalProfileView"
import { PersonalRatingCard, PersonalRatingChip } from "@/components/personal/PersonalRatingCard"
import { PlayerProfileIdentityCard } from "@/components/player/PlayerProfileIdentityCard"
import { BackButton } from "@/components/ui/BackButton"
import { useAccountProfile } from "@/context/AccountProfileProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { getPlayerSideAndHandLabel } from "@/lib/accountProfile"
import type { PersonalMatchItem } from "@/lib/personalMatches"

const emptyHistory: PersonalMatchItem[] = []

export default function PersonalProfilePage() {
  const { t } = useI18n()
  const { history, profile } = useAccountProfile()
  const { getMembershipForLeague, userLeagues } = useLeagueAccess()
  const participatingLeagues = useMemo(
    () => userLeagues.filter((league) => getMembershipForLeague(league.id)),
    [getMembershipForLeague, userLeagues],
  )
  const { data: cachedItems, failed } = useSessionResource(history)
  const [animate] = useState(cachedItems === null)

  const displayName = profile?.displayName?.trim() || "Mi perfil"
  const playerPositionLabel = getPlayerSideAndHandLabel(profile?.preferredSide, profile?.dominantHand)

  return (
    <div className="space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label={t.common.back} />
        <PlayerProfileIdentityCard
          player={{ displayName, avatarUrl: profile?.avatarUrl ?? null }}
          positionLabel={playerPositionLabel}
          context="global"
          trailing={<PersonalRatingChip />}
        />
      </header>
      <PersonalProfileView
        items={cachedItems ?? emptyHistory}
        loaded={cachedItems !== null}
        failed={failed}
        animate={animate}
        topSlot={<PersonalRatingCard />}
        leagueFilterCount={participatingLeagues.length}
      />
    </div>
  )
}
