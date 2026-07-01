"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"

export default function NewLeaguePage() {
  const { t } = useI18n()
  const router = useRouter()
  const { setActiveLeagueId } = useActiveLeague()
  const { canCreateLeagues, createLeague } = useLeagueAccess()
  const [leagueName, setLeagueName] = useState("")
  const [leagueDescription, setLeagueDescription] = useState("")
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
      <div className="space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-4 sl-page-title">
            {t.newLeague.title}
          </h1>

          <p className="mt-1 sl-page-subtitle">
            La creación de ligas está limitada a usuarios autorizados. Puedes unirte a una liga existente con un código de invitación.
          </p>
        </header>

        <AppCard>
          <p className="font-bold">No tienes permisos para crear ligas</p>
          <p className="mt-2 text-sm text-stone-500">
            Tu cuenta puede jugar y administrar las ligas donde tengas permisos, pero no crear ligas nuevas.
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <h1 className="mt-4 sl-page-title">
          {t.newLeague.title}
        </h1>

        <p className="mt-1 sl-page-subtitle">
          {t.newLeague.description}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-3">
        <AppCard>
          <p className="font-bold">Datos de la liga</p>
          <p className="mt-2 text-sm text-stone-500">
            Primero crea la liga. Después configurarás la Temporada 1 con sus jugadores, jornadas y reglas.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
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
                className="mt-2 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-700">
                {t.newLeague.leagueDescription}
              </span>
              <textarea
                value={leagueDescription}
                onChange={(event) => setLeagueDescription(event.target.value)}
                disabled={isCreating}
                placeholder={t.newLeague.leagueDescriptionPlaceholder}
                rows={3}
                className="mt-2 w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-stone-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>
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
          className="w-full rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
        >
          {isCreating ? "Creando liga..." : t.newLeague.create}
        </button>
      </form>
    </div>
  )
}
