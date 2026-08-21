"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useI18n } from "@/i18n/I18nProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import {
  ensurePushSubscriptionForLeague,
  getPushSupportStatus,
  isPushAutoRegistrationDisabled,
} from "@/lib/pushClient"

const reminderSnoozeStorageKey = "smash-lob:push-permission-reminder-until"
const reminderSnoozeMs = 14 * 24 * 60 * 60 * 1000

function isSnoozed() {
  const value = Number(window.localStorage.getItem(reminderSnoozeStorageKey) ?? "0")
  return Number.isFinite(value) && value > Date.now()
}

export function PushPermissionReminder() {
  const pathname = usePathname()
  const { tx } = useI18n()
  const router = useRouter()
  const { activeLeagueId } = useActiveLeague()
  const { canAccessLeague, getMembershipForLeague, isLeagueSpectator } = useLeagueAccess()
  const membership = getMembershipForLeague(activeLeagueId)
  const playerId = membership?.playerId ?? null
  const [visible, setVisible] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | null>(null)
  const [activating, setActivating] = useState(false)
  const eligible = useMemo(
    () => canAccessLeague(activeLeagueId) && !isLeagueSpectator(activeLeagueId),
    [activeLeagueId, canAccessLeague, isLeagueSpectator],
  )

  useEffect(() => {
    if (pathname !== "/" || !eligible) return
    if (getPushSupportStatus() === "unsupported" || getPushSupportStatus() === "missing_public_key") return
    if (isPushAutoRegistrationDisabled() || isSnoozed()) return
    if (Notification.permission === "granted") return

    const timer = window.setTimeout(() => {
      const currentPermission = Notification.permission
      setPermission(currentPermission)
      if (currentPermission !== "granted") setVisible(true)
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [eligible, pathname])

  if (!visible || permission === "granted") return null

  function snooze() {
    window.localStorage.setItem(
      reminderSnoozeStorageKey,
      String(Date.now() + reminderSnoozeMs),
    )
    setVisible(false)
  }

  async function activate() {
    if (permission === "denied") {
      snooze()
      router.push("/settings/notifications#device")
      return
    }

    setActivating(true)
    const result = await ensurePushSubscriptionForLeague({
      leagueId: activeLeagueId,
      playerId,
      requestPermissionIfNeeded: true,
    })
    setActivating(false)
    setPermission(Notification.permission)
    if (result.ok) {
      setVisible(false)
      window.localStorage.removeItem(reminderSnoozeStorageKey)
      return
    }
    if (Notification.permission === "denied") {
      setPermission("denied")
    }
  }

  return (
    <aside className="fixed inset-x-3 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] z-[70] mx-auto max-w-md rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.2)]">
      <p className="text-sm font-black text-neutral-950">{tx("No te pierdas las novedades")}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-600">
        {permission === "denied"
          ? tx("Las notificaciones están bloqueadas en este navegador. Puedes revisar el permiso desde Ajustes.")
          : tx("Activa las notificaciones para recibir avisos de jornadas, temporada, chats y amistosos aunque no tengas la app abierta.")}
      </p>
      <div className="mt-3 flex items-center justify-end gap-2">
        <button type="button" onClick={snooze} className="rounded-xl px-3 py-2 text-center text-xs font-black text-neutral-500">
          {tx("Ahora no")}
        </button>
        <button
          type="button"
          onClick={() => void activate()}
          disabled={activating}
          className="inline-flex items-center justify-center rounded-xl bg-neutral-950 px-3 py-2 text-center text-xs font-black text-white disabled:opacity-50"
        >
          {permission === "denied" ? tx("Revisar permisos") : activating ? tx("Activando…") : tx("Activar notificaciones")}
        </button>
      </div>
    </aside>
  )
}
