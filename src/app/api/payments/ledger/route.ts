import { NextResponse } from "next/server"
import type { CourtBookingTransfer } from "@/context/MatchDataProvider"
import type { PaymentLedgerItem } from "@/lib/paymentLedger"
import { requireAuthenticatedAppUser } from "@/lib/serverAuth"
import { enforceRequestRateLimit } from "@/lib/serverRateLimit"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LeagueMembershipRow = {
  league_id: string
  player_id: string | null
}

type LeagueMatchRow = {
  id: string
  league_id: string
  season_id: string
  round: number
  scheduled_at: string | null
  booking_transfers: unknown
}

type NamedRow = {
  id: string
  name?: string | null
  display_name?: string | null
  league_id?: string
}

type PersonalParticipantRow = {
  id: string
  match_id: string
  user_id: string | null
  display_name: string
}

type PersonalMatchRow = {
  id: string
  played_at: string | null
}

type PersonalBookingRow = {
  match_id: string
  booking_transfers: unknown
}

function uniqueStrings(values: Array<string | null | undefined>) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

function parseTransfers(value: unknown): CourtBookingTransfer[] {
  if (!Array.isArray(value)) return []

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return []

    const transfer = candidate as Record<string, unknown>
    const id = typeof transfer.id === "string" ? transfer.id : ""
    const fromPlayerId =
      typeof transfer.fromPlayerId === "string" ? transfer.fromPlayerId : ""
    const toPlayerId =
      typeof transfer.toPlayerId === "string" ? transfer.toPlayerId : ""
    const amount = Number(transfer.amount)

    if (!id || !fromPlayerId || !toPlayerId || !Number.isFinite(amount) || amount <= 0) {
      return []
    }

    return [{
      id,
      fromPlayerId,
      toPlayerId,
      amount,
      isPaid: Boolean(transfer.isPaid),
      paidAt: typeof transfer.paidAt === "string" ? transfer.paidAt : null,
    }]
  })
}

function eventTime(value: string | null) {
  if (!value) return 0
  const timestamp = Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : 0
}

