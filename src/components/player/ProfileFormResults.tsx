import { useI18n } from "@/i18n/I18nProvider"

export type ProfileFormResult = "win" | "loss"

export function ProfileFormResults({ results }: { results: ProfileFormResult[] }) {
  const { tx } = useI18n()
  if (!results.length) return null

  return (
    <div className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[var(--app-accent)] bg-[var(--app-accent)] px-2.5 py-2">
      <p className="shrink-0 type-caption font-black uppercase tracking-[0.14em] text-[var(--competition-accent-contrast)]">{tx("Forma")}</p>
      <div className="flex min-w-0 items-center gap-1.5" aria-label={tx("Forma reciente") }>
        {results.slice(-5).map((result, index) => (
          <span
            key={`${result}-${index}`}
            title={tx(result === "win" ? "Victoria" : "Derrota")}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 type-caption font-black ${result === "win" ? "text-emerald-400" : "text-rose-400"}`}
          >
            {result === "win" ? "V" : "D"}
          </span>
        ))}
      </div>
    </div>
  )
}
