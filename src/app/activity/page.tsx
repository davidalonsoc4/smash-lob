"use client"

import { useEffect, useMemo, useState } from "react"
import { ActivityAvatar } from "@/components/activity/ActivityAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity"

function formatActivityDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getActorLabel(event: ActivityEvent) {
  return event.actorDisplayName || event.actorEmail || "Usuario"
}

function getTypeLabel(type: ActivityEvent["type"]) {
  const labels: Record<ActivityEvent["type"], string> = {
    match_scheduled: "Programación",
    match_schedule_updated: "Programación",
    match_postponed: "Aplazamiento",
    match_result_saved: "Resultado",
    match_result_updated: "Resultado",
    match_result_cleared: "Resultado",
    court_booking_updated: "Reserva",
    court_booking_cleared: "Reserva",
    court_booking_payment_paid: "Pago",
    league_created: "Liga",
    league_updated: "Liga",
    season_created: "Temporada",
    user_updated: "Usuario",
  }

  return labels[type]
}

export default function ActivityPage() {
  const { activeLeague } = useCurrentLeagueData()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const hasEvents = events.length > 0

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      setIsLoading(true)
      setError(null)

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 80,
        })

        if (!isMounted) {
          return
        }

        setEvents(activityEvents)
      } catch {
        if (!isMounted) {
          return
        }

        setError(
          "No se ha podido cargar la actividad. Revisa Supabase o vuelve a intentarlo."
        )
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadActivity()

    return () => {
      isMounted = false
    }
  }, [activeLeague.id, refreshKey])

  const groupedEvents = useMemo(() => events, [events])

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Actividad
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Últimos cambios importantes de la liga: partidos, resultados, reservas y pagos.
        </p>
      </header>

      <section>
        <SectionHeader
          title="Muro de actividad"
          action={
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="text-sm font-semibold text-neutral-600"
            >
              Actualizar
            </button>
          }
        />

        {isLoading ? (
          <AppCard>
            <p className="text-sm font-semibold text-neutral-500">
              Cargando actividad...
            </p>
          </AppCard>
        ) : null}

        {error ? (
          <AppCard>
            <p className="font-bold text-red-700">No se ha podido cargar</p>
            <p className="mt-2 text-sm text-neutral-500">{error}</p>
          </AppCard>
        ) : null}

        {!isLoading && !error && !hasEvents ? (
          <AppCard>
            <p className="font-bold">Aún no hay actividad</p>
            <p className="mt-2 text-sm text-neutral-500">
              Cuando alguien programe un partido, registre o modifique un resultado, aplace una jornada o actualice una reserva, aparecerá aquí.
            </p>
          </AppCard>
        ) : null}

        {hasEvents ? (
          <div className="space-y-3">
            {groupedEvents.map((event) => (
              <AppCard key={event.id}>
                <div className="flex gap-3">
                  <ActivityAvatar
                    name={event.actorDisplayName}
                    email={event.actorEmail}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-neutral-950">
                          {event.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-neutral-500">
                          {getActorLabel(event)} · {getTypeLabel(event.type)}
                        </p>
                      </div>

                      <p className="shrink-0 text-xs font-semibold text-neutral-400">
                        {formatActivityDate(event.createdAt)}
                      </p>
                    </div>

                    {event.description ? (
                      <p className="mt-3 text-sm text-neutral-600">
                        {event.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </AppCard>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
