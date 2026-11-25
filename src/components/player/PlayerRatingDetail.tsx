import { AppCard } from "@/components/ui/AppCard"
import type { PlayerRating } from "@/lib/rating"

// Intense green for a high level, intense red for a low one.
export const levelColor = (level: number) => `hsl(${Math.round(Math.min(100, Math.max(0, level)) * 1.3)} 75% 36%)`
const dateLabel = (value: string) => (value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" }) : "")

// Level of a person, from all their matches (league and friendlies), with the matches that move it.
export function PlayerRatingDetail({ rating, labels, showEvents = true }: { rating: PlayerRating; labels: Record<string, string>; showEvents?: boolean }) {
  const name = (key: string) => labels[key] ?? "Jugador"
  return (
    <AppCard className="!p-0">
      <div className="flex items-center gap-3 p-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-xl font-black" style={{ background: levelColor(rating.level), color: "#ffffff" }}>{Math.round(rating.level)}</span>
        <div className="min-w-0 flex-1">
          <p className="type-panel-title font-black">Nivel</p>
          <p className="type-caption font-semibold text-neutral-500">{rating.matches} partidos · {rating.wins} ganados · {rating.level.toFixed(1)} · {Math.round(rating.rating)} Elo</p>
          <p className="type-caption font-semibold text-neutral-500">{rating.provisional ? "Provisional: aún con pocos partidos." : "Calculado con todos sus partidos, de liga y amistosos."}</p>
        </div>
      </div>
      {showEvents ? <details className="border-t border-neutral-100">
        <summary className="cursor-pointer list-none px-3 py-2 type-caption font-black text-neutral-700">Ver partidos que lo mueven</summary>
        <ul className="space-y-1 px-3 pb-3">
          {[...rating.events].reverse().map((event) => (
            <li key={event.matchId} className="type-caption font-semibold leading-5 text-neutral-600">
              <span className={event.won ? "font-black text-emerald-700" : "font-black text-red-700"}>{event.won ? "Ganó" : "Perdió"}</span> {event.score} · {dateLabel(event.at)} · {event.kind === "friendly" ? "amistoso" : "liga"}
              <br />con {event.partners.map(name).join(", ")} contra {event.opponents.map(name).join(" y ")} · esperado {Math.round(event.expected * 100)} %
            </li>
          ))}
        </ul>
      </details> : null}
    </AppCard>
  )
}
