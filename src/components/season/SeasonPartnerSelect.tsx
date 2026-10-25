import { useI18n } from "@/i18n/I18nProvider"

export function SeasonPartnerSelect({ players, value, onChange, disabled = false }: {
  players: { id: string; displayName: string }[]; value: string; onChange: (value: string) => void; disabled?: boolean
}) {
  const { tx } = useI18n()
  return <div className="mt-3 space-y-1">
    <label className="block text-sm font-bold text-neutral-900">{tx("Tu compañero")}
      <select value={value} disabled={disabled} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900">
        <option value="" disabled>{tx("Selecciona un jugador")}</option>
        {players.map(player => <option key={player.id} value={player.id}>{player.displayName}</option>)}
        <option value="__pending__">{tx("Mi compañero aún no se ha inscrito")}</option>
      </select>
    </label>
    <p className="text-xs leading-5 text-neutral-500">{tx("Elige a tu compañero entre quienes aún no tienen pareja. Si todavía no aparece, podrás vincularos cuando se inscriba.")}</p>
  </div>
}
