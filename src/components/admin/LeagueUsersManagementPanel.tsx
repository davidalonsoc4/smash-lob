"use client"

import { useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import type { LeagueMemberRole } from "@/data/fakeData"
import type { LeagueUserManagementPlayer } from "@/lib/supabaseAdminUsers"
import { recordActivityEvent } from "@/lib/activity"

type PlayerUserCardProps = {
  leagueId: string
  item: LeagueUserManagementPlayer
  currentUserId: string | null
  onChangeRole: (
    playerId: string,
    role: Extract<LeagueMemberRole, "admin" | "player">
  ) => Promise<boolean>
  onUnlink: (playerId: string) => Promise<boolean>
  onRename: (playerId: string, displayName: string) => Promise<boolean>
}

type LeagueUsersManagementPanelProps = {
  leagueId: string
}


function getActorFromSession(session: ReturnType<typeof useSession>["data"]) {
  return {
    actorEmail: session?.user?.email ?? "system@smash-lob.local",
    actorDisplayName: session?.user?.name ?? null,
  }
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
  leagueId,
  item,
  currentUserId,
  onChangeRole,
  onUnlink,
  onRename,
}: PlayerUserCardProps) {
  const { data: session } = useSession()
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
  const isCurrentUser =
    Boolean(currentUserId) && item.linkedUserEmail === currentUserId
  const canManageLink = isLinked && item.role !== "creator" && !isCurrentUser
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

    try {
      await recordActivityEvent({
        leagueId,
        ...getActorFromSession(session),
        type: "player_name_updated",
        title: "Nombre de jugador actualizado",
        description: `${item.displayName} ahora se llama ${cleanDisplayName}.`,
        metadata: {
          targetPlayerId: item.playerId,
          previousDisplayName: item.displayName,
          nextDisplayName: cleanDisplayName,
        },
      })
    } catch {
      // El nombre ya está guardado; la actividad es auxiliar.
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

    try {
      await recordActivityEvent({
        leagueId,
        ...getActorFromSession(session),
        type: "player_role_updated",
        title: nextRole === "admin" ? "Admin añadido" : "Admin retirado",
        description:
          nextRole === "admin"
            ? `${item.displayName} ahora tiene permisos de admin.`
            : `${item.displayName} deja de tener permisos de admin.`,
        metadata: {
          targetPlayerId: item.playerId,
          targetPlayerName: item.displayName,
          previousRole: item.role,
          nextRole,
        },
      })
    } catch {
      // El rol ya está guardado; la actividad es auxiliar.
    }

    setSavedMessage(
      nextRole === "admin"
        ? "Usuario convertido en admin."
        : "Permiso de admin retirado."
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

    try {
      await recordActivityEvent({
        leagueId,
        ...getActorFromSession(session),
        type: "player_unlinked",
        title: "Cuenta desvinculada",
        description: `${item.displayName} ya no tiene una cuenta vinculada en esta liga.`,
        metadata: {
          targetPlayerId: item.playerId,
          targetPlayerName: item.displayName,
          linkedUserEmail: item.linkedUserEmail,
        },
      })
    } catch {
      // La cuenta ya está desvinculada; la actividad es auxiliar.
    }

    setSavedMessage("Cuenta desvinculada.")
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <PlayerAvatar
            player={{
              displayName: item.displayName,
              avatarInitials: item.avatarInitials,
              avatarUrl: item.avatarUrl,
            }}
            size="md"
          />

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
        </div>

        <span
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${getRoleClassName(
            item.role
          )}`}
        >
          {getRoleLabel(item.role)}
        </span>
      </div>

      <div className="mt-4 space-y-3">
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
            className="mt-2 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold text-neutral-900 shadow-sm outline-none focus:border-neutral-400 disabled:bg-neutral-100"
          />
        </label>

        <button
          type="button"
          onClick={handleSaveName}
          disabled={!canSaveName || isSavingName}
          className="w-full rounded-2xl bg-white px-3 py-2.5 text-sm font-black text-neutral-800 shadow-sm disabled:bg-neutral-200 disabled:text-neutral-400"
        >
          {isSavingName ? "Guardando..." : "Guardar nombre"}
        </button>
      </div>

      {canManageLink ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={handleChangeRole}
            disabled={isUpdatingRole || isUnlinking}
            className="rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
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
            className="rounded-2xl bg-red-50 px-3 py-2.5 text-sm font-black text-red-700 disabled:text-red-300"
          >
            {isUnlinking ? "Desvinculando..." : "Desvincular cuenta"}
          </button>
        </div>
      ) : item.role === "creator" ? (
        <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-semibold text-neutral-500">
          El creador no se puede degradar ni desvincular desde este panel.
        </p>
      ) : isCurrentUser ? (
        <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-semibold text-neutral-500">
          No puedes quitarte tus propios permisos ni desvincular tu propia cuenta.
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
    </div>
  )
}

export function LeagueUsersManagementPanel({
  leagueId,
}: LeagueUsersManagementPanelProps) {
  const {
    fetchLeagueUsers,
    unlinkLeaguePlayerAccount,
    updateLeaguePlayerName,
    updateLeagueUserRole,
    userId,
  } = useLeagueAccess()
  const [items, setItems] = useState<LeagueUserManagementPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const linkedCount = useMemo(
    () => items.filter((item) => item.linkedUserId).length,
    [items]
  )
  const unlinkedCount = items.length - linkedCount

  async function loadUsers() {
    setIsLoading(true)
    setLoadError(null)

    const users = await fetchLeagueUsers(leagueId)

    setItems(users)
    setIsLoading(false)

    if (users.length === 0) {
      setLoadError(
        "No se han podido cargar los usuarios de la liga o no hay jugadores disponibles."
      )
    }
  }

  useEffect(() => {
    window.setTimeout(() => {
      void loadUsers()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leagueId])

  async function handleChangeRole(
    playerId: string,
    role: Extract<LeagueMemberRole, "admin" | "player">
  ) {
    const saved = await updateLeagueUserRole(leagueId, playerId, role)

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  async function handleUnlink(playerId: string) {
    const saved = await unlinkLeaguePlayerAccount(leagueId, playerId)

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  async function handleRename(playerId: string, displayName: string) {
    const saved = await updateLeaguePlayerName(leagueId, playerId, displayName)

    if (saved) {
      await loadUsers()
    }

    return saved
  }

  return (
    <AppCard>
      <p className="font-bold">Jugadores y usuarios</p>
      <p className="mt-2 text-sm text-neutral-500">
        Gestiona los jugadores de la liga, sus cuentas vinculadas y los permisos
        de administración. Estos jugadores pertenecen a la liga; cada temporada
        decide cuáles participan.
      </p>
      <p className="mt-3 text-xs font-semibold text-neutral-500">
        Total: {items.length} · Vinculados: {linkedCount} · Sin vincular:{" "}
        {unlinkedCount}
      </p>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="rounded-2xl bg-neutral-100 p-3">
            <p className="font-bold">Cargando usuarios...</p>
          </div>
        ) : null}

        {!isLoading && loadError ? (
          <div className="rounded-2xl bg-neutral-100 p-3">
            <p className="font-bold">No hay usuarios para mostrar</p>
            <p className="mt-2 text-sm text-neutral-500">{loadError}</p>
          </div>
        ) : null}

        {!isLoading && items.length > 0
          ? items.map((item) => (
              <PlayerUserCard
                key={`${item.playerId}:${item.displayName}:${item.linkedUserId ?? "free"}:${item.role ?? "none"}`}
                leagueId={leagueId}
                item={item}
                currentUserId={userId}
                onChangeRole={handleChangeRole}
                onUnlink={handleUnlink}
                onRename={handleRename}
              />
            ))
          : null}
      </div>
    </AppCard>
  )
}
