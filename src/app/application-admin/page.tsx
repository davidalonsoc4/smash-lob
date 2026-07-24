"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { ClickableChevron } from "@/components/ui/ClickableChevron"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { formatProfileName } from "@/lib/accountProfile"

type LeagueAccessRole = "creator" | "admin" | "player" | "spectator"

type UserLeagueAccess = {
  leagueId: string
  leagueName: string
  playerId: string | null
  role: LeagueAccessRole
  isOwner: boolean
}

type ApplicationUser = {
  id: string
  email: string
  displayName: string
  firstName: string
  lastName: string
  isSuperuser: boolean
  canCreateLeagues: boolean
  profileCompleted: boolean
  availabilityCompleted: boolean
  createdAt: string
  suspendedAt: string | null
  suspensionReason: string | null
  leagueCount: number
  spectatorLeagueCount: number
  adminLeagueCount: number
  ownedLeagueCount: number
  leagueNames: string[]
  ownedLeagueNames: string[]
  leagueAccesses: UserLeagueAccess[]
  pushSubscriptionCount: number
  enabledPushSubscriptionCount: number
  notificationPreferenceCount: number
}

type ApplicationSummary = {
  userCount: number
  activeUserCount: number
  suspendedUserCount: number
  leagueCount: number
  activeSeasonCount: number
  incompleteProfileCount: number
  incompleteAvailabilityCount: number
  activePushSubscriptionCount: number
}

type AuditItem = {
  id: string
  actorEmail: string
  targetEmail: string | null
  leagueId: string | null
  leagueName: string | null
  action: string
  metadata: Record<string, unknown>
  createdAt: string
}

type UsersPayload = {
  currentUserId: string
  summary: ApplicationSummary
  items: ApplicationUser[]
  auditItems: AuditItem[]
}

type UserAction =
  | "suspend"
  | "reactivate"
  | "reset_profile"
  | "reset_availability"
  | "revoke_push"
  | "reset_notifications"

const EMPTY_SUMMARY: ApplicationSummary = {
  userCount: 0,
  activeUserCount: 0,
  suspendedUserCount: 0,
  leagueCount: 0,
  activeSeasonCount: 0,
  incompleteProfileCount: 0,
  incompleteAvailabilityCount: 0,
  activePushSubscriptionCount: 0,
}

function getApiErrorMessage(error: string, leagues?: string[]) {
  if (error === "cannot_delete_self") return "No puedes eliminar tu propia cuenta."
  if (error === "cannot_suspend_self") return "No puedes suspender tu propia cuenta."
  if (error === "protected_superuser") {
    return "Esta acción está protegida para cuentas superusuarias."
  }
  if (error === "user_owns_leagues") {
    return `La cuenta es propietaria de ${leagues?.join(", ") || "una liga"}. Transfiere o elimina esas ligas antes.`
  }
  if (error === "new_owner_suspended") {
    return "La nueva persona propietaria tiene la cuenta suspendida."
  }
  if (error === "new_owner_membership_not_found") {
    return "La nueva persona propietaria debe pertenecer a la liga."
  }
  if (error === "owner_mismatch") {
    return "La propiedad de la liga ha cambiado. Actualiza la pantalla e inténtalo de nuevo."
  }
  if (error === "same_owner") return "Selecciona otra persona propietaria."
  return `No se ha podido completar la operación (${error}).`
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Fecha desconocida"
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function roleLabel(role: LeagueAccessRole) {
  if (role === "creator") return "Creador"
  if (role === "admin") return "Administrador"
  if (role === "spectator") return "Espectador"
  return "Jugador"
}

function metadataNumber(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function metadataString(metadata: Record<string, unknown>, key: string) {
  const value = metadata[key]
  return typeof value === "string" ? value : ""
}

function auditDescription(item: AuditItem) {
  const target = item.targetEmail ?? "una cuenta eliminada"

  if (item.action === "user_updated") {
    return `actualizó los datos de ${target}`
  }
  if (item.action === "user_suspended") {
    const reason = metadataString(item.metadata, "reason")
    return `suspendió la cuenta ${target}${reason ? ` · ${reason}` : ""}`
  }
  if (item.action === "user_reactivated") return `reactivó la cuenta ${target}`
  if (item.action === "profile_onboarding_reset") {
    return `reinició el perfil de ${target}`
  }
  if (item.action === "standard_availability_reset") {
    return `reinició la disponibilidad habitual de ${target}`
  }
  if (item.action === "push_devices_revoked") {
    return `revocó ${metadataNumber(item.metadata, "revokedCount")} dispositivo(s) de ${target}`
  }
  if (item.action === "notification_preferences_reset") {
    return `restableció las notificaciones de ${target}`
  }
  if (item.action === "league_ownership_transferred") {
    const previousOwner = metadataString(item.metadata, "previousOwnerEmail")
    return `transfirió ${item.leagueName ?? "una liga"} de ${previousOwner || "su propietario anterior"} a ${target}`
  }
  if (item.action === "user_deleted") return `eliminó la cuenta ${target}`
  return `realizó ${item.action} sobre ${target}`
}

async function fetchApplicationUsers() {
  const response = await fetch("/api/application-admin/users", {
    cache: "no-store",
  })
  const nextPayload = (await response.json()) as UsersPayload & { error?: string }

  if (!response.ok) {
    throw new Error(nextPayload.error ?? "application_users_lookup_failed")
  }

  return nextPayload
}

function SummaryMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-neutral-100 px-2.5 py-2">
      <p className="text-lg font-black leading-none text-neutral-950">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase leading-3 text-neutral-500">
        {label}
      </p>
    </div>
  )
}

