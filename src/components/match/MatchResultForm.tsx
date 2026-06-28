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
  if (!initialSets || initialSets.length === 0) {
    return [
      { a: "", b: "" },
      { a: "", b: "" },
      { a: "", b: "" },
    ]
  }

  return initialSets.slice(0, 3).map((set) => ({
    a: String(set.a),
    b: String(set.b),
  }))
}

export function MatchResultForm({
  matchId,
  teamA,
  teamB,
  initialSets,
  mode,
  onCancel,
  onSaved,
}: MatchResultFormProps) {
  const { t } = useI18n()
  const { finishMatch } = useMatchData()

  const [sets, setSets] = useState<SetInput[]>(
    getInitialSetInputs(initialSets)
  )

  const setWinners = useMemo(() => sets.map(getSetWinner), [sets])
  const pointsA = setWinners.filter((winner) => winner === "A").length
  const pointsB = setWinners.filter((winner) => winner === "B").length
  const canSave = setWinners.every(Boolean)

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
      sets: sets.map((set) => ({
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
              : t.matchResult.description}
          </p>
        </div>

        <div className="mt-5 rounded-2xl bg-neutral-100 p-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="font-bold">{getTeamDisplayName(teamA)}</p>
            <p className="text-xl font-black">{pointsA}</p>
          </div>

          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="font-bold">{getTeamDisplayName(teamB)}</p>
            <p className="text-xl font-black">{pointsB}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {sets.map((set, index) => {
            const winner = getSetWinner(set)
            const showError = isTouched(set) && !winner

            return (
              <div key={index}>
                <p className="mb-2 text-sm font-black">
                  {t.matchResult.set} {index + 1}
                </p>

                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <label>
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">
                      {t.matchResult.teamA}
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={set.a}
                      onChange={(event) =>
                        updateSet(index, "a", event.target.value)
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-lg font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                    />
                  </label>

                  <span className="mt-5 text-lg font-black text-neutral-400">
                    -
                  </span>

                  <label>
                    <span className="mb-1 block text-xs font-semibold text-neutral-500">
                      {t.matchResult.teamB}
                    </span>

                    <input
                      type="number"
                      min={0}
                      max={7}
                      value={set.b}
                      onChange={(event) =>
                        updateSet(index, "b", event.target.value)
                      }
                      className="w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-lg font-black text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
                    />
                  </label>
                </div>

                {showError ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    {t.matchResult.invalidSet}
                  </p>
                ) : null}
              </div>
            )
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