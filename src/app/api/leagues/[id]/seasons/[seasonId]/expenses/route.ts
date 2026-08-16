import { randomUUID } from "node:crypto"
import { NextResponse } from "next/server"
import { roundMoney } from "@/lib/courtBooking"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
type Access = Extract<Awaited<ReturnType<typeof getServerSeasonAdmin>>, { ok: true }>
type Body = { title?: unknown; amount?: unknown; expenseId?: unknown }
const cleanTitle = (value: unknown) => typeof value === "string" ? value.trim().slice(0, 120) : ""
const parseAmount = (value: unknown) => { const amount = Number(value); return Number.isFinite(amount) && amount > 0 ? roundMoney(amount) : null }

async function readFee(access: Access, seasonId: string) {
  const { data, error } = await access.actor.supabase.from("season_settings").select("registration_fee").eq("season_id", seasonId).maybeSingle()
  if (error) throw new Error("season_settings_lookup_failed")
  return normalizeSeasonRegistrationFee(data?.registration_fee)
}
async function writeFee(access: Access, seasonId: string, registrationFee: ReturnType<typeof normalizeSeasonRegistrationFee>) {
  const { data, error } = await access.actor.supabase.from("season_settings").update({ registration_fee: registrationFee }).eq("season_id", seasonId).select("season_id").maybeSingle()
  if (error || !data) throw new Error("season_settings_update_failed")
}
async function accessFor(params: Promise<{ id: string; seasonId: string }>) {
  const { id, seasonId } = await params
  if (!validateUuid(id) || !validateUuid(seasonId)) return { response: NextResponse.json({ error: "invalid_request" }, { status: 400 }) }
  const access = await getServerSeasonAdmin(id, seasonId, { requireMutable: true })
  if (!access.ok) return { response: NextResponse.json({ error: access.error }, { status: access.status }) }
  return { access, seasonId }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const resolved = await accessFor(params); if ("response" in resolved) return resolved.response
  const body = await parseJsonBody<Body>(request); const title = cleanTitle(body?.title); const amount = parseAmount(body?.amount)
  if (!title || amount === null) return NextResponse.json({ error: "invalid_expense" }, { status: 400 })
  try {
    const fee = await readFee(resolved.access, resolved.seasonId)
    if (!fee.enabled || fee.amount <= 0) return NextResponse.json({ error: "registration_not_enabled" }, { status: 409 })
    const registrationFee = { ...fee, expenses: [...fee.expenses, { id: randomUUID(), title, amount, createdAt: new Date().toISOString() }] }
    await writeFee(resolved.access, resolved.seasonId, registrationFee); return NextResponse.json({ registrationFee })
  } catch { return NextResponse.json({ error: "season_expense_create_failed" }, { status: 500 }) }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string; seasonId: string }> }) {
  const resolved = await accessFor(params); if ("response" in resolved) return resolved.response
  const body = await parseJsonBody<Body>(request); const expenseId = typeof body?.expenseId === "string" ? body.expenseId.trim() : ""
  if (!expenseId) return NextResponse.json({ error: "invalid_expense" }, { status: 400 })
  try {
    const fee = await readFee(resolved.access, resolved.seasonId)
    if (!fee.expenses.some((expense) => expense.id === expenseId)) return NextResponse.json({ error: "expense_not_found" }, { status: 404 })
    const registrationFee = { ...fee, expenses: fee.expenses.filter((expense) => expense.id !== expenseId) }
    await writeFee(resolved.access, resolved.seasonId, registrationFee); return NextResponse.json({ registrationFee })
  } catch { return NextResponse.json({ error: "season_expense_delete_failed" }, { status: 500 }) }
}
