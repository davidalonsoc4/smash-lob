"use client"

import { useEffect, useRef, useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { formatMoney } from "@/lib/courtBooking"
import { exportSeasonFinanceExcelWorkbook } from "@/lib/excelExport"
import { showActionFeedback } from "@/lib/actionFeedback"
import {
  buildSeasonFinanceTransparencyData,
  type SeasonFinanceTransparencyData,
} from "@/lib/seasonFinanceTransparency"
import {
  createSeasonFinanceTransparencyImage,
  downloadSeasonFinanceTransparencyImage,
} from "@/lib/seasonFinanceTransparencyImage"
import {
  getSeasonRegistrationFinanceSummary,
  normalizeSeasonRegistrationFee,
  type SeasonRegistrationExpense,
} from "@/lib/seasonRegistration"
import { useI18n } from "@/i18n/I18nProvider"
import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isRemote(id: string) {
  return uuid.test(id)
}

function dateLabel(value: string, locale: Locale) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(getIntlLocale(locale), {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Europe/Madrid",
      }).format(date)
}

function sanitizeFilename(value: string) {
  return (
    value
      .trim()
      .toLocaleLowerCase("es-ES")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "smash-lob"
  )
}

function FinanceStat({
  label,
  value,
  helper,
  negative = false,
}: {
  label: string
  value: string
  helper: string
  negative?: boolean
}) {
  return (
    <AppCard className="p-3">
      <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
        {label}
      </p>
      <p
        className={`mt-1 text-xl font-black ${negative ? "text-red-700" : "text-neutral-950"}`}
      >
        {value}
      </p>
      <p className="type-caption font-semibold text-neutral-500">{helper}</p>
    </AppCard>
  )
}

