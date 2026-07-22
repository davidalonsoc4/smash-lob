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
    fetchLeagueUsers,
    getMembershipForLeague,
    isLeagueAdmin,
    refreshLeagueAccess,
  } = useLeagueAccess()
  const { playerProfiles, seasonPlayers, getSeasonRoundSettings } = useSeasonSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [rosterPermissions, setRosterPermissions] = useState<{
    leagueId: string
    removablePlayerIds: Set<string>
  } | null>(null)
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
  const removablePlayerIds =
    rosterPermissions?.leagueId === leagueId
      ? rosterPermissions.removablePlayerIds
      : null

  useEffect(() => {
    if (!canManage) return

    let cancelled = false

    void fetchLeagueUsers(leagueId)
      .then((items) => {
        if (cancelled) return

        setRosterPermissions({
          leagueId,
          removablePlayerIds: new Set(
            items
              .filter((item) => item.role === "player")
              .map((item) => item.playerId),
          ),
        })
      })
      .catch(() => {
        if (!cancelled) {
          setRosterPermissions({
            leagueId,
            removablePlayerIds: new Set(),
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [canManage, fetchLeagueUsers, leagueId])

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
    <AppCard className="border-emerald-200 bg-emerald-50/70 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="truncate text-sm font-black text-emerald-950">
              {t.roster.title}
            </p>
            <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">
              {registeredPlayers.length}/{playerCapacity}
            </p>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold text-emerald-800">
            {remaining > 0
              ? t.roster.remaining.replace("{count}", String(remaining))
              : t.roster.complete}
          </p>
        </div>
      </div>

      <div className="mt-2 grid gap-1">
        {registeredPlayers.map((player, index) => (
          <div
            key={player.id}
            className="flex min-h-9 items-center gap-2 rounded-xl border border-emerald-100 bg-white px-2 py-1"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] font-black text-emerald-800">
              {index + 1}
            </span>
            <PlayerAvatar player={player} size="sm" />
            <p className="min-w-0 flex-1 truncate text-xs font-black">
              {player.displayName}
            </p>
            {canManage && removablePlayerIds?.has(player.id) ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleLeave(player.id)}
                aria-label={t.roster.leaveAction}
                title={t.roster.leaveAction}
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-base font-black leading-none text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
              >
                ×
              </button>
            ) : null}
          </div>
        ))}

        {Array.from({ length: remaining }, (_, index) => (
          <div
            key={`empty-${index}`}
            className="flex min-h-8 items-center gap-2 rounded-xl border border-dashed border-emerald-200 bg-white/60 px-2 py-1 text-xs font-semibold text-emerald-700"
          >
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-[9px] font-black">
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
          className="mt-2 w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:bg-emerald-200"
        >
          {isSaving ? t.common.saving : t.roster.joinAction}
        </button>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-bold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}
