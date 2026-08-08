import Link from "next/link"
import {
  formatPersonalMatchDate,
  formatPersonalMatchScore,
  getPersonalMatchOutcome,
  getPersonalMatchTeamNames,
  type PersonalMatchItem,
} from "@/lib/personalMatches"

export function PersonalMatchCard({ match }: { match: PersonalMatchItem }) {
  const outcome = getPersonalMatchOutcome(match)
  const outcomeCopy =
    outcome === "win"
      ? { label: "Victoria", className: "bg-emerald-100 text-emerald-700" }
      : outcome === "loss"
        ? { label: "Derrota", className: "bg-red-100 text-red-700" }
        : { label: "Registrado", className: "bg-neutral-100 text-neutral-600" }

  return (
    <Link
      href={`/personal-matches/${encodeURIComponent(match.id)}`}
      className="block rounded-2xl border border-neutral-200 bg-white p-3 shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-neutral-400">
            Amistoso
          </p>
          <p className="mt-1 text-xs font-bold text-neutral-500">
            {formatPersonalMatchDate(match.playedAt)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${outcomeCopy.className}`}>
          {outcomeCopy.label}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p className="min-w-0 text-right text-sm font-black leading-5 text-neutral-950">
          {getPersonalMatchTeamNames(match.participants, 1)}
        </p>
        <div className="rounded-xl bg-neutral-950 px-2.5 py-2 text-center text-xs font-black text-white">
          {formatPersonalMatchScore(match.sets)}
        </div>
        <p className="min-w-0 text-left text-sm font-black leading-5 text-neutral-950">
          {getPersonalMatchTeamNames(match.participants, 2)}
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-2">
        <p className="truncate text-[11px] font-semibold text-neutral-500">
          {match.locationName || "Ubicación no indicada"}
        </p>
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wide text-neutral-400">
          Ver partido
        </span>
      </div>
    </Link>
  )
}
