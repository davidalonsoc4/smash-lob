"use client"

import { FormEvent, useMemo, useRef, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { PlayerProfile } from "@/data/fakeData"

type MatchResultFormProps = {
  matchId: string
  teamA: string[]
  teamB: string[]
  players?: PlayerProfile[]
  initialSets?: { a: number; b: number }[]
  mode: "create" | "edit"
  requiresThreeSets: boolean
  onCancel?: () => void
  onSaved?: () => void
}

type SetInput = {
  a: string
  b: string
}

function parseScore(value: string) {
  const numberValue = Number(value)

  if (!Number.isInteger(numberValue)) {
    return null
  }

  if (numberValue < 0 || numberValue > 7) {
    return null
  }

  return numberValue
}

function getSetWinner(set: SetInput) {
  const gamesA = parseScore(set.a)
  const gamesB = parseScore(set.b)

  if (gamesA === null || gamesB === null) {
    return null
  }

  if (gamesA === gamesB) {
    return null
  }

  const winnerGames = Math.max(gamesA, gamesB)
  const loserGames = Math.min(gamesA, gamesB)

  const isValidSet =
    (winnerGames === 6 && loserGames <= 4) ||
    (winnerGames === 7 && (loserGames === 5 || loserGames === 6))

  if (!isValidSet) {
    return null
  }

  return gamesA > gamesB ? "A" : "B"
}

function isTouched(set: SetInput) {
  return set.a.length > 0 || set.b.length > 0
}

function getInitialSetInputs(initialSets?: { a: number; b: number }[]) {
  const emptySets = [
    { a: "", b: "" },
    { a: "", b: "" },
    { a: "", b: "" },
  ]

  if (!initialSets || initialSets.length === 0) {
    return emptySets
  }

  return emptySets.map((emptySet, index) => {
    const initialSet = initialSets[index]

    if (!initialSet) {
      return emptySet
    }

    return {
      a: String(initialSet.a),
      b: String(initialSet.b),
    }
  })
}

function getPlayerDisplayName(playerId: string, players?: PlayerProfile[]) {
  return players?.find((player) => player.id === playerId)?.displayName ?? playerId
}

function TeamNameStack({
  label,
  team,
  players,
}: {
  label: string
  team: string[]
  players?: PlayerProfile[]
}) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <div className="mt-2 space-y-1">
        {team.map((playerId) => (
          <p
            key={playerId}
            className="truncate text-sm font-black text-neutral-950"
            title={getPlayerDisplayName(playerId, players)}
          >
            {getPlayerDisplayName(playerId, players)}
          </p>
        ))}
      </div>
    </div>
  )
}

