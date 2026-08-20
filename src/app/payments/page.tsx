"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { type MatchData, useMatchData } from "@/context/MatchDataProvider"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"
import {
  fetchSupabaseActivityEvents,
  type ActivityEvent,
} from "@/lib/activity"
import { formatMoney, roundMoney } from "@/lib/courtBooking"
import {
  fetchPaymentLedger,
  filterPaymentLedgerItems,
  getPaymentLedgerPendingSummary,
  setPaymentLedgerTransferPaid,
  type PaymentLedgerItem,
} from "@/lib/paymentLedger"

type PaymentTab = "status" | "movements" | "all"
type PaymentScope = "all" | "league" | "friendly"

const paymentEventTypes = new Set<ActivityEvent["type"]>([
  "court_booking_updated",
  "court_booking_cleared",
  "court_booking_payment_paid",
  "court_booking_payment_reminder",
])

function getRecordedMatchCost(match: MatchData) {
  const court = match.courtBooking.reservations.reduce(
    (sum, payment) => sum + payment.amount,
    0
  )
  const balls = match.courtBooking.ballPurchases.reduce(
    (sum, payment) => sum + payment.amount,
    0
  )

  return {
    court: roundMoney(court),
    balls: roundMoney(balls),
    total: roundMoney(court + balls),
  }
}

function formatEventDate(value: string, locale: Locale) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function getPaymentEventLabel(type: ActivityEvent["type"]) {
  if (type === "court_booking_updated") {
    return "Reserva actualizada"
  }

  if (type === "court_booking_cleared") {
    return "Reserva cancelada"
  }

  if (type === "court_booking_payment_paid") {
    return "Pago registrado"
  }

  if (type === "court_booking_payment_reminder") {
    return "Recordatorio enviado"
  }

  return "Movimiento"
}

function isPaymentActivityEvent(event: ActivityEvent) {
  return paymentEventTypes.has(event.type)
}

