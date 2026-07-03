"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LeagueLocationsEditor } from "@/components/league/LeagueLocationsEditor"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { LeagueLocation } from "@/lib/leagueLocations"

export default function NewLeaguePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { setActiveLeagueId } = useActiveLeague()
  const { canCreateLeagues, createLeague } = useLeagueAccess()
  const [leagueName, setLeagueName] = useState("")
  const [leagueDescription, setLeagueDescription] = useState("")
  const [locations, setLocations] = useState<LeagueLocation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const canCreate = canCreateLeagues && leagueName.trim().length > 0

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreate || isCreating) {
      return
    }

    setIsCreating(true)
    setError(null)

    const league = await createLeague({
      name: leagueName.trim(),
      description: leagueDescription.trim() || t.newLeague.defaultDescription,
      locations,
    })

    if (!league) {
      setError(t.newLeague.createError)
      setIsCreating(false)
      return
    }

    setActiveLeagueId(league.id)
    router.push("/admin/season")
  }

  if (!canCreateLeagues) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-3 text-2xl font-black tracking-tight">
            {t.newLeague.title}
          </h1>

          <p className="mt-1 text-sm text-neutral-500">
            La creación de ligas está limitada a usuarios autorizados. Puedes unirte a una liga existente con un código de invitación.
          </p>
        </header>

        <AppCard>
          <p className="font-bold">No tienes permisos para crear ligas</p>
          <p className="mt-2 text-sm text-neutral-500">
            Tu cuenta puede jugar y administrar las ligas donde tengas permisos, pero no crear ligas nuevas.
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <h1 className="mt-3 text-2xl font-black tracking-tight">
          {t.newLeague.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.newLeague.description}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AppCard>
          <p className="font-bold">Datos de la liga</p>
          <p className="mt-2 text-sm text-neutral-500">
            Primero crea la liga. Después configurarás la Temporada 1 con sus jugadores, jornadas y reglas.
          </p>

          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.newLeague.leagueName}
              </span>
              <input
                value={leagueName}
                onChange={(event) => {
                  setLeagueName(event.target.value)
                  setError(null)
                }}
                disabled={isCreating}
                placeholder={t.newLeague.leagueNamePlaceholder}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.newLeague.leagueDescription}
              </span>
              <textarea
                value={leagueDescription}
                onChange={(event) => setLeagueDescription(event.target.value)}
                disabled={isCreating}
                placeholder={t.newLeague.leagueDescriptionPlaceholder}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
          </div>
        </AppCard>

        <AppCard>
          <p className="font-bold">{t.newLeague.locationsTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.newLeague.locationsDescription}
          </p>

          <div className="mt-4">
            <LeagueLocationsEditor
              locations={locations}
              onChange={(nextLocations) => {
                setLocations(nextLocations)
                setError(null)
              }}
              disabled={isCreating}
              copy={{
                emptyLocations: t.adminLeague.emptyLocations,
                addLocationTitle: t.adminLeague.addLocationTitle,
                locationName: t.adminLeague.locationName,
                locationPlaceholder: t.adminLeague.locationPlaceholder,
                town: t.adminLeague.town,
                townPlaceholder: t.adminLeague.townPlaceholder,
                googleLocation: t.adminLeague.googleLocation,
                googleLocationPlaceholder: t.adminLeague.googleLocationPlaceholder,
                courts: t.adminLeague.courts,
                courtsPlaceholder: t.adminLeague.courtsPlaceholder,
                duplicatedLocation: t.adminLeague.duplicatedLocation,
                addLocation: t.adminLeague.addLocation,
                editLocation: t.adminLeague.editLocation,
                saveLocation: t.adminLeague.saveLocation,
                cancelLocationEdit: t.adminLeague.cancelLocationEdit,
                removeLocation: t.adminLeague.removeLocation,
                openMaps: t.adminLeague.openMaps,
                searchMaps: t.adminLeague.searchMaps,
                googleApiMissing: t.adminLeague.googleApiMissing,
              }}
            />
          </div>
        </AppCard>

        {error ? (
          <p className="text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canCreate || isCreating}
          className="w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isCreating ? "Creando liga..." : t.newLeague.create}
        </button>
      </form>
    </div>
  )
}
