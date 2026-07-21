"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { PlayerAvatar } from "@/components/player/PlayerAvatar"
import { AppCard } from "@/components/ui/AppCard"
import { useActiveLeague } from "@/context/ActiveLeagueProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useI18n } from "@/i18n/I18nProvider"
import type { League, PlayerProfile } from "@/data/fakeData"
import { formatMoney } from "@/lib/courtBooking"
import { normalizeInviteCode } from "@/lib/inviteUrls"
import { ensurePushSubscriptionForLeague } from "@/lib/pushClient"
import type { SeasonRegistrationFee } from "@/lib/seasonRegistration"

type InviteFlowProps = {
  code: string
  leagueIdHint?: string | null
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

function getInviteErrorMessage({
  error,
  timeoutMessage,
  fallbackMessage,
}: {
  error: unknown
  timeoutMessage: string
  fallbackMessage: string
}) {
  if (error instanceof Error && error.message === "invite-timeout") {
    return timeoutMessage
  }

  return fallbackMessage
}

function PlayerClaimButton({
  player,
  isSelected,
  disabled,
  onSelect,
}: {
  player: PlayerProfile
  isSelected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex min-h-14 items-center gap-2 rounded-2xl px-2.5 py-2.5 text-left text-sm font-black disabled:opacity-50 ${
        isSelected
          ? "bg-neutral-950 text-white"
          : "bg-neutral-100 text-neutral-800"
      }`}
    >
      <PlayerAvatar player={player} size="sm" />
      <span className="min-w-0 flex-1 truncate">{player.displayName}</span>
    </button>
  )
}

function InviteStep({
  number,
  label,
  isActive,
  isDone,
}: {
  number: number
  label: string
  isActive: boolean
  isDone: boolean
}) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span
        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-black ${
          isDone
            ? "bg-emerald-600 text-white"
            : isActive
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-400"
        }`}
      >
        {isDone ? "✓" : number}
      </span>
      <span
        className={`truncate text-[11px] font-black ${
          isActive || isDone ? "text-neutral-900" : "text-neutral-400"
        }`}
      >
        {label}
      </span>
    </div>
  )
}

function CompactRule({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-neutral-100 px-3 py-2.5">
      <p className="text-sm font-black text-neutral-950">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-neutral-500">
        {description}
      </p>
    </div>
  )
}

