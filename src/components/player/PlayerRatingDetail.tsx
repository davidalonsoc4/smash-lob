import { AppCard } from "@/components/ui/AppCard"
import { ratingBand, ratingBarPosition, type PlayerRating } from "@/lib/rating"

const dateLabel = (value: string) => (value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" }) : "")

// Elo chip shown on the right of a name. The number is absolute; it only means something next to other players' numbers.
export function EloChip({ rating }: { rating: number }) {
  return <span className="inline-flex items-baseline gap-1 rounded-lg bg-neutral-100 px-2.5 py-1 text-sm font-black text-neutral-900">{Math.round(rating)}<span className="type-caption font-bold text-neutral-500">Elo</span></span>
}

// Elo of a person, from all their matches (league and friendlies). `viewerRating` allows the only comparison that is really known: against you.
export function PlayerRatingDetail({ rating, labels, showEvents = true, viewerRating = null }: { rating: PlayerRating; labels: Record<string, string>; showEvents?: boolean; viewerRating?: number | null }) {
  const name = (key: string) => labels[key] ?? "Jugador"
  const difference = viewerRating === null ? null : Math.round(rating.rating - viewerRating)
  return (
    <AppCard className="!p-0">
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="type-panel-title font-black">Nivel</p>
          <span className="type-caption font-bold text-neutral-500">{ratingBand(rating.rating)}{rating.provisional ? " · provisional" : ""}</span>
        </div>
        <p className="mt-1 text-4xl font-black leading-none text-neutral-950">{Math.round(rating.rating)} <span className="text-base font-bold text-neutral-500">Elo</span></p>
        <div className="relative mt-4 h-2 rounded-full" style={{ background: "linear-gradient(90deg,#E24B4A,#EF9F27,#97C459,#1D9E75)" }}>
          <span className="absolute -top-1 h-4 w-1 -translate-x-1/2 rounded-full bg-neutral-950" style={{ left: `${ratingBarPosition(rating.rating)}%` }} />
        </div>
        <div className="mt-1 flex justify-between type-caption font-semibold text-neutral-400"><span>700</span><span>1000</span><span>1400</span></div>
        <p className="mt-2 type-caption font-semibold text-neutral-500">
          {rating.matches} partidos · {rating.wins} ganados. {rating.provisional ? "Aún con pocos partidos: puede moverse mucho." : "Calculado con todos sus partidos, de liga y amistosos."}
        </p>
        {difference !== null && difference !== 0 ? (
          <p className="mt-1 type-caption font-black text-neutral-700">{difference > 0 ? `${difference} Elo por encima de ti` : `${-difference} Elo por debajo de ti`}</p>
        ) : null}
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
