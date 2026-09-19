import { describe, expect, it } from "vitest"
import { readFile } from "node:fs/promises"

describe("v1.15.4 Push resiliency", () => {
  it("queues transient failures for bounded, idempotent retries", async () => {
    const migration = await readFile("supabase/migrations/20260919120000_add_push_delivery_queue.sql", "utf8")
    const retry = await readFile("src/lib/serverPushRetry.ts", "utf8")
    const dispatch = await readFile("src/lib/serverPushDispatch.ts", "utf8")
    expect(migration).toContain("UNIQUE (event_id, subscription_id)")
    expect(retry).toContain("MAX_ATTEMPTS = 5")
    expect(retry).toContain("statusCode === 404 || statusCode === 410")
    expect(dispatch).toContain("enqueuePushRetry")
  })
})

describe("v1.15.4 season waitlist", () => {
  it("keeps FIFO ordering and turns a full roster into a waitlist entry", async () => {
    const migration = await readFile("supabase/migrations/20260919123000_add_season_waitlist.sql", "utf8")
    const route = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/waitlist/route.ts", "utf8")
    const registration = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/registration/route.ts", "utf8")
    expect(migration).toContain("UNIQUE (season_id, user_id)")
    expect(migration).toContain("season_waitlist_order_idx")
    expect(route).toContain("ascending: true")
    expect(registration).toContain("waitlisted: true")
    expect(route).toContain("export async function DELETE")
    expect(route).toContain("waitlist_leave_failed")
  })

  it("promotes the next player with a 48 hour confirmation window and exposes leave/position UI", async () => {
    const registration = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/registration/route.ts", "utf8")
    const confirm = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/waitlist/confirm/route.ts", "utf8")
    const screen = await readFile("src/components/season/SeasonRosterWaitingRoom.tsx", "utf8")
    expect(registration).toContain("48 * 60 * 60 * 1000")
    expect(confirm).toContain("waitlist_confirmation_expired")
    expect(screen).toContain("waitlistPosition")
    expect(screen).toContain("handleLeaveWaitlist")
  })

  it("keeps the queue reorderable and extracts destructive season controls", async () => {
    const positionMigration = await readFile("supabase/migrations/20260919124500_add_season_waitlist_position.sql", "utf8")
    const route = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/waitlist/route.ts", "utf8")
    const page = await readFile("src/app/admin/season/page.tsx", "utf8")
    const dangerZone = await readFile("src/components/admin/season/SeasonDangerZone.tsx", "utf8")
    expect(positionMigration).toContain("ADD COLUMN IF NOT EXISTS position")
    expect(route).toContain("export async function PUT")
    expect(route).toContain("orderedUserIds")
    expect(page).toContain("SeasonDangerZone")
    expect(dangerZone).toContain("handleDeleteSeason")
  })

  it("does not promote or confirm entries after registration closes", async () => {
    const registration = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/registration/route.ts", "utf8")
    const confirm = await readFile("src/app/api/leagues/[id]/seasons/[seasonId]/waitlist/confirm/route.ts", "utf8")
    expect(registration).toContain("registrationState?.registration_open === true")
    expect(registration).toContain("seasonState?.status === \"upcoming\"")
    expect(confirm).toContain("waitlist_registration_closed")
  })
})
