import { useId, useState, type ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"

export function MatchResultDetails({ information, actions, initiallyShowInformation = false }: {
  information: ReactNode
  actions?: ReactNode
  initiallyShowInformation?: boolean
}) {
  const { tx } = useI18n()
  const id = useId()
  const [open, setOpen] = useState({ information: initiallyShowInformation, actions: false })
  const panels = [
    { key: "information" as const, label: tx("Información del resultado"), content: information },
    ...(actions ? [{ key: "actions" as const, label: tx("Más acciones"), content: actions }] : []),
  ]

  return (
    <div className="app-match-result-details mt-1 text-xs leading-5 text-neutral-500">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        {panels.map(panel => (
          <button key={panel.key} id={`${id}-${panel.key}-trigger`} type="button" aria-expanded={open[panel.key]} aria-controls={`${id}-${panel.key}`} onClick={() => setOpen(current => ({ ...current, [panel.key]: !current[panel.key] }))} className="inline-flex min-h-7 items-center gap-1 py-1 text-left font-medium focus-visible:outline-2 focus-visible:outline-offset-2">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`h-3 w-3 shrink-0 ${open[panel.key] ? "rotate-90" : ""}`}><path d="m9 5 7 7-7 7" /></svg>
            {panel.label}
          </button>
        ))}
      </div>
      {panels.map(panel => (
        <div key={panel.key} id={`${id}-${panel.key}`} role="region" aria-labelledby={`${id}-${panel.key}-trigger`} hidden={!open[panel.key]} className="mt-1 w-full">
          {panel.content}
        </div>
      ))}
    </div>
  )
}
