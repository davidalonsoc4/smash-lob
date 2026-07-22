"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import type { MatchData } from "@/context/MatchDataProvider"
import type { PlayerProfile } from "@/data/fakeData"
import { useI18n } from "@/i18n/I18nProvider"

type PoolItem = {
  id: string
  player_id: string
  active: boolean
  players:
    | { id: string; display_name: string }
    | Array<{ id: string; display_name: string }>
    | null
}

type ExistingSubstitution = {
  id: string
  match_id: string
  original_player_id: string
  substitute_player_id: string
  substitution_type: "single" | "permanent"
}

type Payload = {
  substitutes: PoolItem[]
  matchSubstitutions: ExistingSubstitution[]
}

const NEW_SUBSTITUTE_VALUE = "__new_substitute__"

function getProfile(item: PoolItem | null | undefined) {
  if (!item) return null
  return Array.isArray(item.players) ? item.players[0] ?? null : item.players
}

export function MatchSubstitutionPanel({
  match,
  players,
}: {
  match: MatchData
  players: PlayerProfile[]
}) {
  const { t } = useI18n()
  const [payload, setPayload] = useState<Payload | null>(null)
  const [originalPlayerId, setOriginalPlayerId] = useState("")
  const [substituteSelection, setSubstituteSelection] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/matches/${encodeURIComponent(match.id)}/substitution`, {
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("load_failed")
        return (await response.json()) as Payload
      })
      .then((nextPayload) => {
        if (!cancelled) setPayload(nextPayload)
      })
      .catch(() => {
        if (!cancelled) setError(t.matchDetail.substitutionsLoadError)
      })
    return () => {
      cancelled = true
    }
  }, [match.id, t.matchDetail.substitutionsLoadError])

  const matchSubstitutions = useMemo(
    () =>
      payload?.matchSubstitutions.filter(
        (item) => item.match_id === match.id,
      ) ?? [],
    [match.id, payload],
  )
  const substitutePlayerIds = new Set(
    matchSubstitutions.map((item) => item.substitute_player_id),
  )
  const currentParticipants = [...match.teamA, ...match.teamB]
  const selectableOriginalPlayers = currentParticipants.filter(
    (playerId) => !substitutePlayerIds.has(playerId),
  )
  const activePool =
    payload?.substitutes.filter(
      (item) => item.active && !currentParticipants.includes(item.player_id),
    ) ?? []
  const isAddingNewSubstitute = substituteSelection === NEW_SUBSTITUTE_VALUE
  const selectedSubstitutePlayerId = isAddingNewSubstitute
    ? ""
    : substituteSelection
  const canAssign = Boolean(
    originalPlayerId &&
      (selectedSubstitutePlayerId ||
        (isAddingNewSubstitute && displayName.trim().length >= 2)),
  )

  async function assign(event: FormEvent) {
    event.preventDefault()
    if (isSaving || !canAssign) return

    setIsSaving(true)
    setError(null)
    const response = await fetch(
      `/api/matches/${encodeURIComponent(match.id)}/substitution`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalPlayerId,
          substitutePlayerId: selectedSubstitutePlayerId || undefined,
          displayName: isAddingNewSubstitute
            ? displayName.trim()
            : undefined,
        }),
      },
    )
    setIsSaving(false)
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as {
        error?: string
      } | null
      const messages: Record<string, string> = {
        forbidden: t.matchDetail.substitutionsForbidden,
        season_player_cannot_be_substitute:
          t.matchDetail.substitutionsStarterCannotSubstitute,
        substitute_already_in_match:
          t.matchDetail.substitutionsAlreadyInMatch,
        substitute_not_available: t.matchDetail.substitutionsUnavailable,
        original_player_already_substituted:
          t.matchDetail.substitutionsSlotAlreadyReplaced,
        finished_match_locked: t.matchDetail.substitutionsFinishedLocked,
      }
      setError(
        messages[body?.error ?? ""] ?? t.matchDetail.substitutionsSaveError,
      )
      return
    }
    window.location.reload()
  }

  async function remove(substitutePlayerIdToRemove: string) {
    if (isSaving) return
    setIsSaving(true)
    setError(null)
    const response = await fetch(
      `/api/matches/${encodeURIComponent(match.id)}/substitution`,
      {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          substitutePlayerId: substitutePlayerIdToRemove,
        }),
      },
    )
    setIsSaving(false)
    if (!response.ok) {
      setError(t.matchDetail.substitutionsUndoError)
      return
    }
    window.location.reload()
  }

  return (
    <details className="group w-10 flex-none overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-[0_1px_8px_rgba(15,23,42,0.04)] open:w-full open:basis-full">
      <summary title={t.matchDetail.substitutionsTitle} aria-label={t.matchDetail.substitutionsTitle} className="relative flex h-9 cursor-pointer list-none items-center justify-center px-2 text-neutral-700 [&::-webkit-details-marker]:hidden">
        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
          <path d="M3 6h10m0 0-3-3m3 3-3 3M17 14H7m0 0 3-3m-3 3 3 3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">{t.matchDetail.substitutionsTitle}</span>
        {matchSubstitutions.length > 0 ? (
          <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white ring-2 ring-white">
            {matchSubstitutions.length}
          </span>
        ) : null}
      </summary>

      <div className="border-t border-neutral-100 px-3 py-3">

        {matchSubstitutions.length > 0 ? (
          <div className="mt-2 space-y-1.5">
            {matchSubstitutions.map((item) => {
              const original = players.find(
                (player) => player.id === item.original_player_id,
              )
              const substitute =
                players.find(
                  (player) => player.id === item.substitute_player_id,
                ) ??
                getProfile(
                  payload?.substitutes.find(
                    (poolItem) =>
                      poolItem.player_id === item.substitute_player_id,
                  ),
                )
              const substituteName =
                "displayName" in (substitute ?? {})
                  ? (substitute as PlayerProfile).displayName
                  : (substitute as { display_name?: string } | null)
                      ?.display_name

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-red-50 px-2.5 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black">
                      {substituteName ?? t.matchDetail.substituteFallbackName}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-red-700">
                      {t.matchDetail.substituteForPrefix}{" "}
                      {original?.displayName ??
                        t.matchDetail.starterFallbackName}{" "}
                      ·{" "}
                      {item.substitution_type === "permanent"
                        ? t.matchDetail.substitutionPermanent
                        : t.matchDetail.substitutionThisMatch}
                    </p>
                  </div>
                  {item.substitution_type === "single" &&
                  match.status !== "finished" ? (
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => remove(item.substitute_player_id)}
                      className="shrink-0 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-black text-red-700 disabled:opacity-50"
                    >
                      {t.matchDetail.substitutionUndo}
                    </button>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : null}

        {match.status !== "finished" ? (
          <form onSubmit={assign} className="mt-2 space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              <select
                value={originalPlayerId}
                onChange={(event) => setOriginalPlayerId(event.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="">
                  {t.matchDetail.substitutionOriginalPlaceholder}
                </option>
                {selectableOriginalPlayers.map((playerId) => (
                  <option key={playerId} value={playerId}>
                    {players.find((player) => player.id === playerId)
                      ?.displayName ?? playerId}
                  </option>
                ))}
              </select>

              <select
                value={substituteSelection}
                onChange={(event) => {
                  setSubstituteSelection(event.target.value)
                  if (event.target.value !== NEW_SUBSTITUTE_VALUE) {
                    setDisplayName("")
                  }
                }}
                className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
              >
                <option value="">
                  {t.matchDetail.substitutionSelectPlaceholder}
                </option>
                {activePool.map((item) => (
                  <option key={item.id} value={item.player_id}>
                    {getProfile(item)?.display_name ??
                      t.matchDetail.substituteFallbackName}
                  </option>
                ))}
                <option value={NEW_SUBSTITUTE_VALUE}>
                  + {t.matchDetail.substitutionAddNew}
                </option>
              </select>
            </div>

            {isAddingNewSubstitute ? (
              <div>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={80}
                  placeholder={t.matchDetail.substitutionNewNamePlaceholder}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
                />
                <p className="mt-1 text-[10px] font-semibold text-neutral-500">
                  {t.matchDetail.substitutionSavedToPool}
                </p>
              </div>
            ) : null}

            <button
              disabled={isSaving || !canAssign}
              className="w-full rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
            >
              {isSaving
                ? t.matchDetail.saving
                : t.matchDetail.substitutionAssign}
            </button>
          </form>
        ) : null}

        {error ? (
          <p className="mt-2 text-[11px] font-bold text-red-700">{error}</p>
        ) : null}
      </div>
    </details>
  )
}
