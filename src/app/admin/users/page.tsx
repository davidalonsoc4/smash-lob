"use client"

import { LeagueSpectatorsPanel } from "@/components/admin/LeagueSpectatorsPanel"
import { LeagueUsersManagementPanel } from "@/components/admin/LeagueUsersManagementPanel"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = hasLeagueAdminRole(activeLeague.id)

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
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Jugadores, usuarios y espectadores
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Gestiona cuentas vinculadas, espectadores, nombres visibles y permisos de la liga.
        </p>
      </header>

      <LeagueUsersManagementPanel leagueId={activeLeague.id} />
      <LeagueSpectatorsPanel leagueId={activeLeague.id} />
    </div>
  )
}
