"use client"

import Link from "next/link"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { LeagueSwitcher } from "@/components/league/LeagueSwitcher"
import { AppCard } from "@/components/ui/AppCard"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { isCurrentUserLeagueAdmin } from "@/lib/permissions"

export default function SettingsPage() {
  const { t } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isCurrentUserLeagueAdmin(activeLeague.id)

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.settings.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.settings.description}
        </p>
      </header>

      <AppCard>
        <p className="font-bold">{t.settings.leagueTitle}</p>

        <div className="mt-4">
          <LeagueSwitcher />
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.settings.languageTitle}</p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{t.settings.language}</p>
            <p className="mt-1 text-xs text-neutral-500">
              {t.settings.languageDescription}
            </p>
          </div>

          <LanguageSwitcher />
        </div>
      </AppCard>

      {canAccessAdmin ? (
        <Link href="/admin">
          <AppCard className="transition active:scale-[0.99]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold">{t.settings.adminPanelTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.settings.adminPanelDescription}
                </p>
              </div>

              <span className="text-xl">&gt;</span>
            </div>
          </AppCard>
        </Link>
      ) : null}

      <AppCard>
        <p className="font-bold">{t.settings.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
