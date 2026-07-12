"use client"

import { useEffect, useState } from "react"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import {
  fetchLeagueSpectators,
  removeLeagueSpectator,
  type LeagueSpectator,
} from "@/lib/spectatorInvites"

type LeagueSpectatorsPanelProps = {
  leagueId: string
}

export function LeagueSpectatorsPanel({ leagueId }: LeagueSpectatorsPanelProps) {
  const [spectators, setSpectators] = useState<LeagueSpectator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadSpectators() {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchLeagueSpectators(leagueId)
        if (!cancelled) setSpectators(result)
      } catch {
        if (!cancelled) {
          setError("No se ha podido cargar el listado de espectadores.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadSpectators()

    return () => {
      cancelled = true
    }
  }, [leagueId])

  async function handleRemove(spectator: LeagueSpectator) {
    if (removingUserId) return

    const confirmed = window.confirm(
      `¿Quitar el acceso de espectador a ${spectator.displayName || spectator.email}?`,
    )

    if (!confirmed) return

    setRemovingUserId(spectator.userId)
    setError(null)

    try {
      await removeLeagueSpectator({ leagueId, userId: spectator.userId })
      setSpectators((current) =>
        current.filter((item) => item.userId !== spectator.userId),
      )
    } catch {
      setError("No se ha podido retirar el acceso de espectador.")
    } finally {
      setRemovingUserId(null)
    }
  }

  return (
    <AppCard>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-black">Espectadores</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            Cuentas de Google con acceso de solo lectura a la liga.
          </p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-black text-neutral-700">
          {spectators.length}
        </span>
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm font-semibold text-neutral-500">
          Cargando espectadores...
        </p>
      ) : spectators.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-neutral-50 px-3 py-3 text-sm font-semibold text-neutral-500">
          Todavía no se ha unido ningún espectador.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {spectators.map((spectator) => {
            const displayName = spectator.displayName || spectator.email
            const initials = displayName
              .split(/\s+/)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase()

            return (
              <div
                key={spectator.userId}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-3"
              >
                <PlayerAvatar
                  player={{
                    displayName,
                    avatarInitials: initials || "ES",
                    avatarUrl: spectator.avatarUrl,
                  }}
                  size="sm"
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-neutral-950">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
                    {spectator.email}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemove(spectator)}
                  disabled={Boolean(removingUserId)}
                  className="shrink-0 rounded-xl bg-white px-2.5 py-2 text-xs font-black text-red-700 shadow-sm disabled:text-neutral-300"
                >
                  {removingUserId === spectator.userId ? "Quitando..." : "Quitar"}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
    </AppCard>
  )
}
