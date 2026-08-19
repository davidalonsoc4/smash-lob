"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useCurrentUser } from "@/context/CurrentUserProvider"
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
  getPaymentLedgerPendingSummary,
  setPaymentLedgerTransferPaid,
  type PaymentLedgerItem,
} from "@/lib/paymentLedger"

type PaymentTab = "status" | "movements" | "all"
type PaymentScope = "all" | "league" | "friendly"

type EconomyScope = "league" | string

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
  onMarkPaid,
}: {
  items: PaymentLedgerItem[]
  isLoading: boolean
  error: string | null
  updatingTransferId: string | null
  onMarkPaid: (item: PaymentLedgerItem) => void
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
                  onClick={() => onMarkPaid(item)}
                  disabled={updatingTransferId === itemKey}
                  className="flex rounded-2xl bg-neutral-950 px-3 py-2 text-xs font-black text-white disabled:bg-neutral-300 items-center justify-center text-center"
                >
                  {updatingTransferId === itemKey
                    ? tx("Guardando...")
                    : tx("Marcar como pagado")}
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
  const { currentUser } = useCurrentUser()
  const { activeLeague, activeSeason } = useCurrentLeagueData()
  const { isLeagueAdmin } = useLeagueAccess()
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
  const [economyScope, setEconomyScope] = useState<EconomyScope>(activeSeason.id)

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
  const pendingSummary = useMemo(
    () => getPaymentLedgerPendingSummary(ledgerItems),
    [ledgerItems],
  )
  const pendingPaymentCount =
    pendingSummary.owedByMeCount + pendingSummary.owedToMeCount
  const scopedLedgerItems = useMemo(
    () =>
      ledgerItems.filter((item) => {
        if (paymentScope === "friendly") return item.source === "friendly"
        if (paymentScope === "league") {
          return item.source === "league" && item.leagueId === activeLeague.id
        }
        return true
      }),
    [activeLeague.id, ledgerItems, paymentScope],
  )
  const scopedPendingLedgerItems = useMemo(
    () => scopedLedgerItems.filter((item) => !item.isPaid),
    [scopedLedgerItems],
  )

  const leagueSeasons = useMemo(
    () => seasons.filter((season) => season.leagueId === activeLeague.id),
    [activeLeague.id, seasons]
  )
  const effectiveEconomyScope =
    economyScope === "league" ||
    leagueSeasons.some((season) => season.id === economyScope)
      ? economyScope
      : activeSeason.id
  const economicSummary = useMemo(() => {
    const selectedSeasonIds = new Set(
      effectiveEconomyScope === "league"
        ? leagueSeasons.map((season) => season.id)
        : [effectiveEconomyScope]
    )
    const scopedMatches = storedMatches.filter(
      (match) =>
        match.leagueId === activeLeague.id &&
        selectedSeasonIds.has(match.seasonId)
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
        participantIds.includes(currentUser.id) &&
        participantIds.length > 0
      ) {
        userMatchShare += cost.total / participantIds.length
      }
    })

    let registrationExpected = 0
    let registrationPaid = 0
    let userRegistration = 0
    let userRegistrationPaid = 0

    leagueSeasons
      .filter((season) => selectedSeasonIds.has(season.id))
      .forEach((season) => {
        const registrationFee = getSeasonRoundSettings(season.id).registrationFee

        if (!registrationFee.enabled || registrationFee.amount <= 0) {
          return
        }

        const fallbackPlayerIds = seasonPlayers
          .filter((seasonPlayer) => seasonPlayer.seasonId === season.id)
          .map((seasonPlayer) => seasonPlayer.playerId)
        const paymentPlayerIds = registrationFee.payments.map(
          (payment) => payment.playerId
        )
        const chargedPlayerIds = Array.from(
          new Set(
            paymentPlayerIds.length > 0 ? paymentPlayerIds : fallbackPlayerIds
          )
        )
        const currentUserPayment = registrationFee.payments.find(
          (payment) => payment.playerId === currentUser.id
        )

        registrationExpected += registrationFee.amount * chargedPlayerIds.length
        registrationPaid +=
          registrationFee.amount *
          registrationFee.payments.filter((payment) => payment.isPaid).length

        if (chargedPlayerIds.includes(currentUser.id)) {
          userRegistration += registrationFee.amount

          if (currentUserPayment?.isPaid) {
            userRegistrationPaid += registrationFee.amount
          }
        }
      })

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
    activeLeague.id,
    currentUser.id,
    effectiveEconomyScope,
    getSeasonRoundSettings,
    leagueSeasons,
    seasonPlayers,
    storedMatches,
  ])
  const economyScopeLabel =
    effectiveEconomyScope === "league"
      ? t.payments.allLeague
      : leagueSeasons.find((season) => season.id === effectiveEconomyScope)?.name ??
        activeSeason.name

  async function handleMarkTransferPaid(item: PaymentLedgerItem) {
    if (updatingTransferId) return

    setUpdatingTransferId(`${item.source}-${item.matchId}-${item.transferId}`)
    setPaymentStatusError(null)

    const saved = await setPaymentLedgerTransferPaid(item, true)
    if (saved) {
      await refreshLedger()
    } else {
      setPaymentStatusError(
        "No se ha podido marcar el pago como pagado. Revisa Supabase o smash-lob-last-supabase-error.",
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
    { id: "league", label: activeLeague.name },
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
                  {formatMoney(pendingSummary.owedByMe)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {pendingSummary.owedByMeCount} {tx(pendingSummary.owedByMeCount === 1 ? "movimiento" : "movimientos")}
                </p>
              </div>

              <div className="rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                <p className="type-caption font-black uppercase tracking-[0.16em] text-neutral-400">
                  {tx("Te deben")}
                </p>
                <p className="mt-1 text-lg font-black text-neutral-950">
                  {formatMoney(pendingSummary.owedToMe)}
                </p>
                <p className="text-xs font-semibold text-neutral-500">
                  {pendingSummary.owedToMeCount} {tx(pendingSummary.owedToMeCount === 1 ? "movimiento" : "movimientos")}
                </p>
              </div>
            </div>

          </AppCard>

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
                <label className="block type-caption font-black uppercase tracking-[0.16em] text-neutral-500">
                  {t.payments.scopeLabel}
                  <select
                    value={effectiveEconomyScope}
                    onChange={(event) => setEconomyScope(event.target.value)}
                    className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-bold text-neutral-950 outline-none"
                  >
                    <option value="league">{t.payments.allLeague}</option>
                    {leagueSeasons.map((season) => (
                      <option key={season.id} value={season.id}>
                        {season.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="mt-3 grid grid-cols-2 gap-2">
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

          <AppCard>
            <p className="text-sm font-black text-neutral-950">
              {tx("Pagos pendientes")}
            </p>
            <p className="mt-1 text-xs font-semibold text-neutral-500">
              {tx("Liga y amistosos de tu cuenta, con el origen de cada deuda.")}
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
                onMarkPaid={(item) => void handleMarkTransferPaid(item)}
              />
            </div>
          </AppCard>
        </>
      ) : activeTab === "movements" ? (
        <AppCard>
          <p className="text-sm font-black text-neutral-950">{tx("Mis movimientos")}</p>
          <p className="mt-1 text-xs font-semibold text-neutral-500">
            {tx("Pagos pendientes y saldados de todas tus ligas y amistosos.")}
          </p>
          <div className="mt-3">
            <PaymentLedgerList
              items={scopedLedgerItems}
              isLoading={isLedgerLoading}
              error={ledgerError}
              updatingTransferId={updatingTransferId}
              onMarkPaid={(item) => void handleMarkTransferPaid(item)}
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
