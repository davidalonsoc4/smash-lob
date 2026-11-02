import styles from "./MatchPreviewTeams.module.css"
import { Fragment } from "react"
import { FitText } from "@/components/ui/FitText"
import { SetGameScore } from "./SetGameScore"
import { useI18n } from "@/i18n/I18nProvider"

export type PreviewPlayer = { id: string; name: string; highlightedLabel?: string; substituteLabel?: string }

export function MatchPreviewTeams({ teamA, teamB, sets, scores, accented = false, unboxed = false }: {
  unboxed?: boolean
  accented?: boolean
  teamA: PreviewPlayer[]; teamB: PreviewPlayer[]
  sets: { a: number; b: number }[]; scores: { a: number; b: number }
}) {
  const { tx } = useI18n()
  const names = (players: PreviewPlayer[]) => players.map(player => {
    const name = <FitText noWrap minFontSize={10} className={player.highlightedLabel ? "min-w-0 flex-1" : ""}>{player.name}</FitText>
    return (
    <p key={player.id} className="w-full text-sm font-black leading-tight text-neutral-950">
      {player.highlightedLabel ? <span className="flex min-w-0 items-center gap-1">{name}<span className="shrink-0 text-yellow-500" aria-label={player.highlightedLabel} title={player.highlightedLabel}>★</span></span> : name}
      {player.substituteLabel ? <span className="block type-micro font-semibold text-red-700">{tx("Suplente · por")} {player.substituteLabel}</span> : null}
    </p>
    )
  })


  return (
    <div data-match-preview="result" className={`match-preview-result grid min-w-0 flex-1 gap-x-1 gap-y-2 ${accented ? styles.accented : styles.standard} ${unboxed ? styles.unboxed : ""}`} style={{ gridTemplateColumns: `minmax(0,1fr)${sets.length ? ` repeat(${sets.length}, 24px)` : ""} 32px 12px` }}>
      {([{ players: teamA, side: "a" as const }, { players: teamB, side: "b" as const }]).map(({ players, side }) => {
        const won = scores[side] > scores[side === "a" ? "b" : "a"]
        return <Fragment key={side}>
          <div data-preview-team={side} data-preview-winner={won || undefined} className="col-span-full grid items-center gap-x-1 rounded-xl bg-neutral-50 px-3 py-2.5" style={{ gridTemplateColumns: "subgrid" }} aria-label={won ? tx("Ganadores:") : undefined}>
            <div className="grid min-w-0" style={{ gridTemplateRows: players.map(() => "minmax(0,1fr)").join(" 1px ") }}>
              {players.map((player, playerIndex) => <Fragment key={player.id}>
                {playerIndex > 0 ? <div data-preview-name-divider className="relative mr-1 h-px">
                  <span aria-hidden="true" className={`match-preview-name-line absolute inset-y-0 left-0 border-t ${won ? "right-5" : "right-0"}`} />
                  {won ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="match-preview-trophy absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2"><path d="M8 3h8v6a4 4 0 0 1-8 0V3Zm0 2H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4M12 13v5m-4 3h8m-7-3h6v3H9z" /></svg> : null}
                </div> : null}
                <div className={`flex min-w-0 ${playerIndex === 0 ? "items-end pb-1" : "items-start pt-1"}`}>{names([player])}</div>
              </Fragment>)}
            </div>
            {sets.map((set, setIndex) => <div key={setIndex} data-preview-score aria-label={`${tx(side === "a" ? "Juegos por set de la pareja A" : "Juegos por set de la pareja B")} ${setIndex + 1}: ${set[side]}`} className="match-preview-partial flex items-center justify-center"><SetGameScore value={set[side]} won={set[side] > set[side === "a" ? "b" : "a"]} /></div>)}
            <span data-preview-score className="match-preview-total text-center text-xl font-black leading-none tabular-nums text-neutral-950" aria-label={tx(side === "a" ? "Sets ganados por la pareja A" : "Sets ganados por la pareja B")}>{scores[side]}</span>
          </div>
        </Fragment>
      })}
    </div>
  )
}
