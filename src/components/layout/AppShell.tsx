"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { type CSSProperties, type ReactNode, useEffect } from "react"
import { FloatingInviteShareButton } from "@/components/invite/FloatingInviteShareButton"
import { PendingAccessIntentNotice } from "@/components/invite/PendingAccessIntentNotice"
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
import { isScheduledSeasonHomeLocked } from "@/lib/seasonScheduling"
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
  return "max(10px, calc(var(--app-safe-top) + 8px))"
}

function getPreproductionBadgeLeft() {
  return "max(4px, calc((100vw - 448px) / 2 + 4px))"
}

function InviteFloatingControls() {
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
      onGenerateInviteCode={() => regenerateLeagueInviteCode(activeLeague.id)}
    />
  )
}


function SpectatorFloatingControls() {
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
    />
  )
}

export function AppShell({ children }: AppShellProps) {
  const { tx } = useI18n()
  const { t, locale } = useI18n()

  useEffect(() => {
    applyAppFontSize(readStoredAppFontSize())
  }, [])
  const branding = getAppBranding()
  const pathname = usePathname()
  const router = useRouter()
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
  const { seasons, seasonSettings } = useSeasonSettings()
  const isInviteRoute = pathname === "/invite" || pathname.startsWith("/invite/")
  const isSpectateRoute = pathname.startsWith("/spectate/")
  const isLeagueNavigationRoute = pathname === "/open"
  const isPersonalMatchesRoute =
    pathname === "/personal-matches" || pathname.startsWith("/personal-matches/")
  const isSettingsRoute =
    pathname === "/settings" || pathname.startsWith("/settings/")
  const isSettingsContextRoute =
    isSettingsRoute ||
    pathname === "/availability" ||
    pathname === "/leagues" ||
    pathname === "/payments" ||
    pathname === "/activity" ||
    pathname === "/help" ||
    pathname === "/changelog" ||
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/application-admin" ||
    pathname.startsWith("/application-admin/") ||
    pathname === "/experimental/avatar-lab" ||
    pathname.startsWith("/experimental/avatar-lab/")
  const isMatchChatRoute =
    (pathname.startsWith("/match/") ||
      pathname.startsWith("/personal-matches/")) &&
    pathname.endsWith("/chat")
  const isPublicAccessRoute =
    isInviteRoute || isSpectateRoute || isLeagueNavigationRoute
  const isNewLeagueRoute = pathname === "/league/new"
  const isInitialSeasonSetupRoute =
    pathname === "/admin/season" &&
    !seasons.some((season) => season.leagueId === activeLeagueId)
  const activeSeason = seasons.find(
    (season) => season.leagueId === activeLeagueId && season.status !== "finished",
  )
  const activeRoundSettings = activeSeason
    ? seasonSettings.find((settings) => settings.seasonId === activeSeason.id)
    : null
  const spectatorMode = isLeagueSpectator(activeLeagueId)
  const activeMembership = getMembershipForLeague(activeLeagueId)
  const canAccessAdmin = isLeagueAdmin(activeLeagueId)
  const hasAdminRole = hasLeagueAdminRole(activeLeagueId)
  const scheduledSeasonHomeOnly = Boolean(
    activeSeason &&
      activeRoundSettings &&
      !spectatorMode &&
      isScheduledSeasonHomeLocked(
        activeSeason.status,
        activeRoundSettings.scheduledStartAt,
        canAccessAdmin,
      ),
  )
  const isScheduledSeasonUtilityRoute =
    pathname === "/" ||
    isSettingsContextRoute ||
    isPersonalMatchesRoute ||
    isPublicAccessRoute ||
    pathname === "/notifications"
  const canCreateLeague = canCreateLeagues && isAdminViewEnabled
  const canSelfUnlink = Boolean(
    activeMembership && activeMembership.role !== "creator",
  )

  useEffect(() => {
    if (scheduledSeasonHomeOnly && !isScheduledSeasonUtilityRoute) {
      router.replace("/")
    }
  }, [isScheduledSeasonUtilityRoute, router, scheduledSeasonHomeOnly])

  const shouldShowSettingsSearch =
    settingsSearchHubRoutes.has(pathname) && !isPublicAccessRoute && !isPersonalMatchesRoute
  const shouldShowLeagueSearch =
    pathname === "/leagues" && !isPublicAccessRoute
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
        availabilityRecommendationsEnabled:
          activeRoundSettings?.availabilityRecommendationsEnabled === true,
      })
    : []
  const shouldShowSettingsButton =
    !isMatchChatRoute &&
    !isSettingsRoute &&
    !isInitialSeasonSetupRoute &&
    !isPublicAccessRoute
  const shouldShowHelpButton =
    !isMatchChatRoute &&
    !isInitialSeasonSetupRoute &&
    !isPublicAccessRoute &&
    !isPersonalMatchesRoute
  const shouldShowNotificationsButton =
    !isMatchChatRoute &&
    !isInitialSeasonSetupRoute &&
    !isPublicAccessRoute &&
    !isPersonalMatchesRoute &&
    !spectatorMode
  const shouldShowBottomNav =
    !isMatchChatRoute &&
    !isSettingsContextRoute &&
    !isPublicAccessRoute &&
    !isNewLeagueRoute &&
    !isInitialSeasonSetupRoute &&
    !isPersonalMatchesRoute
  const shouldShowPersonalMatchesNav =
    isPersonalMatchesRoute && !isMatchChatRoute && !isPublicAccessRoute
  const shouldShowPlayerInviteButton =
    !isMatchChatRoute &&
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
      className={`app-shell-outer bg-stone-200 text-neutral-950 ${
        isMatchChatRoute ? "h-[100dvh] min-h-0 overflow-hidden" : "min-h-screen"
      } ${statusColorsEnabled ? "" : "status-colors-disabled"}`}
    >
      <div
        className={`app-shell-frame mx-auto max-w-md bg-stone-50 shadow-[0_0_32px_rgba(15,23,42,0.06)] ${
          isMatchChatRoute ? "h-[100dvh] min-h-0 overflow-hidden" : "min-h-screen"
        }`}
        data-home-route={pathname === "/"}
        data-match-chat-route={isMatchChatRoute}
      >
        {branding.preproduction ? (
          <div
            aria-label={branding.internalBadgeAriaLabel ?? undefined}
            className="app-preproduction-badge pointer-events-none fixed rounded-full border border-red-200 bg-red-600 px-3 py-1 type-caption font-black uppercase tracking-[0.24em] text-white shadow-lg"
            style={{
              top: "max(4px, calc(var(--app-safe-top) + 4px))",
              left: getPreproductionBadgeLeft(),
              zIndex: 80,
            }}
          >
            {branding.internalBadgeText} · {APP_VERSION_LABEL}
          </div>
        ) : null}

        {hasFloatingTopControls ? (
          <div
            data-floating-top-toolbar
            className={`flex items-center gap-2 ${isMatchChatRoute ? "z-[70]" : "z-50"}`}
            style={{
              position: "fixed",
              top: getFloatingTop(),
              right: getFloatingRight(16),
            }}
          >
            {shouldShowHelpButton ? <FloatingHelpButton /> : null}

            {hasPlayerInviteControl ? <InviteFloatingControls /> : null}

            {hasSpectatorShareControl ? <SpectatorFloatingControls /> : null}

            {shouldShowNotificationsButton ? (
              <Link
                href="/notifications"
                data-tour="floating-notifications"
                aria-label={tx("Notificaciones")}
                title={tx("Notificaciones")}
                className="app-floating-control flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
              >
                <NotificationsIcon />
              </Link>
            ) : null}

            {shouldShowSettingsButton ? (
              <Link
                href={`/settings?returnTo=${encodeURIComponent(pathname)}`}
                data-tour="floating-settings"
                aria-label={t.appHeader.settingsLabel}
                title={t.appHeader.settingsLabel}
                className="app-floating-control flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition active:scale-[0.96] active:bg-neutral-100"
              >
                <SettingsIcon />
              </Link>
            ) : null}
          </div>
        ) : null}

        <main
          className={`app-main ${isMatchChatRoute ? "h-[100dvh] min-h-0 overflow-hidden p-0" : "px-3"} ${
            isLeagueNavigationRoute ? "flex min-h-screen items-center" : ""
          }`}
          data-has-floating-top-controls={hasFloatingTopControls}
          data-match-chat-route={isMatchChatRoute}
          style={
            {
              paddingTop: isMatchChatRoute
                ? "0px"
                : isLeagueNavigationRoute
                  ? "var(--app-safe-top)"
                  : hasFloatingTopControls
                    ? "max(54px, calc(var(--app-safe-top) + 52px))"
                    : "max(20px, calc(var(--app-safe-top) + 20px))",
              paddingBottom: isMatchChatRoute
                ? "0px"
                : isLeagueNavigationRoute
                  ? "env(safe-area-inset-bottom, 0px)"
                  : shouldShowBottomNav || shouldShowPersonalMatchesNav ? "96px" : "32px",
            } as CSSProperties
          }
        >
          {scheduledSeasonHomeOnly && !isScheduledSeasonUtilityRoute ? (
            <div
              data-scheduled-season-home-lock
              aria-live="polite"
              className="rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-sm"
            >
              <p className="type-panel-title font-black text-neutral-950">{tx("Temporada programada")}</p>
              <p className="mt-1 text-sm font-semibold text-neutral-600">
                {tx("Esta sección estará disponible cuando comience la temporada. Volviendo a Inicio…")}{" "}</p>
            </div>
          ) : (
            <>
              {pathname === "/" ? <PendingAccessIntentNotice /> : null}
              {children}
            </>
          )}
        </main>

        {shouldShowSettingsSearch ? (
          <GlobalSettingsSearch
            locale={locale}
            entries={settingsSearchEntries}
            hasBottomNav={shouldShowBottomNav}
          />
        ) : null}

        {shouldShowLeagueSearch ? <GlobalLeagueSearch /> : null}

        <ActionFeedbackCenter hasBottomNav={shouldShowBottomNav || shouldShowPersonalMatchesNav} />

        {shouldShowBottomNav ? <BottomNav homeOnlyLocked={scheduledSeasonHomeOnly} /> : null}
        {shouldShowPersonalMatchesNav ? <PersonalMatchesNav /> : null}
      </div>
    </div>
  )
}
