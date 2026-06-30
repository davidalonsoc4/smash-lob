"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { LeagueUsersManagementPanel } from "@/components/admin/LeagueUsersManagementPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { resizeImageFileToDataUrl } from "@/lib/clientImages"
import { recordActivityEvent } from "@/lib/activity"

type LeagueDetailsFormProps = {
  leagueId: string
  seasonId: string | null
  initialName: string
  initialDescription: string
}

type LeagueLogoFormProps = {
  leagueId: string
  seasonId: string | null
  leagueName: string
  initialLogoUrl?: string | null
}

type LeagueLocationsFormProps = {
  leagueId: string
  seasonId: string | null
  initialLocations: string[]
}

type DeleteLeagueCardProps = {
  leagueId: string
  leagueName: string
  onDeleteLeague: (leagueId: string) => Promise<boolean>
}

function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
}

function normalizeLocation(value: string) {
  return value.trim()
}

function hasLocation(locations: string[], location: string) {
  return locations.some(
    (item) => item.toLowerCase() === location.toLowerCase()
  )
}

function LeagueDetailsForm({
  leagueId,
  seasonId,
  initialName,
  initialDescription,
}: LeagueDetailsFormProps) {
  const { data: session } = useSession()
  const { updateLeagueDetails } = useLeagueAccess()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanName = name.trim()
  const cleanDescription = description.trim()
  const canSave = cleanName.length > 0 && !isSaving

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSave) {
      return
    }

    setIsSaving(true)
    setSaved(false)
    setError(null)

    const updated = await updateLeagueDetails(leagueId, {
      name: cleanName,
      description: cleanDescription,
    })

    setIsSaving(false)

    if (!updated) {
      setError(
        "No se han podido guardar los datos de la liga en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    try {
      await recordActivityEvent({
        leagueId,
        seasonId,
        ...getActorFromSession(session),
        type: "league_updated",
        title: "Datos de liga actualizados",
        description: `La liga ha pasado a llamarse ${cleanName}.`,
        metadata: {
          previousName: initialName,
          nextName: cleanName,
          previousDescription: initialDescription,
          nextDescription: cleanDescription,
        },
      })
    } catch {
      // Los datos ya están guardados; la actividad es auxiliar.
    }

    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit}>
      <AppCard>
        <p className="font-bold">Datos de la liga</p>
        <p className="mt-2 text-sm text-neutral-500">
          Edita el nombre y la descripción que ven los jugadores.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Nombre de la liga
            </span>
            <input
              value={name}
              disabled={isSaving}
              onChange={(event) => {
                setName(event.target.value)
                setSaved(false)
                setError(null)
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Descripción
            </span>
            <textarea
              value={description}
              disabled={isSaving}
              rows={3}
              onChange={(event) => {
                setDescription(event.target.value)
                setSaved(false)
                setError(null)
              }}
              className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSave}
          className="mt-5 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isSaving ? "Guardando..." : "Guardar datos de liga"}
        </button>

        {error ? (
          <p className="mt-3 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
            Datos de liga guardados.
          </p>
        ) : null}
      </AppCard>
    </form>
  )
}

