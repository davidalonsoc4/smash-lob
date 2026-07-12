"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import {
  acceptSpectatorInvite,
  fetchSpectatorInvite,
  type SpectatorInviteSummary,
} from "@/lib/spectatorInvites"
import { addCachedSpectatorLeagueId } from "@/lib/leagueAccessCache"

export function SpectatorInviteFlow() {
  const { data: session } = useSession()
  const params = useParams<{ code: string }>()
  const code = decodeURIComponent(params.code ?? "").trim().toUpperCase()
  const [invite, setInvite] = useState<SpectatorInviteSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadInvite() {
      try {
        const result = await fetchSpectatorInvite(code)

        if (cancelled) return

        if (!result) {
          setNotFound(true)
          return
        }

        setInvite(result)
      } catch {
        if (!cancelled) {
          setError("No se ha podido cargar el enlace de espectador.")
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    loadInvite()

    return () => {
      cancelled = true
    }
  }, [code])

  async function handleJoin() {
    if (!invite || isJoining) return

    setIsJoining(true)
    setError(null)

    try {
      const result = await acceptSpectatorInvite(code)
      const userEmail = session?.user?.email?.trim().toLowerCase()

      if (userEmail) {
        addCachedSpectatorLeagueId(userEmail, result.leagueId)
      }

      window.localStorage.setItem("smash-lob-active-league", result.leagueId)
      window.location.assign("/")
    } catch {
      setError("No se ha podido activar el acceso de espectador.")
      setIsJoining(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 px-4 py-8 text-neutral-950">
      <div className="mx-auto max-w-md space-y-4 pt-8">
        {isLoading ? (
          <AppCard>
            <p className="font-black">Cargando liga...</p>
          </AppCard>
        ) : notFound ? (
          <AppCard>
            <p className="font-black">Enlace no válido</p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              Este enlace de espectador no existe o ha sido desactivado.
            </p>
          </AppCard>
        ) : invite ? (
          <>
            <AppCard>
              <div className="flex items-center gap-3">
                <LeagueLogo
                  league={{
                    name: invite.leagueName,
                    logoUrl: invite.leagueLogoUrl,
                  }}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                    Invitación de espectador
                  </p>
                  <h1 className="mt-1 text-2xl font-black tracking-tight">
                    {invite.leagueName}
                  </h1>
                  {invite.seasonName ? (
                    <p className="mt-1 text-sm font-bold text-neutral-600">
                      {invite.seasonName}
                    </p>
                  ) : null}
                </div>
              </div>

              {invite.leagueDescription ? (
                <p className="mt-4 text-sm font-semibold leading-6 text-neutral-600">
                  {invite.leagueDescription}
                </p>
              ) : null}
            </AppCard>

            <AppCard>
              <p className="font-black">Acceso de solo lectura</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
                Podrás consultar la Home, el ranking, los partidos, los resultados y los perfiles de jugadores. No podrás programar, votar, confirmar resultados ni ver la actividad interna.
              </p>

              <button
                type="button"
                onClick={handleJoin}
                disabled={isJoining}
                className="mt-4 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-400"
              >
                {isJoining ? "Activando acceso..." : "Entrar como espectador"}
              </button>

              {error ? (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {error}
                </p>
              ) : null}
            </AppCard>
          </>
        ) : null}
      </div>
    </main>
  )
}
