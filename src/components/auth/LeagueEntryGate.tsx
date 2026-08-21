"use client"

import { FormEvent, type ReactNode, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { AppBootSkeleton } from "@/components/loading/PageSkeletons"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { normalizeInviteCode } from "@/lib/inviteUrls"

type LeagueEntryGateProps = {
  children: ReactNode
}

function isDocumentReload() {
  if (typeof window === "undefined") {
    return false
  }

  const navigationEntry = window.performance.getEntriesByType(
    "navigation",
  )[0] as PerformanceNavigationTiming | undefined

  if (navigationEntry) {
    return navigationEntry.type === "reload"
  }

  return window.performance.navigation?.type === 1
}

export function LeagueEntryGate({ children }: LeagueEntryGateProps) {
  const { t, tx } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const { data: session } = useSession()
  const { activeLeagueId, isLeagueTransitioning } = useActiveLeague()
  const { seasons } = useSeasonSettings()
  const {
    canCreateLeagues,
    hasLeagueAdminRole,
    isAccessHydrated,
    isLeagueSpectator,
    isSuperuser,
    userLeagues,
  } = useLeagueAccess()
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [initialLeagueEntryResolved, setInitialLeagueEntryResolved] = useState(false)
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isSpectatorInviteRoute = pathname.startsWith("/spectate/")
  const isLeagueNavigationRoute = pathname === "/open"
  const isAccessInviteRoute = isInviteRoute || isSpectatorInviteRoute
  const isNewLeagueRoute = pathname === "/league/new"
  const isLeaguesRoute = pathname === "/leagues"
  const isPersonalMatchesRoute =
    pathname === "/personal-matches" || pathname.startsWith("/personal-matches/")
  const isSeasonSetupRoute = pathname === "/admin/season"
  const activeLeague =
    userLeagues.find((league) => league.id === activeLeagueId) ?? userLeagues[0]
  const activeLeagueHasSeason = activeLeague
    ? seasons.some((season) => season.leagueId === activeLeague.id)
    : false
  const canManageActiveLeagueSeason = activeLeague
    ? hasLeagueAdminRole(activeLeague.id)
    : false
  const shouldRequireInitialSeason =
    Boolean(activeLeague) &&
    !activeLeagueHasSeason &&
    !isAccessInviteRoute &&
    !isNewLeagueRoute &&
    !isLeaguesRoute &&
    !isPersonalMatchesRoute
  useEffect(() => {
    if (!isAccessHydrated || initialLeagueEntryResolved || isAccessInviteRoute) return

    if (
      pathname === "/" &&
      userLeagues.length > 1 &&
      !isDocumentReload()
    ) {
      router.replace("/leagues")
      return
    }

    const resolveTimer = window.setTimeout(() => {
      setInitialLeagueEntryResolved(true)
    }, 0)

    return () => window.clearTimeout(resolveTimer)
  }, [
    initialLeagueEntryResolved,
    isAccessHydrated,
    isAccessInviteRoute,
    pathname,
    router,
    userLeagues.length,
  ])
  useEffect(() => {
    if (
      isLeagueTransitioning ||
      !shouldRequireInitialSeason ||
      !canManageActiveLeagueSeason ||
      isSeasonSetupRoute
    ) {
      return
    }

    router.replace("/admin/season")
  }, [
    canManageActiveLeagueSeason,
    isLeagueTransitioning,
    isSeasonSetupRoute,
    router,
    shouldRequireInitialSeason,
  ])
  const spectatorMode = activeLeague
    ? isLeagueSpectator(activeLeague.id)
    : false
  const spectatorAllowedRoute =
    pathname === "/" ||
    pathname === "/ranking" ||
    pathname === "/matches" ||
    pathname.startsWith("/match/") ||
    pathname.startsWith("/round/") ||
    pathname.startsWith("/player/") ||
    pathname === "/settings" ||
    pathname === "/settings/profile" ||
    pathname === "/settings/suggestions" ||
    pathname === "/leagues" ||
    isPersonalMatchesRoute ||
    pathname === "/help" ||
    pathname === "/changelog" ||
    (isSuperuser && pathname.startsWith("/application-admin")) ||
    isAccessInviteRoute ||
    isLeagueNavigationRoute
  useEffect(() => {
    if (isLeagueTransitioning) {
      return
    }

    if (spectatorMode && !spectatorAllowedRoute) {
      router.replace("/")
    }
  }, [isLeagueTransitioning, router, spectatorAllowedRoute, spectatorMode])
  if (!isAccessHydrated || (!initialLeagueEntryResolved && pathname === "/" && userLeagues.length > 1)) {
    return <AppBootSkeleton />
  }

  if (isLeagueTransitioning) {
    return children
  }

  if (
    isAccessInviteRoute ||
    isLeagueNavigationRoute ||
    isLeaguesRoute ||
    isPersonalMatchesRoute ||
    (isNewLeagueRoute && canCreateLeagues)
  ) {
    return children
  }

  if (spectatorMode && !spectatorAllowedRoute) {
    return null
  }

  if (shouldRequireInitialSeason) {
    if (canManageActiveLeagueSeason && isSeasonSetupRoute) {
      return children
    }

    return (
      <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950">
        <div className="mx-auto max-w-md space-y-4">
          <header className="pt-8">
            <p className="text-sm font-medium text-neutral-500">
              {activeLeague?.name}
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight">
              {tx("Crea la primera temporada")}
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {tx("Antes de usar la liga hay que configurar jugadores, calendario y reglas.")}
            </p>
          </header>

          <AppCard>
            {canManageActiveLeagueSeason ? (
              <>
                <p className="font-bold">{tx("Temporada obligatoria")}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {tx("La aplicación permanecerá bloqueada hasta crear la temporada inicial.")}
                </p>
                <Link
                  href="/admin/season"
                  className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white items-center justify-center"
                >
                  {tx("Crear temporada")}
                </Link>
              </>
            ) : (
              <>
                <p className="font-bold">{tx("Temporada pendiente")}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {tx("El administrador debe crear la primera temporada antes de que la liga esté disponible.")}
                </p>
              </>
            )}
          </AppCard>
        </div>
      </main>
    )
  }

  if (userLeagues.length > 0) {
    return children
  }

  function handleJoinSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedInviteCode = normalizeInviteCode(inviteCode)

    if (!normalizedInviteCode) {
      setError(t.invites.invalidCode)
      return
    }

    router.push(`/invite/${encodeURIComponent(normalizedInviteCode)}`)
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-6 text-neutral-950">
      <div className="mx-auto max-w-md space-y-4">
        <header className="pt-8">
          <p className="text-sm font-medium text-neutral-500">
            {session?.user?.email}
          </p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">
            {t.onboarding.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t.onboarding.description}
          </p>
        </header>

        {canCreateLeagues ? (
          <AppCard>
            <p className="font-bold">{t.onboarding.createTitle}</p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.onboarding.createDescription}
            </p>
            <Link
              href="/league/new"
              className="flex mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white items-center justify-center"
            >
              {t.onboarding.createAction}
            </Link>
          </AppCard>
        ) : null}

        <AppCard>
          <p className="font-bold">{t.onboarding.joinTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.onboarding.joinDescription}
          </p>

          <form onSubmit={handleJoinSubmit} className="mt-3 space-y-3">
            <label className="block">
              <span className="text-sm font-semibold text-neutral-700">
                {t.invites.codeLabel}
              </span>
              <input
                value={inviteCode}
                onChange={(event) => {
                  setInviteCode(event.target.value)
                  setError(null)
                }}
                placeholder={t.invites.codePlaceholder}
                className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold uppercase text-neutral-900 shadow-sm outline-none focus:border-neutral-400"
              />
            </label>

            {error ? (
              <p className="text-sm font-semibold text-red-600">{tx(error)}</p>
            ) : null}

            <button
              type="submit"
              className="flex w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white items-center justify-center text-center"
            >
              {t.onboarding.joinAction}
            </button>
          </form>
        </AppCard>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 shadow-sm items-center justify-center text-center"
        >
          {t.auth.signOut}
        </button>
      </div>
    </main>
  )
}
