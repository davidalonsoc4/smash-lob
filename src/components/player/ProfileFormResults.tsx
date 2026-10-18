import { useI18n } from "@/i18n/I18nProvider"

export type ProfileFormResult = "win" | "loss"

export function ProfileFormResults({ results }: { results: ProfileFormResult[] }) {
  const { tx } = useI18n()
  if (!results.length) return null

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--app-accent)] bg-[var(--app-accent)] px-2.5 py-2">
      <p className="shrink-0 text-xs font-black uppercase tracking-[0.14em] text-[var(--competition-accent-contrast)]">{tx("Racha")}</p>
      <div className="flex min-w-0 items-center gap-1.5" aria-label={tx("Racha reciente") }>
        {results.slice(-5).map((result, index) => (
          <span
            key={`${result}-${index}`}
            title={tx(result === "win" ? "Victoria" : "Derrota")}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white shadow-md ring-1 ring-black/10 type-caption font-black text-white ${result === "win" ? "bg-emerald-600" : "bg-rose-600"}`}
          >
            {result === "win" ? "V" : "D"}
          </span>
        ))}
      </div>
    </div>
  )
}
