import type { ReactNode } from "react"
import type { LeaguePair } from "@/lib/fixedPairLeague"
import { useI18n } from "@/i18n/I18nProvider"

export function SeasonPairFields({ pairs, options, onChange, disabled = false, allowEmpty = false, renderPlayerDetails }: {
  pairs: LeaguePair[]
  options: { value: string; label: string }[]
  onChange: (pairs: LeaguePair[]) => void
  disabled?: boolean
  allowEmpty?: boolean
  renderPlayerDetails?: (id: string) => ReactNode
}) {
  const { tx } = useI18n()
  function choose(index: number, member: number, value: string) {
    const next = pairs.flat(), target = index * 2 + member, previous = next.indexOf(value)
    if (previous >= 0) [next[target], next[previous]] = [next[previous], next[target]]
    else next[target] = value
    onChange(pairs.map((_, i) => [next[i * 2], next[i * 2 + 1]]))
  }
  return <div className="space-y-3">{pairs.map((pair, index) => <fieldset key={index} className="min-w-0 rounded-xl border border-neutral-200 p-3">
    <legend className="px-1 text-xs font-bold text-neutral-500">{tx("Pareja")} {index + 1}</legend>
    <div className="grid grid-cols-2 gap-2">{pair.map((id, member) => <div key={member} className="min-w-0">
      <select aria-label={`${tx("Pareja")} ${index + 1} · ${tx("Jugador")} ${member + 1}`} value={id ?? ""} disabled={disabled} onChange={event => choose(index, member, event.target.value)} className="w-full min-w-0 rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm font-semibold text-neutral-900 disabled:opacity-60">
        {allowEmpty ? <option value="">{tx("Pendiente")}</option> : null}
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {renderPlayerDetails?.(id)}
    </div>)}</div>
  </fieldset>)}</div>
}
