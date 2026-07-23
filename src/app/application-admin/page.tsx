"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { formatProfileName } from "@/lib/accountProfile"

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
  leagueCount: number
  adminLeagueCount: number
  leagueNames: string[]
  ownedLeagueNames: string[]
}

type UsersPayload = {
  currentUserId: string
  items: ApplicationUser[]
}

function getApiErrorMessage(error: string, leagues?: string[]) {
  if (error === "cannot_delete_self") return "No puedes eliminar tu propia cuenta."
  if (error === "protected_superuser") return "No se puede eliminar una cuenta superusuaria."
  if (error === "user_owns_leagues") {
    return `La cuenta es propietaria de ${leagues?.join(", ") || "una liga"}. Transfiere o elimina esas ligas antes.`
  }
  return `No se ha podido completar la operación (${error}).`
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

export default function ApplicationAdminPage() {
  const { isSuperuser } = useLeagueAccess()
  const [payload, setPayload] = useState<UsersPayload | null>(null)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [busyUserId, setBusyUserId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      [user.email, user.displayName, ...user.leagueNames]
        .join(" ")
        .toLocaleLowerCase("es-ES")
        .includes(cleanQuery),
    )
  }, [payload, query])

  async function saveUser(user: ApplicationUser) {
    if (busyUserId) return
    setBusyUserId(user.id)
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
      setBusyUserId(null)
    }
  }

  async function deleteUser(user: ApplicationUser) {
    if (busyUserId) return
    const confirmed = window.confirm(
      `¿Eliminar la cuenta ${user.email}? Se borrarán sus accesos a ligas, preferencias y suscripciones push. Los jugadores, partidos y resultados históricos se conservarán.`,
    )
    if (!confirmed) return

    setBusyUserId(user.id)
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
      setPayload((current) =>
        current
          ? { ...current, items: current.items.filter((item) => item.id !== user.id) }
          : current,
      )
      setFeedback(`Cuenta ${user.email} eliminada.`)
    } catch (caughtError) {
      const apiError = caughtError as Error & { leagues?: string[] }
      setError(getApiErrorMessage(apiError.message, apiError.leagues))
    } finally {
      setBusyUserId(null)
    }
  }

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

  return (
    <div className="compact-page space-y-3">
      <header className="pt-2">
        <BackButton fallbackHref="/settings" label="Volver" />
        <p className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-red-600">
          Superusuario
        </p>
        <h1 className="mt-0.5 text-xl font-black">Administración de la aplicación</h1>
        <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
          Gestiona cuentas globales. Estas acciones afectan a todas las ligas.
        </p>
      </header>

      <AppCard className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-bold">Usuarios</p>
            <p className="text-xs font-semibold text-neutral-500">
              {payload?.items.length ?? 0} cuentas registradas
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
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nombre, correo o liga"
          className="mt-3 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
        />
      </AppCard>

      {feedback ? <p className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">{feedback}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{error}</p> : null}
      {loading ? <AppCard><p className="text-sm font-semibold text-neutral-500">Cargando usuarios...</p></AppCard> : null}

      <div className="space-y-3">
        {visibleUsers.map((user) => {
          const isCurrentUser = user.id === payload?.currentUserId
          const isBusy = busyUserId === user.id

          return (
            <AppCard key={user.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate font-black">{user.displayName || user.email}</p>
                    {user.isSuperuser ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-700">SUPERUSER</span>
                    ) : null}
                    {isCurrentUser ? (
                      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-black text-neutral-600">TÚ</span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">{user.email}</p>
                </div>
                <span className="shrink-0 text-[10px] font-black text-neutral-400">
                  {user.leagueCount} liga{user.leagueCount === 1 ? "" : "s"}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <label>
                  <span className="text-[9px] font-black uppercase text-neutral-400">Nombre</span>
                  <input
                    value={user.firstName}
                    onChange={(event) => updateLocalUser(user.id, { firstName: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs font-bold outline-none"
                  />
                </label>
                <label>
                  <span className="text-[9px] font-black uppercase text-neutral-400">Apellido</span>
                  <input
                    value={user.lastName}
                    onChange={(event) => updateLocalUser(user.id, { lastName: event.target.value })}
                    className="mt-1 w-full rounded-xl border border-neutral-200 px-2.5 py-2 text-xs font-bold outline-none"
                  />
                </label>
              </div>

              <label className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-neutral-100 px-3 py-2">
                <span className="text-xs font-black text-neutral-700">Puede crear ligas</span>
                <input
                  type="checkbox"
                  checked={user.canCreateLeagues}
                  onChange={(event) => updateLocalUser(user.id, { canCreateLeagues: event.target.checked })}
                />
              </label>

              {user.leagueNames.length > 0 ? (
                <p className="mt-2 text-[10px] font-semibold leading-4 text-neutral-500">
                  {user.leagueNames.join(" · ")}
                </p>
              ) : null}

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void saveUser(user)}
                  disabled={Boolean(busyUserId)}
                  className="rounded-xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300"
                >
                  {isBusy ? "Guardando..." : "Guardar"}
                </button>
                <button
                  type="button"
                  onClick={() => void deleteUser(user)}
                  disabled={Boolean(busyUserId) || isCurrentUser || user.isSuperuser}
                  className="rounded-xl bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:text-red-200"
                >
                  Eliminar cuenta
                </button>
              </div>
            </AppCard>
          )
        })}
      </div>
    </div>
  )
}
