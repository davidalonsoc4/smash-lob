"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ActivityAvatar } from "@/components/activity/ActivityAvatar"
import { LeagueSeasonEyebrow } from "@/components/layout/LeagueSeasonEyebrow"
import { AppCard } from "@/components/ui/AppCard"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity"
import {
  getLeagueLocationScheduleText,
  getScheduleLocationFallbackText,
  normalizeLeagueLocation,
} from "@/lib/leagueLocations"
import {
  activityEventCategories,
  configurableNotificationEventTypes,
  fetchLeagueActivitySettings,
  getActivityDeliveryMode,
  getActivityEventDefinition,
  mergeWithDefaultActivitySettings,
  updateLeagueActivitySettings,
  type LeagueActivitySettings,
} from "@/lib/activitySettings"

type ActivityScope = "all" | "mine" | "admin"

function formatActivityDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getActorLabel(event: ActivityEvent, fallback: string) {
  return event.actorDisplayName || event.actorEmail || fallback
}

function readLastActivityError() {
  if (typeof window === "undefined") {
    return null
  }

  const storedError = window.localStorage.getItem("smash-lob-last-supabase-error")

  if (!storedError) {
    return null
  }

  try {
    const parsedError = JSON.parse(storedError) as { action?: string; message?: string }

    if (parsedError.action === "record-activity") {
      return parsedError.message ?? storedError
    }
  } catch {
    return storedError
  }

  return null
}

function toStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((item): item is string => typeof item === "string")
}

function toMatchSets(value: unknown) {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((set) => {
      if (typeof set !== "object" || set === null) {
        return null
      }

      const item = set as Record<string, unknown>
      const a = Number(item.a)
      const b = Number(item.b)

      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return null
      }

      return { a, b }
    })
    .filter((set): set is { a: number; b: number } => Boolean(set))
}

function getResultSummaryFromMetadata({
  pointsA,
  pointsB,
  sets,
  setsLabel,
  gamesLabel,
  noGamesLabel,
}: {
  pointsA: unknown
  pointsB: unknown
  sets: unknown
  setsLabel: string
  gamesLabel: string
  noGamesLabel: string
}) {
  const parsedPointsA = Number(pointsA)
  const parsedPointsB = Number(pointsB)
  const parsedSets = toMatchSets(sets)

  if (!Number.isFinite(parsedPointsA) || !Number.isFinite(parsedPointsB)) {
    return null
  }

  const gamesSummary =
    parsedSets.length > 0
      ? parsedSets.map((set) => `${set.a}-${set.b}`).join(", ")
      : noGamesLabel

  return `${setsLabel} ${parsedPointsA}-${parsedPointsB} · ${gamesLabel}: ${gamesSummary}`
}

