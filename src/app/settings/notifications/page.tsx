"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { SettingsSectionIcon, type SettingsSectionIconName } from "@/components/settings/SettingsSectionIcon"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { showActionFeedback } from "@/lib/actionFeedback"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  defaultNotificationPreferences,
  isNotificationGroupEnabled,
  legacyNotificationGroupIds,
  normalizeNotificationPreferences,
  notificationPreferenceDefinitions,
  notificationPreferenceGroupDefinitions,
  setNotificationGroupEnabled,
  type NotificationGroupId,
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

type NotificationGroupView = {
  id: NotificationGroupId
  title: string
  description: string
  icon: SettingsSectionIconName
}

const notificationGroupViews: NotificationGroupView[] = [
  {
    id: "before-play",
    title: "Antes de jugar",
    description: "Recordatorio del próximo partido, bolas que te tocan llevar y sorteo del saque.",
    icon: "matches",
  },
  {
    id: "match-changes",
    title: "Cambios en tus partidos",
    description: "Fecha, hora, pista, reservas e incidencias de tus partidos.",
    icon: "availability",
  },
  {
    id: "results",
    title: "Resultados y MVP",
    description: "Resultados, confirmaciones pendientes, votación y premios MVP.",
    icon: "competition",
  },
  {
    id: "chat",
    title: "Mensajes del chat",
    description: "Cuando alguien escribe en el chat de tus partidos o de tu liga. Las menciones @ siempre llegan.",
    icon: "activity",
  },
  {
    id: "league-updates",
    title: "Actualizaciones de liga",
    description: "Jornadas, temporadas, altas y bajas de jugadores, comunicados y cambios de cuentas o permisos.",
    icon: "leagues",
  },
  {
    id: "payments",
    title: "Pagos",
    description: "Pagos de pista recibidos y recordatorios de pagos pendientes.",
    icon: "payments",
  },
]

const notificationGroupKeys = Object.fromEntries(
  notificationPreferenceGroupDefinitions.map((group) => [group.id, group.keys]),
) as unknown as Record<NotificationGroupId, readonly NotificationPreferenceKey[]>

function getEnabledGroupCount(preferences: NotificationPreferences) {
  return notificationPreferenceGroupDefinitions.filter((group) => isNotificationGroupEnabled(preferences, group.keys)).length
}

export default function NotificationSettingsPage() {
  const { t, tx } = useI18n()
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
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    const targetId = hash === "device" ? hash : (legacyNotificationGroupIds[hash] ?? hash)
    if (!targetId) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "center" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const enabledCount = useMemo(() => getEnabledGroupCount(preferences), [preferences])
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
      showActionFeedback({
        tone: "success",
        message: t.notifications.preferencesSaved,
      })
    } catch {
      setError(t.notifications.preferencesSaveError)
      showActionFeedback({
        tone: "error",
        message: t.notifications.preferencesSaveError,
        actionLabel: t.actionFeedback.retry,
        onAction: () => void savePreferences(nextPreferences),
        durationMs: 0,
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleGroup(groupId: NotificationGroupId) {
    const keys = notificationGroupKeys[groupId]
    const nextPreferences = setNotificationGroupEnabled(preferences, keys, !isNotificationGroupEnabled(preferences, keys))

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

    try {
      const result = await requestPushSubscription()

      if (!result.ok) {
        const supportMessage = getSupportMessage(result.reason)
        setSupportStatus(result.reason)
        setError(supportMessage)
        showActionFeedback({ tone: "error", message: supportMessage })
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
      showActionFeedback({ tone: "success", message: t.notifications.deviceEnabled })
    } catch {
      setError(t.notifications.deviceEnableError)
      showActionFeedback({
        tone: "error",
        message: t.notifications.deviceEnableError,
        actionLabel: t.actionFeedback.retry,
        onAction: () => void enablePushOnThisDevice(),
        durationMs: 0,
      })
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
      showActionFeedback({ tone: "success", message: t.notifications.deviceDisabled })
    } catch {
      setError(t.notifications.deviceDisableError)
      showActionFeedback({
        tone: "error",
        message: t.notifications.deviceDisableError,
        actionLabel: t.actionFeedback.retry,
        onAction: () => void disablePushOnThisDevice(),
        durationMs: 0,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label={t.common.back} />

        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">
          {t.notifications.title}
        </h1>

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
            className={`shrink-0 rounded-full px-2 py-0.5 type-caption font-black uppercase tracking-wide ${
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
            className="inline-flex rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
          >
            {t.notifications.enablePush}
          </button>
          <button
            type="button"
            onClick={disablePushOnThisDevice}
            disabled={!hasSubscription || isSaving}
            className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-300 items-center justify-center text-center"
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
              {t.notifications.enabledCount.replace("{enabled}", String(enabledCount)).replace("{total}", String(notificationPreferenceGroupDefinitions.length))}
            </p>
            <p className="mt-1 type-caption font-semibold leading-4 text-neutral-400">
              {t.notifications.allTypesConfigurable}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={disableAll}
              disabled={isLoading || isSaving}
              className="inline-flex rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 type-caption font-black text-neutral-700 disabled:text-neutral-300 items-center justify-center text-center"
            >
              {t.notifications.disableAll}
            </button>
            <button
              type="button"
              onClick={enableAll}
              disabled={isLoading || isSaving}
              className="inline-flex rounded-xl bg-neutral-950 px-2.5 py-1.5 type-caption font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
            >
              {t.notifications.enableAll}
            </button>
          </div>
        </div>

        <div className="mt-2 divide-y divide-neutral-100">
          {notificationGroupViews.map((group) => {
            const isEnabled = isNotificationGroupEnabled(preferences, notificationGroupKeys[group.id])

            return (
              <section
                key={group.id}
                id={group.id}
                data-notification-group={group.id}
                className="settings-search-target flex items-start gap-3 py-3"
              >
                <SettingsSectionIcon name={group.icon} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-neutral-950">{tx(group.title)}</p>
                  <p className="mt-0.5 text-xs font-semibold leading-4 text-neutral-500">{tx(group.description)}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label={tx(group.title)}
                  onClick={() => toggleGroup(group.id)}
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
              </section>
            )
          })}
        </div>
      </AppCard>

      <p data-required-note className="px-1 text-xs font-semibold leading-4 text-neutral-500">{t.notifications.requiredNote}</p>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-center text-xs font-semibold text-red-700">
          {tx(error)}
        </p>
      ) : null}
    </div>
  )
}
