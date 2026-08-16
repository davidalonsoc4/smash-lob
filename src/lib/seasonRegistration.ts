import { roundMoney } from "@/lib/courtBooking"

export type SeasonRegistrationPayment = { playerId: string; isPaid: boolean; paidAt: string | null }
export type SeasonRegistrationExpense = { id: string; title: string; amount: number; createdAt: string }
export type SeasonRegistrationFee = { enabled: boolean; amount: number; purpose: string; payments: SeasonRegistrationPayment[]; expenses: SeasonRegistrationExpense[] }
export const emptySeasonRegistrationFee: SeasonRegistrationFee = { enabled: false, amount: 0, purpose: "", payments: [], expenses: [] }
const normalizeAmount = (value: unknown) => { const amount = Number(value); return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : 0 }
const toRecord = (value: unknown): Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : {}

export function normalizeSeasonRegistrationFee(value: unknown): SeasonRegistrationFee {
  const item = toRecord(value)
  const expenses = Array.isArray(item.expenses) ? item.expenses.map((raw) => { const expense = toRecord(raw); const id = String(expense.id ?? "").trim(); const title = String(expense.title ?? "").trim(); const amount = normalizeAmount(expense.amount); const createdAt = typeof expense.createdAt === "string" ? expense.createdAt : ""; return id && title && amount > 0 && createdAt ? { id, title, amount, createdAt } : null }).filter((expense): expense is SeasonRegistrationExpense => Boolean(expense)) : []
  const payments = Array.isArray(item.payments) ? item.payments.map((raw) => { const payment = toRecord(raw); const playerId = String(payment.playerId ?? ""); return playerId ? { playerId, isPaid: Boolean(payment.isPaid), paidAt: typeof payment.paidAt === "string" ? payment.paidAt : null } : null }).filter((payment): payment is SeasonRegistrationPayment => Boolean(payment)) : []
  return { enabled: Boolean(item.enabled), amount: normalizeAmount(item.amount), purpose: typeof item.purpose === "string" ? item.purpose.trim() : "", payments, expenses }
}

export function buildSeasonRegistrationFee({ enabled, amount, purpose = "", playerIds, paidPlayerIds = [] }: { enabled: boolean; amount: number; purpose?: string; playerIds: string[]; paidPlayerIds?: string[] }): SeasonRegistrationFee {
  const normalizedAmount = enabled ? normalizeAmount(amount) : 0; const uniquePlayerIds = [...new Set(playerIds.filter(Boolean))]; const paid = new Set(paidPlayerIds.filter(Boolean)); const paidAt = new Date().toISOString()
  return { enabled: enabled && normalizedAmount > 0, amount: normalizedAmount, purpose: enabled ? purpose.trim() : "", payments: uniquePlayerIds.map((playerId) => ({ playerId, isPaid: paid.has(playerId), paidAt: paid.has(playerId) ? paidAt : null })), expenses: [] }
}

export function ensureSeasonRegistrationPlayers({ registrationFee, playerIds }: { registrationFee: SeasonRegistrationFee; playerIds: string[] }): SeasonRegistrationFee {
  const byPlayer = new Map(registrationFee.payments.map((payment) => [payment.playerId, payment]))
  return { ...registrationFee, payments: [...new Set(playerIds.filter(Boolean))].map((playerId) => byPlayer.get(playerId) ?? { playerId, isPaid: false, paidAt: null }) }
}

export function setSeasonRegistrationPaymentPaidStatus({ registrationFee, playerId, isPaid }: { registrationFee: SeasonRegistrationFee; playerId: string; isPaid: boolean }): SeasonRegistrationFee {
  const next = { playerId, isPaid, paidAt: isPaid ? new Date().toISOString() : null }; const exists = registrationFee.payments.some((payment) => payment.playerId === playerId)
  return { ...registrationFee, payments: exists ? registrationFee.payments.map((payment) => payment.playerId === playerId ? next : payment) : [...registrationFee.payments, next] }
}

export function getSeasonRegistrationPendingPayments({ registrationFee, playerIds, settledPlayerIds = [] }: { registrationFee: SeasonRegistrationFee; playerIds: string[]; settledPlayerIds?: string[] }) {
  if (!registrationFee.enabled || registrationFee.amount <= 0) return []
  const byPlayer = new Map(registrationFee.payments.map((payment) => [payment.playerId, payment])); const settled = new Set(settledPlayerIds.filter(Boolean))
  return [...new Set(playerIds.filter(Boolean))].filter((playerId) => !settled.has(playerId) && !byPlayer.get(playerId)?.isPaid)
}

export function isSeasonRegistrationSettled(input: Parameters<typeof getSeasonRegistrationPendingPayments>[0]) { return getSeasonRegistrationPendingPayments(input).length === 0 }
export function getSeasonRegistrationExpenseTotal(registrationFee: SeasonRegistrationFee) { return roundMoney(registrationFee.expenses.reduce((total, expense) => total + expense.amount, 0)) }
export function getSeasonRegistrationCollectedAmount({ registrationFee, playerIds }: { registrationFee: SeasonRegistrationFee; playerIds: string[] }) {
  if (!registrationFee.enabled || registrationFee.amount <= 0) return 0
  const players = new Set(playerIds.filter(Boolean)); return roundMoney(registrationFee.payments.filter((payment) => players.has(payment.playerId) && payment.isPaid).length * registrationFee.amount)
}
export function getSeasonRegistrationFinanceSummary({ registrationFee, playerIds, settledPlayerIds = [] }: { registrationFee: SeasonRegistrationFee; playerIds: string[]; settledPlayerIds?: string[] }) {
  const collected = getSeasonRegistrationCollectedAmount({ registrationFee, playerIds }); const pendingIds = getSeasonRegistrationPendingPayments({ registrationFee, playerIds, settledPlayerIds }); const spent = getSeasonRegistrationExpenseTotal(registrationFee)
  return { collected, pending: roundMoney(pendingIds.length * registrationFee.amount), spent, available: roundMoney(collected - spent), paidCount: registrationFee.payments.filter((payment) => playerIds.includes(payment.playerId) && payment.isPaid).length, pendingCount: pendingIds.length }
}
