import { notFound } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { loadRatingsOverview } from "@/lib/serverRatings"

export const dynamic = "force-dynamic"

// Intense green for a high level, intense red for a low one.
const levelColor = (level: number) => `hsl(${Math.round(Math.min(100, Math.max(0, level)) * 1.3)} 75% 36%)`
const dateLabel = (value: string) => (value ? new Date(value).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "2-digit" }) : "")

// Level (Elo) of every player. Only visible to the superuser while the system is being tuned.
export default async function ApplicationRatingsPage() {
  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok || !authResult.actor.user.isSuperuser) notFound()
  const { people, labels, matchCount, excludedMatchCount } = await loadRatingsOverview(authResult.actor.supabase)
  const name = (key: string) => labels[key] ?? "Jugador"

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/application-admin" label="Volver" />
        <h1 className="type-page-title font-black">Nivel de los jugadores</h1>
        <p className="mt-0.5 text-xs font-black uppercase tracking-[0.16em] text-red-600">Superusuario · en pruebas</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Calculado con {matchCount} partidos terminados (liga y amistosos){excludedMatchCount > 0 ? `; ${excludedMatchCount} excluidos del ranking` : ""}. Solo lo ves tú. Se recalcula entero cada vez que abres esta pantalla.
        </p>
      </header>
      <div className="space-y-2">
        {people.map((person, index) => (
          <AppCard key={person.key} className="!p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-3 p-3">
                <span className="w-5 shrink-0 text-center text-xs font-black text-neutral-400">{index + 1}</span>
                <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-neutral-100 text-xs font-black text-neutral-600">
                  {person.avatarUrl ? <img src={person.avatarUrl} alt="" className="h-full w-full object-cover" /> : person.displayName.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-neutral-950">{person.displayName}</span>
                  <span className="block truncate text-xs font-semibold text-neutral-500">{person.email} · {person.matches} partidos · {person.wins} ganados{person.provisional ? " · provisional" : ""}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="inline-block rounded-full px-3 py-0.5 text-sm font-black" style={{ background: levelColor(person.level), color: "#ffffff" }}>{Math.round(person.level)}</span>
                  <span className="mt-0.5 block type-caption font-semibold text-neutral-400">{person.level.toFixed(1)} · {Math.round(person.rating)} Elo</span>
                </span>
              </summary>
              <ul className="space-y-1 border-t border-neutral-100 px-3 py-2">
                {[...person.events].reverse().map((event) => (
                  <li key={event.matchId} className="text-xs font-semibold leading-5 text-neutral-600">
                    <span className={event.won ? "font-black text-emerald-700" : "font-black text-red-700"}>{event.won ? "Ganó" : "Perdió"}</span>{" "}
                    {event.score} · {dateLabel(event.at)} · {event.kind === "friendly" ? "amistoso" : "liga"}
                    <br />
                    con {event.partners.map(name).join(", ")} contra {event.opponents.map(name).join(" y ")} · esperado {Math.round(event.expected * 100)} %
                  </li>
                ))}
              </ul>
            </details>
          </AppCard>
        ))}
        {people.length === 0 ? <p className="text-center text-xs font-semibold text-neutral-500">Todavía no hay partidos terminados con jugadores con cuenta.</p> : null}
      </div>
    </div>
  )
}
