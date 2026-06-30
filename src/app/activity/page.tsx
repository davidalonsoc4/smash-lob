"use client"

import { useEffect, useMemo, useState } from "react"
import { ActivityAvatar } from "@/components/activity/ActivityAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity"

type ActivityScope = "all" | "mine"

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

function readLastActivityError() {
  if (typeof window === "undefined") {
    return null
  }

  const storedError = window.localStorage.getItem("smash-lob-last-supabase-error")

  if (!storedError) {
    return null
  }

  try {
    const parsedError = JSON.parse(storedError) as { action?: string; message?: string }

    if (parsedError.action === "record-activity") {
      return parsedError.message ?? storedError
    }
  } catch {
    return storedError
  }

  return null
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function isPersonalEvent({
  event,
  currentUserId,
  currentUserMatchIds,
}: {
  event: ActivityEvent
  currentUserId: string
  currentUserMatchIds: Set<string>
}) {
  if (event.matchId && currentUserMatchIds.has(event.matchId)) {
    return true
  }

  const metadata = event.metadata
  const directPlayerIds = [
    metadata.playerId,
    metadata.targetPlayerId,
    metadata.fromPlayerId,
    metadata.toPlayerId,
  ].filter((value): value is string => typeof value === "string")
  const participantIds = toStringArray(metadata.participantIds)

  return [...directPlayerIds, ...participantIds].includes(currentUserId)
}

export default function ActivityPage() {
  const { currentUserId } = useCurrentUser()
  const { activeLeague, matches } = useCurrentLeagueData()
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [scope, setScope] = useState<ActivityScope>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastActivityError, setLastActivityError] = useState<string | null>(
    () => readLastActivityError()
  )

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      setIsLoading(true)
      setError(null)

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 120,
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

  const currentUserMatchIds = useMemo(() => {
    return new Set(
      matches
        .filter(
          (match) =>
            match.teamA.includes(currentUserId) ||
            match.teamB.includes(currentUserId)
        )
        .map((match) => match.id)
    )
  }, [currentUserId, matches])
  const personalEvents = useMemo(
    () =>
      events.filter((event) =>
        isPersonalEvent({
          event,
          currentUserId,
          currentUserMatchIds,
        })
      ),
    [currentUserId, currentUserMatchIds, events]
  )
  const visibleEvents = scope === "mine" ? personalEvents : events
  const hasEvents = visibleEvents.length > 0

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
          Cambios importantes de la liga y de tus partidos.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => setScope("all")}
          className={`rounded-xl px-3 py-2 text-sm font-black ${
            scope === "all" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
          }`}
        >
          General
        </button>
        <button
          type="button"
          onClick={() => setScope("mine")}
          className={`rounded-xl px-3 py-2 text-sm font-black ${
            scope === "mine" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
          }`}
        >
          Personal
        </button>
      </div>

      <section>
        <SectionHeader
          title={scope === "mine" ? "Actividad personal" : "Muro de actividad"}
          action={
            <button
              type="button"
              onClick={() => {
                setLastActivityError(readLastActivityError())
                setRefreshKey((current) => current + 1)
              }}
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
            <p className="font-bold">
              {scope === "mine" ? "Aún no tienes actividad" : "Aún no hay actividad"}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {scope === "mine"
                ? "Aquí aparecerán cambios relacionados con tus partidos, reservas y pagos."
                : "Cuando alguien programe un partido, registre o modifique un resultado, aplace una jornada o actualice una reserva, aparecerá aquí."}
            </p>
          </AppCard>
        ) : null}

        {!isLoading && !error && !hasEvents && lastActivityError ? (
          <AppCard>
            <p className="font-bold text-orange-800">Último error al registrar actividad</p>
            <p className="mt-2 break-words text-xs font-semibold text-neutral-500">
              {lastActivityError}
            </p>
          </AppCard>
        ) : null}

        {hasEvents ? (
          <div className="space-y-3">
            {visibleEvents.map((event) => (
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
                      <p className="mt-3 whitespace-pre-line text-sm text-neutral-600">
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
