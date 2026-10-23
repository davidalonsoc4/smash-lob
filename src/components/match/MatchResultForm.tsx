"use client"

import { type FormEvent, useMemo, useRef, useState } from "react"
import { FitText } from "@/components/ui/FitText"
import { AppCard } from "@/components/ui/AppCard"
import { useMatchData } from "@/context/MatchDataProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { showActionFeedback } from "@/lib/actionFeedback"
import { hasMatchResultWinner } from "@/lib/matchResultValidity"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { matchPrimaryButton, matchSecondaryButton, matchToggleClass } from "./matchPanelStyles"

type MatchResultFormProps = {
  matchId: string
  initialSets?: { a: number; b: number }[]
  mode: "create" | "edit"
  requiresThreeSets: boolean
  reportedByPlayerId: string | null
  onCancel?: () => void
  onSaved?: () => void
  persistResult?: (sets: { a: number; b: number }[]) => Promise<boolean>
  saveErrorMessage?: string
  teamAPlayers?: string[]
  teamBPlayers?: string[]
  teamALabel?: string
  teamBLabel?: string
  initiallyExpanded?: boolean
}

type SetInput = {
  a: string
  b: string
}

function parseScore(value: string) {
  if (!value.trim()) return null
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
  initialSets,
  mode,
  requiresThreeSets,
  reportedByPlayerId,
  onCancel,
  onSaved,
  persistResult,
  saveErrorMessage,
  teamAPlayers,
  teamBPlayers,
  teamALabel,
  teamBLabel,
  initiallyExpanded = true,
}: MatchResultFormProps) {
  const { t, tx } = useI18n()
  const { finishMatch } = useMatchData()

  const [sets, setSets] = useState<SetInput[]>(
    getInitialSetInputs(initialSets)
  )
  const scoreInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const [isSaving, setIsSaving] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(initiallyExpanded || mode === "edit")
  const [blurredFields, setBlurredFields] = useState<number[]>([])
  const isExpanded = expanded || initiallyExpanded || mode === "edit"

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
    hasMatchResultWinner(completedSets.map((set) => ({ a: Number(set.a), b: Number(set.b) }))) &&
    (requiresThreeSets
      ? setWinners.every(Boolean)
      : completedSets.length > 0 && !hasInvalidTouchedSet)
  const incompleteSet = sets.some(set => isTouched(set) && (!set.a || !set.b))
  const saveHint = canSave || isSaving ? null : incompleteSet ? tx("Completa los dos marcadores de cada set empezado.") : hasInvalidTouchedSet ? tx("Revisa los sets señalados antes de guardar.") : requiresThreeSets && !setWinners.every(Boolean) ? tx("Completa los tres sets obligatorios.") : tx("Introduce un resultado con una pareja ganadora.")

  function focusScoreInput(fieldIndex: number) {
    const input = scoreInputRefs.current[fieldIndex]

    if (!input) {
      return
    }

    window.setTimeout(() => {
      input.focus()
      input.select()
    }, 0)
  }

  function focusNextScoreInput(fieldIndex: number) {
    focusScoreInput(fieldIndex + 1)
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

    const normalizedSets = completedSets.map((set) => ({
      a: Number(set.a),
      b: Number(set.b),
    }))
    const saved = await (persistResult
      ? persistResult(normalizedSets)
      : finishMatch(
          matchId,
          { sets: normalizedSets },
          reportedByPlayerId,
        )).catch(() => false)

    setIsSaving(false)

    if (!saved) {
      setActionError(
        saveErrorMessage ??
          "No se ha podido guardar el resultado en la base de datos. Revisa Supabase o el valor smash-lob-last-supabase-error."
      )
      return
    }

    showActionFeedback({
      tone: "success",
      message:
        mode === "edit"
          ? t.matchResult.updatedFeedback
          : t.matchResult.savedFeedback,
    })
    onSaved?.()
  }

  return (
    <AppCard className="!p-0">
      {mode === "edit" || initiallyExpanded ? <div className="px-3 py-2.5"><SectionHeader title={mode === "edit" ? t.matchResult.editTitle : t.matchResult.title} /></div> : <button type="button" className="w-full px-3 py-2.5 text-left" aria-expanded={isExpanded} onClick={() => setExpanded(value => !value)}>
        <SectionHeader headingTag="span" title={t.matchResult.title} action={<span aria-hidden="true" className={matchToggleClass}><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={`h-4 w-4 ${isExpanded ? "rotate-180" : ""}`}><path d="m6 8 4 4 4-4" /></svg></span>} />
      </button>}
      {isExpanded ? <form onSubmit={handleSubmit} className="px-3 pb-3">
        <div>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            {mode === "edit"
              ? t.matchResult.editDescription
              : requiresThreeSets
                ? t.matchResult.description
                : t.matchResult.optionalSetsDescription}
          </p>
        </div>

        <div className="mt-3 space-y-1.5">
          <div className="grid grid-cols-[minmax(0,1fr)_repeat(3,2rem)_4.5rem] items-center gap-1 px-2">
            <span />
            {sets.map((_, index) => <span key={index} className="text-center type-caption font-semibold text-neutral-500">{t.matchResult.set} {index + 1}</span>)}
            <span className="text-center text-sm font-bold text-neutral-950">{t.matchResult.resultLabel}</span>
          </div>
          {(["a", "b"] as const).map((team, teamIndex) => {
            const names = team === "a" ? teamAPlayers : teamBPlayers
            const label = team === "a" ? teamALabel : teamBLabel
            const title = team === "a" ? t.matchResult.teamA : t.matchResult.teamB
            return <div key={team} role="group" aria-label={title} className="grid grid-cols-[minmax(0,1fr)_repeat(3,2rem)_4.5rem] items-center gap-1 rounded-xl bg-neutral-100 px-2 py-2.5">
              <div className="min-w-0 pr-1 text-sm font-bold leading-5 text-neutral-950">
                {(names?.length ? names : [label || title]).map((name, index) => <FitText key={index} noWrap minFontSize={10}>{name}</FitText>)}
              </div>
              {sets.map((set, index) => <label key={index}>
                <span className="sr-only">{title} {t.matchResult.set} {index + 1}</span>
                <input
                  ref={element => { scoreInputRefs.current[index * 2 + teamIndex] = element }}
                  type="text" inputMode="numeric" pattern="[0-7]*" maxLength={1}
                  value={set[team]} disabled={isSaving}
                  onChange={event => updateSet(index, team, event.target.value)}
                  onBlur={() => setBlurredFields(fields => [...new Set([...fields, index * 2 + teamIndex])])}
                  className="h-9 w-full rounded-lg border border-neutral-300 bg-white p-0 text-center text-base font-bold text-neutral-900 outline-none focus:border-neutral-950 focus:ring-1 focus:ring-current disabled:opacity-50"
                />
              </label>)}
              <span className="text-center text-2xl font-black text-neutral-950">{team === "a" ? pointsA : pointsB}</span>
            </div>
          })}
        </div>

        <div className="mt-2 space-y-1">
          {sets.map((set, index) => {
            const winner = getSetWinner(set)
            const complete = set.a.length > 0 && set.b.length > 0
            const showError = isTouched(set) && !winner && (complete || (blurredFields.includes(index * 2) && blurredFields.includes(index * 2 + 1)))

            return showError ? (
              <p key={index} className="text-xs font-semibold text-red-600">
                {t.matchResult.set} {index + 1}: {complete ? t.matchResult.invalidSet : tx("Completa ambos marcadores.")}
              </p>
            ) : null
          })}
        </div>

        {actionError ? (
            <p role="alert" className="mt-2 rounded-lg bg-red-50 p-2 text-xs font-semibold text-red-700">
            {tx(actionError)}
          </p>
        ) : null}
        {saveHint ? <p className="mt-2 text-xs text-neutral-500">{saveHint}</p> : null}

        <div className="mt-3 flex gap-2">
          {mode === "edit" && onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className={`${matchSecondaryButton} flex-1`}
            >
              {t.matchResult.cancelEdit}
            </button>
          ) : null}

          <button
            type="submit"
            disabled={!canSave}
            className={`${matchPrimaryButton} flex-1`}
          >
            {isSaving
              ? "Guardando..."
              : mode === "edit"
                ? t.matchResult.update
                : t.matchResult.save}
          </button>
        </div>
      </form> : null}
    </AppCard>
  )
}
