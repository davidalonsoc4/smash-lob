import { NextResponse } from "next/server";
import { isQaModeEnabled } from "@/lib/qaMode";
import { fetchQaSnapshot, runQaAction, type QaActionInput } from "@/lib/serverQa";
import { getServerLeagueActor } from "@/lib/serverLeagueAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function disabledResponse() {
  return NextResponse.json(
    { ok: false, error: "qa_mode_disabled" },
    { status: 404 },
  );
}

export async function GET(request: Request) {
  if (!isQaModeEnabled()) {
    return disabledResponse();
  }

  const leagueId = new URL(request.url).searchParams.get("leagueId")?.trim();

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
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "qa_snapshot_failed",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!isQaModeEnabled()) {
    return disabledResponse();
  }

  const body = (await request.json().catch(() => null)) as QaActionInput | null;
  const leagueId = body?.leagueId?.trim();

  if (!body?.action || !leagueId) {
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
      input: { ...body, leagueId },
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "qa_action_failed",
      },
      { status: 400 },
    );
  }
}
