"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect } from "react"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { LeagueSwitcher } from "@/components/league/LeagueSwitcher"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { leagueMembers, playerProfiles } from "@/data/fakeData"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  getCurrentUserLeagueRole,
  isCurrentUserLeagueAdmin,
} from "@/lib/permissions"

export default function SettingsPage() {
  const { t } = useI18n()
  const searchParams = useSearchParams()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { currentUserId, setCurrentUserId } = useCurrentUser()
  const testUserId = searchParams.get("testUser")

  useEffect(() => {
    if (!testUserId) {
      return
    }

    setCurrentUserId(testUserId)
  }, [setCurrentUserId, testUserId])

  const activeLeaguePlayerIds = leagueMembers
    .filter((member) => member.leagueId === activeLeague.id)
    .map((member) => member.playerId)
  const activeLeaguePlayers = playerProfiles.filter((player) =>
    activeLeaguePlayerIds.includes(player.id)
  )
  const queryUserId = testUserId ?? ""
  const selectedUserId = activeLeaguePlayers.some(
    (player) => player.id === queryUserId
  )
    ? queryUserId
    : currentUserId
  const canAccessAdmin = isCurrentUserLeagueAdmin(
    activeLeague.id,
    selectedUserId
  )
  const currentUserRole = getCurrentUserLeagueRole(
    activeLeague.id,
    selectedUserId
  )

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

        <div className="mt-4">
          <LeagueSwitcher />
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.settings.testUserTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.testUserDescription}
        </p>

        <div className="mt-4">
          <p className="text-sm font-semibold text-neutral-700">
            {t.settings.connectedUser}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-2">
            {activeLeaguePlayers.map((player) => {
              const isSelected = player.id === selectedUserId

              return (
                <a
                  key={player.id}
                  href={`/settings?testUser=${player.id}`}
                  onClick={() => setCurrentUserId(player.id)}
                  className={`rounded-2xl px-4 py-3 text-sm font-black ${
                    isSelected
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-800"
                  }`}
                >
                  {player.displayName}
                </a>
              )
            })}
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold text-neutral-500">
          {t.settings.connectedRole}: {currentUserRole ?? "-"}
        </p>
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
      </AppCard>

      <AppCard>
        <p className="font-bold">{t.settings.futureTitle}</p>
        <p className="mt-2 text-sm text-neutral-500">
          {t.settings.futureDescription}
        </p>
      </AppCard>
    </div>
  )
}
