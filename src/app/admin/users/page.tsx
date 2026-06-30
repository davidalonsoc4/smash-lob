"use client"

import { useEffect, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import type { LeagueUserManagementPlayer } from "@/lib/supabaseAdminUsers"

type PlayerUserCardProps = {
  item: LeagueUserManagementPlayer
  onChangeRole: (
    playerId: string,
    role: "admin" | "player"
  ) => Promise<boolean>
  onUnlink: (playerId: string) => Promise<boolean>
  onRename: (playerId: string, displayName: string) => Promise<boolean>
}

function getRoleLabel(role: LeagueUserManagementPlayer["role"]) {
  if (role === "creator") return "Creador"
  if (role === "admin") return "Admin"
  if (role === "player") return "Jugador"
  return "Sin vincular"
}

function getRoleClassName(role: LeagueUserManagementPlayer["role"]) {
  if (role === "creator") return "bg-neutral-950 text-white"
  if (role === "admin") return "bg-neutral-800 text-white"
  if (role === "player") return "bg-neutral-100 text-neutral-800"
  return "bg-orange-100 text-orange-900"
}

function PlayerUserCard({
  item,
  onChangeRole,
  onUnlink,
  onRename,
}: PlayerUserCardProps) {
  const [displayName, setDisplayName] = useState(item.displayName)
  const [isSavingName, setIsSavingName] = useState(false)
  const [isUpdatingRole, setIsUpdatingRole] = useState(false)
  const [isUnlinking, setIsUnlinking] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const cleanDisplayName = displayName.trim()
  const canSaveName =
    cleanDisplayName.length > 0 && cleanDisplayName !== item.displayName
  const isLinked = Boolean(item.linkedUserId)
  const canManageLink = isLinked && item.role !== "creator"
  const nextRole = item.role === "admin" ? "player" : "admin"

  async function handleSaveName() {
    if (!canSaveName || isSavingName) return

    setIsSavingName(true)
    setSavedMessage(null)
    setError(null)

    const saved = await onRename(item.playerId, cleanDisplayName)

    setIsSavingName(false)

    if (!saved) {
      setError("No se ha podido cambiar el nombre del jugador.")
      return
    }

    setSavedMessage("Nombre actualizado.")
  }

  async function handleChangeRole() {
    if (!canManageLink || isUpdatingRole) return

    setIsUpdatingRole(true)
    setSavedMessage(null)
    setError(null)

    const saved = await onChangeRole(item.playerId, nextRole)

    setIsUpdatingRole(false)

    if (!saved) {
      setError("No se ha podido cambiar el rol del usuario.")
      return
    }

    setSavedMessage(
      nextRole === "admin" ? "Usuario convertido en admin." : "Permiso de admin retirado."
    )
  }

  async function handleUnlink() {
    if (!canManageLink || isUnlinking) return

    const confirmed = window.confirm(
      `¿Seguro que quieres desvincular la cuenta de ${item.displayName}? El jugador quedará libre para reclamarlo de nuevo con invitación.`
    )

    if (!confirmed) return

    setIsUnlinking(true)
    setSavedMessage(null)
    setError(null)

    const saved = await onUnlink(item.playerId)

    setIsUnlinking(false)

    if (!saved) {
      setError("No se ha podido desvincular la cuenta.")
      return
    }

    setSavedMessage("Cuenta desvinculada.")
  }

  return (
    <AppCard>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-lg font-black">{item.displayName}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {item.linkedUserEmail
              ? item.linkedUserDisplayName
                ? `${item.linkedUserDisplayName} · ${item.linkedUserEmail}`
                : item.linkedUserEmail
              : "Este jugador todavía no tiene cuenta vinculada."}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getRoleClassName(
            item.role
          )}`}
        >
          {getRoleLabel(item.role)}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        <label className="block">
          <span className="text-sm font-semibold text-neutral-700">
            Nombre visible del jugador
          </span>
          <input
            value={displayName}
            disabled={isSavingName}
            onChange={(event) => {
              setDisplayName(event.target.value)
              setSavedMessage(null)
              setError(null)
            }}
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
          />
        </label>

        <button
          type="button"
          onClick={handleSaveName}
          disabled={!canSaveName || isSavingName}
          className="w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {isSavingName ? "Guardando..." : "Guardar nombre"}
        </button>
      </div>

      {canManageLink ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleChangeRole}
            disabled={isUpdatingRole || isUnlinking}
            className="rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isUpdatingRole
              ? "Guardando..."
              : item.role === "admin"
                ? "Quitar admin"
                : "Convertir en admin"}
          </button>

          <button
            type="button"
            onClick={handleUnlink}
            disabled={isUpdatingRole || isUnlinking}
            className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700 disabled:text-red-300"
          >
            {isUnlinking ? "Desvinculando..." : "Desvincular cuenta"}
          </button>
        </div>
      ) : item.role === "creator" ? (
        <p className="mt-4 rounded-2xl bg-neutral-100 p-3 text-xs font-semibold text-neutral-500">
          El creador no se puede degradar ni desvincular desde este panel.
        </p>
      ) : null}

      {savedMessage ? (
        <p className="mt-3 text-sm font-semibold text-neutral-600">
          {savedMessage}
        </p>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}

export default function AdminUsersPage() {
  const { t } = useI18n()
  const {
    fetchLeagueUsers,
    isLeagueAdmin,
    unlinkLeaguePlayerAccount,
    updateLeaguePlayerName,
    updateLeagueUserRole,
  } = useLeagueAccess()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const canAccessAdmin = isLeagueAdmin(activeLeague.id)
  const [items, setItems] = useState<LeagueUserManagementPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  async function loadUsers() {
    setIsLoading(true)
    setLoadError(null)

    const users = await fetchLeagueUsers(activeLeague.id)

    setItems(users)
    setIsLoading(false)

    if (users.length === 0) {
      setLoadError(
        "No se han podido cargar los usuarios de la liga o no hay jugadores disponibles."
      )
    }
  }

  useEffect(() => {
    if (!canAccessAdmin) {
      return
    }

    window.setTimeout(() => {
      void loadUsers()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLeague.id, canAccessAdmin])

  async function handleChangeRole(playerId: string, role: "admin" | "player") {
    const saved = await updateLeagueUserRole(activeLeague.id, playerId, role)

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  async function handleUnlink(playerId: string) {
    const saved = await unlinkLeaguePlayerAccount(activeLeague.id, playerId)

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  async function handleRename(playerId: string, displayName: string) {
    const saved = await updateLeaguePlayerName(
      activeLeague.id,
      playerId,
      displayName
    )

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  if (!canAccessAdmin) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <BackButton fallbackHref="/settings" label={t.common.back} />

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            {t.adminPanel.accessDeniedTitle}
          </h1>
        </header>

        <AppCard>
          <p className="font-bold">{t.adminPanel.accessDeniedCardTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.adminPanel.accessDeniedDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <BackButton fallbackHref="/admin" label={t.common.back} />

        <p className="mt-4 text-sm font-medium text-neutral-500">
          {activeLeague.name} - {activeSeason.name}
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight">
          Gestión de usuarios
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Cambia nombres de jugadores, convierte usuarios en admin, retira permisos
          o desvincula cuentas para que puedan reclamarse de nuevo.
        </p>
      </header>

      <AppCard>
        <p className="font-bold">Resumen</p>
        <p className="mt-2 text-sm text-neutral-500">
          Jugadores totales: {items.length} · Vinculados:{" "}
          {items.filter((item) => item.linkedUserId).length} · Sin vincular:{" "}
          {items.filter((item) => !item.linkedUserId).length}
        </p>
      </AppCard>

      {isLoading ? (
        <AppCard>
          <p className="font-bold">Cargando usuarios...</p>
        </AppCard>
      ) : null}

      {!isLoading && loadError ? (
        <AppCard>
          <p className="font-bold">No hay usuarios para mostrar</p>
          <p className="mt-2 text-sm text-neutral-500">{loadError}</p>
        </AppCard>
      ) : null}

      {!isLoading && items.length > 0 ? (
        <div className="space-y-3">
          {items.map((item) => (
            <PlayerUserCard
              key={item.playerId}
              item={item}
              onChangeRole={handleChangeRole}
              onUnlink={handleUnlink}
              onRename={handleRename}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}
