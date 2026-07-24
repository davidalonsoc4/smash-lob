"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  defaultNotificationPreferences,
  normalizeNotificationPreferences,
  notificationPreferenceDefinitions,
  type NotificationPreferenceKey,
  type NotificationPreferences,
} from "@/lib/notificationSettings"
import {
  ensurePushSubscriptionForLeague,
  getExistingPushSubscription,
  getPushSupportStatus,
  requestPushSubscription,
  setPushAutoRegistrationDisabled,
  unsubscribeFromPush,
  type PushSupportStatus,
} from "@/lib/pushClient"

type LoadPreferencesResponse = {
  preferences?: unknown
  isConfigured?: boolean
}

type NotificationGroupId = "matches" | "competition" | "league" | "payments"

type NotificationPreferenceGroup = {
  id: NotificationGroupId
  title: string
  description: string
  keys: NotificationPreferenceKey[]
}

const notificationPreferenceGroups: NotificationPreferenceGroup[] = [
  {
    id: "matches",
    title: "Partidos",
    description: "Programación, incidencias y recordatorios del próximo partido.",
    keys: ["match_schedule", "match_incidents", "match_upcoming"],
  },
  {
    id: "competition",
    title: "Resultados y competición",
    description: "Resultados, confirmaciones, MVP, jornadas y temporadas.",
    keys: [
      "match_results",
      "result_confirmations",
      "mvp_reminders",
      "mvp_awards",
      "round_events",
      "season_lifecycle",
    ],
  },
  {
    id: "league",
    title: "Liga y jugadores",
    description: "Plantilla, comunicados y cambios en cuentas o permisos.",
    keys: ["season_roster", "announcements", "player_account"],
  },
  {
    id: "payments",
    title: "Reservas y pagos",
    description: "Cambios de reserva, pagos recibidos y recordatorios.",
    keys: ["booking_updates", "booking_payments", "payment_reminders"],
  },
]

function getEnabledCount(preferences: NotificationPreferences) {
  return Object.values(preferences).filter(Boolean).length
}

