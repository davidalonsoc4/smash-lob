"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type CSSProperties, type ReactNode } from "react"
import { FloatingInviteShareButton } from "@/components/invite/FloatingInviteShareButton"
import { PwaInstallPrompt } from "@/components/layout/PwaInstallPrompt"
import { FloatingSpectatorShareButton } from "@/components/spectator/FloatingSpectatorShareButton"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getAppBranding } from "@/lib/appVariant"
import { BottomNav } from "./BottomNav"

type AppShellProps = {
  children: ReactNode
}

type InviteFloatingControlsProps = {
  rightOffsetPx: number
}

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: "15px",
        height: "15px",
        display: "block",
      }}
    >
      <path d="M4 7h10" />
      <path d="M18 7h2" />
      <path d="M4 17h2" />
      <path d="M10 17h10" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="8" cy="17" r="2" />
    </svg>
  )
}

function NotificationsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        width: "15px",
        height: "15px",
        display: "block",
      }}
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  )
}

function getFloatingRight(offsetPx: number) {
  return `max(${offsetPx}px, calc((100vw - 448px) / 2 + ${offsetPx}px))`
}

function getFloatingTop() {
  return "max(16px, calc(env(safe-area-inset-top, 0px) + 12px))"
}

function InviteFloatingControls({ rightOffsetPx }: InviteFloatingControlsProps) {
  const {
    getLeagueInviteCode,
    isLeagueAdmin,
    isPlayerClaimed,
    regenerateLeagueInviteCode,
  } = useLeagueAccess()
  const {
    activeLeague,
    activeSeason,
    roundSettings,
    players,
  } = useCurrentLeagueData()
  const { seasonPlayers } = useSeasonSettings()

  if (!isLeagueAdmin(activeLeague.id)) {
    return null
  }

  const unclaimedPlayers = players.filter(
    (player) => !isPlayerClaimed(activeLeague.id, player.id)
  )
  const inviteCode = getLeagueInviteCode(activeLeague.id)
  const registeredCount = seasonPlayers.filter(
    (item) =>
      item.seasonId === activeSeason.id && item.status !== "withdrawn",
  ).length
  const selfRegistrationSlots =
    roundSettings.rosterMode === "self_registration" &&
    roundSettings.registrationOpen &&
    roundSettings.playerCapacity
      ? Math.max(roundSettings.playerCapacity - registeredCount, 0)
      : 0
  const inviteCount =
    roundSettings.rosterMode === "self_registration"
      ? selfRegistrationSlots
      : unclaimedPlayers.length

  if (inviteCount === 0) {
    return null
  }

  return (
    <FloatingInviteShareButton
      initialInviteCode={inviteCode}
      leagueName={activeLeague.name}
      unclaimedCount={inviteCount}
      rightOffsetPx={rightOffsetPx}
      onGenerateInviteCode={() => regenerateLeagueInviteCode(activeLeague.id)}
    />
  )
}


function SpectatorFloatingControls({ rightOffsetPx }: InviteFloatingControlsProps) {
  const { canShareSpectatorInvite } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()

  if (!canShareSpectatorInvite(activeLeague.id)) {
    return null
  }

  return (
    <FloatingSpectatorShareButton
      leagueId={activeLeague.id}
      leagueName={activeLeague.name}
      seasonName={activeSeason.name}
      rightOffsetPx={rightOffsetPx}
    />
  )
}

