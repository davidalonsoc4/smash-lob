"use client"

import { Fragment } from "react"
import { FitText } from "@/components/ui/FitText"
import { SetGameScore } from "./SetGameScore"
import { useI18n } from "@/i18n/I18nProvider"

export type PreviewPlayer = { id: string; name: string; highlightedLabel?: string; substituteLabel?: string }

export function MatchPreviewTeams({ teamA, teamB, finished, sets, scores }: {
  teamA: PreviewPlayer[]; teamB: PreviewPlayer[]; finished: boolean
  sets: { a: number; b: number }[]; scores: { a: number; b: number }
}) {
  const { tx } = useI18n()
  const names = (players: PreviewPlayer[]) => players.map(player => {
    const name = <FitText noWrap minFontSize={10} className={player.highlightedLabel ? "min-w-0 flex-1" : ""}>{player.name}</FitText>
    return (
    <p key={player.id} className="w-full text-sm font-black leading-tight text-neutral-950">
      {player.highlightedLabel ? <span className="flex min-w-0 items-center gap-1">{name}<span className="shrink-0 text-yellow-500" aria-label={player.highlightedLabel} title={player.highlightedLabel}>★</span></span> : name}
      {player.substituteLabel ? <span className="block text-[10px] font-semibold text-red-700">{tx("Suplente · por")} {player.substituteLabel}</span> : null}
    </p>
    )
  })

  if (!finished) return (
    <div data-match-preview="versus" className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_30px_minmax(0,1fr)] items-stretch gap-2">
      <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5"><div className="flex min-w-0 flex-col gap-y-1">{names(teamA)}</div></div>
      <div className="flex items-center justify-center"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 type-caption font-black uppercase text-neutral-600">VS</span></div>
      <div className="min-w-0 rounded-xl bg-neutral-50 px-3 py-2.5 text-right"><div className="flex min-w-0 flex-col items-end gap-y-1">{names(teamB)}</div></div>
    </div>
  )

  return (
    <div data-match-preview="result" className="match-preview-result grid min-w-0 flex-1 gap-x-1 rounded-xl bg-neutral-50 px-3 py-1" style={{ gridTemplateColumns: `minmax(0,1fr)${sets.length ? ` repeat(${sets.length}, 24px)` : ""} 32px` }}>
      <div className="col-span-full grid gap-x-1 pb-0.5 text-center text-[10px] font-medium text-neutral-500" data-preview-score-head style={{ gridTemplateColumns: "subgrid" }}>
        <span />{sets.map((_, index) => <span key={index}>S{index + 1}</span>)}<span>{tx("Sets")}</span>
      </div>
      {([{ players: teamA, side: "a" as const }, { players: teamB, side: "b" as const }]).map(({ players, side }, index) => {
        const won = scores[side] > scores[side === "a" ? "b" : "a"]
        return <Fragment key={side}>
          {index > 0 ? <div aria-hidden="true" className="match-preview-pair-divider col-span-full my-1.5 border-t" /> : null}
          <div data-preview-team={side} data-preview-winner={won || undefined} className="col-span-full grid items-center gap-x-1" style={{ gridTemplateColumns: "subgrid" }} aria-label={won ? tx("Ganadores:") : undefined}>
            <div className="grid min-w-0" style={{ gridTemplateRows: players.map(() => "minmax(0,1fr)").join(" 1px ") }}>
              {players.map((player, playerIndex) => <Fragment key={player.id}>
                {playerIndex > 0 ? <div data-preview-name-divider className="relative mr-1 h-px">
                  <span aria-hidden="true" className={`match-preview-name-line absolute inset-y-0 left-0 border-t ${won ? "right-5" : "right-0"}`} />
                  {won ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="match-preview-trophy absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6v3H9z" /></svg> : null}
                </div> : null}
                <div className={`flex min-w-0 ${playerIndex === 0 ? "items-end pb-1" : "items-start pt-1"}`}>{names([player])}</div>
              </Fragment>)}
            </div>
            {sets.map((set, setIndex) => <div key={setIndex} data-preview-score className="match-preview-partial flex items-center justify-center"><SetGameScore value={set[side]} won={set[side] > set[side === "a" ? "b" : "a"]} /></div>)}
            <span data-preview-score className="match-preview-total text-center text-xl font-black leading-none tabular-nums text-neutral-950" aria-label={tx(side === "a" ? "Sets ganados por la pareja A" : "Sets ganados por la pareja B")}>{scores[side]}</span>
          </div>
        </Fragment>
      })}
    </div>
  )
}