function PaymentActivityList({
  events,
  isLoading,
  error,
}: {
  events: ActivityEvent[]
  isLoading: boolean
  error: string | null
}) {
  const { tx, locale } = useI18n()

  if (isLoading) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        {tx("Cargando movimientos...")}{" "}</p>
    )
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold text-red-700">
        {tx(error)}
      </p>
    )
  }

  if (events.length === 0) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        {tx("No hay movimientos registrados.")}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black text-neutral-950">
                {tx(event.title)}
              </p>
              <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                {tx(getPaymentEventLabel(event.type))}
                {event.actorDisplayName ? ` · ${event.actorDisplayName}` : ""}
              </p>
            </div>

            <p className="shrink-0 type-caption font-semibold text-neutral-400">
              {formatEventDate(event.createdAt, locale)}
            </p>
          </div>

          {event.description ? (
            <p className="mt-2 text-xs leading-snug text-neutral-600">
              {tx(event.description)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function formatLedgerDate(value: string | null, locale: Locale) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date)
}

function getLedgerSourceLabel(
  item: PaymentLedgerItem,
  tx: (value: string) => string,
) {
  if (item.source === "friendly") return tx("Amistoso")

  return [
    item.leagueName ?? tx("Liga"),
    item.seasonName,
    item.round ? `J${item.round}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function PaymentLedgerList({
  items,
  isLoading,
  error,
  updatingTransferId,
  onSetPaidStatus,
}: {
  items: PaymentLedgerItem[]
  isLoading: boolean
  error: string | null
  updatingTransferId: string | null
  onSetPaidStatus: (item: PaymentLedgerItem, isPaid: boolean) => void
}) {
  const { tx, locale } = useI18n()

  if (isLoading) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        {tx("Cargando pagos...")}
      </p>
    )
  }

  if (error) {
    return (
      <p className="rounded-2xl bg-red-50 px-3 py-3 text-xs font-bold text-red-700">
        {tx(error)}
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className="rounded-2xl bg-neutral-50 px-3 py-4 text-center text-xs font-semibold text-neutral-500">
        {tx("No hay pagos para este filtro.")}
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const description =
          item.direction === "owe"
            ? `${tx("Debes pagar a")} ${item.toName}`
            : `${item.fromName} ${tx("debe pagarte")}`
        const ledgerDate = formatLedgerDate(item.eventAt, locale)
        const itemKey = `${item.source}-${item.matchId}-${item.transferId}`

        return (
          <div
            key={itemKey}
            className="rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-2.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-neutral-950">{description}</p>
                <p className="mt-0.5 text-xs font-semibold text-neutral-500">
                  {getLedgerSourceLabel(item, tx)}
                  {ledgerDate ? ` · ${ledgerDate}` : ` · ${tx("Fecha pendiente")}`}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <p className="text-sm font-black text-neutral-950">
                  {formatMoney(item.amount)}
                </p>
                <p
                  className={`type-caption font-black uppercase tracking-[0.14em] ${
                    item.isPaid ? "text-emerald-600" : "text-amber-600"
                  }`}
                >
                  {item.isPaid ? tx("Pagado") : tx("Pendiente")}
                </p>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href={item.href}
                className="flex rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-xs font-black text-neutral-700 items-center justify-center text-center"
              >
                {tx("Ver partido")}
              </Link>
              {!item.isPaid ? (
                <button
                  type="button"
                  onClick={() => onSetPaidStatus(item, true)}
                  disabled={updatingTransferId === itemKey}
                  className="flex rounded-2xl bg-neutral-950 px-3 py-2 type-caption font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
                >
                  {updatingTransferId === itemKey
                    ? tx("Guardando...")
                    : tx("Marcar como pagado")}
                </button>
              ) : item.canMarkPending ? (
                <button
                  type="button"
                  onClick={() => onSetPaidStatus(item, false)}
                  disabled={updatingTransferId === itemKey}
                  className="flex rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 type-caption font-black text-emerald-700 disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400 items-center justify-center text-center"
                >
                  {updatingTransferId === itemKey
                    ? tx("Guardando...")
                    : tx("Marcar como pendiente")}
                </button>
              ) : (
                <span className="flex rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 items-center justify-center text-center">
                  {tx("Saldado")}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function PaymentsPage() {
  const { tx } = useI18n()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { isLeagueAdmin, userLeagues, getMembershipForLeague } =
    useLeagueAccess()
  const { seasons, seasonPlayers, getSeasonRoundSettings } = useSeasonSettings()
  const { t } = useI18n()
  const { matches: storedMatches } = useMatchData()
  const canViewAllMovements = isLeagueAdmin(activeLeague.id)
  const [activeTab, setActiveTab] = useState<PaymentTab>("status")
  const [events, setEvents] = useState<ActivityEvent[]>([])
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  const [eventsError, setEventsError] = useState<string | null>(null)
  const [ledgerItems, setLedgerItems] = useState<PaymentLedgerItem[]>([])
  const [isLedgerLoading, setIsLedgerLoading] = useState(true)
  const [ledgerError, setLedgerError] = useState<string | null>(null)
  const [paymentScope, setPaymentScope] = useState<PaymentScope>("all")
  const [updatingTransferId, setUpdatingTransferId] = useState<string | null>(null)
  const [paymentStatusError, setPaymentStatusError] = useState<string | null>(null)
  const [isEconomyExpanded, setIsEconomyExpanded] = useState(false)
  const [selectedLeagueId, setSelectedLeagueId] = useState(activeLeague.id)
  const [selectedSeasonId, setSelectedSeasonId] = useState(activeSeason.id)

  const refreshLedger = useCallback(async () => {
    try {
      const payload = await fetchPaymentLedger()
      setLedgerItems(payload.items)
      setLedgerError(null)
    } catch {
      setLedgerError("No se han podido cargar tus pagos.")
    } finally {
      setIsLedgerLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadLedger() {
      try {
        const payload = await fetchPaymentLedger()
        if (isMounted) {
          setLedgerItems(payload.items)
          setLedgerError(null)
        }
      } catch {
        if (isMounted) {
          setLedgerError("No se han podido cargar tus pagos.")
        }
      } finally {
        if (isMounted) {
          setIsLedgerLoading(false)
        }
      }
    }

    void loadLedger()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadEvents() {
      setIsEventsLoading(true)
      setEventsError(null)

      try {
        const activityEvents = await fetchSupabaseActivityEvents({
          leagueId: activeLeague.id,
          limit: 200,
        })

        if (isMounted) {
          setEvents(activityEvents)
        }
      } catch {
        if (isMounted) {
          setEventsError(tx("No se ha podido cargar el historial de movimientos."))
        }
      } finally {
        if (isMounted) {
          setIsEventsLoading(false)
        }
      }
    }

    loadEvents()

    return () => {
      isMounted = false
    }
  }, [activeLeague.id])

  const paymentEvents = useMemo(
    () => events.filter(isPaymentActivityEvent),
    [events]
  )
  const selectedLeague =
    userLeagues.find((league) => league.id === selectedLeagueId) ?? activeLeague
  const selectedLeagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === selectedLeague.id),
    [selectedLeague.id, seasons],
  )
  const selectedSeason =
    selectedLeagueSeasons.find((season) => season.id === selectedSeasonId) ??
    selectedLeagueSeasons.find(
      (season) => season.id === selectedLeague.activeSeasonId,
    ) ??
    selectedLeagueSeasons.at(-1) ??
    activeSeason
  const selectedPlayerId =
    getMembershipForLeague(selectedLeague.id)?.playerId ?? null

  const scopedLedgerItems = useMemo(
    () =>
      filterPaymentLedgerItems(ledgerItems, {
        scope: paymentScope,
        leagueId: selectedLeague.id,
        seasonId: selectedSeason.id,
      }),
    [ledgerItems, paymentScope, selectedLeague.id, selectedSeason.id],
  )
  const scopedPendingSummary = useMemo(
    () => getPaymentLedgerPendingSummary(scopedLedgerItems),
    [scopedLedgerItems],
  )
  const pendingPaymentCount =
    scopedPendingSummary.owedByMeCount + scopedPendingSummary.owedToMeCount
  const scopedPendingLedgerItems = useMemo(
    () => scopedLedgerItems.filter((item) => !item.isPaid),
    [scopedLedgerItems],
  )

  const economicSummary = useMemo(() => {
    const scopedMatches = storedMatches.filter(
      (match) =>
        match.leagueId === selectedLeague.id &&
        match.seasonId === selectedSeason.id
    )
    let courtCost = 0
    let ballCost = 0
    let userMatchShare = 0

    scopedMatches.forEach((match) => {
      const cost = getRecordedMatchCost(match)
      const participantIds = Array.from(
        new Set([...match.teamA, ...match.teamB])
      )

      courtCost += cost.court
      ballCost += cost.balls

      if (
        selectedPlayerId &&
        participantIds.includes(selectedPlayerId) &&
        participantIds.length > 0
      ) {
        userMatchShare += cost.total / participantIds.length
      }
    })

    let registrationExpected = 0
    let registrationPaid = 0
    let userRegistration = 0
    let userRegistrationPaid = 0
    const registrationFee =
      getSeasonRoundSettings(selectedSeason.id).registrationFee

    if (registrationFee.enabled && registrationFee.amount > 0) {
      const fallbackPlayerIds = seasonPlayers
        .filter((seasonPlayer) => seasonPlayer.seasonId === selectedSeason.id)
        .map((seasonPlayer) => seasonPlayer.playerId)
      const paymentPlayerIds = registrationFee.payments.map(
        (payment) => payment.playerId
      )
      const chargedPlayerIds = Array.from(
        new Set(
          paymentPlayerIds.length > 0 ? paymentPlayerIds : fallbackPlayerIds,
        )
      )
      const currentUserPayment = selectedPlayerId
        ? registrationFee.payments.find(
            (payment) => payment.playerId === selectedPlayerId
          )
        : null

      registrationExpected += registrationFee.amount * chargedPlayerIds.length
      registrationPaid +=
        registrationFee.amount *
        registrationFee.payments.filter((payment) => payment.isPaid).length

      if (selectedPlayerId && chargedPlayerIds.includes(selectedPlayerId)) {
        userRegistration += registrationFee.amount

        if (currentUserPayment?.isPaid) {
          userRegistrationPaid += registrationFee.amount
        }
      }
    }

    return {
      courtCost: roundMoney(courtCost),
      ballCost: roundMoney(ballCost),
      recordedCost: roundMoney(courtCost + ballCost),
      userMatchShare: roundMoney(userMatchShare),
      userRegistration: roundMoney(userRegistration),
      userRegistrationPaid: roundMoney(userRegistrationPaid),
      userEstimatedShare: roundMoney(userMatchShare + userRegistration),
      registrationExpected: roundMoney(registrationExpected),
      registrationPaid: roundMoney(registrationPaid),
      matchCount: scopedMatches.length,
    }
  }, [
    getSeasonRoundSettings,
    seasonPlayers,
    selectedLeague.id,
    selectedPlayerId,
    selectedSeason.id,
    storedMatches,
  ])
  const economyScopeLabel = `${selectedLeague.name} · ${selectedSeason.name}`
  const scopeDescription =
    paymentScope === "league"
      ? economyScopeLabel
      : paymentScope === "friendly"
        ? tx("Amistosos")
        : tx("Liga y amistosos de tu cuenta, con el origen de cada deuda.")

  function handleLeagueSelection(leagueId: string) {
    setSelectedLeagueId(leagueId)
    const league = userLeagues.find((candidate) => candidate.id === leagueId)
    const leagueSeasons = seasons.filter(
      (season) => season.leagueId === leagueId,
    )
    const nextSeason =
      leagueSeasons.find((season) => season.id === league?.activeSeasonId) ??
      leagueSeasons.at(-1)

    if (nextSeason) {
      setSelectedSeasonId(nextSeason.id)
    }
  }

  async function handleSetTransferPaidStatus(
    item: PaymentLedgerItem,
    isPaid: boolean,
  ) {
    if (updatingTransferId) return

    setUpdatingTransferId(`${item.source}-${item.matchId}-${item.transferId}`)
    setPaymentStatusError(null)

    const saved = await setPaymentLedgerTransferPaid(item, isPaid)
    if (saved) {
      await refreshLedger()
    } else {
      setPaymentStatusError(
        isPaid
          ? "No se ha podido marcar el pago como pagado."
          : "No se ha podido volver a marcar el pago como pendiente.",
      )
    }

    setUpdatingTransferId(null)
  }

  const tabs: { id: PaymentTab; label: string }[] = [
    { id: "status", label: tx("Estado") },
    { id: "movements", label: tx("Movimientos") },
    ...(canViewAllMovements ? [{ id: "all" as const, label: tx("Admin") }] : []),
  ]
  const paymentScopeOptions: { id: PaymentScope; label: string }[] = [
    { id: "all", label: tx("Todos") },
    { id: "league", label: tx("Liga") },
    { id: "friendly", label: tx("Amistosos") },
  ]

  return (
    <div className="compact-page space-y-3">
      <header className="app-page-header">
        <BackButton fallbackHref="/settings" label={tx("Volver")} />

        <h1 className="type-page-title mt-0.5 text-xl font-black tracking-tight">{tx("Mis pagos")}</h1>

      </header>

      <div
        className="grid rounded-2xl bg-neutral-100 p-1 text-xs font-black"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-3 py-2 ${
              activeTab === tab.id ? "bg-white shadow-sm" : "text-neutral-500"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab !== "all" ? (
        <div className="grid grid-cols-3 rounded-2xl border border-neutral-200 bg-white p-1 text-xs font-black">
          {paymentScopeOptions.map((scope) => (
            <button
              key={scope.id}
              type="button"
              onClick={() => setPaymentScope(scope.id)}
              className={`min-w-0 truncate rounded-xl px-2 py-2 ${
                paymentScope === scope.id
                  ? "bg-neutral-950 text-white"
                  : "text-neutral-500"
              }`}
            >
              {scope.label}
            </button>
          ))}
        </div>
      ) : null}

      {activeTab !== "all" && paymentScope === "league" ? (
        <AppCard>
          <div className="grid gap-3">
            <label className="block type-caption font-black uppercase tracking-[0.16em] text-neutral-500">
              {tx("Liga")}
              <select
                value={selectedLeague.id}
                onChange={(event) => handleLeagueSelection(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 outline-none"
              >
                {userLeagues.map((league) => (
                  <option key={league.id} value={league.id}>
                    {league.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block type-caption font-black uppercase tracking-[0.16em] text-neutral-500">
              {tx("Temporada")}
              <select
                value={selectedSeason.id}
                onChange={(event) => setSelectedSeasonId(event.target.value)}
                className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 outline-none"
              >
                {selectedLeagueSeasons.map((season) => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </AppCard>
      ) : null}

      {activeTab === "status" ? (
        <>
          <AppCard
            className={
              pendingPaymentCount > 0 ? "border-amber-200 bg-amber-50" : ""
            }
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
                  {tx("Debes")}
                </p>
                <p className="mt-1 text-lg font-black text-neutral-950">
                  {formatMoney(scopedPendingSummary.owedByMe)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {scopedPendingSummary.owedByMeCount}{" "}
                  {tx(
                    scopedPendingSummary.owedByMeCount === 1
                      ? "movimiento"
                      : "movimientos",
                  )}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
                  {tx("Te deben")}
                </p>
                <p className="mt-1 text-lg font-black text-neutral-950">
                  {formatMoney(scopedPendingSummary.owedToMe)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {scopedPendingSummary.owedToMeCount}{" "}
                  {tx(
                    scopedPendingSummary.owedToMeCount === 1
                      ? "movimiento"
                      : "movimientos",
                  )}
                </p>
              </div>
            </div>

          </AppCard>

          {paymentScope === "league" ? (
            <AppCard className="overflow-hidden p-0">
            <button
              type="button"
              onClick={() => setIsEconomyExpanded((current) => !current)}
              aria-expanded={isEconomyExpanded}
              aria-label={
                isEconomyExpanded
                  ? t.payments.collapseEconomy
                  : t.payments.expandEconomy
              }
              className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
            >
              <div className="min-w-0">
                <p className="text-sm font-black text-neutral-950">
                  {t.payments.economyTitle}
                </p>
                <p className="mt-0.5 truncate text-xs font-semibold text-neutral-500">
                  {economyScopeLabel} · {formatMoney(economicSummary.recordedCost)}
                </p>
              </div>

              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-neutral-100 text-neutral-600">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  fill="none"
                  className={`h-4 w-4 transition-transform ${
                    isEconomyExpanded ? "rotate-180" : ""
                  }`}
                >
                  <path
                    d="m6 8 4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {isEconomyExpanded ? (
              <div className="border-t border-neutral-100 px-3 pb-3 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-2xl bg-neutral-50 px-3 py-2.5">
                    <p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-400">
                      {t.payments.recordedSpend}
                    </p>
                    <p className="mt-1 text-lg font-black text-neutral-950">
                      {formatMoney(economicSummary.recordedCost)}
                    </p>
                    <p className="type-caption font-semibold text-neutral-500">
                      {economicSummary.matchCount} {t.payments.matchesWithCosts}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-neutral-50 px-3 py-2.5">
                    <p className="type-caption font-black uppercase tracking-[0.14em] text-neutral-400">
                      {t.payments.yourEstimatedShare}
                    </p>
                    <p className="mt-1 text-lg font-black text-neutral-950">
                      {formatMoney(economicSummary.userEstimatedShare)}
                    </p>
                    <p className="type-caption font-semibold text-neutral-500">
                      {t.payments.matchShareAndFees}
                    </p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-neutral-100 rounded-2xl border border-neutral-100 bg-white px-3">
                  <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-bold text-neutral-600">
                      {t.payments.courts}
                    </span>
                    <span className="font-black text-neutral-950">
                      {formatMoney(economicSummary.courtCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="font-bold text-neutral-600">
                      {t.payments.balls}
                    </span>
                    <span className="font-black text-neutral-950">
                      {formatMoney(economicSummary.ballCost)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <div>
                      <p className="font-bold text-neutral-600">
                        {t.payments.registrationFees}
                      </p>
                      <p className="type-caption font-semibold text-neutral-400">
                        {formatMoney(economicSummary.registrationPaid)} {t.payments.collectedOf}{" "}
                        {formatMoney(economicSummary.registrationExpected)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-neutral-950">
                        {formatMoney(economicSummary.userRegistration)}
                      </p>
                      {economicSummary.userRegistration > 0 ? (
                        <p
                          className={`type-caption font-black uppercase tracking-[0.12em] ${
                            economicSummary.userRegistrationPaid >=
                            economicSummary.userRegistration
                              ? "text-emerald-600"
                              : "text-amber-600"
                          }`}
                        >
                          {economicSummary.userRegistrationPaid >=
                          economicSummary.userRegistration
                            ? t.payments.paid
                            : t.payments.pending}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <p className="mt-3 type-caption font-semibold leading-4 text-neutral-500">
                  {t.payments.economyNote}
                </p>
              </div>
            ) : null}
            </AppCard>
          ) : null}

          <AppCard>
            <p className="text-sm font-black text-neutral-950">
              {tx("Pagos pendientes")}
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {scopeDescription}
            </p>

            {paymentStatusError ? (
              <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                {tx(paymentStatusError)}
              </p>
            ) : null}

            <div className="mt-3">
              <PaymentLedgerList
                items={scopedPendingLedgerItems}
                isLoading={isLedgerLoading}
                error={ledgerError}
                updatingTransferId={updatingTransferId}
                onSetPaidStatus={(item, isPaid) =>
                  void handleSetTransferPaidStatus(item, isPaid)
                }
              />
            </div>
          </AppCard>
        </>
      ) : activeTab === "movements" ? (
        <AppCard>
          <p className="text-sm font-black text-neutral-950">{tx("Mis movimientos")}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {scopeDescription}
          </p>
          <div className="mt-3">
            <PaymentLedgerList
              items={scopedLedgerItems}
              isLoading={isLedgerLoading}
              error={ledgerError}
              updatingTransferId={updatingTransferId}
              onSetPaidStatus={(item, isPaid) =>
                  void handleSetTransferPaidStatus(item, isPaid)
                }
            />
          </div>
        </AppCard>
      ) : (
        <AppCard>
          <p className="text-sm font-black text-neutral-950">{tx("Todos los movimientos")}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {tx("Historial administrativo de pagos de la liga activa.")}
          </p>
          <div className="mt-3">
            <PaymentActivityList
              events={paymentEvents}
              isLoading={isEventsLoading}
              error={eventsError ? tx(eventsError) : null}
            />
          </div>
        </AppCard>
      )}
    </div>
  )
}
