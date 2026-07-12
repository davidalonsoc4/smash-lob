"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { normalizeInternalNavigationTarget } from "@/lib/leagueNavigation"

export function LeagueNotificationRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activateLeague } = useActiveLeague()
  const { canAccessLeague, isAccessHydrated, leagues } = useLeagueAccess()
  const leagueId = searchParams.get("leagueId")?.trim() ?? ""
  const targetPath = useMemo(
    () => normalizeInternalNavigationTarget(searchParams.get("target")),
    [searchParams],
  )
  const leagueName = leagues.find((league) => league.id === leagueId)?.name
  const hasValidAccess = Boolean(leagueId) && canAccessLeague(leagueId)
  const hasAccessError = isAccessHydrated && !hasValidAccess

  useEffect(() => {
    if (!isAccessHydrated || !hasValidAccess) {
      return
    }

    if (!activateLeague(leagueId)) {
      return
    }

    const navigationTimer = window.setTimeout(() => {
      router.replace(targetPath)
    }, 0)

    return () => window.clearTimeout(navigationTimer)
  }, [
    activateLeague,
    hasValidAccess,
    isAccessHydrated,
    leagueId,
    router,
    targetPath,
  ])

  return (
    <AppCard>
      <p className="font-black">
        {hasAccessError
          ? "No se puede abrir la notificación"
          : "Abriendo liga"}
      </p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {hasAccessError
          ? "No tienes acceso a la liga de esta notificación o el acceso ya no está disponible."
          : leagueName
            ? `Cambiando a ${leagueName}…`
            : "Comprobando el acceso y cargando la liga correcta…"}
      </p>

      {hasAccessError ? (
        <Link
          href="/leagues"
          className="mt-3 block rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
        >
          Ver mis ligas
        </Link>
      ) : null}
    </AppCard>
  )
}
