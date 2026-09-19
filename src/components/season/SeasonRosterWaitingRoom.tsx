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
  const { t, tx } = useI18n()
  const {
    fetchLeagueUsers,
    getMembershipForLeague,
    isLeagueAdmin,
    refreshLeagueAccess,
  } = useLeagueAccess()
  const { playerProfiles, seasonPlayers, getSeasonRoundSettings } = useSeasonSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [waitlistPosition, setWaitlistPosition] = useState<number | null>(null)
  const [isWaitlisted, setIsWaitlisted] = useState(false)
  const [isPromoted, setIsPromoted] = useState(false)
  const [adminWaitlist, setAdminWaitlist] = useState<Array<{ user_id: string; status: string; display_name?: string }>>([])
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

  useEffect(() => {
    let cancelled = false
    void fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<{ position: number | null; items?: Array<{ user_id: string; status: string; display_name?: string }> }> : null)
      .then((payload) => {
        if (cancelled || !payload) return
        setWaitlistPosition(payload.position)
        const own = payload.items?.find((item) => item.user_id === membership?.userId)
        setIsPromoted(own?.status === "promoted")
        setIsWaitlisted(own?.status === "waiting" || payload.position !== null)
        if (canManage) setAdminWaitlist(payload.items?.filter((item) => item.status === "waiting") ?? [])
      })
      .catch(() => null)
    return () => { cancelled = true }
  }, [canManage, leagueId, membership?.userId, seasonId])

  async function handleConfirmPromotion() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist/confirm`, { method: "POST" })
      if (!response.ok) throw new Error("waitlist_confirmation_failed")
      setIsPromoted(false)
      setIsWaitlisted(false)
      setError(tx("Plaza confirmada."))
      await refreshLeagueAccess()
    } catch (confirmationError) {
      setError(confirmationError instanceof Error ? confirmationError.message : "waitlist_confirmation_failed")
    } finally {
      setIsSaving(false)
    }
  }

  async function moveWaitlistEntry(index: number, direction: -1 | 1) {
    const next = [...adminWaitlist]
    const target = index + direction
    if (target < 0 || target >= next.length || isSaving) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setAdminWaitlist(next)
    setIsSaving(true)
    try {
      const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderedUserIds: next.map((item) => item.user_id) }) })
      if (!response.ok) throw new Error("waitlist_reorder_failed")
    } catch (reorderError) {
      setError(reorderError instanceof Error ? reorderError.message : "waitlist_reorder_failed")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleJoin() {
    if (isSaving) return
    setIsSaving(true)
    setError(null)

    try {
      await joinSeasonRoster(leagueId, seasonId)
      await refreshLeagueAccess()
    } catch (joinError) {
      const message = joinError instanceof Error ? joinError.message : t.roster.joinError
      if (message.includes("roster_full")) {
        const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist`, { method: "POST" })
        if (!response.ok) throw new Error("waitlist_join_failed")
        const payload = await response.json() as { entry?: { created_at?: string } }
        setIsWaitlisted(true)
        const positionResponse = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist`, { cache: "no-store" })
        if (positionResponse.ok) {
          const positionPayload = await positionResponse.json() as { position?: number | null }
          setWaitlistPosition(positionPayload.position ?? null)
        }
        setError(tx("La plantilla está completa. Te has unido a la lista de espera."))
        return payload
      }
      setError(message)
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

  async function handleLeaveWaitlist() {
    if (isSaving) return
    setIsSaving(true)
    try {
      const response = await fetch(`/api/leagues/${encodeURIComponent(leagueId)}/seasons/${encodeURIComponent(seasonId)}/waitlist`, { method: "DELETE" })
      if (!response.ok) throw new Error("waitlist_leave_failed")
      setIsWaitlisted(false)
      setWaitlistPosition(null)
    } catch (waitlistError) {
      setError(waitlistError instanceof Error ? waitlistError.message : "waitlist_leave_failed")
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
            <p className="shrink-0 type-caption font-black uppercase tracking-[0.12em] text-emerald-700">
              {registeredPlayers.length}/{playerCapacity}
            </p>
          </div>
          <p className="mt-0.5 type-caption font-semibold text-emerald-800">
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
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 type-caption font-black text-emerald-800">
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
            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 type-caption font-black">
              {registeredPlayers.length + index + 1}
            </span>
            {t.roster.availableSlot}
          </div>
        ))}
      </div>

      {!isCurrentUserRegistered && settings.registrationOpen && !isWaitlisted ? (
        <button
          type="button"
          onClick={handleJoin}
          disabled={isSaving}
          className="flex mt-2 w-full rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:bg-emerald-200 items-center justify-center text-center"
        >
          {isWaitlisted ? tx("En lista de espera") : isSaving ? t.common.saving : remaining > 0 ? t.roster.joinAction : tx("Entrar en lista de espera")}
        </button>
      ) : null}

      {isWaitlisted ? (
        <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900">
          {waitlistPosition ? tx(`Estás en la posición ${waitlistPosition} de la lista de espera.`) : tx("Estás en la lista de espera.")}
          <button type="button" onClick={() => void handleLeaveWaitlist()} disabled={isSaving} className="ml-2 underline disabled:opacity-50">{tx("Salir")}</button>
        </div>
      ) : null}

      {isPromoted ? (
        <div className="mt-2 rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-xs font-bold text-emerald-950">
          <p>{t.roster.waitlistPromoted}</p>
          <button type="button" onClick={() => void handleConfirmPromotion()} disabled={isSaving} className="mt-2 rounded-lg bg-emerald-700 px-3 py-1.5 text-white disabled:opacity-50">{t.roster.waitlistConfirm}</button>
        </div>
      ) : null}

      {canManage && adminWaitlist.length > 0 ? (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-white/80 p-2">
          <p className="text-xs font-black text-emerald-950">{t.roster.waitlistAdminTitle}</p>
          <div className="mt-1 grid gap-1">
            {adminWaitlist.map((entry, index) => (
              <div key={entry.user_id} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 px-2 py-1 text-xs">
                <span>{index + 1}. {entry.display_name ?? entry.user_id.slice(0, 8)}</span>
                <span className="flex gap-1">
                  <button type="button" disabled={index === 0 || isSaving} onClick={() => void moveWaitlistEntry(index, -1)} aria-label={t.roster.waitlistAdminMoveUp} className="rounded px-1.5 py-0.5 hover:bg-emerald-50">↑</button>
                  <button type="button" disabled={index === adminWaitlist.length - 1 || isSaving} onClick={() => void moveWaitlistEntry(index, 1)} aria-label={t.roster.waitlistAdminMoveDown} className="rounded px-1.5 py-0.5 hover:bg-emerald-50">↓</button>
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-2 text-xs font-bold text-red-600">{tx(error)}</p>
      ) : null}
    </AppCard>
  )
}
