"use client"

import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { LeagueSwitcher } from "@/components/league/LeagueSwitcher"
import { LocalDataMaintenanceCard } from "@/components/settings/LocalDataMaintenanceCard"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"

export default function SettingsPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { isLeagueAdmin, isLeagueCreator, userLeagues } = useLeagueAccess()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const canMaintainLocalData = isLeagueCreator(activeLeague.id)
  const hasMultipleLeagues = userLeagues.length > 1

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/profile" label={t.common.back} />

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

        {hasMultipleLeagues ? (
          <div className="mt-4">
            <LeagueSwitcher />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-semibold text-neutral-500">
              Liga activa
            </p>
            <p className="mt-1 text-sm font-black text-neutral-950">
              {activeLeague.name}
            </p>
          </div>
        )}

        <Link
          href="/league/new"
          className="mt-4 block w-full rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white"
        >
          {t.settings.createNewLeague}
        </Link>
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
        <p className="font-bold">{t.settings.accountTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.accountDescription}
        </p>

        {session?.user?.email ? (
          <div className="mt-4 rounded-2xl bg-neutral-100 p-4">
            <p className="text-xs font-semibold text-neutral-500">
              {t.settings.connectedEmail}
            </p>
            <p className="mt-1 text-sm font-black text-neutral-900">
              {session.user.email}
            </p>
          </div>
        ) : null}

        <Link
          href="/invite"
          className="mt-4 block w-full rounded-2xl bg-neutral-100 px-4 py-3 text-center text-sm font-black text-neutral-800"
        >
          {t.settings.joinNewExistingLeague}
        </Link>
      </AppCard>

      {canMaintainLocalData ? <LocalDataMaintenanceCard /> : null}

      <AppCard>
        <p className="font-bold">{t.settings.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.futureDescription}
        </p>
      </AppCard>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="w-full rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700"
      >
        {t.auth.signOut}
      </button>
    </div>
  )
}