function InviteRulesSummary({
  registrationFee,
  requiresThreeSets,
}: {
  registrationFee: SeasonRegistrationFee | null
  requiresThreeSets: boolean
}) {
  const { t } = useI18n()
  const hasRegistrationFee = Boolean(
    registrationFee?.enabled && registrationFee.amount > 0
  )
  const registrationAmountLabel = hasRegistrationFee
    ? formatMoney(registrationFee?.amount ?? 0)
    : t.invites.rules.registrationFallbackAmount
  const registrationPurpose = registrationFee?.purpose.trim()

  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-3">
        <p className="text-sm font-black text-amber-950">
          {t.invites.rules.registrationTitle}
        </p>
        <p className="mt-1 text-xs font-bold leading-5 text-amber-900">
          {hasRegistrationFee
            ? `${t.invites.rules.registrationAmountPrefix} ${registrationAmountLabel} ${t.invites.rules.registrationAmountSuffix}`
            : t.invites.rules.registrationNoAmount}
        </p>
        {registrationPurpose ? (
          <p className="mt-2 rounded-xl bg-white/70 px-2.5 py-2 text-xs font-bold text-amber-950">
            {t.invites.rules.registrationPurposePrefix} {registrationPurpose}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <CompactRule
          title={t.invites.rules.individualTitle}
          description={t.invites.rules.individualDescription}
        />
        <CompactRule
          title={t.invites.rules.calendarTitle}
          description={t.invites.rules.calendarDescription}
        />
        <CompactRule
          title={t.invites.rules.scoringTitle}
          description={
            requiresThreeSets
              ? t.invites.rules.scoringThreeSets
              : t.invites.rules.scoringOptionalSets
          }
        />
        <CompactRule
          title={t.invites.rules.commitmentTitle}
          description={t.invites.rules.commitmentDescription}
        />
        <CompactRule
          title={t.invites.rules.substitutesTitle}
          description={t.invites.rules.substitutesDescription}
        />
        <CompactRule
          title={t.invites.rules.gameRulesTitle}
          description={t.invites.rules.gameRulesDescription}
        />
      </div>
    </div>
  )
}

export function InviteFlow({ code, leagueIdHint }: InviteFlowProps) {
  const { t } = useI18n()
  const router = useRouter()
  const normalizedCode = useMemo(() => normalizeInviteCode(code), [code])
  const { activateGrantedLeague } = useActiveLeague()
  const { seasons, getSeasonRoundSettings } = useSeasonSettings()
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
  const [hasAcceptedRules, setHasAcceptedRules] = useState(false)
  const [loadAttempt, setLoadAttempt] = useState(0)

  async function syncPushForInviteLeague(leagueId: string, playerId: string | null) {
    try {
      await ensurePushSubscriptionForLeague({
        leagueId,
        playerId,
        requestPermissionIfNeeded: true,
      })
    } catch {
      // Push setup must never block joining or entering a league.
    }
  }

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
      setHasAcceptedRules(false)
      setLeague(localLeagueRef.current(normalizedCode))

      try {
        const resolvedLeague = await withTimeout(
          resolveLeagueInviteRef.current(normalizedCode, leagueIdHint),
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
        setError(
          getInviteErrorMessage({
            error: loadError,
            timeoutMessage: t.invites.timeoutError,
            fallbackMessage: t.invites.genericError,
          })
        )
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
  }, [leagueIdHint, loadAttempt, normalizedCode, t.invites.genericError, t.invites.invalidCode, t.invites.timeoutError])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <h1 className="text-2xl font-black tracking-tight">
            {t.invites.title}
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.loadingDescription}
          </p>
        </header>

        <AppCard>
          <p className="font-bold">{t.invites.checkingCode}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {t.invites.checkingCodeDescription}
          </p>
        </AppCard>
      </div>
    )
  }

  if (!league) {
    return (
      <div className="space-y-4">
        <header className="pt-2">
          <h1 className="text-2xl font-black tracking-tight">
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
            className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white"
          >
            {t.common.retry}
          </button>
        </AppCard>
      </div>
    )
  }

  const existingMembership = getMembershipForLeague(league.id)
  const activeSeason =
    (league.activeSeasonId
      ? seasons.find((season) => season.id === league.activeSeasonId)
      : null) ??
    [...seasons]
      .filter((season) => season.leagueId === league.id)
      .at(-1) ??
    null
  const activeSeasonSettings = activeSeason
    ? getSeasonRoundSettings(activeSeason.id)
    : null
  const registrationFee = activeSeasonSettings?.registrationFee ?? null
  const unclaimedPlayers = activeSeason
    ? getUnclaimedPlayersForLeague(league.id)
    : []
  const selectedPlayer = unclaimedPlayers.find(
    (player) => player.id === selectedPlayerId
  )
  const currentStep = existingMembership ? 3 : hasAcceptedRules ? 3 : 2

  async function handleEnterExistingLeague() {
    if (!league) {
      return
    }

    activateGrantedLeague(league.id)
    void syncPushForInviteLeague(league.id, existingMembership?.playerId || null)
    router.replace("/")
  }

  async function handleClaim() {
    if (!league || isClaiming) {
      return
    }

    if (!hasAcceptedRules) {
      setError(t.invites.acceptRulesError)
      return
    }

    if (!selectedPlayerId) {
      setError(t.invites.selectPlayerError)
      return
    }

    setIsClaiming(true)
    setError(null)

    const result = await claimPlayer(league.id, selectedPlayerId, normalizedCode)

    setIsClaiming(false)

    if (!result.ok) {
      setError(
        result.error === "already-in-league"
          ? t.invites.alreadyInLeague
          : t.invites.playerAlreadyClaimed
      )
      return
    }

    activateGrantedLeague(league.id)
    void syncPushForInviteLeague(league.id, selectedPlayerId)
    router.replace("/")
  }

  return (
    <div className="space-y-4">
      <header className="pt-2">
        <p className="text-sm font-medium text-neutral-500">
          {t.invites.subtitle}
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
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
        <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm font-black text-neutral-800">
          {league.joinMode === "closed"
            ? t.invites.closedMode
            : t.invites.openMode}
        </p>
      </AppCard>

      <AppCard className="p-2.5">
        <div className="flex items-center gap-2">
          <InviteStep number={1} label={t.invites.stepsCode} isActive={false} isDone />
          <InviteStep
            number={2}
            label={t.invites.stepsRules}
            isActive={currentStep === 2}
            isDone={hasAcceptedRules || Boolean(existingMembership)}
          />
          <InviteStep
            number={3}
            label={t.invites.stepsPlayer}
            isActive={currentStep === 3 && !existingMembership}
            isDone={Boolean(existingMembership)}
          />
        </div>
      </AppCard>

      <AppCard>
        <p className="font-bold">
          {activeSeason?.status === "finished"
            ? t.invites.finishedSeasonTitle
            : activeSeason
              ? t.invites.activeSeasonTitle
              : t.invites.noActiveSeasonTitle}
        </p>
        <p className="mt-1 text-xl font-black tracking-tight">
          {activeSeason?.name ?? "—"}
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          {activeSeason?.status === "finished"
            ? t.invites.finishedSeasonDescription
            : activeSeason
              ? t.invites.activeSeasonDescription
              : t.invites.noActiveSeasonDescription}
        </p>
      </AppCard>

      {!existingMembership ? (
        <AppCard className={hasAcceptedRules ? "border-emerald-200 bg-emerald-50" : ""}>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
            {t.invites.rulesEyebrow}
          </p>
          <h2 className="mt-1 text-lg font-black tracking-tight">
            {t.invites.rulesTitle}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-5 text-neutral-500">
            {t.invites.rulesDescription}
          </p>

          <InviteRulesSummary
            registrationFee={registrationFee}
            requiresThreeSets={activeSeasonSettings?.requiresThreeSets ?? true}
          />

          <label className="mt-4 flex items-start gap-3 rounded-2xl bg-white px-3 py-3 text-sm font-black text-neutral-900 ring-1 ring-neutral-100">
            <input
              type="checkbox"
              checked={hasAcceptedRules}
              onChange={(event) => {
                setHasAcceptedRules(event.target.checked)
                setError(null)
              }}
              className="mt-1"
            />
            <span>{t.invites.acceptRulesLabel}</span>
          </label>
        </AppCard>
      ) : null}

      {error ? (
        <AppCard>
          <p className="font-bold">{t.invites.warningTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">{error}</p>
          <button
            type="button"
            onClick={() => setLoadAttempt((currentAttempt) => currentAttempt + 1)}
            className="mt-3 w-full rounded-2xl bg-neutral-100 px-3 py-2.5 text-sm font-black text-neutral-800"
          >
            {t.common.retry}
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
            className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white"
          >
            {t.invites.enterLeague}
          </button>
        </AppCard>
      ) : (
        <AppCard>
          <p className="font-bold">{t.invites.claimTitle}</p>
          <p className="mt-2 text-sm text-neutral-500">
            {activeSeason?.status === "finished"
              ? t.invites.claimFinishedDescription
              : activeSeason
                ? t.invites.claimActiveDescription
                : t.invites.claimDescription}
          </p>

          {!hasAcceptedRules ? (
            <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-900">
              {t.invites.acceptRulesBeforeSelect}
            </p>
          ) : null}

          {hasAcceptedRules && selectedPlayer ? (
            <div className="mt-3 rounded-2xl border border-neutral-200 bg-white p-3">
              <p className="text-xs font-semibold text-neutral-500">
                {t.invites.selectedPlayer}
              </p>
              <div className="mt-2 flex items-center gap-3">
                <PlayerAvatar player={selectedPlayer} size="sm" />
                <p className="min-w-0 flex-1 truncate text-sm font-black">
                  {selectedPlayer.displayName}
                </p>
              </div>
            </div>
          ) : null}

          {hasAcceptedRules ? (
            <>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-neutral-400">
                {activeSeason?.status === "finished"
                  ? t.invites.claimableFinishedPlayers
                  : t.invites.claimableActivePlayers}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2">
                {unclaimedPlayers.map((player) => (
                  <PlayerClaimButton
                    key={player.id}
                    player={player}
                    isSelected={selectedPlayerId === player.id}
                    disabled={isClaiming}
                    onSelect={() => {
                      setSelectedPlayerId(player.id)
                      setError(null)
                    }}
                  />
                ))}
              </div>
            </>
          ) : null}

          {hasAcceptedRules && unclaimedPlayers.length > 0 ? (
            <p className="mt-3 text-xs font-semibold text-neutral-500">
              {t.invites.inactivePlayersHidden}
            </p>
          ) : null}

          {hasAcceptedRules && unclaimedPlayers.length === 0 ? (
            <p className="mt-3 text-sm font-semibold text-red-600">
              {t.invites.noPlayersAvailable}
            </p>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
          ) : null}

          <button
            type="button"
            onClick={handleClaim}
            disabled={!hasAcceptedRules || !selectedPlayerId || isClaiming}
            className="mt-3 w-full rounded-2xl bg-neutral-950 px-3 py-2.5 text-sm font-black text-white disabled:bg-neutral-300"
          >
            {isClaiming ? t.invites.claiming : t.invites.confirmClaim}
          </button>
        </AppCard>
      )}
    </div>
  )
}
