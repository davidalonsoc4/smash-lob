import { NextResponse } from "next/server"
import { normalizeSeasonRegistrationFee } from "@/lib/seasonRegistration"
import { getServerSeasonAdmin } from "@/lib/serverSeasonAccess"
import {
  isSeasonMutationError,
  updateServerSeasonRoundSettings,
} from "@/lib/serverSeasonMutations"
import { parseJsonBody, validateUuid } from "@/lib/serverRequest"
import type { SeasonRoundSettings } from "@/context/SeasonSettingsProvider"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateSeasonSettingsBody = {
  roundWindowMode?: unknown
  seasonStartsAt?: unknown
  roundWindowDays?: unknown
  requiresThreeSets?: unknown
  mvpSystem?: unknown
  resultConfirmationMode?: unknown
  manualActiveRound?: unknown
  manualCompletedRounds?: unknown
  registrationFee?: unknown
}

const dateOnlyPattern = /^\d{4}-\d{2}-\d{2}$/

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function parseRoundWindowMode(value: unknown): SeasonRoundSettings["roundWindowMode"] | null {
  return value === "none" || value === "fixed-days" ? value : null
}

function parseMvpSystem(value: unknown): SeasonRoundSettings["mvpSystem"] | null {
  return value === "none" || value === "automatic" || value === "voting"
    ? value
    : null
}

function parseResultConfirmationMode(
  value: unknown
): SeasonRoundSettings["resultConfirmationMode"] | null {
  return value === "required" || value === "optional" || value === "none"
    ? value
    : null
}

function parseOptionalDateOnly(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const cleanValue = cleanString(value)

  return dateOnlyPattern.test(cleanValue) ? cleanValue : null
}

function parseOptionalPositiveInteger(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null
  }

  const numberValue = Number(value)

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    return null
  }

  return numberValue
}

function parseManualCompletedRounds(value: unknown) {
  if (!Array.isArray(value)) {
    return null
  }

  const rounds = value
    .map((round) => Number(round))
    .filter((round) => Number.isInteger(round) && round > 0)
    .sort((firstRound, secondRound) => firstRound - secondRound)

  if (rounds.length !== value.length || new Set(rounds).size !== rounds.length) {
    return null
  }

  return rounds
}

function parseRegistrationFee(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null
  }

  return normalizeSeasonRegistrationFee(value)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonId: string }> }
) {
  const { id: leagueId, seasonId } = await params

  if (!validateUuid(leagueId) || !validateUuid(seasonId)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  const access = await getServerSeasonAdmin(leagueId, seasonId)

  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status })
  }

  const body = await parseJsonBody<UpdateSeasonSettingsBody>(request)
  const roundWindowMode = parseRoundWindowMode(body?.roundWindowMode)
  const seasonStartsAt =
    roundWindowMode === "fixed-days"
      ? parseOptionalDateOnly(body?.seasonStartsAt)
      : null
  const roundWindowDays =
    roundWindowMode === "fixed-days"
      ? parseOptionalPositiveInteger(body?.roundWindowDays)
      : null
  const requiresThreeSets =
    typeof body?.requiresThreeSets === "boolean" ? body.requiresThreeSets : null
  const mvpSystem = parseMvpSystem(body?.mvpSystem)
  const resultConfirmationMode = parseResultConfirmationMode(
    body?.resultConfirmationMode
  )
  const manualActiveRound = parseOptionalPositiveInteger(body?.manualActiveRound)
  const manualCompletedRounds = parseManualCompletedRounds(body?.manualCompletedRounds)
  const registrationFee = parseRegistrationFee(body?.registrationFee)

  if (
    !roundWindowMode ||
    requiresThreeSets === null ||
    !mvpSystem ||
    !resultConfirmationMode ||
    !manualCompletedRounds ||
    !registrationFee
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (
    roundWindowMode === "fixed-days" &&
    (!seasonStartsAt || roundWindowDays === null)
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  if (
    (manualActiveRound !== null && manualActiveRound > access.season.totalRounds) ||
    manualCompletedRounds.some((round) => round > access.season.totalRounds) ||
    (manualActiveRound !== null && manualCompletedRounds.includes(manualActiveRound))
  ) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 })
  }

  try {
    await updateServerSeasonRoundSettings({
      supabase: access.actor.supabase,
      leagueId,
      seasonId,
      settings: {
        roundWindowMode,
        seasonStartsAt,
        roundWindowDays,
        requiresThreeSets,
        mvpSystem,
        resultConfirmationMode,
        manualActiveRound,
        manualCompletedRounds,
        registrationFee,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (isSeasonMutationError(error)) {
      return NextResponse.json({ error: error.code }, { status: error.status })
    }

    return NextResponse.json(
      { error: "season_settings_update_failed" },
      { status: 500 }
    )
  }
}
