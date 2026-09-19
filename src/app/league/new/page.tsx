"use client"

import { type FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { DEFAULT_LEAGUE_ACCENT, normalizeAccentColor } from "@/lib/visualStyle"

export default function NewLeaguePage() {
  const { tx } = useI18n()
  const { t } = useI18n()
  const router = useRouter()
  const { activateGrantedLeague } = useActiveLeague()
  const { canCreateLeagues, createLeague } = useLeagueAccess()
  const [leagueName, setLeagueName] = useState("")
  const [leagueDescription, setLeagueDescription] = useState("")
  const [leagueRecommendations, setLeagueRecommendations] = useState("")
  const [accentColor, setAccentColor] = useState(DEFAULT_LEAGUE_ACCENT)
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
      recommendations: leagueRecommendations.trim(),
      accentColor,
      locations: [],
    })

    if (!league) {
      setError(t.newLeague.createError)
      setIsCreating(false)
      return
    }

    activateGrantedLeague(league.id, "/admin/season")
    router.replace("/admin/season")
  }

  if (!canCreateLeagues) {
    return (
      <div className="space-y-4">
        <header className="app-page-header">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="type-page-title mt-3 text-2xl font-black tracking-tight">
            {t.newLeague.title}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{tx("No tienes permisos para crear ligas")}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {tx("Tu cuenta puede jugar y administrar las ligas donde tengas permisos, pero no crear ligas nuevas. Puedes unirte a otra liga con un código de invitación.")}{" "}</p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <h1 className="type-page-title mt-3 text-2xl font-black tracking-tight">
          {t.newLeague.title}
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AppCard>
          <p className="font-bold">{tx("Datos de la liga")}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {tx("Primero crea la liga. Después configurarás la Temporada 1 con sus jugadores, jornadas y reglas.")}{" "}</p>

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


            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {tx("Recomendaciones de la liga")}{" "}</span>
              <textarea
                value={leagueRecommendations}
                onChange={(event) => setLeagueRecommendations(event.target.value)}
                disabled={isCreating}
                placeholder={tx("Bolas recomendadas, pistas habituales, equipamiento o normas prácticas para jugar la liga.")}
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
              <p className="mt-1 text-xs text-neutral-500">
                {tx("Campo opcional para dejar indicaciones útiles a todos los jugadores.")}{" "}</p>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">{t.settings.leagueAccentColor}</span>
              <span className="mt-1 block text-xs font-semibold text-neutral-500">{t.settings.leagueAccentDescription}</span>
              <div className="mt-2 flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 shadow-sm">
                <input
                  aria-label={t.settings.leagueAccentColor}
                  type="color"
                  value={accentColor}
                  disabled={isCreating}
                  onChange={(event) => setAccentColor(normalizeAccentColor(event.target.value))}
                  className="h-10 w-14 cursor-pointer rounded-xl border-0 bg-transparent p-0"
                />
                <span className="font-mono text-sm font-bold uppercase text-neutral-700">{accentColor}</span>
                <button
                  type="button"
                  onClick={() => setAccentColor(DEFAULT_LEAGUE_ACCENT)}
                  className="ml-auto inline-flex items-center justify-center rounded-xl bg-neutral-100 px-3 py-2 text-center text-xs font-black text-neutral-700"
                >
                  {t.common.reset}
                </button>
              </div>
            </label>
          </div>
        </AppCard>

        {error ? (
          <p className="text-center text-sm font-semibold text-red-600">
            {tx(error)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!canCreate || isCreating}
          className="flex w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
        >
          {isCreating ? tx("Creando liga...") : t.newLeague.create}
        </button>
      </form>
    </div>
  )
}