export function MatchResultForm({
  matchId,
  teamA,
  teamB,
  players,
  initialSets,
  mode,
  requiresThreeSets,
  onCancel,
  onSaved,
}: MatchResultFormProps) {
  const { t } = useI18n()
  const { finishMatch } = useMatchData()

  const [sets, setSets] = useState<SetInput[]>(
    getInitialSetInputs(initialSets)
  )
  const scoreInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const setWinners = useMemo(() => sets.map(getSetWinner), [sets])
  const completedSets = sets.filter(
    (set, index) => isTouched(set) && setWinners[index]
  )
  const pointsA = setWinners.filter((winner) => winner === "A").length
  const pointsB = setWinners.filter((winner) => winner === "B").length
  const hasInvalidTouchedSet = sets.some(
    (set, index) => isTouched(set) && !setWinners[index]
  )
  const canSave =
    !isSaving &&
    (requiresThreeSets
      ? setWinners.every(Boolean)
      : completedSets.length > 0 && !hasInvalidTouchedSet)

  function focusNextScoreInput(fieldIndex: number) {
    const nextInput = scoreInputRefs.current[fieldIndex + 1]

    if (!nextInput) {
      return
    }

    window.setTimeout(() => {
      nextInput.focus()
      nextInput.select()
    }, 0)
  }

  function sanitizeScoreInput(value: string) {
    const lastValidDigit = value
      .split("")
      .reverse()
      .find((character) => /^[0-7]$/.test(character))

    return lastValidDigit ?? ""
  }

  function updateSet(index: number, team: "a" | "b", value: string) {
    const cleanValue = sanitizeScoreInput(value)
    const fieldIndex = index * 2 + (team === "a" ? 0 : 1)

    setSets((currentSets) =>
      currentSets.map((set, setIndex) =>
        setIndex === index
          ? {
              ...set,
              [team]: cleanValue,
            }
          : set
      )
    )
    setActionError(null)

    if (cleanValue) {
      focusNextScoreInput(fieldIndex)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setIsSaving(true)
    setActionError(null)

    const saved = await finishMatch(matchId, {
      sets: completedSets.map((set) => ({
        a: Number(set.a),
        b: Number(set.b),
      })),
    })

    setIsSaving(false)

    if (!saved) {
      setActionError(
        "No se ha podido guardar el resultado en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error."
      )
      return
    }

    onSaved?.()
  }

  return (
    <AppCard>
      <form onSubmit={handleSubmit}>
        <div>
          <p className="font-bold">
            {mode === "edit" ? t.matchResult.editTitle : t.matchResult.title}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {mode === "edit"
              ? t.matchResult.editDescription
              : requiresThreeSets
                ? t.matchResult.description
                : t.matchResult.optionalSetsDescription}
          </p>
        </div>

        <div className="mt-5 rounded-3xl bg-neutral-100 p-3">
          <div className="grid grid-cols-2 gap-2">
            <TeamNameStack label="Pareja A" team={teamA} players={players} />
            <TeamNameStack label="Pareja B" team={teamB} players={players} />
          </div>

          <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm">
            <div className="grid grid-cols-[50px_repeat(3,minmax(46px,1fr))_42px] items-center gap-2">
              <div />

              {sets.map((set, index) => (
                <p
                  key={index}
                  className="text-center text-[10px] font-black uppercase text-neutral-500"
                >
                  {t.matchResult.set} {index + 1}
                </p>
              ))}

              <p className="text-center text-[10px] font-black uppercase text-neutral-500">
                {t.common.pointsShort}
              </p>

              <p className="text-xs font-black text-neutral-500">A</p>

              {sets.map((set, index) => (
                <label key={index}>
                  <span className="sr-only">
                    {t.matchResult.teamA} {t.matchResult.set} {index + 1}
                  </span>

                  <input
                    ref={(element) => {
                      scoreInputRefs.current[index * 2] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-7]*"
                    maxLength={1}
                    value={set.a}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateSet(index, "a", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-center text-base font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-500 disabled:bg-neutral-100"
                  />
                </label>
              ))}

              <p className="text-center text-lg font-black">{pointsA}</p>

              <p className="text-xs font-black text-neutral-500">B</p>

              {sets.map((set, index) => (
                <label key={index}>
                  <span className="sr-only">
                    {t.matchResult.teamB} {t.matchResult.set} {index + 1}
                  </span>

                  <input
                    ref={(element) => {
                      scoreInputRefs.current[index * 2 + 1] = element
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-7]*"
                    maxLength={1}
                    value={set.b}
                    disabled={isSaving}
                    onChange={(event) =>
                      updateSet(index, "b", event.target.value)
                    }
                    className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-center text-base font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-500 disabled:bg-neutral-100"
                  />
                </label>
              ))}

              <p className="text-center text-lg font-black">{pointsB}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-1">
          {sets.map((set, index) => {
            const winner = getSetWinner(set)
            const showError = isTouched(set) && !winner

            return showError ? (
              <p key={index} className="text-xs font-semibold text-red-600">
                {t.matchResult.set} {index + 1}: {t.matchResult.invalidSet}
              </p>
            ) : null
          })}
        </div>

        {actionError ? (
          <p className="mt-4 rounded-2xl bg-red-50 p-3 text-xs font-semibold text-red-700">
            {actionError}
          </p>
        ) : null}

        <div className="mt-5 flex gap-3">
          {mode === "edit" && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:text-neutral-400"
            >
              {t.matchResult.cancelEdit}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!canSave}
            className="flex-1 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isSaving
              ? "Guardando..."
              : mode === "edit"
                ? t.matchResult.update
                : t.matchResult.save}
          </button>
        </div>
      </form>
    </AppCard>
  )
}
