"use client"

import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { isCurrentUserLeagueAdmin } from "@/lib/permissions"

export default function AdminPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isCurrentUserLeagueAdmin(activeLeague.id)

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
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.adminPanel.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.adminPanel.description}
        </p>
      </header>

      <div className="space-y-3">
        <Link href="/admin/league">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.leagueTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.adminPanel.leagueDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>

        <Link href="/admin/season">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.adminPanel.seasonTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.adminPanel.seasonDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      </div>

      <AppCard>
        <p className="font-bold">{t.adminPanel.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.adminPanel.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
