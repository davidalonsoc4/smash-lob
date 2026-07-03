import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dispatchPushForActivityEvent } from "@/lib/serverPushDispatch";

export const runtime = "nodejs";

function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export async function POST(request: Request) {
  const session = await auth();
  const currentEmail = normalizeEmail(session?.user?.email);
  const body = (await request.json().catch(() => null)) as {
    eventId?: string;
  } | null;
  const eventId = body?.eventId?.trim() ?? "";

  if (!currentEmail) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!eventId) {
    return NextResponse.json({ error: "missing_event" }, { status: 400 });
  }

  const result = await dispatchPushForActivityEvent(eventId);

  if (!result.ok && result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result);
}
