"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { LeagueLocationsEditor } from "@/components/league/LeagueLocationsEditor"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { resizeImageFileToDataUrl } from "@/lib/clientImages"
import { recordActivityEvent } from "@/lib/activity"
import type { LeagueLocation } from "@/lib/leagueLocations"

type LeagueIdentityFormProps = {
  leagueId: string
  seasonId: string | null
  initialName: string
  initialDescription: string
  initialLogoUrl?: string | null
}

type LeagueLocationsFormProps = {
  leagueId: string
  seasonId: string | null
  initialLocations: LeagueLocation[]
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

function LeagueIdentityForm({
  leagueId,
  seasonId,
  initialName,
  initialDescription,
  initialLogoUrl,
}: LeagueIdentityFormProps) {
  const { data: session } = useSession()
  const { updateLeagueDetails, updateLeagueLogo } = useLeagueAccess()
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl ?? null)
  const [detailsSaved, setDetailsSaved] = useState(false)
  const [logoSaved, setLogoSaved] = useState(false)
  const [isSavingDetails, setIsSavingDetails] = useState(false)
  const [isSavingLogo, setIsSavingLogo] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [logoError, setLogoError] = useState<string | null>(null)

  const cleanName = name.trim()
  const cleanDescription = description.trim()
  const canSaveDetails = cleanName.length > 0 && !isSavingDetails
  const previewLeagueName = cleanName || initialName

  async function handleSubmitDetails(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSaveDetails) {
      return
    }

    setIsSavingDetails(true)
    setDetailsSaved(false)
    setDetailsError(null)

    const updated = await updateLeagueDetails(leagueId, {
      name: cleanName,
      description: cleanDescription,
    })

    setIsSavingDetails(false)

    if (!updated) {
      setDetailsError(
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

    setDetailsSaved(true)
  }

  async function saveLogo(nextLogoUrl: string | null) {
    setIsSavingLogo(true)
    setLogoSaved(false)
    setLogoError(null)

    const updated = await updateLeagueLogo(leagueId, nextLogoUrl)

    setIsSavingLogo(false)

    if (!updated) {
      setLogoError(
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

    setLogoSaved(true)
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
      setLogoError(
        imageError instanceof Error
          ? imageError.message
          : "No se ha podido procesar la imagen."
      )
    } finally {
      event.target.value = ""
    }
  }

  return (
    <form onSubmit={handleSubmitDetails}>
      <AppCard>
        <p className="font-bold">Datos de la liga</p>
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          Edita el nombre, la descripción y el logo que ven los jugadores.
        </p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-100 p-3">
          <LeagueLogo
            league={{ name: previewLeagueName, logoUrl }}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black">{previewLeagueName}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {logoUrl ? "Logo personalizado activo." : "Se usan iniciales si no hay logo."}
            </p>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="block rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white">
            {isSavingLogo ? "Guardando..." : "Subir logo"}
            <input
              type="file"
              accept="image/*"
              disabled={isSavingLogo}
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={() => saveLogo(null)}
            disabled={!logoUrl || isSavingLogo}
            className="rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm font-black text-neutral-800 disabled:text-neutral-400"
          >
            Quitar logo
          </button>
        </div>

        {logoError ? (
          <p className="mt-3 text-center text-sm font-semibold text-red-600">
            {logoError}
          </p>
        ) : null}

        {logoSaved ? (
          <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
            Logo guardado.
          </p>
        ) : null}

        <div className="mt-4 space-y-4 border-t border-neutral-100 pt-5">
          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Nombre de la liga
            </span>
            <input
              value={name}
              disabled={isSavingDetails}
              onChange={(event) => {
                setName(event.target.value)
                setDetailsSaved(false)
                setDetailsError(null)
              }}
              className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-neutral-700">
              Descripción
            </span>
            <textarea
              value={description}
              disabled={isSavingDetails}
              rows={3}
              onChange={(event) => {
                setDescription(event.target.value)
                setDetailsSaved(false)
                setDetailsError(null)
              }}
              className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={!canSaveDetails}
          className="mt-4 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isSavingDetails ? "Guardando..." : "Guardar datos de liga"}
        </button>

        {detailsError ? (
          <p className="mt-3 text-center text-sm font-semibold text-red-600">
            {detailsError}
          </p>
        ) : null}

        {detailsSaved ? (
          <p className="mt-3 text-center text-sm font-semibold text-neutral-600">
            Datos de liga guardados.
          </p>
        ) : null}
      </AppCard>
    </form>
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

      <label className="mt-4 block">
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
          className="mt-2 w-full rounded-2xl border border-red-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-red-400 disabled:bg-red-100"
        />
      </label>

      <button
        type="button"
        onClick={handleDelete}
        disabled={!canDelete || isDeleting}
        className="mt-3 w-full rounded-2xl bg-red-700 px-3 py-2.5 text-sm font-black text-white disabled:bg-red-200"
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
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        <p className="mt-1 text-xs font-semibold text-neutral-500">
          {t.adminLeague.locationsDescription}
        </p>

        <div className="mt-4">
          <LeagueLocationsEditor
            locations={locations}
            onChange={(nextLocations) => {
              setLocations(nextLocations)
              setSaved(false)
              setError(null)
            }}
            disabled={isSaving}
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

        <button
          type="submit"
          disabled={isSaving}
          className="mt-4 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
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
  const { deleteLeague, hasLeagueAdminRole, isLeagueCreator } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const canDeleteLeague = isLeagueCreator(activeLeague.id)

  if (!canAccessAdmin) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-1 text-xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.adminLeague.title}
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {t.adminLeague.description}
        </p>
      </header>

      <AppCard className="p-2.5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-neutral-400">
          Accesos rápidos
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href="#identidad" className="rounded-2xl bg-neutral-100 px-3 py-2 text-center text-xs font-black text-neutral-800">
            Identidad
          </a>
          <a href="#lugares" className="rounded-2xl bg-neutral-100 px-3 py-2 text-center text-xs font-black text-neutral-800">
            Lugares
          </a>
          {canDeleteLeague ? (
            <a href="#zona-sensible" className="rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-black text-red-700">
              Zona sensible
            </a>
          ) : null}
        </div>
      </AppCard>

      <div id="identidad" className="settings-search-target">
        <LeagueIdentityForm
          key={`${activeLeague.id}-identity`}
          leagueId={activeLeague.id}
          seasonId={activeSeason.id}
          initialName={activeLeague.name}
          initialDescription={activeLeague.description}
          initialLogoUrl={activeLeague.logoUrl}
        />
      </div>

      <div id="lugares" className="settings-search-target">
        <LeagueLocationsForm
          key={`${activeLeague.id}-locations`}
          leagueId={activeLeague.id}
          seasonId={activeSeason.id}
          initialLocations={activeLeague.locations}
        />
      </div>

      {canDeleteLeague ? (
        <div id="zona-sensible" className="settings-search-target">
          <DeleteLeagueCard
            leagueId={activeLeague.id}
            leagueName={activeLeague.name}
            onDeleteLeague={deleteLeague}
          />
        </div>
      ) : null}
    </div>
  )
}