export default function NotificationSettingsPage() {
  const { t } = useI18n()
  const { activeLeague } = useCurrentLeagueData()
  const { currentUserId } = useCurrentUser()
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    defaultNotificationPreferences
  )
  const [supportStatus, setSupportStatus] = useState<PushSupportStatus>("unsupported")
  const [hasSubscription, setHasSubscription] = useState(false)
  const [isConfigured, setIsConfigured] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<NotificationGroupId, boolean>>({
    matches: false,
    competition: false,
    league: false,
    payments: false,
  })

  useEffect(() => {
    const groupId = window.location.hash.slice(1) as NotificationGroupId | "device"

    if (groupId === "device") {
      window.requestAnimationFrame(() => {
        document.getElementById("device")?.scrollIntoView({ block: "center" })
      })
      return
    }

    const targetGroup = notificationPreferenceGroups.find(
      (group) => group.id === groupId,
    )

    if (targetGroup) {
      setExpandedGroups((current) => ({
        ...current,
        [targetGroup.id]: true,
      }))
      window.requestAnimationFrame(() => {
        document
          .getElementById(targetGroup.id)
          ?.scrollIntoView({ block: "center" })
      })
    }
  }, [])

  const enabledCount = useMemo(() => getEnabledCount(preferences), [preferences])
  const canRequestPush = supportStatus === "supported"

  function getSupportMessage(status: PushSupportStatus) {
    if (status === "unsupported") return t.notifications.supportUnsupported
    if (status === "missing_public_key") return t.notifications.supportMissingPublicKey
    if (status === "permission_denied") return t.notifications.supportPermissionDenied
    return t.notifications.supportReady
  }

  useEffect(() => {
    let isMounted = true

    async function hydrate() {
      setIsLoading(true)
      setError(null)
      setMessage(null)

      const nextSupportStatus = getPushSupportStatus()
      setSupportStatus(nextSupportStatus)

      try {
        if (nextSupportStatus === "supported") {
          const autoSyncResult = await ensurePushSubscriptionForLeague({
            leagueId: activeLeague.id,
            playerId: currentUserId,
          })
          if (isMounted) {
            setHasSubscription(autoSyncResult.ok)
          }
        }
      } catch {
        if (isMounted) {
          setHasSubscription(false)
        }
      }

      try {
        const response = await fetch(
          `/api/notifications/preferences?leagueId=${encodeURIComponent(activeLeague.id)}`
        )

        if (!response.ok) {
          throw new Error("load-failed")
        }

        const data = (await response.json()) as LoadPreferencesResponse

        if (!isMounted) {
          return
        }

        setPreferences(normalizeNotificationPreferences(data.preferences))
        setIsConfigured(data.isConfigured !== false)
      } catch {
        if (isMounted) {
          setPreferences(defaultNotificationPreferences)
          setIsConfigured(false)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    hydrate()

    return () => {
      isMounted = false
    }
  }, [activeLeague.id, currentUserId])

  async function savePreferences(nextPreferences: NotificationPreferences) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueId: activeLeague.id,
          preferences: nextPreferences,
        }),
      })

      if (!response.ok) {
        throw new Error("save-failed")
      }

      const data = (await response.json()) as LoadPreferencesResponse
      setPreferences(normalizeNotificationPreferences(data.preferences))
      setIsConfigured(data.isConfigured !== false)
      setMessage(t.notifications.preferencesSaved)
    } catch {
      setError(t.notifications.preferencesSaveError)
    } finally {
      setIsSaving(false)
    }
  }

  async function togglePreference(key: keyof NotificationPreferences) {
    const nextPreferences = {
      ...preferences,
      [key]: !preferences[key],
    }

    setPreferences(nextPreferences)
    await savePreferences(nextPreferences)
  }

  async function enableAll() {
    setPreferences(defaultNotificationPreferences)
    await savePreferences(defaultNotificationPreferences)
  }

  async function disableAll() {
    const disabledPreferences = notificationPreferenceDefinitions.reduce(
      (nextPreferences, definition) => {
        nextPreferences[definition.key] = false
        return nextPreferences
      },
      {} as NotificationPreferences
    )

    setPreferences(disabledPreferences)
    await savePreferences(disabledPreferences)
  }

  async function enablePushOnThisDevice() {
    if (!canRequestPush || isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const result = await requestPushSubscription()

      if (!result.ok) {
        setSupportStatus(result.reason)
        setError(getSupportMessage(result.reason))
        return
      }

      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leagueId: activeLeague.id,
          playerId: currentUserId,
          subscription: result.subscription.toJSON(),
        }),
      })

      if (!response.ok) {
        throw new Error("subscribe-failed")
      }

      setPushAutoRegistrationDisabled(false)
      setHasSubscription(true)
      setMessage(t.notifications.deviceEnabled)
    } catch {
      setError(t.notifications.deviceEnableError)
    } finally {
      setIsSaving(false)
    }
  }

  async function disablePushOnThisDevice() {
    if (isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)
    setPushAutoRegistrationDisabled(true)

    try {
      const existingSubscription = await getExistingPushSubscription()
      const endpoint = existingSubscription?.endpoint ?? ""

      if (existingSubscription) {
        await unsubscribeFromPush()
      }

      const response = await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leagueId: activeLeague.id, endpoint }),
      })

      if (!response.ok) {
        throw new Error("unsubscribe-failed")
      }

      setHasSubscription(false)
      setMessage(t.notifications.deviceDisabled)
    } catch {
      setError(t.notifications.deviceDisableError)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>{activeLeague.name}</span>
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          {t.notifications.title}
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          {t.notifications.description}
        </p>
      </header>

      <div id="device" className="settings-search-target">
      <AppCard className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              {t.notifications.deviceTitle}
            </p>
            <p className="mt-1 text-xs font-semibold leading-4 text-neutral-500">
              {getSupportMessage(supportStatus)}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
              hasSubscription
                ? "bg-emerald-100 text-emerald-800"
                : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {hasSubscription ? t.notifications.active : t.notifications.inactive}
          </span>
        </div>

        {!isConfigured ? (
          <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold leading-4 text-orange-900">
            {t.notifications.missingConfiguration}
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={enablePushOnThisDevice}
            disabled={!canRequestPush || hasSubscription || isSaving}
            className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
          >
            {t.notifications.enablePush}
          </button>
          <button
            type="button"
            onClick={disablePushOnThisDevice}
            disabled={!hasSubscription || isSaving}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-300"
          >
            {t.notifications.disablePush}
          </button>
        </div>
      </AppCard>
      </div>

      <AppCard className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              {t.notifications.typesTitle}
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {t.notifications.enabledCount.replace("{enabled}", String(enabledCount)).replace("{total}", String(notificationPreferenceDefinitions.length))}
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-400">
              {t.notifications.allTypesConfigurable}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={disableAll}
              disabled={isLoading || isSaving}
              className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-neutral-700 disabled:text-neutral-300"
            >
              {t.notifications.disableAll}
            </button>
            <button
              type="button"
              onClick={enableAll}
              disabled={isLoading || isSaving}
              className="rounded-xl bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
            >
              {t.notifications.enableAll}
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {notificationPreferenceGroups.map((group) => {
            const definitions = notificationPreferenceDefinitions.filter((definition) =>
              group.keys.includes(definition.key),
            )
            const groupEnabledCount = definitions.filter(
              (definition) => preferences[definition.key],
            ).length
            const isExpanded = expandedGroups[group.id]

            return (
              <section
                key={group.id}
                id={group.id}
                className="settings-search-target overflow-hidden rounded-2xl border border-neutral-200 bg-white"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                  aria-expanded={isExpanded}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-neutral-950">
                        {group.title}
                      </p>
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-neutral-500">
                        {groupEnabledCount}/{definitions.length}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs font-semibold leading-4 text-neutral-500">
                      {group.description}
                    </p>
                  </div>
                  <ClickableChevron
                    className={`shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  />
                </button>

                {isExpanded ? (
                  <div className="divide-y divide-neutral-100 border-t border-neutral-100">
                    {definitions.map((definition) => {
                      const isEnabled = preferences[definition.key]

                      return (
                        <div
                          key={definition.key}
                          className="flex items-start justify-between gap-3 px-3 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-black text-neutral-950">
                              {t.notifications.preferences[definition.key].title}
                            </p>
                            <p className="mt-0.5 text-xs font-semibold leading-4 text-neutral-500">
                              {t.notifications.preferences[definition.key].description}
                            </p>
                          </div>

                          <button
                            type="button"
                            role="switch"
                            aria-checked={isEnabled}
                            onClick={() => togglePreference(definition.key)}
                            disabled={isLoading || isSaving}
                            className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${
                              isEnabled ? "bg-neutral-950" : "bg-neutral-300"
                            } disabled:opacity-60`}
                          >
                            <span
                              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                                isEnabled ? "left-6" : "left-1"
                              }`}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </section>
            )
          })}
        </div>
      </AppCard>

      {message ? (
        <p className="text-center text-xs font-semibold text-neutral-600">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  )
}
