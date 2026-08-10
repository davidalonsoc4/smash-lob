"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { type CSSProperties, type ReactNode, useEffect } from "react"
import { FloatingInviteShareButton } from "@/components/invite/FloatingInviteShareButton"
import { GlobalLeagueSearch } from "@/components/league/GlobalLeagueSearch"
import { FloatingSpectatorShareButton } from "@/components/spectator/FloatingSpectatorShareButton"
import { GlobalSettingsSearch } from "@/components/settings/GlobalSettingsSearch"
import { PersonalMatchesNav } from "@/components/personal/PersonalMatchesNav"
import { LeagueTransitionSkeleton } from "@/components/loading/PageSkeletons"
import { ActionFeedbackCenter } from "@/components/ui/ActionFeedbackCenter"
import { FloatingHelpButton } from "@/components/onboarding/FloatingHelpButton"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { APP_VERSION_LABEL } from "@/lib/appVersion"
import { isAvatarLabEnabled } from "@/lib/avatarLabAccess"
import { getAppBranding } from "@/lib/appVariant"
import { buildSettingsSearchEntries } from "@/lib/settingsSearch"
import { applyAppFontSize, readStoredAppFontSize } from "@/lib/fontSizePreference"
import { BottomNav } from "./BottomNav"

type AppShellProps = {
  children: ReactNode
}

const qaModeEnabled = process.env.NEXT_PUBLIC_QA_MODE === "true"
const settingsSearchHubRoutes = new Set([
  "/settings",
  "/admin",
  "/application-admin",
])

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
  return "max(10px, calc(env(safe-area-inset-top, 0px) + 8px))"
}

