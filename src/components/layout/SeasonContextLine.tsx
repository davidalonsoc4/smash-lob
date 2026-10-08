import { useId, useState } from "react"
import type { Season } from "@/data/fakeData"
import { useI18n } from "@/i18n/I18nProvider"
import { getNewestLeagueSeasons, writeSelectedSeasonId } from "@/lib/seasonSelection"
type SeasonContextLineProps = {
  seasonName: string
  statusLabel?: string
  className?: string
  button?: {
    ariaControls: string
    ariaExpanded: boolean
    dataTour?: string
    onClick: () => void
  }
}

export function SeasonContextLineSelector({ leagueId, season, seasons, onChange, dataTour }: {
  leagueId: string; season: Season; seasons: Season[]; onChange?: (id: string) => void; dataTour?: string
}) {
  const { tx, t } = useI18n(), id = useId(), [open, setOpen] = useState(false)
  const options = getNewestLeagueSeasons(seasons, leagueId)
  const status = (item: Season) => item.status === "finished" ? t.common.finishedSeasonBadge : item.status === "upcoming" ? t.rounds.statusUpcoming : t.rounds.statusActive
  return <div className="relative mt-0.5">
    <SeasonContextLine seasonName={season.name} statusLabel={status(season)} button={options.length > 1 ? { ariaControls: id, ariaExpanded: open, dataTour, onClick: () => setOpen(!open) } : undefined} />
    {open ? <>
      <button type="button" aria-label={tx("Cerrar selector de temporadas")} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
      <div id={id} role="menu" aria-label={tx("Cambiar temporada")} onKeyDown={(event) => { if (event.key === "Escape") setOpen(false) }} className="absolute left-0 top-full z-50 mt-2 w-64 max-w-[calc(100vw-6rem)] overflow-hidden rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
        {options.map((item) => <button key={item.id} type="button" role="menuitemradio" aria-checked={item.id === season.id} onClick={() => { writeSelectedSeasonId(leagueId, item.id); onChange?.(item.id); setOpen(false) }} className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-black transition ${item.id === season.id ? "bg-neutral-100 text-neutral-950 dark:bg-neutral-800 dark:text-white" : "text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800"}`}>
          <span className="min-w-0"><span className="block truncate">{item.name}</span><span className="mt-0.5 block type-caption font-semibold text-neutral-500">{status(item)}</span></span>{item.id === season.id ? <span aria-hidden="true">✓</span> : null}
        </button>)}
      </div>
    </> : null}
  </div>
}

export function SeasonContextLine({
  seasonName,
  statusLabel,
  className = "",
  button,
}: SeasonContextLineProps) {
  const content = (
    <>
      {seasonName}
      {statusLabel ? (
        <>
          <span aria-hidden="true"> · </span>
          <span>{statusLabel}</span>
        </>
      ) : null}
    </>
  )

  const visualClassName = `type-caption font-bold text-neutral-500 ${className}`.trim()

  if (button) {
    return (
      <button
        type="button"
        data-tour={button.dataTour}
        aria-haspopup="menu"
        aria-expanded={button.ariaExpanded}
        aria-controls={button.ariaControls}
        onClick={button.onClick}
        className={`m-0 block appearance-none border-0 bg-transparent p-0 text-left ${visualClassName} focus:outline-none focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-500`}
      >
        {content}
      </button>
    )
  }

  return <p className={visualClassName}>{content}</p>
}
