import type { PlayerRating } from "@/lib/rating"

const dateLabel = (value: string) => (value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" }) : "")

// Match by match breakdown of a rating. Superuser only: it names people and matches the viewer may not see.
export function PlayerRatingEvents({ rating, labels }: { rating: PlayerRating; labels: Record<string, string> }) {
  const name = (key: string) => labels[key] ?? "Jugador"
  return (
    <details className="mt-3 border-t border-neutral-200 pt-2">
      <summary className="cursor-pointer list-none type-caption font-black text-neutral-700">Ver partidos que lo mueven</summary>
      <ul className="mt-2 space-y-1">
        {[...rating.events].reverse().map((event) => (
          <li key={event.matchId} className="type-caption font-semibold leading-5 text-neutral-600">
            <span className={event.won ? "font-black text-emerald-700" : "font-black text-red-700"}>{event.won ? "Ganó" : "Perdió"}</span> {event.score} · {dateLabel(event.at)} · {event.kind === "friendly" ? "amistoso" : "liga"}
            <br />con {event.partners.map(name).join(", ")} contra {event.opponents.map(name).join(" y ")} · esperado {Math.round(event.expected * 100)} %
          </li>
        ))}
      </ul>
    </details>
  )
}
