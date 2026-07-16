import { NextResponse } from "next/server";
import { isQaModeEnabled } from "@/lib/qaMode";
import type { QaActionInput } from "@/lib/qaTypes";
import { fetchQaSnapshot, runQaAction } from "@/lib/serverQa";
import { getServerLeagueActor } from "@/lib/serverLeagueAccess";
import { parseJsonBody, validateUuid } from "@/lib/serverRequest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function disabledResponse() {
  return NextResponse.json(
    { ok: false, error: "qa_mode_disabled" },
    { status: 404 },
  );
}

const qaActionErrors = new Set([
  "actor_not_in_match",
  "invalid_dispute_actor",
  "invalid_vote",
  "match_not_found",
  "match_requires_four_players",
  "missing_actor_player",
  "missing_match_id",
  "missing_round_context",
  "missing_selected_player",
  "missing_tie_players",
  "missing_vote_players",
  "mvp_voting_not_enabled",
  "required_confirmations_not_enabled",
  "reset_finished_match_before_scheduling",
  "result_confirmations_disabled",
  "result_is_disputed",
  "result_not_recorded",
  "round_without_matches",
  "scenario_not_possible",
  "tie_not_possible",
  "unsupported_qa_action",
]);

function getKnownQaError(error: unknown, fallback: string) {
  return error instanceof Error && qaActionErrors.has(error.message)
    ? error.message
    : fallback;
}

function parseOptionalUuid(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  const cleanValue = value.trim();

  if (!cleanValue) {
    return undefined;
  }

  return validateUuid(cleanValue) ?? undefined;
}

export async function GET(request: Request) {
  if (!isQaModeEnabled()) {
    return disabledResponse();
  }

  const leagueId = validateUuid(
    new URL(request.url).searchParams.get("leagueId"),
  );

  if (!leagueId) {
    return NextResponse.json(
      { ok: false, error: "missing_league_id" },
      { status: 400 },
    );
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true });

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: access.status },
    );
  }

  try {
    const snapshot = await fetchQaSnapshot({
      actor: access.actor,
      leagueId,
    });

    return NextResponse.json({ ok: true, snapshot });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "qa_snapshot_failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isQaModeEnabled()) {
    return disabledResponse();
  }

  const body = await parseJsonBody<QaActionInput>(request);
  const leagueId = validateUuid(body?.leagueId);
  const seasonId = parseOptionalUuid(body?.seasonId);
  const matchId = parseOptionalUuid(body?.matchId);
  const actorPlayerId = parseOptionalUuid(body?.actorPlayerId);
  const selectedPlayerId = parseOptionalUuid(body?.selectedPlayerId);
  const secondaryPlayerId = parseOptionalUuid(body?.secondaryPlayerId);
  const hasInvalidOptionalId =
    (typeof body?.seasonId === "string" &&
      body.seasonId.trim().length > 0 &&
      !seasonId) ||
    (typeof body?.matchId === "string" &&
      body.matchId.trim().length > 0 &&
      !matchId) ||
    (typeof body?.actorPlayerId === "string" &&
      body.actorPlayerId.trim().length > 0 &&
      !actorPlayerId) ||
    (typeof body?.selectedPlayerId === "string" &&
      body.selectedPlayerId.trim().length > 0 &&
      !selectedPlayerId) ||
    (typeof body?.secondaryPlayerId === "string" &&
      body.secondaryPlayerId.trim().length > 0 &&
      !secondaryPlayerId);

  if (!body?.action || !leagueId || hasInvalidOptionalId) {
    return NextResponse.json(
      { ok: false, error: "invalid_qa_action" },
      { status: 400 },
    );
  }

  const access = await getServerLeagueActor(leagueId, { requireAdmin: true });

  if (!access.ok) {
    return NextResponse.json(
      { ok: false, error: access.error },
      { status: access.status },
    );
  }

  try {
    const result = await runQaAction({
      actor: access.actor,
      input: {
        ...body,
        leagueId,
        seasonId,
        matchId,
        actorPlayerId,
        selectedPlayerId,
        secondaryPlayerId,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: getKnownQaError(error, "qa_action_failed"),
      },
      { status: 400 },
    );
  }
}
