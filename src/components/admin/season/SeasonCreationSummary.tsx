import type { ReactNode } from "react"
import { useI18n } from "@/i18n/I18nProvider"
import { SettingsSectionIcon, type SettingsSectionIconName } from "@/components/settings/SettingsSectionIcon"
import { AppCard } from "@/components/ui/AppCard"

export type SeasonCreationSummaryGroup = {
  title: string; target: "basic" | "advanced" | "league"; rows: Array<[string, ReactNode]>; featured?: ReactNode; accent?: string; inlineMetrics?: boolean
}
export function SeasonCreationSummary({ groups, participants, onEdit }: { groups: SeasonCreationSummaryGroup[]; participants: string[][]; onEdit: (target: SeasonCreationSummaryGroup["target"], section?: string) => void }) {
  const { tx } = useI18n()
  const icons: SettingsSectionIconName[] = ["leagues", "profile", "availability", "notifications", "matches", "payments"]
  const renderField = ([label, value]: [string, ReactNode]) => <div key={label} className="season-review-field"><dt className="text-xs text-neutral-600">{tx(label)}</dt><dd className={typeof value === "number" ? "season-review-number" : "mt-1 break-words text-sm font-semibold"}>{value}</dd></div>
  return <div className="space-y-3" data-season-creation-summary>
    <p className="text-sm text-neutral-500">{tx("Revisa los datos antes de confirmar. Puedes editar cualquier apartado sin perder el resto.")}</p>
    {groups.map((group, index) => { const metrics = group.inlineMetrics ? [] : group.rows.filter(([, value]) => typeof value === "number"); return <AppCard key={group.title} className="season-review-card" style={group.accent ? { borderTopColor: group.accent, borderTopWidth: 2 } : undefined}>
      <div className="mb-3 flex items-center justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><SettingsSectionIcon name={icons[index] ?? "leagues"} /><h3 className="text-sm font-bold">{tx(group.title)}</h3></div><button type="button" className="league-creation-edit" onClick={() => onEdit(group.target, group.title)}>{tx("Editar")}<span className="sr-only"> {tx(group.title)}</span></button></div>
      {group.featured}
      <dl className="season-review-fields">{group.rows.filter(([, value]) => group.inlineMetrics || typeof value !== "number").map(renderField)}</dl>
      {metrics.length ? <dl className="season-review-metrics" style={{ gridTemplateColumns: `repeat(${metrics.length},minmax(0,1fr))` }}>{metrics.map(renderField)}</dl> : null}
    </AppCard>})}
    {participants.length ? <details className="league-creation-details" data-season-review-roster><summary>{tx("Ver jugadores")}<span className="text-xs font-normal text-neutral-500">{participants.reduce((count, names) => count + names.length, 0)} {tx("Jugadores")}</span></summary><div className="grid grid-cols-2 gap-2 p-3 pt-0">{participants.map((names, index) => <div key={index} className="rounded-xl border border-neutral-200 px-3 py-2 text-sm">{names.length === 2 ? <p className="mb-1 text-xs text-neutral-500">{tx("Pareja")} {index + 1}</p> : null}<p className="break-words font-semibold">{names.join(" · ")}</p></div>)}</div></details> : null}
  </div>
}