export async function GET(request: Request) {
  const rateLimited = await enforceRequestRateLimit({
    request,
    scope: "payment_ledger_lookup",
    limit: 60,
    windowMs: 60_000,
  })
  if (rateLimited) return rateLimited

  const authResult = await requireAuthenticatedAppUser()
  if (!authResult.ok) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { actor } = authResult

  try {
    const [membershipsResult, personalMembershipsResult] = await Promise.all([
      actor.supabase
        .from("league_memberships")
        .select("league_id,player_id")
        .eq("user_id", actor.user.id),
      actor.supabase
        .from("personal_match_participants")
        .select("id,match_id,user_id,display_name")
        .eq("user_id", actor.user.id),
    ])

    if (membershipsResult.error || personalMembershipsResult.error) {
      throw new Error("payment_ledger_membership_lookup_failed")
    }

    const memberships = (membershipsResult.data ?? []) as LeagueMembershipRow[]
    const leaguePlayerByLeagueId = new Map(
      memberships
        .filter((membership) => membership.player_id)
        .map((membership) => [membership.league_id, membership.player_id as string]),
    )
    const leagueIds = [...leaguePlayerByLeagueId.keys()]

    const currentPersonalParticipants = (personalMembershipsResult.data ?? []) as PersonalParticipantRow[]
    const personalMatchIds = uniqueStrings(
      currentPersonalParticipants.map((participant) => participant.match_id),
    )

    const [leagueMatchesResult, leaguesResult, seasonsResult, playersResult] =
      leagueIds.length > 0
        ? await Promise.all([
            actor.supabase
              .from("matches")
              .select("id,league_id,season_id,round,scheduled_at,booking_transfers")
              .in("league_id", leagueIds),
            actor.supabase.from("leagues").select("id,name").in("id", leagueIds),
            actor.supabase.from("seasons").select("id,name,league_id").in("league_id", leagueIds),
            actor.supabase
              .from("players")
              .select("id,league_id,display_name")
              .in("league_id", leagueIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ]

    if (
      leagueMatchesResult.error ||
      leaguesResult.error ||
      seasonsResult.error ||
      playersResult.error
    ) {
      throw new Error("payment_ledger_league_lookup_failed")
    }

    const [personalMatchesResult, personalBookingsResult, personalParticipantsResult] =
      personalMatchIds.length > 0
        ? await Promise.all([
            actor.supabase.from("personal_matches").select("id,played_at").in("id", personalMatchIds),
            actor.supabase
              .from("personal_match_bookings")
              .select("match_id,booking_transfers")
              .in("match_id", personalMatchIds),
            actor.supabase
              .from("personal_match_participants")
              .select("id,match_id,user_id,display_name")
              .in("match_id", personalMatchIds),
          ])
        : [
            { data: [], error: null },
            { data: [], error: null },
            { data: [], error: null },
          ]

    if (
      personalMatchesResult.error ||
      personalBookingsResult.error ||
      personalParticipantsResult.error
    ) {
      throw new Error("payment_ledger_personal_lookup_failed")
    }

    const leagueNames = new Map(
      ((leaguesResult.data ?? []) as NamedRow[]).map((league) => [league.id, league.name ?? "Liga"]),
    )
    const seasonNames = new Map(
      ((seasonsResult.data ?? []) as NamedRow[]).map((season) => [season.id, season.name ?? "Temporada"]),
    )
    const playerNames = new Map(
      ((playersResult.data ?? []) as NamedRow[]).map((player) => [
        player.id,
        player.display_name ?? "Jugador",
      ]),
    )

    const items: PaymentLedgerItem[] = []

    ;((leagueMatchesResult.data ?? []) as LeagueMatchRow[]).forEach((match) => {
      const currentPlayerId = leaguePlayerByLeagueId.get(match.league_id)
      if (!currentPlayerId) return

      parseTransfers(match.booking_transfers).forEach((transfer) => {
        if (
          transfer.fromPlayerId !== currentPlayerId &&
          transfer.toPlayerId !== currentPlayerId
        ) {
          return
        }

        items.push({
          source: "league",
          matchId: match.id,
          transferId: transfer.id,
          direction: transfer.fromPlayerId === currentPlayerId ? "owe" : "owed",
          amount: transfer.amount,
          isPaid: transfer.isPaid,
          paidAt: transfer.paidAt,
          eventAt: match.scheduled_at,
          fromName: playerNames.get(transfer.fromPlayerId) ?? "Jugador",
          toName: playerNames.get(transfer.toPlayerId) ?? "Jugador",
          leagueId: match.league_id,
          leagueName: leagueNames.get(match.league_id) ?? "Liga",
          seasonId: match.season_id,
          seasonName: seasonNames.get(match.season_id) ?? "Temporada",
          round: Number.isFinite(match.round) ? match.round : null,
          href: `/match/${match.id}`,
        })
      })
    })

    const currentParticipantByMatchId = new Map(
      currentPersonalParticipants.map((participant) => [participant.match_id, participant.id]),
    )
    const personalMatchById = new Map(
      ((personalMatchesResult.data ?? []) as PersonalMatchRow[]).map((match) => [match.id, match]),
    )
    const personalParticipantNames = new Map(
      ((personalParticipantsResult.data ?? []) as PersonalParticipantRow[]).map((participant) => [
        participant.id,
        participant.display_name,
      ]),
    )

    ;((personalBookingsResult.data ?? []) as PersonalBookingRow[]).forEach((booking) => {
      const currentParticipantId = currentParticipantByMatchId.get(booking.match_id)
      if (!currentParticipantId) return

      parseTransfers(booking.booking_transfers).forEach((transfer) => {
        if (
          transfer.fromPlayerId !== currentParticipantId &&
          transfer.toPlayerId !== currentParticipantId
        ) {
          return
        }

        const match = personalMatchById.get(booking.match_id)
        items.push({
          source: "friendly",
          matchId: booking.match_id,
          transferId: transfer.id,
          direction: transfer.fromPlayerId === currentParticipantId ? "owe" : "owed",
          amount: transfer.amount,
          isPaid: transfer.isPaid,
          paidAt: transfer.paidAt,
          eventAt: match?.played_at ?? null,
          fromName: personalParticipantNames.get(transfer.fromPlayerId) ?? "Jugador",
          toName: personalParticipantNames.get(transfer.toPlayerId) ?? "Jugador",
          leagueId: null,
          leagueName: null,
          seasonId: null,
          seasonName: null,
          round: null,
          href: `/personal-matches/${booking.match_id}`,
        })
      })
    })

    items.sort((left, right) => eventTime(right.eventAt) - eventTime(left.eventAt))

    return NextResponse.json({ items })
  } catch {
    return NextResponse.json({ error: "payment_ledger_lookup_failed" }, { status: 500 })
  }
}