function LeagueLogoForm({
  leagueId,
  seasonId,
  leagueName,
  initialLogoUrl,
}: LeagueLogoFormProps) {
  const { data: session } = useSession()
  const { updateLeagueLogo } = useLeagueAccess()
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? null)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function saveLogo(nextLogoUrl: string | null) {
    setIsSaving(true)
    setSaved(false)
    setError(null)

    const updated = await updateLeagueLogo(leagueId, nextLogoUrl)

    setIsSaving(false)

    if (!updated) {
      setError(
        "No se ha podido guardar el logo de la liga. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    setLogoUrl(nextLogoUrl)

    try {
      await recordActivityEvent({
        leagueId,
        seasonId,
        ...getActorFromSession(session),
        type: "league_logo_updated",
        title: nextLogoUrl ? "Logo de liga actualizado" : "Logo de liga eliminado",
        description: nextLogoUrl
          ? "Se ha actualizado el logo de la liga."
          : "Se ha eliminado el logo personalizado de la liga.",
        metadata: {
          hadPreviousLogo: Boolean(logoUrl),
          hasLogo: Boolean(nextLogoUrl),
        },
      })
    } catch {
      // El logo ya está guardado; la actividad es auxiliar.
    }

    setSaved(true)
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const dataUrl = await resizeImageFileToDataUrl({
        file,
        maxSize: 512,
      })

      await saveLogo(dataUrl)
    } catch (imageError) {
      setError(
        imageError instanceof Error
          ? imageError.message
          : "No se ha podido procesar la imagen."
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <AppCard>
      <p className="font-bold">Logo de la liga</p>
      <p className="mt-2 text-sm text-neutral-500">
        Sube una imagen cuadrada o recortable. Se verá en el inicio y en zonas de identificación de la liga.
      </p>

      <div className="mt-5 flex items-center gap-4">
        <LeagueLogo
          league={{ name: leagueName, logoUrl }}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black">{leagueName}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {logoUrl ? "Logo personalizado activo." : "Se usan iniciales si no hay logo."}
          </p>
        </div>
      </div>

      <label className="mt-5 block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white">
        {isSaving ? "Guardando..." : "Subir logo"}
        <input
          type="file"
          accept="image/*"
          disabled={isSaving}
          onChange={handleFileChange}
          className="sr-only"
        />
      </label>

      {logoUrl ? (
        <button
          type="button"
          onClick={() => saveLogo(null)}
          disabled={isSaving}
          className="mt-3 w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:text-neutral-400"
        >
          Quitar logo
        </button>
      ) : null}

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-red-600">
          {error}
        </p>
      ) : null}

      {saved ? (
        <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
          Logo guardado.
        </p>
      ) : null}
    </AppCard>
  )
}

