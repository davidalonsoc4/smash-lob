"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { League } from "@/data/fakeData"
import { normalizeInviteCode } from "@/lib/inviteUrls"

type InviteFlowProps = {
  code: string
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("invite-timeout"))
    }, timeoutMs)

    promise
      .then((value) => resolve(value))
      .catch((error) => reject(error))
      .finally(() => window.clearTimeout(timeout))
  })
}

function getInviteErrorMessage(error: unknown) {
  if (error instanceof Error && error.message === "invite-timeout") {
    return "La comprobación del código ha tardado demasiado. Revisa la conexión y vuelve a intentarlo."
  }

  return "No se ha podido comprobar la invitación. Vuelve a intentarlo o pide un nuevo enlace al administrador."
}

export function InviteFlow({ code }: InviteFlowProps) {
  const { t } = useI18n()
  const normalizedCode = useMemo(() => normalizeInviteCode(code), [code])
  const router = useRouter()
  const { setActiveLeagueId } = useActiveLeague()
  const {
    getLeagueByInviteCode,
    resolveLeagueInvite,
    getMembershipForLeague,
    getUnclaimedPlayersForLeague,
    claimPlayer,
  } = useLeagueAccess()
  const resolveLeagueInviteRef = useRef(resolveLeagueInvite)
  const localLeagueRef = useRef(getLeagueByInviteCode)
  const [league, setLeague] = useState<League | null>(() =>
    getLeagueByInviteCode(normalizedCode)
  )
  const [selectedPlayerId, setSelectedPlayerId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClaiming, setIsClaiming] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    resolveLeagueInviteRef.current = resolveLeagueInvite
    localLeagueRef.current = getLeagueByInviteCode
  }, [getLeagueByInviteCode, resolveLeagueInvite])

  useEffect(() => {
    let isMounted = true

    async function loadInvite() {
      if (!normalizedCode) {
        setLeague(null)
        setError(t.invites.invalidCode)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)
      setSelectedPlayerId("")
      setLeague(localLeagueRef.current(normalizedCode))

      try {
        const resolvedLeague = await withTimeout(
          resolveLeagueInviteRef.current(normalizedCode),
          12000
        )

        if (!isMounted) {
          return
        }

        setLeague(resolvedLeague)
      } catch (loadError) {
        if (!isMounted) {
          return
        }

        setLeague(localLeagueRef.current(normalizedCode))
        setError(getInviteErrorMessage(loadError))
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadInvite()

    return () => {
      isMounted = false
    }
  }, [loadAttempt, normalizedCode, t.invites.invalidCode])

  if (isLoading) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <h1 className="text-3xl font-black tracking-tight">
            {t.invites.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            Comprobando invitación y cargando la liga desde la base de datos.
          </p>
        </header>

        <AppCard>
          <p className="font-bold">Comprobando código</p>
          <p className="mt-2 text-sm text-neutral-500">
            Estamos buscando la liga asociada a esta invitación.
          </p>
        </AppCard>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="space-y-5">
        <header className="pt-2">
          <h1 className="text-3xl font-black tracking-tight">
            {t.invites.notFoundTitle}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.notFoundDescription}
          </p>
        </header>

        <AppCard>
          <p className="font-bold">{error ?? t.invites.leagueNotFound}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.invalidCode}
          </p>
          <button
            type="button"
            onClick={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
            className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
          >
            Volver a comprobar
          </button>
        </AppCard>
      </div>
    )
  }

  const existingMembership = getMembershipForLeague(league.id)
  const unclaimedPlayers = getUnclaimedPlayersForLeague(league.id)

  function handleEnterExistingLeague() {
    if (!league) {
      return
    }

    window.localStorage.setItem("smash-lob-active-league", league.id)
    setActiveLeagueId(league.id)
    router.push("/")
  }

  async function handleClaim() {
    if (!league || !selectedPlayerId || isClaiming) {
      setError(t.invites.selectPlayerError)
      return
    }

    setIsClaiming(true)
    setError(null)

    const result = await claimPlayer(league.id, selectedPlayerId)

    setIsClaiming(false)

    if (!result.ok) {
      setError(
        result.error === "already-in-league"
          ? t.invites.alreadyInLeague
          : t.invites.playerAlreadyClaimed
      )
      return
    }

    setActiveLeagueId(league.id)
    router.push("/")
  }

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {t.invites.subtitle}
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight">
          {t.invites.title}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          {t.invites.description}
        </p>
      </header>

      <AppCard>
        <p className="text-sm font-semibold text-neutral-500">
          {t.invites.foundLeague}
        </p>
        <h2 className="mt-1 text-2xl font-black tracking-tight">
          {league.name}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">{league.description}</p>
        <p className="mt-4 rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800">
          {league.joinMode === "closed"
            ? t.invites.closedMode
            : t.invites.openMode}
        </p>
      </AppCard>

      {error ? (
        <AppCard>
          <p className="font-bold">Aviso de invitación</p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
            className="mt-4 w-full rounded-2xl bg-neutral-100 px-4 py-3 text-sm font-black text-neutral-800"
          >
            Volver a comprobar
          </button>
        </AppCard>
      ) : null}

      {existingMembership ? (
        <AppCard>
          <p className="font-bold">{t.invites.alreadyInLeague}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.alreadyInLeagueDescription}
          </p>
          <button
            type="button"
            onClick={handleEnterExistingLeague}
            className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white"
          >
            {t.invites.enterLeague}
          </button>
        </AppCard>
      ) : (
        <AppCard>
          <p className="font-bold">{t.invites.claimTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.claimDescription}
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {unclaimedPlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => {
                  setSelectedPlayerId(player.id)
                  setError(null)
                }}
                disabled={isClaiming}
                className={`rounded-2xl px-4 py-3 text-left text-sm font-black disabled:opacity-50 ${
                  selectedPlayerId === player.id
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-800"
                }`}
              >
                {player.displayName}
              </button>
            ))}
          </div>

          {unclaimedPlayers.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-red-600">
              {t.invites.noPlayersAvailable}
            </p>
          ) : null}

          {error ? (
            <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleClaim}
            disabled={!selectedPlayerId || isClaiming}
            className="mt-4 w-full rounded-2xl bg-neutral-950 px-4 py-3 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isClaiming ? "Guardando..." : t.invites.confirmClaim}
          </button>
        </AppCard>
      )}
    </div>
  )
}
