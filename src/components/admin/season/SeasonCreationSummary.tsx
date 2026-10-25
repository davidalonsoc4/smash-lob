import type { ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { AppCard } from "@/components/ui/AppCard"

export type SeasonCreationSummaryGroup = {
  title: string; target: "basic" | "advanced" | "league"; rows: Array<[string, ReactNode]>
}
export function SeasonCreationSummary({ groups, participants, onEdit }: { groups: SeasonCreationSummaryGroup[]; participants: string[][]; onEdit: (target: SeasonCreationSummaryGroup["target"], section?: string) => void }) {
  const { tx } = useI18n()
  return <div className="space-y-3" data-season-creation-summary>
    <p className="text-sm text-neutral-500">{tx("Revisa los datos antes de confirmar. Puedes editar cualquier apartado sin perder el resto.")}</p>
    {groups.map(group => <AppCard key={group.title}>
      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-bold">{tx(group.title)}</h3><button type="button" className="league-creation-edit" onClick={() => onEdit(group.target, group.title)}>{tx("Editar")}<span className="sr-only"> {tx(group.title)}</span></button></div>
      <dl className="space-y-2">{group.rows.map(([label, value]) => <div key={label} className="flex items-start justify-between gap-4 text-sm"><dt className="min-w-0 text-neutral-500">{tx(label)}</dt><dd className="max-w-[65%] break-words text-right font-semibold">{value}</dd></div>)}</dl>
    </AppCard>)}
    {participants.length ? <AppCard><h3 className="mb-3 text-sm font-bold">{tx("Participantes")}</h3><div className="grid gap-2 sm:grid-cols-2">{participants.map((names, index) => <div key={index} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">{names.length === 2 ? <p className="mb-1 text-xs text-neutral-500">{tx("Pareja")} {index + 1}</p> : null}<p className="break-words font-semibold">{names.join(" · ")}</p></div>)}</div></AppCard> : null}
  </div>
}
