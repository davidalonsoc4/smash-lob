"use client"

import { FormEvent, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useLeagueSettings } from "@/context/LeagueSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

type AdminLeagueFormProps = {
  leagueId: string
  initialLocations: string[]
}

function normalizeLocation(value: string) {
  return value.trim()
}

function hasLocation(locations: string[], location: string) {
  return locations.some(
    (item) => item.toLowerCase() === location.toLowerCase()
  )
}

function AdminLeagueForm({
  leagueId,
  initialLocations,
}: AdminLeagueFormProps) {
  const { t } = useI18n()
  const { updateLeagueLocations } = useLeagueSettings()

  const [locations, setLocations] = useState(initialLocations)
  const [newLocation, setNewLocation] = useState("")
  const [saved, setSaved] = useState(false)

  const normalizedNewLocation = normalizeLocation(newLocation)
  const canAdd =
    normalizedNewLocation.length > 0 &&
    !hasLocation(locations, normalizedNewLocation)

  function handleAddLocation() {
    if (!canAdd) {
      return
    }

    setLocations((currentLocations) => [
      ...currentLocations,
      normalizedNewLocation,
    ])
    setNewLocation("")
    setSaved(false)
  }

  function handleRemoveLocation(locationToRemove: string) {
    setLocations((currentLocations) =>
      currentLocations.filter((location) => location !== locationToRemove)
    )
    setSaved(false)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    updateLeagueLocations(leagueId, locations)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AppCard>
        <p className="font-bold">{t.adminLeague.locationsTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminLeague.locationsDescription}
        </p>

        <div className="mt-5 space-y-3">
          {locations.length > 0 ? (
            locations.map((location) => (
              <div
                key={location}
                className="flex items-center justify-between gap-3 rounded-2xl border border-neutral-200 p-4"
              >
                <p className="text-sm font-bold">{location}</p>

                <button
                  type="button"
                  onClick={() => handleRemoveLocation(location)}
                  className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800"
                >
                  {t.adminLeague.removeLocation}
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-neutral-300 p-4">
              <p className="text-sm font-semibold text-neutral-500">
                {t.adminLeague.emptyLocations}
              </p>
            </div>
          )}
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.adminLeague.addLocationTitle}</p>

        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.adminLeague.locationName}
            </span>

            <input
              value={newLocation}
              onChange={(event) => {
                setNewLocation(event.target.value)
                setSaved(false)
              }}
              placeholder={t.adminLeague.locationPlaceholder}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
            />
          </label>

          {normalizedNewLocation.length > 0 &&
          hasLocation(locations, normalizedNewLocation) ? (
            <p className="text-xs font-semibold text-red-600">
              {t.adminLeague.duplicatedLocation}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAddLocation}
            disabled={!canAdd}
            className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t.adminLeague.addLocation}
          </button>
        </div>
      </AppCard>

      <button
        type="submit"
        className="w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
      >
        {t.adminLeague.save}
      </button>

      {saved ? (
        <p className="text-center text-sm font-semibold text-neutral-600">
          {t.adminLeague.saved}
        </p>
      ) : null}
    </form>
  )
}

export default function AdminLeaguePage() {
  const { t } = useI18n()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)

  if (!canAccessAdmin) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.adminLeague.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.adminLeague.description}
        </p>
      </header>

      <AdminLeagueForm
        key={activeLeague.id}
        leagueId={activeLeague.id}
        initialLocations={activeLeague.locations}
      />
    </div>
  )
}