export default function ApplicationAdminPage() {
  const { isSuperuser } = useLeagueAccess()
  const [payload, setPayload] = useState<UsersPayload | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [transferTargets, setTransferTargets] = useState<Record<string, string>>({})

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setPayload(await fetchApplicationUsers())
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getApiErrorMessage(caughtError.message)
          : "No se han podido cargar los usuarios.",
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSuperuser) return

    let cancelled = false

    fetchApplicationUsers()
      .then((nextPayload) => {
        if (!cancelled) {
          setPayload(nextPayload)
          setError(null)
        }
      })
      .catch((caughtError: unknown) => {
        if (!cancelled) {
          setError(
            caughtError instanceof Error
              ? getApiErrorMessage(caughtError.message)
              : "No se han podido cargar los usuarios.",
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isSuperuser])

  const visibleUsers = useMemo(() => {
    const cleanQuery = query.trim().toLocaleLowerCase("es-ES")
    if (!cleanQuery) return payload?.items ?? []

    return (payload?.items ?? []).filter((user) =>
      [
        user.email,
        user.displayName,
        user.suspendedAt ? "suspendido" : "activo",
        ...user.leagueNames,
      ]
        .join(" ")
        .toLocaleLowerCase("es-ES")
        .includes(cleanQuery),
    )
  }, [payload, query])

  function updateLocalUser(userId: string, changes: Partial<ApplicationUser>) {
    setPayload((current) =>
      current
        ? {
            ...current,
            items: current.items.map((user) =>
              user.id === userId ? { ...user, ...changes } : user,
            ),
          }
        : current,
    )
  }

  function getTransferCandidates(leagueId: string, ownerUserId: string) {
    return (payload?.items ?? []).filter(
      (candidate) =>
        candidate.id !== ownerUserId &&
        !candidate.suspendedAt &&
        candidate.leagueAccesses.some(
          (access) => access.leagueId === leagueId && access.role !== "spectator",
        ),
    )
  }

  async function saveUser(user: ApplicationUser) {
    if (busyKey) return
    setBusyKey(`${user.id}:save`)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(`/api/application-admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formatProfileName(user.firstName),
          lastName: formatProfileName(user.lastName),
          canCreateLeagues: user.canCreateLeagues,
        }),
      })
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error ?? "application_user_update_failed")
      await loadUsers()
      setFeedback(`Cuenta de ${user.email} actualizada.`)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getApiErrorMessage(caughtError.message)
          : "No se ha podido actualizar la cuenta.",
      )
    } finally {
      setBusyKey(null)
    }
  }

  async function runUserAction(
    user: ApplicationUser,
    action: UserAction,
    confirmation: string,
  ) {
    if (busyKey || !window.confirm(confirmation)) return

    let reason: string | null = null
    if (action === "suspend") {
      reason = window.prompt("Motivo de la suspensión (opcional):", "")
      if (reason === null) return
    }

    setBusyKey(`${user.id}:${action}`)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(
        `/api/application-admin/users/${encodeURIComponent(user.id)}/actions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason }),
        },
      )
      const result = (await response.json()) as {
        error?: string
        affectedCount?: number
      }
      if (!response.ok) throw new Error(result.error ?? "application_user_action_failed")
      await loadUsers()

      const messages: Record<UserAction, string> = {
        suspend: `Cuenta ${user.email} suspendida.`,
        reactivate: `Cuenta ${user.email} reactivada.`,
        reset_profile: `El perfil de ${user.email} deberá completarse de nuevo.`,
        reset_availability: `La disponibilidad habitual de ${user.email} se ha reiniciado.`,
        revoke_push: `${result.affectedCount ?? 0} dispositivo(s) revocado(s) para ${user.email}.`,
        reset_notifications: `Preferencias de notificación restablecidas para ${user.email}.`,
      }
      setFeedback(messages[action])
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getApiErrorMessage(caughtError.message)
          : "No se ha podido completar la acción.",
      )
    } finally {
      setBusyKey(null)
    }
  }

  async function transferOwnership(
    owner: ApplicationUser,
    access: UserLeagueAccess,
  ) {
    const newOwnerUserId = transferTargets[access.leagueId]
    const newOwner = payload?.items.find((user) => user.id === newOwnerUserId)
    if (!newOwnerUserId || !newOwner || busyKey) return

    const confirmed = window.confirm(
      `¿Transferir la propiedad de ${access.leagueName} de ${owner.email} a ${newOwner.email}? El propietario anterior pasará a ser administrador.`,
    )
    if (!confirmed) return

    setBusyKey(`${access.leagueId}:transfer`)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(
        `/api/application-admin/leagues/${encodeURIComponent(access.leagueId)}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentOwnerUserId: owner.id,
            newOwnerUserId,
          }),
        },
      )
      const result = (await response.json()) as { error?: string }
      if (!response.ok) throw new Error(result.error ?? "league_ownership_transfer_failed")
      setTransferTargets((current) => ({ ...current, [access.leagueId]: "" }))
      await loadUsers()
      setFeedback(`Propiedad de ${access.leagueName} transferida a ${newOwner.email}.`)
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? getApiErrorMessage(caughtError.message)
          : "No se ha podido transferir la liga.",
      )
    } finally {
      setBusyKey(null)
    }
  }

  async function deleteUser(user: ApplicationUser) {
    if (busyKey) return
    const confirmed = window.confirm(
      `¿Eliminar la cuenta ${user.email}? Se borrarán sus accesos a ligas, preferencias y suscripciones push. Los jugadores, partidos y resultados históricos se conservarán.`,
    )
    if (!confirmed) return

    setBusyKey(`${user.id}:delete`)
    setFeedback(null)
    setError(null)

    try {
      const response = await fetch(`/api/application-admin/users/${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { error?: string; leagues?: string[] }
      if (!response.ok) {
        throw Object.assign(new Error(result.error ?? "application_user_delete_failed"), {
          leagues: result.leagues,
        })
      }
      await loadUsers()
      setFeedback(`Cuenta ${user.email} eliminada.`)
    } catch (caughtError) {
      const apiError = caughtError as Error & { leagues?: string[] }
      setError(getApiErrorMessage(apiError.message, apiError.leagues))
    } finally {
      setBusyKey(null)
    }
  }

  if (!isSuperuser) {
    return (
      <div className="compact-page space-y-3">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label="Volver" />
          <h1 className="mt-2 text-xl font-black">Acceso restringido</h1>
        </header>
        <AppCard>
          <p className="text-sm font-semibold text-neutral-600">
            Esta pantalla solo está disponible para superusuarios de Smash & Lob.
          </p>
        </AppCard>
      </div>
    )
  }

  const summary = payload?.summary ?? EMPTY_SUMMARY

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-red-600">
          Superusuario
        </p>
        <h1 className="mt-0.5 text-xl font-black">Administración de la aplicación</h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Gestiona cuentas globales, accesos, dispositivos y propiedad de ligas.
        </p>
      </header>

      <Link
        href="/application-admin/suggestions"
        className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-3 py-3 shadow-[0_1px_8px_rgba(15,23,42,0.04)] transition active:bg-neutral-50"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-neutral-950">Sugerencias recibidas</p>
          <p className="mt-0.5 text-xs font-semibold leading-5 text-neutral-500">
            Revisa, clasifica y anota las propuestas enviadas desde Ajustes.
          </p>
        </div>
        <ClickableChevron className="shrink-0" />
      </Link>

      <AppCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">Resumen global</p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Estado actual de Smash & Lob
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="rounded-full bg-neutral-100 px-3 py-1.5 text-xs font-black text-neutral-700 disabled:text-neutral-300"
          >
            Actualizar
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryMetric label="Usuarios" value={summary.userCount} />
          <SummaryMetric label="Activos" value={summary.activeUserCount} />
          <SummaryMetric label="Suspendidos" value={summary.suspendedUserCount} />
          <SummaryMetric label="Ligas" value={summary.leagueCount} />
          <SummaryMetric label="Temporadas activas" value={summary.activeSeasonCount} />
          <SummaryMetric label="Perfil pendiente" value={summary.incompleteProfileCount} />
          <SummaryMetric
            label="Disponibilidad pendiente"
            value={summary.incompleteAvailabilityCount}
          />
          <SummaryMetric
            label="Dispositivos push"
            value={summary.activePushSubscriptionCount}
          />
        </div>
      </AppCard>

      <AppCard className="p-3">
        <p className="font-bold">Usuarios</p>
        <p className="text-xs font-semibold text-neutral-500">
          {visibleUsers.length} de {payload?.items.length ?? 0} cuentas
        </p>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, correo, estado o liga"
          className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
        />
      </AppCard>

      {feedback ? (
        <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          {feedback}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">Cargando usuarios...</p>
        </AppCard>
      ) : null}

      <div className="space-y-3">
        {visibleUsers.map((user) => {
          const isCurrentUser = user.id === payload?.currentUserId
          const isBusy = busyKey?.startsWith(`${user.id}:`) === true
          const ownedAccesses = user.leagueAccesses.filter((access) => access.isOwner)

          return (
            <AppCard key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-black">{user.displayName || user.email}</p>
                    {user.isSuperuser ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700">
                        SUPERUSER
                      </span>
                    ) : null}
                    {user.suspendedAt ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-800">
                        SUSPENDIDA
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-black text-emerald-700">
                        ACTIVA
                      </span>
                    )}
                    {isCurrentUser ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-600">
                        TÚ
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
                    {user.email}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] font-black text-neutral-400">
                  Alta {formatDate(user.createdAt)}
                </span>
              </div>

              {user.suspendedAt ? (
                <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-800">
                  Suspendida desde {formatDate(user.suspendedAt)}
                  {user.suspensionReason ? ` · ${user.suspensionReason}` : ""}
                </p>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-neutral-100 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase text-neutral-400">Perfil</p>
                  <p className="mt-0.5 text-xs font-black">
                    {user.profileCompleted ? "Completo" : "Pendiente"}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase text-neutral-400">
                    Disponibilidad
                  </p>
                  <p className="mt-0.5 text-xs font-black">
                    {user.availabilityCompleted ? "Completa" : "Pendiente"}
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase text-neutral-400">Accesos</p>
                  <p className="mt-0.5 text-xs font-black">
                    {user.leagueCount} miembro · {user.spectatorLeagueCount} espectador
                  </p>
                </div>
                <div className="rounded-xl bg-neutral-100 px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase text-neutral-400">Push</p>
                  <p className="mt-0.5 text-xs font-black">
                    {user.enabledPushSubscriptionCount}/{user.pushSubscriptionCount} activos
                  </p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label>
                  <span className="text-[9px] font-black uppercase text-neutral-400">Nombre</span>
                  <input
                    value={user.firstName}
                    onChange={(event) =>
                      updateLocalUser(user.id, { firstName: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs font-bold outline-none"
                  />
                </label>
                <label>
                  <span className="text-[9px] font-black uppercase text-neutral-400">Apellido</span>
                  <input
                    value={user.lastName}
                    onChange={(event) =>
                      updateLocalUser(user.id, { lastName: event.target.value })
                    }
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs font-bold outline-none"
                  />
                </label>
              </div>

              <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2">
                <span>
                  <span className="block text-xs font-black text-neutral-700">
                    Puede crear ligas
                  </span>
                  <span className="block text-[10px] font-semibold text-neutral-500">
                    {user.ownedLeagueCount} en propiedad · {user.adminLeagueCount} administradas
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={user.canCreateLeagues}
                  onChange={(event) =>
                    updateLocalUser(user.id, {
                      canCreateLeagues: event.target.checked,
                    })
                  }
                />
              </label>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void saveUser(user)}
                  disabled={Boolean(busyKey)}
                  className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
                >
                  {busyKey === `${user.id}:save` ? "Guardando..." : "Guardar"}
                </button>
                {user.suspendedAt ? (
                  <button
                    type="button"
                    onClick={() =>
                      void runUserAction(
                        user,
                        "reactivate",
                        `¿Reactivar la cuenta ${user.email}?`,
                      )
                    }
                    disabled={Boolean(busyKey)}
                    className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 disabled:text-emerald-200"
                  >
                    Reactivar cuenta
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      void runUserAction(
                        user,
                        "suspend",
                        `¿Suspender la cuenta ${user.email}? No podrá utilizar la aplicación hasta que la reactives.`,
                      )
                    }
                    disabled={Boolean(busyKey) || isCurrentUser || user.isSuperuser}
                    className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-800 disabled:text-amber-200"
                  >
                    Suspender cuenta
                  </button>
                )}
              </div>

              <details className="mt-3 rounded-xl border border-neutral-200">
                <summary className="cursor-pointer px-3 py-2.5 text-xs font-black text-neutral-700">
                  Accesos, recuperación y dispositivos
                </summary>
                <div className="border-t border-neutral-200 px-3 pb-3 pt-3">
                  <p className="text-[10px] font-black uppercase text-neutral-400">
                    Accesos a ligas
                  </p>
                  {user.leagueAccesses.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {user.leagueAccesses.map((access) => (
                        <div
                          key={`${user.id}:${access.leagueId}:${access.role}`}
                          className="flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-black">{access.leagueName}</p>
                            <p className="text-[10px] font-semibold text-neutral-500">
                              {roleLabel(access.role)}
                              {access.isOwner ? " · Propietario" : ""}
                            </p>
                          </div>
                          {access.playerId ? (
                            <span className="text-[9px] font-black text-neutral-400">
                              JUGADOR VINCULADO
                            </span>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-neutral-500">
                      No tiene accesos a ligas.
                    </p>
                  )}

                  {ownedAccesses.length > 0 ? (
                    <div className="mt-4">
                      <p className="text-[10px] font-black uppercase text-neutral-400">
                        Transferir propiedad
                      </p>
                      <div className="mt-2 space-y-2">
                        {ownedAccesses.map((access) => {
                          const candidates = getTransferCandidates(access.leagueId, user.id)
                          return (
                            <div
                              key={`${user.id}:${access.leagueId}:transfer`}
                              className="rounded-xl border border-neutral-200 p-2.5"
                            >
                              <p className="text-xs font-black">{access.leagueName}</p>
                              {candidates.length > 0 ? (
                                <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                                  <select
                                    value={transferTargets[access.leagueId] ?? ""}
                                    onChange={(event) =>
                                      setTransferTargets((current) => ({
                                        ...current,
                                        [access.leagueId]: event.target.value,
                                      }))
                                    }
                                    className="min-w-0 rounded-xl border border-neutral-200 bg-white px-2.5 py-2 text-xs font-bold"
                                  >
                                    <option value="">Seleccionar nuevo propietario</option>
                                    {candidates.map((candidate) => (
                                      <option key={candidate.id} value={candidate.id}>
                                        {candidate.displayName || candidate.email} · {candidate.email}
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => void transferOwnership(user, access)}
                                    disabled={
                                      Boolean(busyKey) || !transferTargets[access.leagueId]
                                    }
                                    className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
                                  >
                                    Transferir
                                  </button>
                                </div>
                              ) : (
                                <p className="mt-1 text-[10px] font-semibold text-neutral-500">
                                  No hay otro miembro activo al que transferirla.
                                </p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        void runUserAction(
                          user,
                          "reset_profile",
                          `¿Hacer que ${user.email} complete de nuevo su perfil? Los nombres actuales se conservarán como valores iniciales.`,
                        )
                      }
                      disabled={Boolean(busyKey)}
                      className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
                    >
                      Repetir perfil
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runUserAction(
                          user,
                          "reset_availability",
                          `¿Borrar la disponibilidad habitual de ${user.email}? No se modificará la disponibilidad ya guardada en temporadas.`,
                        )
                      }
                      disabled={Boolean(busyKey)}
                      className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
                    >
                      Reiniciar disponibilidad
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runUserAction(
                          user,
                          "revoke_push",
                          `¿Revocar los ${user.pushSubscriptionCount} dispositivo(s) push de ${user.email}? Tendrá que volver a permitir las notificaciones.`,
                        )
                      }
                      disabled={Boolean(busyKey) || user.pushSubscriptionCount === 0}
                      className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
                    >
                      Revocar dispositivos
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        void runUserAction(
                          user,
                          "reset_notifications",
                          `¿Restablecer las preferencias de notificación de ${user.email}? Volverán a sus valores predeterminados.`,
                        )
                      }
                      disabled={Boolean(busyKey) || user.notificationPreferenceCount === 0}
                      className="rounded-xl bg-neutral-100 px-3 py-2 text-xs font-black text-neutral-700 disabled:text-neutral-300"
                    >
                      Restablecer notificaciones
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => void deleteUser(user)}
                    disabled={
                      Boolean(busyKey) ||
                      isCurrentUser ||
                      user.isSuperuser ||
                      user.ownedLeagueCount > 0
                    }
                    className="mt-2 w-full rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:text-red-200"
                  >
                    {isBusy ? "Procesando..." : "Eliminar cuenta"}
                  </button>
                </div>
              </details>
            </AppCard>
          )
        })}
      </div>

      {!loading && visibleUsers.length === 0 ? (
        <AppCard>
          <p className="text-sm font-semibold text-neutral-500">
            No hay cuentas que coincidan con la búsqueda.
          </p>
        </AppCard>
      ) : null}

      <AppCard>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">Registro de auditoría</p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-500">
              Últimas {payload?.auditItems.length ?? 0} acciones administrativas
            </p>
          </div>
        </div>
        {payload?.auditItems.length ? (
          <div className="mt-3 space-y-2">
            {payload.auditItems.map((item) => (
              <div key={item.id} className="rounded-xl bg-neutral-100 px-3 py-2.5">
                <p className="text-xs font-semibold leading-5 text-neutral-700">
                  <span className="font-black">{item.actorEmail}</span>{" "}
                  {auditDescription(item)}
                </p>
                <p className="mt-0.5 text-[9px] font-black uppercase text-neutral-400">
                  {formatDateTime(item.createdAt)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs font-semibold text-neutral-500">
            Todavía no hay acciones administrativas registradas.
          </p>
        )}
      </AppCard>
    </div>
  )
}
