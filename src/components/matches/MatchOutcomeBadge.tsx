import { useI18n } from "@/i18n/I18nProvider"
import { StatusHelp } from "@/components/ui/StatusHelp"

type MatchOutcome = "victory" | "defeat" | "finished"
const tones = {
  victory: "bg-green-100 text-green-800",
  defeat: "bg-red-100 text-red-800",
  finished: "bg-neutral-100 text-neutral-600",
}

/** Shared compact result label; keep appearance consistent across match cards. */
export function MatchOutcomeBadge({ outcome }: { outcome: MatchOutcome }) {
  const { tx } = useI18n()
  const label = tx(outcome === "victory" ? "Victoria" : outcome === "defeat" ? "Derrota" : "Finalizado")
  return <StatusHelp kind="match" status={outcome} label={label}
    className={`relative z-10 inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2 py-0.5 type-caption font-semibold leading-none normal-case tracking-normal !border-0 !ring-0 ${tones[outcome]}`}>
    {label}
  </StatusHelp>
}