function formatActivityScheduleDate(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getActivityLocationText(value: unknown) {
  if (typeof value === "string") {
    const fallbackText = getScheduleLocationFallbackText(value)

    return fallbackText && fallbackText !== "Ubicación en Maps" ? fallbackText : fallbackText
  }

  const normalizedLocation = normalizeLeagueLocation(value)

  if (!normalizedLocation) {
    return null
  }

  return getLeagueLocationScheduleText(normalizedLocation)
}

function getActivityScheduleDescription({
  event,
  round,
}: {
  event: ActivityEvent
  round: string | null
}) {
  const metadata = event.metadata
  const dateText =
    formatActivityScheduleDate(metadata.scheduledAt) ??
    formatActivityScheduleDate(metadata.nextScheduledAt)
  const locationText = getActivityLocationText(
    metadata.location ?? metadata.nextLocation
  )
  const parts = [round, dateText, locationText].filter(
    (item): item is string => Boolean(item?.trim())
  )

  return parts.length > 0 ? parts.join(" · ") : null
}

function getActivityDescription({
  event,
  roundLabel,
  setsLabel,
  gamesLabel,
  noGamesLabel,
}: {
  event: ActivityEvent
  roundLabel: string
  setsLabel: string
  gamesLabel: string
  noGamesLabel: string
}) {
  const metadata = event.metadata
  const round =
    typeof metadata.round === "number" || typeof metadata.round === "string"
      ? `${roundLabel} ${metadata.round}`
      : null

  if (event.type === "match_result_updated") {
    const previousResult = getResultSummaryFromMetadata({
      pointsA: metadata.previousPointsA,
      pointsB: metadata.previousPointsB,
      sets: metadata.previousSets,
      setsLabel,
      gamesLabel,
      noGamesLabel,
    })
    const currentResult = getResultSummaryFromMetadata({
      pointsA: metadata.pointsA,
      pointsB: metadata.pointsB,
      sets: metadata.sets,
      setsLabel,
      gamesLabel,
      noGamesLabel,
    })

    if (previousResult && currentResult) {
      return [round, `${previousResult} → ${currentResult}`]
        .filter(Boolean)
        .join(" · ")
    }
  }

  if (event.type === "match_result_saved") {
    const currentResult = getResultSummaryFromMetadata({
      pointsA: metadata.pointsA,
      pointsB: metadata.pointsB,
      sets: metadata.sets,
      setsLabel,
      gamesLabel,
      noGamesLabel,
    })

    if (currentResult) {
      return [round, currentResult].filter(Boolean).join(" · ")
    }
  }

  if (
    event.type === "match_scheduled" ||
    event.type === "match_schedule_updated" ||
    event.type === "round_in_play"
  ) {
    const scheduleDescription = getActivityScheduleDescription({ event, round })

    if (scheduleDescription) {
      return scheduleDescription
    }
  }

  return event.description
}

function isPersonalEvent({
  event,
  currentUserId,
  currentUserMatchIds,
  activitySettings,
}: {
  event: ActivityEvent
  currentUserId: string
  currentUserMatchIds: Set<string>
  activitySettings: LeagueActivitySettings
}) {
  const deliveryMode = getActivityDeliveryMode(activitySettings, event.type)

  if (deliveryMode === "activity_only") {
    return false
  }

  if (getActivityEventDefinition(event.type).personalScope === "league_wide") {
    return true
  }

  if (event.matchId && currentUserMatchIds.has(event.matchId)) {
    return true
  }

  const metadata = event.metadata
  const directPlayerIds = [
    metadata.playerId,
    metadata.targetPlayerId,
    metadata.fromPlayerId,
    metadata.toPlayerId,
  ].filter((value): value is string => typeof value === "string")
  const participantIds = toStringArray(metadata.participantIds)

  return [...directPlayerIds, ...participantIds].includes(currentUserId)
}


const leagueLogoActorEmails = new Set([
  "system@smash-lob.local",
  "smashlobadmi@gmail.com",
  "smashlobadmin@gmail.com",
])

function normalizeActorEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ""
}

function shouldUseLeagueLogoForActor(event: ActivityEvent) {
  const actorEmail = normalizeActorEmail(event.actorEmail)
  const actorName = event.actorDisplayName?.trim().toLowerCase() ?? ""

  return (
    leagueLogoActorEmails.has(actorEmail) ||
    actorName === "smash & lob" ||
    actorName === "admin"
  )
}

function stringifyMetadata(metadata: Record<string, unknown>) {
  try {
    return JSON.stringify(metadata, null, 2)
  } catch {
    return "{}"
  }
}