function getPreproductionBadgeLeft() {
  return "max(4px, calc((100vw - 448px) / 2 + 4px))"
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
  const { t, locale } = useI18n()

  useEffect(() => {
    applyAppFontSize(readStoredAppFontSize())
  }, [])
  const branding = getAppBranding()
  const pathname = usePathname()
  const {
    activeLeagueId,
    isLeagueTransitioning,
    transitioningLeagueId,
  } = useActiveLeague()
  const {
    canCreateLeagues,
    canShareSpectatorInvite,
    getMembershipForLeague,
    hasLeagueAdminRole,
    isAdminViewEnabled,
    isLeagueAdmin,
    isLeagueSpectator,
    isSuperuser,
    leagues,
  } = useLeagueAccess()
  const { seasons } = useSeasonSettings()
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isSpectateRoute = pathname.startsWith("/spectate/")
  const isLeagueNavigationRoute = pathname === "/open"
  const isPersonalMatchesRoute =
    pathname === "/personal-matches" || pathname.startsWith("/personal-matches/")
  const isPublicAccessRoute =
    isInviteRoute || isSpectateRoute || isLeagueNavigationRoute
  const isNewLeagueRoute = pathname === "/league/new"
  const isInitialSeasonSetupRoute =
    pathname === "/admin/season" &&
    !seasons.some((season) => season.leagueId === activeLeagueId)
  const spectatorMode = isLeagueSpectator(activeLeagueId)
  const activeMembership = getMembershipForLeague(activeLeagueId)
  const canAccessAdmin = isLeagueAdmin(activeLeagueId)
  const hasAdminRole = hasLeagueAdminRole(activeLeagueId)
  const canCreateLeague = canCreateLeagues && isAdminViewEnabled
  const canSelfUnlink = Boolean(
    activeMembership && activeMembership.role !== "creator",
  )
  const shouldShowSettingsSearch =
    settingsSearchHubRoutes.has(pathname) && !isPublicAccessRoute && !isPersonalMatchesRoute
  const shouldShowLeagueSearch = pathname === "/leagues" && !isPublicAccessRoute
  const settingsSearchEntries = shouldShowSettingsSearch
    ? buildSettingsSearchEntries(locale, {
        isSpectator: !isSuperuser && spectatorMode,
        canAccessAdmin,
        hasAdminRole,
        canCreateLeague,
        canSelfUnlink,
        qaEnabled: qaModeEnabled,
        isSuperuser,
        avatarLabEnabled: isAvatarLabEnabled(),
      })
    : []
  const shouldShowSettingsButton =
    !isInitialSeasonSetupRoute && !isPublicAccessRoute
  const shouldShowHelpButton =
    !isInitialSeasonSetupRoute && !isPublicAccessRoute && !isPersonalMatchesRoute
  const shouldShowNotificationsButton =
    !isInitialSeasonSetupRoute &&
    !isPublicAccessRoute &&
    !isPersonalMatchesRoute &&
    !spectatorMode
  const shouldShowBottomNav =
    !isPublicAccessRoute &&
    !isNewLeagueRoute &&
    !isInitialSeasonSetupRoute &&
    !isPersonalMatchesRoute
  const shouldShowPersonalMatchesNav =
    isPersonalMatchesRoute && !isPublicAccessRoute
  const shouldShowPlayerInviteButton =
    !isPublicAccessRoute &&
    !isNewLeagueRoute &&
    !isInitialSeasonSetupRoute &&
    !isPersonalMatchesRoute &&
    !spectatorMode
  const shouldShowSpectatorShareButton = shouldShowPlayerInviteButton
  const hasPlayerInviteControl =
    shouldShowPlayerInviteButton && isLeagueAdmin(activeLeagueId)
  const hasSpectatorShareControl =
    shouldShowSpectatorShareButton &&
    canShareSpectatorInvite(activeLeagueId)
  const hasFloatingTopControls =
    shouldShowSettingsButton ||
    shouldShowHelpButton ||
    shouldShowNotificationsButton ||
    hasPlayerInviteControl ||
    hasSpectatorShareControl
  const activeLeague = leagues.find((league) => league.id === activeLeagueId)
  const transitioningLeague = transitioningLeagueId
    ? leagues.find((league) => league.id === transitioningLeagueId)
    : null
  const statusColorsEnabled = activeLeague?.statusColorsEnabled !== false

  if (isLeagueTransitioning) {
    const leagueName = transitioningLeague?.name ?? t.common.privateLeague
    return <LeagueTransitionSkeleton leagueName={leagueName} />
  }

  return (
    <div
      className={`app-shell-outer min-h-screen bg-stone-200 text-neutral-950 ${
        statusColorsEnabled ? "" : "status-colors-disabled"
      }`}
    >
      <div
        className="app-shell-frame mx-auto min-h-screen max-w-md bg-stone-50 shadow-[0_0_32px_rgba(15,23,42,0.06)]"
        data-home-route={pathname === "/"}
      >
        {branding.preproduction ? (
          <div
            aria-label={branding.internalBadgeAriaLabel ?? undefined}
            className="app-preproduction-badge pointer-events-none fixed rounded-full border border-red-200 bg-red-600 px-3 py-1 type-caption font-black uppercase tracking-[0.24em] text-white shadow-lg"
            style={{
              top: "max(4px, calc(env(safe-area-inset-top, 0px) + 4px))",
              left: getPreproductionBadgeLeft(),
              zIndex: 80,
            }}
          >
            {branding.internalBadgeText} · {APP_VERSION_LABEL}
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
            data-tour="floating-notifications"
            aria-label="Notificaciones"
            title="Notificaciones"
            className="app-floating-control z-50 flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
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

        {shouldShowHelpButton ? (
          <FloatingHelpButton
            right={getFloatingRight(
              hasPlayerInviteControl
                ? 184
                : hasSpectatorShareControl
                  ? 142
                  : shouldShowNotificationsButton
                    ? 100
                    : shouldShowSettingsButton
                      ? 58
                      : 16,
            )}
          />
        ) : null}

        {shouldShowSettingsButton ? (
          <Link
            href="/settings"
            data-tour="floating-settings"
            aria-label={t.appHeader.settingsLabel}
            title={t.appHeader.settingsLabel}
            className="app-floating-control z-50 flex items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
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
          className={`app-main px-3 ${
            isLeagueNavigationRoute ? "flex min-h-screen items-center" : ""
          }`}
          data-has-floating-top-controls={hasFloatingTopControls}
          style={
            {
              paddingTop: isLeagueNavigationRoute
                ? "env(safe-area-inset-top, 0px)"
                : hasFloatingTopControls
                  ? "max(54px, calc(env(safe-area-inset-top, 0px) + 52px))"
                  : "max(20px, calc(env(safe-area-inset-top, 0px) + 20px))",
              paddingBottom: isLeagueNavigationRoute
                ? "env(safe-area-inset-bottom, 0px)"
                : shouldShowBottomNav || shouldShowPersonalMatchesNav ? "96px" : "32px",
            } as CSSProperties
          }
        >
          {children}
        </main>

        {shouldShowSettingsSearch ? (
          <GlobalSettingsSearch locale={locale} entries={settingsSearchEntries} />
        ) : null}

        {shouldShowLeagueSearch ? <GlobalLeagueSearch /> : null}

        <ActionFeedbackCenter hasBottomNav={shouldShowBottomNav || shouldShowPersonalMatchesNav} />

        {shouldShowBottomNav ? <BottomNav /> : null}
        {shouldShowPersonalMatchesNav ? <PersonalMatchesNav /> : null}
      </div>
    </div>
  )
}
