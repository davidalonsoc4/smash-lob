"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { joinSeasonRoster, leaveSeasonRoster } from "@/lib/selfRegistration"
import type { PlayerProfile } from "@/data/fakeData"

export function SeasonRosterWaitingRoom({
  leagueId,
  seasonId,
}: {
  leagueId: string
  seasonId: string
}) {
  const { t } = useI18n()
  const {
    getMembershipForLeague,
    isLeagueAdmin,
    refreshLeagueAccess,
  } = useLeagueAccess()
  const { playerProfiles, seasonPlayers, getSeasonRoundSettings } = useSeasonSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const settings = getSeasonRoundSettings(seasonId)
  const membership = getMembershipForLeague(leagueId)
  const canManage = isLeagueAdmin(leagueId)
  const registeredPlayerIds = useMemo(
    () =>
      seasonPlayers
        .filter(
          (item) => item.seasonId === seasonId && item.status !== "withdrawn",
        )
        .map((item) => item.playerId),
    [seasonId, seasonPlayers],
  )
  const registeredPlayers = registeredPlayerIds
    .map((playerId) => playerProfiles.find((player) => player.id === playerId))
    .filter((player): player is PlayerProfile => Boolean(player))
  const playerCapacity = settings.playerCapacity ?? registeredPlayers.length
  const isCurrentUserRegistered = Boolean(
    membership?.playerId && registeredPlayerIds.includes(membership.playerId),
  )
  const remaining = Math.max(playerCapacity - registeredPlayers.length, 0)

  useEffect(() => {
    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void refreshLeagueAccess()
      }
    }

    const intervalId = window.setInterval(refreshWhenVisible, 15000)
    window.addEventListener("focus", refreshWhenVisible)
    document.addEventListener("visibilitychange", refreshWhenVisible)

    return () => {
      window.clearInterval(intervalId)
      window.removeEventListener("focus", refreshWhenVisible)
      document.removeEventListener("visibilitychange", refreshWhenVisible)
    }
  }, [refreshLeagueAccess])

  async function handleJoin() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      await joinSeasonRoster(leagueId, seasonId)
      await refreshLeagueAccess()
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : t.roster.joinError)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleLeave(playerId: string) {
    if (isSaving) return

    const confirmed = window.confirm(t.roster.leaveConfirm)
    if (!confirmed) return

    setIsSaving(true)
    setError(null)

    try {
      await leaveSeasonRoster(leagueId, seasonId, playerId)
      await refreshLeagueAccess()
    } catch (leaveError) {
      setError(leaveError instanceof Error ? leaveError.message : t.roster.leaveError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppCard className="border-emerald-200 bg-emerald-50/70">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            {t.roster.eyebrow}
          </p>
          <p className="mt-1 text-lg font-black text-emerald-950">
            {t.roster.title}
          </p>
          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800">
            {remaining > 0
              ? t.roster.remaining.replace("{count}", String(remaining))
              : t.roster.complete}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-black text-emerald-900 shadow-sm">
          {registeredPlayers.length}/{playerCapacity}
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {registeredPlayers.map((player, index) => (
          <div
            key={player.id}
            className="flex items-center gap-3 rounded-2xl bg-white px-3 py-2.5 shadow-sm"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
              {index + 1}
            </span>
            <PlayerAvatar player={player} size="sm" />
            <p className="min-w-0 flex-1 truncate text-sm font-black">
              {player.displayName}
            </p>
            {(canManage || membership?.playerId === player.id) ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLeave(player.id)}
                className="rounded-full bg-neutral-100 px-2.5 py-1 text-[10px] font-black text-neutral-600 disabled:opacity-40"
              >
                {t.roster.leaveAction}
              </button>
            ) : null}
          </div>
        ))}

        {Array.from({ length: remaining }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-3 py-2.5 text-sm font-semibold text-emerald-700"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-100 text-xs font-black">
              {registeredPlayers.length + index + 1}
            </span>
            {t.roster.availableSlot}
          </div>
        ))}
      </div>

      {!isCurrentUserRegistered && settings.registrationOpen ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={isSaving}
          className="mt-4 w-full rounded-2xl bg-emerald-700 px-3 py-3 text-sm font-black text-white disabled:bg-emerald-200"
        >
          {isSaving ? t.common.saving : t.roster.joinAction}
        </button>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-bold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}