export function SeasonFinanceScreen() {
  const { tx, locale } = useI18n()
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { updateSeasonRoundSettings } = useSeasonSettings()
  const { activeLeague, activeSeason, roundSettings, rankingPlayers } =
    useCurrentLeagueData()
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportBusyAction, setReportBusyAction] = useState<
    "preview" | "share" | "download" | "excel" | null
  >(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  const canManage = hasLeagueAdminRole(activeLeague.id)
  const canEdit = canManage && activeSeason.status !== "finished"
  const organizer = activeLeague.createdByUserId
    ? rankingPlayers.find((player) => player.userId === activeLeague.createdByUserId)
    : null
  const playerIds = rankingPlayers.map((player) => player.id)
  const settledPlayerIds = organizer ? [organizer.id] : []
  const summary = getSeasonRegistrationFinanceSummary({
    registrationFee: roundSettings.registrationFee,
    playerIds,
    settledPlayerIds,
  })
  const expenses = [...roundSettings.registrationFee.expenses].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
  const numericAmount = Number(amount)
  const valid =
    title.trim().length > 0 && Number.isFinite(numericAmount) && numericAmount > 0

  function applyFee(
    registrationFee: ReturnType<typeof normalizeSeasonRegistrationFee>,
  ) {
    updateSeasonRoundSettings({ ...roundSettings, registrationFee })
  }

  async function mutateExpense(method: "POST" | "DELETE", body: Record<string, unknown>) {
    if (isRemote(activeLeague.id) && isRemote(activeSeason.id)) {
      const response = await fetch(
        `/api/leagues/${encodeURIComponent(activeLeague.id)}/seasons/${encodeURIComponent(activeSeason.id)}/expenses`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      )
      const payload = (await response.json().catch(() => ({}))) as {
        registrationFee?: unknown
        error?: string
      }
      if (!response.ok || !payload.registrationFee) {
        throw new Error(payload.error ?? "expense_failed")
      }
      applyFee(normalizeSeasonRegistrationFee(payload.registrationFee))
      return
    }

    if (method === "POST") {
      const expense: SeasonRegistrationExpense = {
        id: crypto.randomUUID(),
        title: String(body.title),
        amount: Math.round(Number(body.amount) * 100) / 100,
        createdAt: new Date().toISOString(),
      }
      applyFee({
        ...roundSettings.registrationFee,
        expenses: [...roundSettings.registrationFee.expenses, expense],
      })
      return
    }

    applyFee({
      ...roundSettings.registrationFee,
      expenses: roundSettings.registrationFee.expenses.filter(
        (expense) => expense.id !== body.expenseId,
      ),
    })
  }

  async function createExpense() {
    if (!canEdit || busy || !valid) return
    setBusy(true)
    setError(null)
    try {
      await mutateExpense("POST", { title: title.trim(), amount: numericAmount })
      setTitle("")
      setAmount("")
    } catch {
      setError(tx("No se ha podido registrar el gasto."))
    } finally {
      setBusy(false)
    }
  }

  async function deleteExpense(expenseId: string) {
    if (
      !canEdit ||
      busy ||
      !window.confirm(tx("¿Eliminar este gasto de la temporada?"))
    ) {
      return
    }
    setBusy(true)
    setError(null)
    try {
      await mutateExpense("DELETE", { expenseId })
    } catch {
      setError(tx("No se ha podido eliminar el gasto."))
    } finally {
      setBusy(false)
    }
  }

  function getTransparencyData(): SeasonFinanceTransparencyData {
    return buildSeasonFinanceTransparencyData({
      leagueName: activeLeague.name,
      leagueLogoUrl: activeLeague.logoUrl ?? null,
      seasonName: activeSeason.name,
      registrationFee: roundSettings.registrationFee,
      players: rankingPlayers,
      organizerPlayerId: organizer?.id ?? null,
    })
  }

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  async function buildTransparencyImageBlob() {
    return createSeasonFinanceTransparencyImage({
      data: getTransparencyData(),
      locale,
      labels: {
        title: tx("Informe de transparencia"),
        subtitle: tx("Economía de la temporada"),
        generatedLabel: tx("Generado"),
        summary: {
          collected: tx("Ingresado"),
          pending: tx("Pendiente"),
          spent: tx("Gastado"),
          available: tx("Disponible"),
          paidHelper: (count) => tx(`${count} cuotas aportadas`),
          pendingHelper: (count) => tx(`${count} jugadores pendientes`),
          expensesHelper: (count) => tx(`${count} gastos registrados`),
          availableHelper: (value) => tx(`${value} por persona`),
        },
        paymentsTitle: tx("Estado de inscripciones"),
        paymentsPendingTitle: tx("Pendientes por aportar"),
        paymentsCompleteDetail: tx("Todas las inscripciones están contabilizadas."),
        paymentsSummary: (paidCount, totalPlayers, collected, pending) =>
          pending !== formatMoney(0)
            ? tx(`${paidCount}/${totalPlayers} cuotas aportadas · ${collected} ingresados · ${pending} pendientes`)
            : tx(`${paidCount}/${totalPlayers} cuotas aportadas · ${collected} ingresados`),
        expensesTitle: tx("Gastos registrados"),
        noExpenses: tx("Todavía no hay gastos registrados."),
        footer: tx("Generado con Smash & Lob"),
        expenseColumns: {
          concept: tx("Concepto"),
          date: tx("Fecha"),
          amount: tx("Importe"),
        },
      },
    })
  }

  async function openTransparencyPreview() {
    if (reportBusyAction) return
    setReportBusyAction("preview")
    try {
      const blob = await buildTransparencyImageBlob()
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
      const objectUrl = URL.createObjectURL(blob)
      previewUrlRef.current = objectUrl
      setPreviewBlob(blob)
      setPreviewUrl(objectUrl)
      setPreviewOpen(true)
    } catch {
      showActionFeedback({
        tone: "error",
        message: tx("No se ha podido generar la previsualización del informe."),
      })
    } finally {
      setReportBusyAction(null)
    }
  }

  function closeTransparencyPreview() {
    setPreviewOpen(false)
  }

  async function shareTransparencyReport() {
    if (reportBusyAction) return
    setReportBusyAction("share")
    try {
      const blob = previewBlob ?? (await buildTransparencyImageBlob())
      const filename = `${sanitizeFilename(activeLeague.name)}-${sanitizeFilename(activeSeason.name)}-transparencia-gastos.png`
      const file = new File([blob], filename, { type: "image/png" })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: `${activeLeague.name} · ${activeSeason.name}`,
          text: tx("Informe de transparencia de gastos de Smash & Lob"),
          files: [file],
        })
      } else {
        downloadSeasonFinanceTransparencyImage(blob, filename)
        showActionFeedback({
          tone: "info",
          message: tx(
            "Tu dispositivo no permite compartir este informe; se ha descargado la imagen.",
          ),
        })
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        showActionFeedback({
          tone: "error",
          message: tx("No se ha podido generar o compartir el informe."),
        })
      }
    } finally {
      setReportBusyAction(null)
    }
  }

  async function downloadTransparencyReport() {
    if (reportBusyAction) return
    setReportBusyAction("download")
    try {
      const blob = previewBlob ?? (await buildTransparencyImageBlob())
      downloadSeasonFinanceTransparencyImage(
        blob,
        `${sanitizeFilename(activeLeague.name)}-${sanitizeFilename(activeSeason.name)}-transparencia-gastos.png`,
      )
      showActionFeedback({
        tone: "success",
        message: tx("Informe descargado como imagen."),
      })
    } catch {
      showActionFeedback({
        tone: "error",
        message: tx("No se ha podido descargar el informe."),
      })
    } finally {
      setReportBusyAction(null)
    }
  }

  function downloadTransparencyWorkbook() {
    if (reportBusyAction) return
    setReportBusyAction("excel")
    try {
      exportSeasonFinanceExcelWorkbook(getTransparencyData())
      showActionFeedback({
        tone: "success",
        message: tx("Libro Excel de transparencia descargado."),
      })
    } catch {
      showActionFeedback({
        tone: "error",
        message: tx("No se ha podido generar el libro Excel."),
      })
    } finally {
      setReportBusyAction(null)
    }
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <BackButton fallbackHref="/" label={tx("Volver")} />
        <AppCard>
          <p className="font-black">{tx("Acceso restringido")}</p>
        </AppCard>
      </div>
    )
  }

  if (
    !roundSettings.registrationFee.enabled ||
    roundSettings.registrationFee.amount <= 0
  ) {
    return (
      <div className="space-y-4">
        <header className="app-page-header">
          <BackButton fallbackHref="/admin/season" label={tx("Volver")} />
          <h1 className="type-page-title">{tx("Economía de temporada")}</h1>
        </header>
        <AppCard>
          <p className="font-black">{tx("Sin inscripción")}</p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            {tx(
              "Activa una inscripción en Ajustes de temporada para registrar ingresos y gastos.",
            )}
          </p>
        </AppCard>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <header className="app-page-header">
        <BackButton fallbackHref="/admin/season#inscripcion" label={tx("Volver")} />
        <h1 className="type-page-title">{tx("Economía de temporada")}</h1>
        <p className="mt-0.5 type-caption font-bold text-neutral-500">
          {activeSeason.name} {tx("· Inscripción")} {formatMoney(roundSettings.registrationFee.amount)}
          {tx("/jugador")}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-2" data-season-finance-summary>
        <FinanceStat
          label={tx("Ingresado")}
          value={formatMoney(summary.collected)}
          helper={tx(`${summary.paidCount} cuotas aportadas`)}
        />
        <FinanceStat
          label={tx("Pendiente")}
          value={formatMoney(summary.pending)}
          helper={tx(`${summary.pendingCount} jugadores`)}
        />
        <FinanceStat
          label={tx("Gastado")}
          value={formatMoney(summary.spent)}
          helper={tx(`${expenses.length} gastos`)}
        />
        <FinanceStat
          label={tx("Disponible")}
          value={formatMoney(summary.available)}
          helper={tx(`${formatMoney(summary.availablePerPlayer)} POR PERSONA`)}
          negative={summary.available < 0}
        />
      </div>

      {canEdit ? (
        <AppCard data-season-expense-form>
          <p className="font-black">{tx("Registrar gasto")}</p>
          <div className="mt-3 grid gap-3">
            <label>
              <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
                {tx("Título")}
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={120}
                placeholder={tx("Bolas jornada de apertura")}
                className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none"
              />
            </label>
            <label>
              <span className="type-caption font-black uppercase tracking-wide text-neutral-500">
                {tx("Importe")}
              </span>
              <div className="mt-1.5 flex items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2.5">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="0,00"
                  className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none"
                />
                <span className="font-black text-neutral-500">€</span>
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={() => void createExpense()}
            disabled={busy || !valid}
            className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {busy ? tx("Guardando...") : tx("Añadir gasto")}
          </button>
          {error ? (
            <p className="mt-2 text-center text-xs font-semibold text-red-600">
              {tx(error)}
            </p>
          ) : null}
        </AppCard>
      ) : null}

      <AppCard>
        <div className="flex items-center justify-between gap-3">
          <p className="font-black">{tx("Gastos registrados")}</p>
          <span className="type-caption font-black text-neutral-500">
            {formatMoney(summary.spent)}
          </span>
        </div>
        {expenses.length ? (
          <div className="mt-3 divide-y divide-neutral-100">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-neutral-950">
                    {expense.title}
                  </p>
                  <p className="mt-0.5 type-caption font-semibold text-neutral-500">
                    {dateLabel(expense.createdAt, locale)}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-neutral-950">
                  {formatMoney(expense.amount)}
                </p>
                {canEdit ? (
                  <button
                    type="button"
                    aria-label={tx(`Eliminar gasto ${expense.title}`)}
                    onClick={() => void deleteExpense(expense.id)}
                    disabled={busy}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg font-black text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-3 text-sm font-semibold text-neutral-600">
            {tx("Todavía no hay gastos registrados.")}
          </p>
        )}
      </AppCard>

      <AppCard data-season-finance-report className="space-y-3">
        <div>
          <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
            {tx("Informe de transparencia")}
          </p>
          <p className="mt-1 text-base font-black text-neutral-950">
            {tx("Comparte las cuentas de la temporada")}
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-600">
            {tx(
              "Genera una imagen compartible con ingresos, gastos, pagos y saldo final, o descarga el detalle en Excel.",
            )}
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3">
          <div className="grid grid-cols-2 gap-2 text-sm font-semibold text-neutral-700">
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                {tx("Ingresos")}
              </p>
              <p className="mt-1 text-lg font-black text-neutral-950">
                {formatMoney(summary.collected)}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-3 py-2">
              <p className="type-caption font-black uppercase tracking-wide text-neutral-400">
                {tx("Gastos")}
              </p>
              <p className="mt-1 text-lg font-black text-neutral-950">
                {formatMoney(summary.spent)}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void openTransparencyPreview()}
            disabled={reportBusyAction !== null}
            data-season-finance-report-preview
            className="flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500"
          >
            {reportBusyAction === "preview"
              ? tx("Generando previsualización...")
              : tx("Ver imagen")}
          </button>
          <button
            type="button"
            onClick={downloadTransparencyWorkbook}
            disabled={reportBusyAction !== null}
            data-season-finance-report-excel
            className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
          >
            {reportBusyAction === "excel"
              ? tx("Generando Excel...")
              : tx("Exportar Excel (.xlsx)")}
          </button>
        </div>
      </AppCard>

      {previewOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 sm:px-5">
              <div>
                <p className="type-caption font-black uppercase tracking-[0.18em] text-neutral-400">
                  {tx("Previsualización")}
                </p>
                <p className="text-sm font-black text-neutral-950">
                  {tx("Informe de transparencia")}
                </p>
              </div>
              <button
                type="button"
                onClick={closeTransparencyPreview}
                className="grid h-10 w-10 place-items-center rounded-full border border-neutral-200 bg-white text-xl font-black text-neutral-600"
                aria-label={tx("Cerrar")}
              >
                ×
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-neutral-100 p-3 sm:p-5">
              {previewUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                  src={previewUrl}
                  alt={tx("Previsualización del informe de transparencia")}
                    className="mx-auto w-full max-w-2xl rounded-[1.5rem] border border-neutral-200 bg-white shadow-sm"
                  />
                </>
              ) : (
                <div className="flex min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-dashed border-neutral-300 bg-white text-sm font-semibold text-neutral-500">
                  {tx("Generando previsualización...")}
                </div>
              )}
            </div>
            <div className="grid gap-2 border-t border-neutral-200 px-4 py-3 sm:grid-cols-2 sm:px-5">
              <button
                type="button"
                onClick={() => void downloadTransparencyReport()}
                disabled={reportBusyAction !== null}
                data-season-finance-preview-download
                className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-950 shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
              >
                {reportBusyAction === "download" ? tx("Descargando...") : tx("Descargar")}
              </button>
              <button
                type="button"
                onClick={() => void shareTransparencyReport()}
                disabled={reportBusyAction !== null}
                data-season-finance-preview-share
                className="flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500"
              >
                {reportBusyAction === "share" ? tx("Compartiendo...") : tx("Compartir")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