function ActivityEventCard({
  event,
  leagueLogoUrl,
  showMetadata = false,
}: {
  event: ActivityEvent
  leagueLogoUrl?: string | null
  showMetadata?: boolean
}) {
  const { t } = useI18n()
  const description = getActivityDescription({
    event,
    roundLabel: t.activity.round,
    setsLabel: t.activity.sets,
    gamesLabel: t.activity.games,
    noGamesLabel: t.activity.noGames,
  })
  const useLeagueLogo = Boolean(leagueLogoUrl && shouldUseLeagueLogoForActor(event))
  const avatarImageUrl = useLeagueLogo ? leagueLogoUrl : event.actorAvatarUrl

  return (
    <AppCard className="p-3">
      <div className="flex gap-2.5">
        <ActivityAvatar
          name={event.actorDisplayName}
          email={event.actorEmail}
          initials={event.actorAvatarInitials}
          imageUrl={avatarImageUrl}
          imageFit={useLeagueLogo ? "contain" : "cover"}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-black text-neutral-950">
                {event.title}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-neutral-500">
                {getActorLabel(event, t.activity.actorFallback)} · {t.activity.labels[event.type]}
              </p>
            </div>

            <p className="shrink-0 text-[11px] font-semibold text-neutral-400">
              {formatActivityDate(event.createdAt)}
            </p>
          </div>

          {description ? (
            <p className="mt-2 whitespace-pre-line text-xs leading-snug text-neutral-600">
              {description}
            </p>
          ) : null}

          {showMetadata ? (
            <div className="mt-2 space-y-2 rounded-2xl bg-neutral-100 p-2.5">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-500">
                {t.activity.adminMetadata}
              </p>
              <p className="break-all text-xs font-semibold text-neutral-500">
                {t.activity.adminEventType}: {event.type}
              </p>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words text-xs font-semibold text-neutral-600">
                {stringifyMetadata(event.metadata)}
              </pre>
            </div>
          ) : null}
        </div>
      </div>
    </AppCard>
  )
}

