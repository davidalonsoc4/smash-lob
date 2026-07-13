"use client"

import { useState } from "react"
import { LeagueSpectatorsPanel } from "@/components/admin/LeagueSpectatorsPanel"
import { LeagueUsersManagementPanel } from "@/components/admin/LeagueUsersManagementPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function AdminUsersPage() {
  const { t } = useI18n()
  const {
    hasLeagueAdminRole,
    updateLeagueShowRankingAvatars,
  } = useLeagueAccess()
  const { activeLeague } = useCurrentLeagueData()
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)
  const showRankingAvatars = activeLeague.showRankingAvatars !== false
  const [isUpdatingRankingAvatars, setIsUpdatingRankingAvatars] = useState(false)
  const [rankingAvatarsError, setRankingAvatarsError] = useState<string | null>(null)

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

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-1 text-xs font-bold text-neutral-500">
          {activeLeague.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Jugadores, usuarios y espectadores
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Gestiona cuentas vinculadas, espectadores, nombres visibles y permisos de la liga.
        </p>
      </header>


      <div id="ranking-avatars" className="settings-search-target"><AppCard>
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
      </AppCard></div>

      <div id="users" className="settings-search-target"><LeagueUsersManagementPanel leagueId={activeLeague.id} /></div>
      <div id="spectators" className="settings-search-target"><LeagueSpectatorsPanel leagueId={activeLeague.id} /></div>
    </div>
  )
}
