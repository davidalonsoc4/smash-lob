"use client"

import { useState } from "react"
import { AppCard } from "@/components/ui/AppCard"
import { BackButton } from "@/components/ui/BackButton"
import { useLeagueAccess } from "@/context/LeagueAccessProvider"
import { useSeasonSettings } from "@/context/SeasonSettingsProvider"
import { useCurrentLeagueData } from "@/hooks/useCurrentLeagueData"
import { formatMoney } from "@/lib/courtBooking"
import { getSeasonRegistrationFinanceSummary, normalizeSeasonRegistrationFee, type SeasonRegistrationExpense } from "@/lib/seasonRegistration"

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const isRemote = (id: string) => uuid.test(id)
const dateLabel = (value: string) => { const date = new Date(value); return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Madrid" }).format(date) }

function FinanceStat({ label, value, helper, negative = false }: { label: string; value: string; helper: string; negative?: boolean }) {
  return <AppCard className="p-3"><p className="type-caption font-black uppercase tracking-wide text-neutral-400">{label}</p><p className={`mt-1 text-xl font-black ${negative ? "text-red-700" : "text-neutral-950"}`}>{value}</p><p className="type-caption font-semibold text-neutral-500">{helper}</p></AppCard>
}

export function SeasonFinanceScreen() {
  const { hasLeagueAdminRole } = useLeagueAccess()
  const { updateSeasonRoundSettings } = useSeasonSettings()
  const { activeLeague, activeSeason, roundSettings, rankingPlayers } = useCurrentLeagueData()
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null)
  const canManage = hasLeagueAdminRole(activeLeague.id); const canEdit = canManage && activeSeason.status !== "finished"
  const organizer = activeLeague.createdByUserId ? rankingPlayers.find((player) => player.userId === activeLeague.createdByUserId) : null
  const playerIds = rankingPlayers.map((player) => player.id); const settledPlayerIds = organizer ? [organizer.id] : []
  const summary = getSeasonRegistrationFinanceSummary({ registrationFee: roundSettings.registrationFee, playerIds, settledPlayerIds })
  const expenses = [...roundSettings.registrationFee.expenses].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const numericAmount = Number(amount); const valid = title.trim().length > 0 && Number.isFinite(numericAmount) && numericAmount > 0
  const applyFee = (registrationFee: ReturnType<typeof normalizeSeasonRegistrationFee>) => updateSeasonRoundSettings({ ...roundSettings, registrationFee })

  async function mutateExpense(method: "POST" | "DELETE", body: Record<string, unknown>) {
    if (isRemote(activeLeague.id) && isRemote(activeSeason.id)) {
      const response = await fetch(`/api/leagues/${encodeURIComponent(activeLeague.id)}/seasons/${encodeURIComponent(activeSeason.id)}/expenses`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const payload = (await response.json().catch(() => ({}))) as { registrationFee?: unknown; error?: string }
      if (!response.ok || !payload.registrationFee) throw new Error(payload.error ?? "expense_failed")
      applyFee(normalizeSeasonRegistrationFee(payload.registrationFee)); return
    }
    if (method === "POST") {
      const expense: SeasonRegistrationExpense = { id: crypto.randomUUID(), title: String(body.title), amount: Math.round(Number(body.amount) * 100) / 100, createdAt: new Date().toISOString() }
      applyFee({ ...roundSettings.registrationFee, expenses: [...roundSettings.registrationFee.expenses, expense] })
    } else applyFee({ ...roundSettings.registrationFee, expenses: roundSettings.registrationFee.expenses.filter((expense) => expense.id !== body.expenseId) })
  }

  async function createExpense() {
    if (!canEdit || busy || !valid) return
    setBusy(true); setError(null)
    try { await mutateExpense("POST", { title: title.trim(), amount: numericAmount }); setTitle(""); setAmount("") } catch { setError("No se ha podido registrar el gasto.") } finally { setBusy(false) }
  }
  async function deleteExpense(expenseId: string) {
    if (!canEdit || busy || !window.confirm("¿Eliminar este gasto de la temporada?")) return
    setBusy(true); setError(null)
    try { await mutateExpense("DELETE", { expenseId }) } catch { setError("No se ha podido eliminar el gasto.") } finally { setBusy(false) }
  }

  if (!canManage) return <div className="space-y-4"><BackButton fallbackHref="/" label="Volver" /><AppCard><p className="font-black">Acceso restringido</p></AppCard></div>
  if (!roundSettings.registrationFee.enabled || roundSettings.registrationFee.amount <= 0) return <div className="space-y-4"><header className="app-page-header"><BackButton fallbackHref="/admin/season" label="Volver" /><h1 className="type-page-title">Economía de temporada</h1></header><AppCard><p className="font-black">Sin inscripción</p><p className="mt-1 text-sm font-semibold text-neutral-600">Activa una inscripción en Ajustes de temporada para registrar ingresos y gastos.</p></AppCard></div>

  return <div className="space-y-4">
    <header className="app-page-header"><BackButton fallbackHref="/admin/season#inscripcion" label="Volver" /><h1 className="type-page-title">Economía de temporada</h1><p className="mt-0.5 type-caption font-bold text-neutral-500">{activeSeason.name} · Inscripción {formatMoney(roundSettings.registrationFee.amount)}/jugador</p></header>
    <div className="grid grid-cols-2 gap-2" data-season-finance-summary><FinanceStat label="Ingresado" value={formatMoney(summary.collected)} helper={`${summary.paidCount} pagos reales`} /><FinanceStat label="Pendiente" value={formatMoney(summary.pending)} helper={`${summary.pendingCount} jugadores`} /><FinanceStat label="Gastado" value={formatMoney(summary.spent)} helper={`${expenses.length} gastos`} /><FinanceStat label="Disponible" value={formatMoney(summary.available)} helper={`${formatMoney(summary.availablePerPlayer)} POR PERSONA`} negative={summary.available < 0} /></div>
    {canEdit ? <AppCard data-season-expense-form><p className="font-black">Registrar gasto</p><div className="mt-3 grid gap-3"><label><span className="type-caption font-black uppercase tracking-wide text-neutral-500">Título</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Bolas jornada de apertura" className="mt-1.5 w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-semibold outline-none" /></label><label><span className="type-caption font-black uppercase tracking-wide text-neutral-500">Importe</span><div className="mt-1.5 flex items-center rounded-2xl border border-neutral-200 bg-white px-3 py-2.5"><input type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className="min-w-0 flex-1 bg-transparent text-sm font-black outline-none" /><span className="font-black text-neutral-500">€</span></div></label></div><button type="button" onClick={() => void createExpense()} disabled={busy || !valid} className="mt-3 flex w-full items-center justify-center rounded-2xl bg-neutral-950 px-4 py-3 text-center text-sm font-black text-white disabled:bg-neutral-200 disabled:text-neutral-500">{busy ? "Guardando..." : "Añadir gasto"}</button>{error ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{error}</p> : null}</AppCard> : null}
    <AppCard><div className="flex items-center justify-between gap-3"><p className="font-black">Gastos registrados</p><span className="type-caption font-black text-neutral-500">{formatMoney(summary.spent)}</span></div>{expenses.length ? <div className="mt-3 divide-y divide-neutral-100">{expenses.map((expense) => <div key={expense.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-neutral-950">{expense.title}</p><p className="mt-0.5 type-caption font-semibold text-neutral-500">{dateLabel(expense.createdAt)}</p></div><p className="shrink-0 text-sm font-black text-neutral-950">{formatMoney(expense.amount)}</p>{canEdit ? <button type="button" aria-label={`Eliminar gasto ${expense.title}`} onClick={() => void deleteExpense(expense.id)} disabled={busy} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg font-black text-neutral-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30">×</button> : null}</div>)}</div> : <p className="mt-3 rounded-2xl bg-neutral-100 px-3 py-3 text-sm font-semibold text-neutral-600">Todavía no hay gastos registrados.</p>}</AppCard>
    <button type="button" disabled data-season-finance-report className="flex w-full items-center justify-center rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-center text-sm font-black text-neutral-500 shadow-sm disabled:cursor-not-allowed disabled:opacity-70">Generar informe de transparencia · Próximamente</button>
  </div>
}
