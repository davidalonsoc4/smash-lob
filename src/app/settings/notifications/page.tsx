"use client"

import { useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import {
  defaultNotificationPreferences,
  normalizeNotificationPreferences,
  notificationPreferenceDefinitions,
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

function getSupportMessage(status: PushSupportStatus) {
  if (status === "unsupported") {
    return "Este navegador no permite notificaciones push web. En iPhone necesitas instalar la PWA en la pantalla de inicio."
  }

  if (status === "missing_public_key") {
    return "Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY para activar el permiso push. Puedes guardar preferencias igualmente."
  }

  if (status === "permission_denied") {
    return "Las notificaciones están bloqueadas en el navegador. Tendrás que permitirlas desde los ajustes del sistema o del navegador."
  }

  return "Activa este dispositivo para recibir avisos aunque no tengas la app abierta."
}

function formatEnabledCount(preferences: NotificationPreferences) {
  const enabled = Object.values(preferences).filter(Boolean).length
  return `${enabled}/${notificationPreferenceDefinitions.length}`
}

export default function NotificationSettingsPage() {
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

  const enabledCount = useMemo(
    () => formatEnabledCount(preferences),
    [preferences]
  )
  const canRequestPush = supportStatus === "supported"

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
      setMessage("Preferencias guardadas.")
    } catch {
      setError(
        "No se han podido guardar las preferencias. Revisa las tablas de notificaciones y SUPABASE_SERVICE_ROLE_KEY."
      )
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
      setMessage("Notificaciones activadas en este dispositivo.")
    } catch {
      setError(
        "No se ha podido guardar este dispositivo. Revisa VAPID, SUPABASE_SERVICE_ROLE_KEY y las tablas de notificaciones."
      )
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

      await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ endpoint }),
      })

      setHasSubscription(false)
      setMessage("Notificaciones desactivadas en este dispositivo.")
    } catch {
      setError("No se ha podido desactivar este dispositivo.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="compact-page space-y-3">
      <header className="pt-1">
        <BackButton fallbackHref="/settings" label="Volver" />

        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-neutral-500">
          <span>{activeLeague.name}</span>
        </p>

        <h1 className="mt-0.5 text-xl font-black tracking-tight">
          Notificaciones
        </h1>

        <p className="mt-0.5 text-xs font-semibold text-neutral-500">
          Elige qué avisos quieres recibir. Todas las opciones vienen activadas por defecto.
        </p>
      </header>

      <AppCard className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              Push en este dispositivo
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
            {hasSubscription ? "Activo" : "Inactivo"}
          </span>
        </div>

        {!isConfigured ? (
          <div className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs font-semibold leading-4 text-orange-900">
            Falta configuración de servidor o las tablas SQL. La pantalla queda preparada, pero el envío real necesita completar la configuración.
          </div>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={enablePushOnThisDevice}
            disabled={!canRequestPush || hasSubscription || isSaving}
            className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
          >
            Activar push
          </button>
          <button
            type="button"
            onClick={disablePushOnThisDevice}
            disabled={!hasSubscription || isSaving}
            className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-black text-neutral-800 disabled:text-neutral-300"
          >
            Desactivar
          </button>
        </div>
      </AppCard>

      <AppCard className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-black text-neutral-950">
              Tipos de aviso
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              Activados: {enabledCount}
            </p>
            <p className="mt-1 text-[11px] font-semibold leading-4 text-neutral-400">
              Los recordatorios manuales de pago se reciben siempre.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={disableAll}
              disabled={isLoading || isSaving}
              className="rounded-xl border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] font-black text-neutral-700 disabled:text-neutral-300"
            >
              Desactivar todo
            </button>
            <button
              type="button"
              onClick={enableAll}
              disabled={isLoading || isSaving}
              className="rounded-xl bg-neutral-950 px-2.5 py-1.5 text-[11px] font-black text-white disabled:bg-neutral-300"
            >
              Activar todo
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          {notificationPreferenceDefinitions.map((definition) => {
            const isEnabled = preferences[definition.key]

            return (
              <div
                key={definition.key}
                className="flex items-start justify-between gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-black text-neutral-950">
                    {definition.title}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold leading-4 text-neutral-500">
                    {definition.description}
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
