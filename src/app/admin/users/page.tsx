"use client"

import { useState } from "react"
import { LeagueSpectatorsPanel } from "@/components/admin/LeagueSpectatorsPanel"
import { LeagueUsersManagementPanel } from "@/components/admin/LeagueUsersManagementPanel"
import { SeasonRosterWaitingRoom } from "@/components/season/SeasonRosterWaitingRoom"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

function SectionIntro({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="px-1 pt-1">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400">
        {title}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {description}
      </p>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { hasLeagueAdminRole, updateLeagueShowRankingAvatars } =
    useLeagueAccess()
  const { activeLeague, activeSeason, roundSettings } = useCurrentLeagueData()
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const showRankingAvatars = activeLeague.showRankingAvatars !== false
  const [isUpdatingRankingAvatars, setIsUpdatingRankingAvatars] = useState(false)
  const [rankingAvatarsError, setRankingAvatarsError] = useState<string | null>(
    null,
  )

  async function handleRankingAvatarsToggle() {
    if (isUpdatingRankingAvatars) {
      return
    }

    setIsUpdatingRankingAvatars(true)
    setRankingAvatarsError(null)

    const ok = await updateLeagueShowRankingAvatars(
      activeLeague.id,
      !showRankingAvatars,
    )

    setIsUpdatingRankingAvatars(false)

    if (!ok) {
      setRankingAvatarsError(t.adminPanel.rankingAvatarsSaveError)
    }
  }

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

  const showsUpcomingRoster =
    activeSeason.status === "upcoming" &&
    roundSettings.rosterMode === "self_registration"

  return (
    <div className="compact-page space-y-4">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />
        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>
        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Personas y accesos
        </h1>
        <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
          La plantilla, las cuentas, los permisos y los espectadores se muestran en bloques separados.
        </p>
      </header>

      {showsUpcomingRoster ? (
        <section className="space-y-2">
          <SectionIntro
            title="Plantilla de temporada"
            description="Comprueba las plazas ocupadas y pendientes antes de comenzar."
          />
          <div id="season-roster" className="settings-search-target">
            <SeasonRosterWaitingRoom
              leagueId={activeLeague.id}
              seasonId={activeSeason.id}
            />
          </div>
        </section>
      ) : null}

      <section className="space-y-2">
        <SectionIntro
          title="Cuentas y permisos"
          description="Gestiona nombres visibles, vinculaciones y roles administrativos."
        />
        <div id="users" className="settings-search-target">
          <LeagueUsersManagementPanel leagueId={activeLeague.id} />
        </div>
      </section>

      <section className="space-y-2">
        <SectionIntro
          title="Espectadores"
          description="Revisa y retira accesos de solo lectura a la liga."
        />
        <div id="spectators" className="settings-search-target">
          <LeagueSpectatorsPanel leagueId={activeLeague.id} />
        </div>
      </section>

      <section className="space-y-2">
        <SectionIntro
          title="Apariencia de jugadores"
          description="Controla cómo se muestran los perfiles en las vistas públicas de la liga."
        />
        <div id="ranking-avatars" className="settings-search-target">
          <AppCard>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold">{t.adminPanel.rankingAvatarsTitle}</p>
                <p className="mt-1 text-xs font-semibold text-neutral-500">
                  {t.adminPanel.rankingAvatarsDescription}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={showRankingAvatars}
                aria-label={t.adminPanel.rankingAvatarsTitle}
                onClick={handleRankingAvatarsToggle}
                disabled={isUpdatingRankingAvatars}
                className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-60 ${
                  showRankingAvatars ? "bg-neutral-950" : "bg-neutral-300"
                }`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    showRankingAvatars ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
            {rankingAvatarsError ? (
              <p className="mt-3 text-xs font-semibold text-red-600">
                {rankingAvatarsError}
              </p>
            ) : null}
          </AppCard>
        </div>
      </section>
    </div>
  )
}
