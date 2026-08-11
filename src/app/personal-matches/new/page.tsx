"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  PersonalMatchParticipantSelector,
  type EditablePersonalMatchParticipant,
} from "@/components/personal/PersonalMatchParticipantSelector"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import {
  createLeagueLocation,
  getLeagueLocationCompactText,
  getLeagueLocationOptionLabel,
  sortLeagueLocationsByOptionLabel,
  type LeagueLocation,
} from "@/lib/leagueLocations"
import type {
  PersonalMatchPerson,
  PersonalMatchSet,
} from "@/lib/personalMatches"

function localDateTimeValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

type EditableParticipant = EditablePersonalMatchParticipant

function initialParticipants(): EditableParticipant[] {
  return [
    { team: 1, slot: 1, personKey: null, displayName: "", label: "Tú" },
    { team: 1, slot: 2, personKey: null, displayName: "", label: "Tu pareja" },
    { team: 2, slot: 1, personKey: null, displayName: "", label: "Rival 1" },
    { team: 2, slot: 2, personKey: null, displayName: "", label: "Rival 2" },
  ]
}

export default function NewPersonalMatchPage() {
  const router = useRouter()
  const [people, setPeople] = useState<PersonalMatchPerson[]>([])
  const [participants, setParticipants] = useState<EditableParticipant[]>(initialParticipants)
  const [includeResult, setIncludeResult] = useState(false)
  const [scheduledAt, setScheduledAt] = useState("")
  const [latestFinishedAt, setLatestFinishedAt] = useState("")
  const [globalLocations, setGlobalLocations] = useState<LeagueLocation[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState("")
  const [locationSearch, setLocationSearch] = useState("")
  const [manualLocationName, setManualLocationName] = useState("")
  const [loadingLocations, setLoadingLocations] = useState(true)
  const [sets, setSets] = useState<PersonalMatchSet[]>([
    { a: 6, b: 0 },
    { a: 6, b: 0 },
  ])
  const [loadingPeople, setLoadingPeople] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const now = new Date()
      setScheduledAt(localDateTimeValue(new Date(now.getTime() + 60 * 60 * 1000)))
      setLatestFinishedAt(localDateTimeValue(new Date(now.getTime() + 24 * 60 * 60 * 1000)))
    }, 0)

    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch("/api/personal-matches/people", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { people?: PersonalMatchPerson[] }
        if (!response.ok) throw new Error("personal_match_people_lookup_failed")
        return payload.people ?? []
      })
      .then((nextPeople) => {
        if (cancelled) return
        setPeople(nextPeople)
        const self = nextPeople.find((person) => person.isSelf)
        if (self) {
          setParticipants((current) =>
            current.map((participant) =>
              participant.team === 1 && participant.slot === 1
                ? { ...participant, personKey: self.key, displayName: self.displayName }
                : participant,
            ),
          )
        }
      })
      .catch(() => {
        if (!cancelled) setError("No se han podido cargar los jugadores disponibles.")
      })
      .finally(() => {
        if (!cancelled) setLoadingPeople(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    fetch("/api/locations", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json()) as { locations?: LeagueLocation[] }
        if (!response.ok) throw new Error("global_locations_lookup_failed")
        return sortLeagueLocationsByOptionLabel(payload.locations ?? [])
      })
      .then((locations) => {
        if (!cancelled) setGlobalLocations(locations)
      })
      .catch(() => {
        if (!cancelled) setGlobalLocations([])
      })
      .finally(() => {
        if (!cancelled) setLoadingLocations(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const usedKeys = useMemo(
    () => new Set(participants.flatMap((participant) => participant.personKey ? [participant.personKey] : [])),
    [participants],
  )
  const teamAWins = sets.filter((set) => set.a > set.b).length
  const teamBWins = sets.filter((set) => set.b > set.a).length
  const hasWinner = teamAWins !== teamBWins
  const participantsComplete = participants.every(
    (participant) => participant.personKey || participant.displayName.trim().length >= 2,
  )
  const selectedGlobalLocation = globalLocations.find(
    (location) => location.id === selectedLocationId,
  ) ?? null
  const filteredGlobalLocations = useMemo(() => {
    const query = locationSearch.trim().toLocaleLowerCase("es-ES")
    if (!query) return globalLocations
    return globalLocations.filter((location) =>
      getLeagueLocationOptionLabel(location)
        .toLocaleLowerCase("es-ES")
        .includes(query),
    )
  }, [globalLocations, locationSearch])
  const resolvedLocationName = selectedGlobalLocation
    ? getLeagueLocationCompactText(selectedGlobalLocation)
    : manualLocationName.trim()
  const canSubmit =
    !loadingPeople &&
    !submitting &&
    scheduledAt.trim().length > 0 &&
    participantsComplete &&
    (!includeResult || (sets.length >= 1 && hasWinner))

  function updateParticipant(index: number, next: EditableParticipant) {
    setParticipants((current) =>
      current.map((participant, participantIndex) =>
        participantIndex === index ? next : participant,
      ),
    )
    setError(null)
  }

  function updateSet(index: number, side: "a" | "b", value: string) {
    const score = Math.min(99, Math.max(0, Number.parseInt(value || "0", 10) || 0))
    setSets((current) =>
      current.map((set, setIndex) =>
        setIndex === index ? { ...set, [side]: score } : set,
      ),
    )
  }

  async function submit() {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)

    try {
      let locationName = resolvedLocationName

      if (!selectedGlobalLocation && manualLocationName.trim()) {
        const draftLocation = createLeagueLocation({
          name: manualLocationName.trim(),
          town: null,
          address: null,
          courtCount: null,
          selectedCourt: null,
          googlePlaceId: null,
          googlePlaceName: null,
          googleMapsUrl: null,
          latitude: null,
          longitude: null,
        })

        if (draftLocation) {
          const locationResponse = await fetch("/api/locations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ location: draftLocation }),
          })

          if (locationResponse.ok) {
            const locationPayload = (await locationResponse.json()) as {
              location?: LeagueLocation
            }
            locationName = locationPayload.location
              ? getLeagueLocationCompactText(locationPayload.location)
              : locationName
          }
        }
      }

      const response = await fetch("/api/personal-matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: includeResult ? "finished" : "scheduled",
          scheduledAt: new Date(scheduledAt).toISOString(),
          locationName,
          sets: includeResult ? sets : [],
          participants: participants.map((participant) => ({
            team: participant.team,
            slot: participant.slot,
            personKey: participant.personKey,
            displayName: participant.displayName,
          })),
        }),
      })
      const payload = (await response.json()) as { id?: string; error?: string }
      if (!response.ok || !payload.id) {
        throw new Error(payload.error ?? "personal_match_create_failed")
      }

      router.replace(`/personal-matches/${encodeURIComponent(payload.id)}`)
    } catch (caughtError) {
      const code = caughtError instanceof Error ? caughtError.message : ""
      setError(
        code === "personal_match_requires_winner"
          ? "El resultado debe tener un equipo ganador."
          : code === "duplicate_personal_match_person"
            ? "No puedes seleccionar al mismo jugador dos veces."
            : code === "invalid_personal_match_date"
              ? includeResult
                ? "Revisa la fecha del partido disputado."
                : "El partido programado debe tener una fecha actual o futura."
              : "No se ha podido guardar el partido. Revisa los datos e inténtalo de nuevo.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/personal-matches" label="Mis partidos" />
        <h1 className="type-page-title font-black tracking-tight">
          Crear encuentro
        </h1>
        <p className="mt-0.5 type-caption font-black uppercase tracking-[0.2em] text-neutral-400">Amistoso</p>
      </header>

      <AppCard className="p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-black text-neutral-800">Fecha y hora</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              max={includeResult ? latestFinishedAt || undefined : undefined}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-400"
            />
          </label>
          <div className="block">
            <span className="text-xs font-black text-neutral-800">Ubicación · opcional</span>
            <input
              type="search"
              value={locationSearch}
              onChange={(event) => setLocationSearch(event.target.value)}
              disabled={loadingLocations}
              placeholder={loadingLocations ? "Cargando ubicaciones..." : "Buscar ubicación..."}
              className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
            {!loadingLocations ? (
              <>
                <div className="mt-1.5 flex items-center justify-between gap-2 type-caption font-semibold text-neutral-500">
                  <span>{filteredGlobalLocations.length} ubicación{filteredGlobalLocations.length === 1 ? "" : "es"}</span>
                  <span>{locationSearch.trim() ? "Resultados filtrados" : "Desliza para ver más"}</span>
                </div>
                <div className="mt-1 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-neutral-100 bg-neutral-50/70 p-1">
                  {filteredGlobalLocations.map((location) => {
                    const selected = selectedLocationId === location.id
                    return (
                      <button
                        key={location.id}
                        type="button"
                        onClick={() => {
                          setSelectedLocationId(location.id)
                          setManualLocationName("")
                        }}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left ${selected ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-900"}`}
                      >
                        <span className="block truncate text-xs font-black">{getLeagueLocationOptionLabel(location)}</span>
                      </button>
                    )
                  })}
                  {filteredGlobalLocations.length === 0 ? (
                    <p className="px-2 py-3 text-center type-caption font-semibold text-neutral-500">No hay ubicaciones que coincidan.</p>
                  ) : null}
                </div>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => { setSelectedLocationId(""); setLocationSearch("") }}
              className={`mt-1.5 w-full rounded-xl border px-3 py-2.5 text-xs font-black ${!selectedLocationId ? "border-neutral-950 bg-neutral-950 text-white" : "border-neutral-200 bg-white text-neutral-800"}`}
            >
              Otra ubicación / introducir nueva
            </button>
            {!selectedLocationId ? (
              <input
                value={manualLocationName}
                onChange={(event) => setManualLocationName(event.target.value.slice(0, 120))}
                placeholder="Nueva ubicación (se guardará en la app)"
                className="mt-2 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-400"
              />
            ) : null}
          </div>
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="text-sm font-black text-neutral-950">Jugadores</p>
        <p className="mt-1 type-caption font-semibold leading-4 text-neutral-500">
          Puedes elegir jugadores conocidos o escribir manualmente cualquier nombre. El mismo amistoso aparecerá en Mis partidos de todos los participantes que tengan una cuenta vinculada.
        </p>
        <div className="mt-3 grid gap-2">
          {participants.map((participant, index) => (
            <PersonalMatchParticipantSelector
              key={`${participant.team}-${participant.slot}`}
              participant={participant}
              people={people}
              usedKeys={usedKeys}
              onChange={(next) => updateParticipant(index, next)}
              locked={participant.team === 1 && participant.slot === 1}
            />
          ))}
        </div>
        {loadingPeople ? (
          <p className="mt-2 type-caption font-semibold text-neutral-400">Cargando jugadores compartidos...</p>
        ) : null}
      </AppCard>

      <AppCard className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">Resultado · opcional</p>
            <p className="mt-0.5 type-caption font-semibold leading-4 text-neutral-500">
              Puedes guardarlo ahora si el partido ya se ha jugado o añadirlo más adelante desde el detalle.
            </p>
          </div>
          <button
            type="button"
            aria-pressed={includeResult}
            onClick={() => {
              setIncludeResult((current) => !current)
              setError(null)
            }}
            className={`shrink-0 rounded-xl px-3 py-2 type-caption font-black ${
              includeResult
                ? "bg-neutral-950 text-white"
                : "border border-neutral-200 bg-white text-neutral-800"
            }`}
          >
            {includeResult ? "Quitar" : "Añadir resultado"}
          </button>
        </div>

        {includeResult ? (
          <>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="type-caption font-semibold text-neutral-500">Equipo A · Equipo B</p>
              {sets.length < 5 ? (
                <button
                  type="button"
                  onClick={() => setSets((current) => [...current, { a: 0, b: 0 }])}
                  className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-2 type-caption font-black text-neutral-700 items-center justify-center text-center"
                >
                  + Set
                </button>
              ) : null}
            </div>

            <div className="mt-2 space-y-2">
              {sets.map((set, index) => (
                <div key={index} className="grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 rounded-xl bg-neutral-100 p-2">
                  <span className="type-caption font-black uppercase text-neutral-500">Set {index + 1}</span>
                  <input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    max={99}
                    value={set.a}
                    onChange={(event) => updateSet(index, "a", event.target.value)}
                    className="min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-center text-sm font-black outline-none"
                  />
                  <span className="text-xs font-black text-neutral-400">-</span>
                  <input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    max={99}
                    value={set.b}
                    onChange={(event) => updateSet(index, "b", event.target.value)}
                    className="min-w-0 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-center text-sm font-black outline-none"
                  />
                  {sets.length > 1 ? (
                    <button
                      type="button"
                      aria-label={`Eliminar set ${index + 1}`}
                      onClick={() => setSets((current) => current.filter((_, setIndex) => setIndex !== index))}
                      className="h-8 w-8 rounded-lg text-sm font-black text-neutral-400"
                    >
                      ×
                    </button>
                  ) : (
                    <span className="h-8 w-8" />
                  )}
                </div>
              ))}
            </div>
            {!hasWinner ? (
              <p className="mt-2 type-caption font-bold text-amber-700">El resultado debe dejar un equipo ganador.</p>
            ) : null}
          </>
        ) : null}
      </AppCard>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-bold leading-5 text-red-700">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void submit()}
        disabled={!canSubmit}
        className="flex w-full rounded-xl bg-neutral-950 px-3 py-3 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
      >
        {submitting
          ? "Guardando..."
          : includeResult
            ? "Guardar encuentro y resultado"
            : "Guardar encuentro"}
      </button>
    </div>
  )
}