export function AppShell({ children }: AppShellProps) {
  const { t } = useI18n()
  const branding = getAppBranding()
  const pathname = usePathname()
  const {
    activeLeagueId,
    isLeagueTransitioning,
    transitioningLeagueId,
  } = useActiveLeague()
  const {
    canShareSpectatorInvite,
    isLeagueAdmin,
    isLeagueSpectator,
    leagues,
  } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isSpectateRoute = pathname.startsWith("/spectate/")
  const isLeagueNavigationRoute = pathname === "/open"
  const isPublicAccessRoute =
    isInviteRoute || isSpectateRoute || isLeagueNavigationRoute
  const isNewLeagueRoute = pathname === "/league/new"
  const isInitialSeasonSetupRoute =
    pathname === "/admin/season" &&
    !seasons.some((season) => season.leagueId === activeLeagueId)
  const spectatorMode = isLeagueSpectator(activeLeagueId)
  const shouldShowSettingsButton = !isInitialSeasonSetupRoute && !isPublicAccessRoute
  const shouldShowNotificationsButton =
    !isInitialSeasonSetupRoute && !isPublicAccessRoute && !spectatorMode
  const shouldShowBottomNav =
    !isPublicAccessRoute && !isNewLeagueRoute && !isInitialSeasonSetupRoute
  const shouldShowPlayerInviteButton =
    !isPublicAccessRoute && !isNewLeagueRoute && !isInitialSeasonSetupRoute && !spectatorMode
  const shouldShowSpectatorShareButton = shouldShowPlayerInviteButton
  const hasPlayerInviteControl =
    shouldShowPlayerInviteButton && isLeagueAdmin(activeLeagueId)
  const hasSpectatorShareControl =
    shouldShowSpectatorShareButton &&
    canShareSpectatorInvite(activeLeagueId)
  const hasFloatingTopControls =
    shouldShowSettingsButton ||
    shouldShowNotificationsButton ||
    hasPlayerInviteControl ||
    hasSpectatorShareControl
  const floatingTopReservedWidth = hasPlayerInviteControl
    ? 184
    : hasSpectatorShareControl
      ? 142
      : shouldShowNotificationsButton
        ? 100
        : shouldShowSettingsButton
          ? 58
          : 0
  const activeLeague = leagues.find((league) => league.id === activeLeagueId)
  const transitioningLeague = transitioningLeagueId
    ? leagues.find((league) => league.id === transitioningLeagueId)
    : null
  const statusColorsEnabled = activeLeague?.statusColorsEnabled !== false

  if (isLeagueTransitioning) {
    const leagueName = transitioningLeague?.name ?? t.common.privateLeague

    return (
      <div className="min-h-screen bg-stone-200 text-neutral-950">
        <div className="mx-auto flex min-h-screen max-w-md items-center bg-stone-50 px-4 shadow-[0_0_32px_rgba(15,23,42,0.06)]">
          <AppCard className="w-full text-center">
            <div
              aria-hidden="true"
              className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-950"
            />
            <p className="mt-4 text-lg font-black">
              {t.invites.enteringLeagueTitle}
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {t.invites.enteringLeagueDescription.replace(
                "{leagueName}",
                leagueName,
              )}
            </p>
          </AppCard>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-stone-200 text-neutral-950 ${
        statusColorsEnabled ? "" : "status-colors-disabled"
      }`}
    >
      <div className="mx-auto min-h-screen max-w-md bg-stone-50 shadow-[0_0_32px_rgba(15,23,42,0.06)]">
        <PwaInstallPrompt />

        {branding.preproduction ? (
          <div
            aria-label={branding.internalBadgeAriaLabel ?? undefined}
            className="pointer-events-none fixed left-4 z-50 rounded-full border border-red-200 bg-red-600 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-white shadow-lg"
            style={{ top: getFloatingTop() }}
          >
            {branding.internalBadgeText}
          </div>
        ) : null}

        {hasPlayerInviteControl ? (
          <InviteFloatingControls rightOffsetPx={142} />
        ) : null}

        {hasSpectatorShareControl ? (
          <SpectatorFloatingControls rightOffsetPx={100} />
        ) : null}

        {shouldShowNotificationsButton ? (
          <Link
            href="/notifications"
            aria-label="Notificaciones"
            title="Notificaciones"
            className="z-50 flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
            style={{
              position: "fixed",
              top: getFloatingTop(),
              right: getFloatingRight(shouldShowSettingsButton ? 58 : 16),
              width: "34px",
              height: "34px",
            }}
          >
            <NotificationsIcon />
          </Link>
        ) : null}

        {shouldShowSettingsButton ? (
          <Link
            href="/settings"
            aria-label={t.appHeader.settingsLabel}
            title={t.appHeader.settingsLabel}
            className="z-50 flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
            style={{
              position: "fixed",
              top: getFloatingTop(),
              right: getFloatingRight(16),
              width: "34px",
              height: "34px",
            }}
          >
            <SettingsIcon />
          </Link>
        ) : null}

        <main
          className="app-main px-3"
          data-has-floating-top-controls={hasFloatingTopControls}
          style={
            {
              "--app-floating-top-reserved-width": `${floatingTopReservedWidth}px`,
              paddingTop: hasFloatingTopControls
                ? "max(20px, calc(env(safe-area-inset-top, 0px) + 20px))"
                : "max(12px, calc(env(safe-area-inset-top, 0px) + 12px))",
              paddingBottom: "96px",
            } as CSSProperties
          }
        >
          {children}
        </main>

        {shouldShowBottomNav ? <BottomNav /> : null}
      </div>
    </div>
  )
}
