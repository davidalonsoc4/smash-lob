"use client"

import { useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useMatchData } from "@/context/MatchDataProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { duplicateSupabaseSeason } from "@/lib/supabaseSeasons"

function suggestedName(name: string) {
  const match = name.match(/^(.*?)(\d+)\s*$/)
  if (!match) return `${name} 2`
  return `${match[1].trim()} ${Number(match[2]) + 1}`
}

export default function DuplicateSeasonPage() {
  const { activeLeague } = useCurrentLeagueData()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { hydrateSeasonSnapshot, seasons } = useSeasonSettings()
  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons],
  )
  const { replaceSeasonMatches } = useMatchData()
  const finishedSeasons = useMemo(
    () => leagueSeasons.filter((season) => season.status === "finished"),
    [leagueSeasons],
  )
  const [sourceSeasonId, setSourceSeasonId] = useState(
    finishedSeasons.at(-1)?.id ?? "",
  )
  const selectedSeason = finishedSeasons.find(
    (season) => season.id === sourceSeasonId,
  )
  const [name, setName] = useState(
    selectedSeason ? suggestedName(selectedSeason.name) : "",
  )
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const canManage = hasLeagueAdminRole(activeLeague.id)

  if (!canManage) {
    return (
      <div className="compact-page space-y-3">
        <BackButton fallbackHref="/admin" label="Volver" />
        <AppCard>
          <p className="font-black">Acceso restringido</p>
        </AppCard>
      </div>
    )
  }

  async function handleDuplicate() {
    if (!sourceSeasonId || name.trim().length < 2 || isDuplicating) return
    setIsDuplicating(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await duplicateSupabaseSeason({
        leagueId: activeLeague.id,
        seasonId: sourceSeasonId,
        name: name.trim(),
      })
      hydrateSeasonSnapshot(result.snapshot)
      const createdSeasonId = result.snapshot.activeSeasonIds[activeLeague.id]
      if (createdSeasonId) {
        replaceSeasonMatches(createdSeasonId, result.matches)
      }
      setSuccess(
        "Temporada duplicada. Se han copiado jugadores, reglas, cuota y formato; calendario, pagos y progreso empiezan desde cero.",
      )
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : ""
      setError(
        message.includes("upcoming_season_already_exists")
          ? "Ya existe una temporada próxima. Elimínala o iníciala antes de duplicar otra."
          : message.includes("season_must_be_finished")
            ? "Solo se pueden duplicar temporadas terminadas."
            : "No se ha podido duplicar la temporada.",
      )
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label="Volver" />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Duplicar temporada
        </h1>
        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Prepara la siguiente temporada sin repetir toda la configuración.
        </p>
      </header>

      {finishedSeasons.length === 0 ? (
        <AppCard>
          <p className="font-black">No hay temporadas terminadas</p>
          <p className="mt-1 text-sm font-semibold text-neutral-500">
            Termina una temporada para poder usarla como plantilla.
          </p>
        </AppCard>
      ) : (
        <AppCard>
          <div className="space-y-3">
            <label className="block">
              <span className="text-xs font-black text-neutral-700">
                Temporada de origen
              </span>
              <select
                value={sourceSeasonId}
                onChange={(event) => {
                  const nextId = event.target.value
                  const nextSeason = finishedSeasons.find(
                    (season) => season.id === nextId,
                  )
                  setSourceSeasonId(nextId)
                  if (nextSeason) setName(suggestedName(nextSeason.name))
                }}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold"
              >
                {finishedSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black text-neutral-700">
                Nombre de la nueva temporada
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 80))}
                className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none focus:border-neutral-500"
              />
            </label>

            <div className="rounded-xl bg-neutral-50 px-3 py-3 text-xs font-semibold leading-5 text-neutral-600">
              <p className="font-black text-neutral-900">Se copia</p>
              <p>Jugadores activos, reglas, cuota, MVP, confirmaciones y formato.</p>
              <p className="mt-1 font-black text-neutral-900">Se reinicia</p>
              <p>Calendario, resultados, pagos, MVP, disponibilidad y progreso.</p>
            </div>

            <button
              type="button"
              onClick={handleDuplicate}
              disabled={isDuplicating || name.trim().length < 2}
              className="w-full rounded-xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
            >
              {isDuplicating ? "Duplicando..." : "Duplicar temporada"}
            </button>

            {success ? (
              <p className="text-sm font-bold leading-5 text-emerald-700">
                {success}
              </p>
            ) : null}
            {error ? (
              <p className="text-sm font-bold leading-5 text-red-600">{error}</p>
            ) : null}
          </div>
        </AppCard>
      )}
    </div>
  )
}
