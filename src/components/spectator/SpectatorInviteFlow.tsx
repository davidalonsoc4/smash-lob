"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { AppCard } from "@/components/ui/AppCard"
import { addCachedSpectatorLeagueId } from "@/lib/leagueAccessCache"
import Link from "next/link"
import { LeagueLogo } from "@/components/league/LeagueLogo"
import {
  acceptSpectatorInvite,
  fetchSpectatorInvite,
  type SpectatorInviteSummary,
} from "@/lib/spectatorInvites"
import { useI18n } from "@/i18n/I18nProvider"
import { clearPendingAccessIntent } from "@/lib/pendingAccessIntentClient"

export function SpectatorInviteFlow() {
  const { tx } = useI18n()
  const { data: session } = useSession()
  const params = useParams<{ code: string }>()
  const router = useRouter()
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
      if (userEmail) addCachedSpectatorLeagueId(userEmail, result.leagueId)
      window.localStorage.setItem("smash-lob-active-league", result.leagueId)
      await clearPendingAccessIntent()
      router.replace("/")
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
            <p className="font-black">{tx("Cargando liga...")}</p>
          </AppCard>
        ) : notFound ? (
          <AppCard>
            <p className="font-black">{tx("Enlace no válido")}</p>
            <p className="mt-2 text-sm font-semibold text-neutral-500">
              {tx("Este enlace de espectador no existe o ha sido desactivado.")}{" "}</p>
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
                  previewable
                />
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">
                    {tx("Invitación de espectador")}{" "}</p>
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
              <p className="font-black">{tx("Acceso de solo lectura")}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
                {tx("Consulta partidos, resultados y clasificación sin crear una cuenta. El enlace da acceso de lectura a esta liga.")}{" "}</p>

              <Link
                href={`/spectate/${encodeURIComponent(code)}/view`}
                className="mt-4 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-3 py-2.5 text-center text-sm font-black text-white"
              >
                {tx("Ver liga sin iniciar sesión")}
              </Link>

              {session?.user ? (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={isJoining}
                  className="mt-2 flex w-full items-center justify-center rounded-2xl border border-neutral-300 px-3 py-2.5 text-center text-sm font-black text-neutral-700 disabled:text-neutral-400"
                >
                  {isJoining ? tx("Guardando acceso...") : tx("Añadir liga a mi cuenta")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void signIn("google", { callbackUrl: `/spectate/${encodeURIComponent(code)}` })}
                  className="mt-2 w-full px-3 py-2 text-center text-xs font-bold text-neutral-500 underline underline-offset-2"
                >
                  {tx("O inicia sesión para guardar esta liga en tu cuenta")}
                </button>
              )}

              {error ? (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {tx(error)}
                </p>
              ) : null}
            </AppCard>
          </>
        ) : null}
      </div>
    </main>
  )
}