function DeleteLeagueCard({
  leagueId,
  leagueName,
  onDeleteLeague,
}: DeleteLeagueCardProps) {
  const router = useRouter()
  const [confirmation, setConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canDelete = confirmation.trim() === leagueName

  async function handleDelete() {
    if (!canDelete || isDeleting) {
      return
    }

    setIsDeleting(true)
    setError(null)

    const deleted = await onDeleteLeague(leagueId)

    setIsDeleting(false)

    if (!deleted) {
      setError(
        "No se ha podido eliminar la liga. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    router.replace("/settings")
    window.setTimeout(() => {
      window.location.reload()
    }, 80)
  }

  return (
    <AppCard className="border-red-200 bg-red-50">
      <p className="font-bold text-red-950">Eliminar liga</p>
      <p className="mt-2 text-sm text-red-900/80">
        Esta acción elimina la liga completa de la base de datos: temporadas,
        jugadores, partidos, resultados, invitaciones y miembros. Solo aparece
        para el creador de la liga.
      </p>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-red-950">
          Escribe el nombre exacto de la liga para confirmar
        </span>
        <input
          value={confirmation}
          disabled={isDeleting}
          onChange={(event) => {
            setConfirmation(event.target.value)
            setError(null)
          }}
          placeholder={leagueName}
          className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-red-400 disabled:bg-red-100"
        />
      </label>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete || isDeleting}
        className="mt-4 w-full rounded-2xl bg-red-700 px-4 py-3 text-sm font-black text-white disabled:bg-red-200"
      >
        {isDeleting ? "Eliminando..." : "Eliminar liga definitivamente"}
      </button>

      {error ? (
        <p className="mt-3 text-xs font-semibold text-red-700">{error}</p>
      ) : null}
    </AppCard>
  )
}

function LeagueLocationsForm({
  leagueId,
  seasonId,
  initialLocations,
}: LeagueLocationsFormProps) {
  const { data: session } = useSession()
  const { t } = useI18n()
  const { updateLeagueLocations } = useLeagueAccess()

  const [locations, setLocations] = useState(initialLocations)
  const [newLocation, setNewLocation] = useState("")
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
  }

  function handleRemoveLocation(locationToRemove: string) {
    setLocations((currentLocations) =>
      currentLocations.filter((location) => location !== locationToRemove)
    )
    setSaved(false)
    setError(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setIsSaving(true)
    setSaved(false)
    setError(null)

    const updated = await updateLeagueLocations(leagueId, locations)

    setIsSaving(false)

    if (!updated) {
      setError(
        "No se han podido guardar los lugares en la base de datos. Revisa Supabase o smash-lob-last-supabase-error."
      )
      return
    }

    try {
      await recordActivityEvent({
        leagueId,
        seasonId,
        ...getActorFromSession(session),
        type: "league_locations_updated",
        title: "Lugares actualizados",
        description: `La liga tiene ${locations.length} lugar${locations.length === 1 ? "" : "es"} habitual${locations.length === 1 ? "" : "es"}.`,
        metadata: {
          previousLocations: initialLocations,
          nextLocations: locations,
        },
      })
    } catch {
      // Los lugares ya están guardados; la actividad es auxiliar.
    }

    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit}>
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
                  disabled={isSaving}
                  className="rounded-full bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-400"
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

        <div className="mt-6 rounded-2xl bg-neutral-100 p-4">
          <p className="font-bold">{t.adminLeague.addLocationTitle}</p>

          <label className="mt-4 block">
            <span className="text-sm font-semibold text-neutral-700">
              {t.adminLeague.locationName}
            </span>

            <input
              value={newLocation}
              disabled={isSaving}
              onChange={(event) => {
                setNewLocation(event.target.value)
                setSaved(false)
                setError(null)
              }}
              placeholder={t.adminLeague.locationPlaceholder}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>

          {normalizedNewLocation.length > 0 &&
          hasLocation(locations, normalizedNewLocation) ? (
            <p className="mt-2 text-xs font-semibold text-red-600">
              {t.adminLeague.duplicatedLocation}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleAddLocation}
            disabled={!canAdd || isSaving}
            className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm font-black text-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {t.adminLeague.addLocation}
          </button>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="mt-5 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isSaving ? "Guardando..." : t.adminLeague.save}
        </button>

        {error ? (
          <p className="mt-3 text-center text-sm font-semibold text-red-600">
            {error}
          </p>
        ) : null}

        {saved ? (
          <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
            {t.adminLeague.saved}
          </p>
        ) : null}
      </AppCard>
    </form>
  )
}

export default function AdminLeaguePage() {
  const { t } = useI18n()
  const { deleteLeague, isLeagueAdmin, isLeagueCreator } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const canDeleteLeague = isLeagueCreator(activeLeague.id)

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

      <LeagueDetailsForm
        key={`${activeLeague.id}-details`}
        leagueId={activeLeague.id}
        seasonId={activeSeason.id}
        initialName={activeLeague.name}
        initialDescription={activeLeague.description}
      />

      <LeagueLogoForm
        key={`${activeLeague.id}-logo`}
        leagueId={activeLeague.id}
        seasonId={activeSeason.id}
        leagueName={activeLeague.name}
        initialLogoUrl={activeLeague.logoUrl}
      />

      <LeagueLocationsForm
        key={`${activeLeague.id}-locations`}
        leagueId={activeLeague.id}
        seasonId={activeSeason.id}
        initialLocations={activeLeague.locations}
      />

      <LeagueUsersManagementPanel leagueId={activeLeague.id} />

      {canDeleteLeague ? (
        <DeleteLeagueCard
          leagueId={activeLeague.id}
          leagueName={activeLeague.name}
          onDeleteLeague={deleteLeague}
        />
      ) : null}
    </div>
  )
}
