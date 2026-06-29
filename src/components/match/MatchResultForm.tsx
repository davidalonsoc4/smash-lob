"use client"

import { FormEvent, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { getTeamDisplayName } from "@/lib/players"

type MatchResultFormProps = {
  matchId: string
  teamA: string[]
  teamB: string[]
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

export function MatchResultForm({
  matchId,
  teamA,
  teamB,
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

  const setWinners = useMemo(() => sets.map(getSetWinner), [sets])
  const completedSets = sets.filter(
    (set, index) => isTouched(set) && setWinners[index]
  )
  const pointsA = setWinners.filter((winner) => winner === "A").length
  const pointsB = setWinners.filter((winner) => winner === "B").length
  const hasInvalidTouchedSet = sets.some(
    (set, index) => isTouched(set) && !setWinners[index]
  )
  const canSave = requiresThreeSets
    ? setWinners.every(Boolean)
    : completedSets.length > 0 && !hasInvalidTouchedSet

  function updateSet(index: number, team: "a" | "b", value: string) {
    setSets((currentSets) =>
      currentSets.map((set, setIndex) =>
        setIndex === index
          ? {
              ...set,
              [team]: value,
            }
          : set
      )
    )
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    finishMatch(matchId, {
      sets: completedSets.map((set) => ({
        a: Number(set.a),
        b: Number(set.b),
      })),
    })

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

        <div className="mt-5 rounded-2xl bg-neutral-100 p-3 text-sm">
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,minmax(48px,58px))_34px] items-center gap-2">
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

            <p className="truncate pr-1 text-xs font-black">
              {getTeamDisplayName(teamA)}
            </p>

            {sets.map((set, index) => (
              <label key={index}>
                <span className="sr-only">
                  {t.matchResult.teamA} {t.matchResult.set} {index + 1}
                </span>

                <input
                  type="number"
                  min={0}
                  max={7}
                  value={set.a}
                  onChange={(event) =>
                    updateSet(index, "a", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-center text-base font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-500"
                />
              </label>
            ))}

            <p className="text-center text-lg font-black">{pointsA}</p>

            <p className="truncate pr-1 text-xs font-black">
              {getTeamDisplayName(teamB)}
            </p>

            {sets.map((set, index) => (
              <label key={index}>
                <span className="sr-only">
                  {t.matchResult.teamB} {t.matchResult.set} {index + 1}
                </span>

                <input
                  type="number"
                  min={0}
                  max={7}
                  value={set.b}
                  onChange={(event) =>
                    updateSet(index, "b", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-neutral-200 bg-white px-2 text-center text-base font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-500"
                />
              </label>
            ))}

            <p className="text-center text-lg font-black">{pointsB}</p>
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

        <div className="mt-5 flex gap-3">
          {mode === "edit" && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800"
            >
              {t.matchResult.cancelEdit}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!canSave}
            className="flex-1 rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {mode === "edit" ? t.matchResult.update : t.matchResult.save}
          </button>
        </div>
      </form>
    </AppCard>
  )
}