function ActivityPageContent() {
  const { t } = useI18n()
  const { currentUserId } = useCurrentUser()
  const { isLeagueAdmin } = useLeagueAccess()
  const { activeLeague, activeSeason, matches } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const searchParams = useSearchParams()
  const requestedScope = searchParams.get("scope")
  const initialScope: ActivityScope =
    requestedScope === "mine" || requestedScope === "all"
      ? requestedScope
      : requestedScope === "admin" && canAccessAdmin
        ? "admin"
        : "all"
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [scope, setScope] = useState<ActivityScope>(initialScope)
  const [activitySettings, setActivitySettings] = useState<LeagueActivitySettings>({})
  const [draftSettings, setDraftSettings] = useState<LeagueActivitySettings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSettingsLoading, setIsSettingsLoading] = useState(true)
  const [isSettingsSaving, setIsSettingsSaving] = useState(false)
  const [areSettingsExpanded, setAreSettingsExpanded] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [lastActivityError, setLastActivityError] = useState<string | null>(
    () => readLastActivityError()
  )

  useEffect(() => {
    let isMounted = true

    async function loadActivity() {
      setIsLoading(true)
      setError(null)

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 160,
          clampToViewerJoinDate: !canAccessAdmin,
        })

        if (!isMounted) {
          return
        }

        setEvents(activityEvents)
      } catch {
        if (!isMounted) {
          return
        }

        setError(t.activity.loadErrorDescription)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadActivity()

    return () => {
      isMounted = false
    }
  }, [
    activeLeague.id,
    canAccessAdmin,
    currentUserId,
    refreshKey,
    t.activity.loadErrorDescription,
  ])

  useEffect(() => {
    let isMounted = true

    async function loadSettings() {
      setIsSettingsLoading(true)
      setSettingsError(null)
      setSettingsMessage(null)

      try {
        const settings = await fetchLeagueActivitySettings(activeLeague.id)

        if (!isMounted) {
          return
        }

        setActivitySettings(settings)
        setDraftSettings(settings)
      } catch {
        if (!isMounted) {
          return
        }

        setActivitySettings({})
        setDraftSettings({})
        setSettingsError(t.activity.settingsLoadError)
      } finally {
        if (isMounted) {
          setIsSettingsLoading(false)
        }
      }
    }

    loadSettings()

    return () => {
      isMounted = false
    }
  }, [activeLeague.id, t.activity.settingsLoadError])

  const currentUserMatchIds = useMemo(() => {
    return new Set(
      matches
        .filter(
          (match) =>
            match.teamA.includes(currentUserId) ||
            match.teamB.includes(currentUserId)
        )
        .map((match) => match.id)
    )
  }, [currentUserId, matches])

  const personalEvents = useMemo(
    () =>
      events.filter((event) =>
        isPersonalEvent({
          event,
          currentUserId,
          currentUserMatchIds,
          activitySettings,
        })
      ),
    [activitySettings, currentUserId, currentUserMatchIds, events]
  )

  const effectiveScope: ActivityScope = canAccessAdmin ? scope : scope === "admin" ? "all" : scope
  const visibleEvents = effectiveScope === "mine" ? personalEvents : events
  const hasEvents = visibleEvents.length > 0
  const normalizedDraftSettings = mergeWithDefaultActivitySettings(draftSettings)
  const notificationSettingsSummary = useMemo(() => {
    const enabled = configurableNotificationEventTypes.filter(
      (eventType) => normalizedDraftSettings[eventType] === "notify"
    ).length

    return {
      enabled,
      disabled: configurableNotificationEventTypes.length - enabled,
    }
  }, [normalizedDraftSettings])
  const activityEventGroups = useMemo(() => {
    return activityEventCategories.map((category) => ({
      category,
      eventTypes: configurableNotificationEventTypes.filter(
        (eventType) => getActivityEventDefinition(eventType).category === category
      ),
    })).filter((group) => group.eventTypes.length > 0)
  }, [])

  function setAllNotificationTypes(enabled: boolean) {
    setDraftSettings((currentSettings) => {
      const nextSettings = { ...currentSettings }
      configurableNotificationEventTypes.forEach((eventType) => {
        nextSettings[eventType] = enabled ? "notify" : "personal"
      })
      return nextSettings
    })
    setSettingsMessage(null)
  }

  async function saveActivitySettings() {
    if (!canAccessAdmin || isSettingsSaving) {
      return
    }

    setIsSettingsSaving(true)
    setSettingsError(null)
    setSettingsMessage(null)

    try {
      const savedSettings = await updateLeagueActivitySettings({
        leagueId: activeLeague.id,
        settings: normalizedDraftSettings,
      })

      setActivitySettings(savedSettings)
      setDraftSettings(savedSettings)
      setSettingsMessage(t.activity.settingsSaved)
    } catch {
      setSettingsError(t.activity.settingsSaveError)
    } finally {
      setIsSettingsSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <LeagueSeasonEyebrow
          leagueName={activeLeague.name}
          seasonName={activeSeason.name}
          seasonStatus={activeSeason.status}
        />

        <h1 className="mt-1.5 text-2xl font-black tracking-tight">
          {t.activity.title}
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          {t.activity.description}
        </p>
      </header>

      <div className={`grid gap-2 rounded-2xl bg-neutral-100 p-1 ${canAccessAdmin ? "grid-cols-3" : "grid-cols-2"}`}>
        <button
          type="button"
          onClick={() => setScope("all")}
          className={`rounded-xl px-3 py-2 text-sm font-black ${
            effectiveScope === "all" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
          }`}
        >
          {t.activity.general}
        </button>
        <button
          type="button"
          onClick={() => setScope("mine")}
          className={`rounded-xl px-3 py-2 text-sm font-black ${
            effectiveScope === "mine" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
          }`}
        >
          {t.activity.personal}
        </button>
        {canAccessAdmin ? (
          <button
            type="button"
            onClick={() => setScope("admin")}
            className={`rounded-xl px-3 py-2 text-sm font-black ${
              effectiveScope === "admin" ? "bg-white text-neutral-950 shadow-sm" : "text-neutral-500"
            }`}
          >
            {t.activity.admin}
          </button>
        ) : null}
      </div>

      {effectiveScope === "admin" && canAccessAdmin ? (
        <section className="space-y-4">
          <div id="notification-settings" className="settings-search-target"><AppCard className="p-0">
            <div className="p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-neutral-950">
                    {t.activity.notificationSettingsTitle}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-neutral-500">
                    {areSettingsExpanded
                      ? t.activity.notificationSettingsDescription
                      : t.activity.notificationSettingsCollapsedHint}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAreSettingsExpanded((current) => !current)}
                  aria-expanded={areSettingsExpanded}
                  className="shrink-0 rounded-2xl bg-neutral-950 px-3 py-2 text-xs font-black text-white"
                >
                  {areSettingsExpanded
                    ? t.activity.hideNotificationSettings
                    : t.activity.showNotificationSettings}
                </button>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-neutral-950 p-3 text-center text-white">
                  <p className="text-lg font-black">{notificationSettingsSummary.enabled}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-white/70">{t.activity.notificationEnabledCount}</p>
                </div>
                <div className="rounded-2xl bg-neutral-100 p-3 text-center">
                  <p className="text-lg font-black text-neutral-950">{notificationSettingsSummary.disabled}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-wide text-neutral-500">{t.activity.notificationDisabledCount}</p>
                </div>
              </div>

              {areSettingsExpanded ? (
                <p className="mt-3 text-xs font-semibold text-neutral-500">
                  {t.activity.notificationFutureHint}
                </p>
              ) : null}
            </div>

            {areSettingsExpanded ? (
              <div className="border-t border-neutral-100 p-3">
                {isSettingsLoading ? (
                  <p className="text-sm font-semibold text-neutral-500">
                    {t.activity.loading}
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-neutral-100 p-3">
                      <p className="text-sm font-black text-neutral-950">
                        {t.activity.pushPreparationTitle}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-neutral-500">
                        {t.activity.pushPreparationDescription}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm font-black text-amber-950">{t.activity.mandatoryPaymentRemindersTitle}</p>
                      <p className="mt-1 text-xs font-semibold text-amber-800">{t.activity.mandatoryPaymentRemindersDescription}</p>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-3">
                      <p className="text-xs font-semibold leading-4 text-neutral-500">{t.activity.notificationToggleDescription}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button type="button" onClick={() => setAllNotificationTypes(false)} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700">{t.notifications.disableAll}</button>
                        <button type="button" onClick={() => setAllNotificationTypes(true)} className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white">{t.notifications.enableAll}</button>
                      </div>
                    </div>

                    {activityEventGroups.map((group) => (
                      <section key={group.category} className="space-y-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                          {t.activity.categoryLabels[group.category]}
                        </p>

                        {group.eventTypes.map((eventType) => {
                          const definition = getActivityEventDefinition(eventType)
                          const isNotificationEnabled = normalizedDraftSettings[eventType] === "notify"

                          return (
                            <div key={eventType} className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 p-3">
                              <div className="min-w-0">
                                <p className="text-sm font-black text-neutral-950">{t.activity.notificationLabels[eventType]}</p>
                                <p className="mt-1 text-xs font-semibold text-neutral-500">{t.activity.personalScopeLabels[definition.personalScope]}</p>
                                <p className="mt-1 text-[11px] font-semibold text-neutral-400">{isNotificationEnabled ? t.activity.notificationEnabled : t.activity.notificationDisabled}</p>
                              </div>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isNotificationEnabled}
                                aria-label={t.activity.notificationLabels[eventType]}
                                onClick={() => {
                                  setDraftSettings((currentSettings) => ({ ...currentSettings, [eventType]: isNotificationEnabled ? "personal" : "notify" }))
                                  setSettingsMessage(null)
                                }}
                                className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${isNotificationEnabled ? "bg-neutral-950" : "bg-neutral-300"}`}
                              >
                                <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${isNotificationEnabled ? "left-6" : "left-1"}`} />
                              </button>
                            </div>
                          )
                        })}
                      </section>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveActivitySettings}
                  disabled={isSettingsLoading || isSettingsSaving}
                  className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
                >
                  {isSettingsSaving ? t.common.saving : t.activity.saveNotificationSettings}
                </button>
              </div>
            ) : null}

            {settingsMessage ? (
              <p className="border-t border-neutral-100 px-3 py-2.5 text-center text-sm font-semibold text-neutral-600">
                {settingsMessage}
              </p>
            ) : null}
            {settingsError ? (
              <p className="border-t border-neutral-100 px-3 py-2.5 text-center text-sm font-semibold text-red-600">
                {settingsError}
              </p>
            ) : null}
          </AppCard></div>

          <section>
            <SectionHeader
              title={t.activity.adminTitle}
              action={
                <button
                  type="button"
                  onClick={() => {
                    setLastActivityError(readLastActivityError())
                    setRefreshKey((current) => current + 1)
                  }}
                  className="text-sm font-semibold text-neutral-600"
                >
                  {t.activity.refresh}
                </button>
              }
            />
            <p className="mb-3 text-sm text-neutral-500">
              {t.activity.adminDescription}
            </p>

            {isLoading ? (
              <AppCard>
                <p className="text-sm font-semibold text-neutral-500">
                  {t.activity.loading}
                </p>
              </AppCard>
            ) : null}

            {error ? (
              <AppCard>
                <p className="font-bold text-red-700">{t.activity.loadErrorTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">{error}</p>
              </AppCard>
            ) : null}

            {!isLoading && !error && events.length === 0 ? (
              <AppCard>
                <p className="font-bold">{t.activity.emptyGeneralTitle}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {t.activity.emptyGeneralDescription}
                </p>
              </AppCard>
            ) : null}

            {events.length > 0 ? (
              <div className="space-y-3">
                {events.map((event) => (
                  <ActivityEventCard
                    key={event.id}
                    event={event}
                    leagueLogoUrl={activeLeague.logoUrl}
                    showMetadata
                  />
                ))}
              </div>
            ) : null}
          </section>
        </section>
      ) : (
        <section>
          <SectionHeader
            title={effectiveScope === "mine" ? t.activity.personalTitle : t.activity.wallTitle}
            action={
              <button
                type="button"
                onClick={() => {
                  setLastActivityError(readLastActivityError())
                  setRefreshKey((current) => current + 1)
                }}
                className="text-sm font-semibold text-neutral-600"
              >
                {t.activity.refresh}
              </button>
            }
          />

          {isLoading ? (
            <AppCard>
              <p className="text-sm font-semibold text-neutral-500">
                {t.activity.loading}
              </p>
            </AppCard>
          ) : null}

          {error ? (
            <AppCard>
              <p className="font-bold text-red-700">{t.activity.loadErrorTitle}</p>
              <p className="mt-2 text-sm text-neutral-500">{error}</p>
            </AppCard>
          ) : null}

          {!isLoading && !error && !hasEvents ? (
            <AppCard>
              <p className="font-bold">
                {effectiveScope === "mine" ? t.activity.emptyPersonalTitle : t.activity.emptyGeneralTitle}
              </p>
              <p className="mt-2 text-sm text-neutral-500">
                {effectiveScope === "mine"
                  ? t.activity.emptyPersonalDescription
                  : t.activity.emptyGeneralDescription}
              </p>
            </AppCard>
          ) : null}

          {!isLoading && !error && !hasEvents && lastActivityError ? (
            <AppCard>
              <p className="font-bold text-orange-800">{t.activity.lastErrorTitle}</p>
              <p className="mt-2 break-words text-xs font-semibold text-neutral-500">
                {lastActivityError}
              </p>
            </AppCard>
          ) : null}

          {hasEvents ? (
            <div className="space-y-3">
              {visibleEvents.map((event) => (
                <ActivityEventCard
                  key={event.id}
                  event={event}
                  leagueLogoUrl={activeLeague.logoUrl}
                />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  )
}


export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="space-y-4" />}>
      <ActivityPageContent />
    </Suspense>
  )
}
