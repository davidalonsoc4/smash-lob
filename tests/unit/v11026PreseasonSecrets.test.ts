import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import type { MatchData } from "@/context/MatchDataProvider"
import type { LeagueLocation } from "@/lib/leagueLocations"
import {
  detectPreseasonOpening,
  getPreseasonAccessPhase,
  getSafePreseasonLocation,
  redactPreseasonMatch,
} from "@/lib/preseasonSecrets"

const read = (path: string) => readFile(path, "utf8")

const pando: LeagueLocation = {
  id: "pando",
  name: "Pando",
  town: "Portugalete",
  address: "Paseo de la Canilla, Portugalete",
  detail: null,
  courtCount: 2,
  selectedCourt: null,
  googlePlaceId: "place-pando",
  googlePlaceName: "Polideportivo Pando",
  googleMapsUrl: "https://maps.google.com/?q=pando",
  latitude: 43.319,
  longitude: -3.021,
}

const locationValue = (court: string) => JSON.stringify({ ...pando, selectedCourt: court })

function match(overrides: Partial<MatchData> = {}): MatchData {
  return {
    id: "match-1",
    leagueId: "league-1",
    seasonId: "season-1",
    round: 1,
    teamA: ["p1", "p2"],
    teamB: ["p3", "p4"],
    pointsA: 2,
    pointsB: 1,
    sets: [{ a: 6, b: 4 }],
    status: "scheduled",
    scheduledAt: "2026-09-27T08:00:00.000Z",
    dateLabel: "27 sep",
    location: locationValue("Pista 1"),
    resultRecordedAt: "2026-09-27T10:00:00.000Z",
    resultReportedByPlayerId: "p1",
    resultLocked: true,
    rankingCounts: true,
    resultCounts: true,
    coordinationStatus: null,
    incidentType: null,
    incidentStatus: null,
    incidentReason: null,
    incidentNotes: null,
    incidentCreatedAt: null,
    incidentResolvedAt: null,
    resolutionType: null,
    substitutions: [],
    courtBooking: {
      isReserved: true,
      reservations: [],
      ballPurchases: [],
      transfers: [],
      updatedAt: null,
    },
    ...overrides,
  } as MatchData
}

describe("v1.10.26 preseason secret phase", () => {
  it("derives locked, secrets and active phases without adding lifecycle statuses", () => {
    const startsAt = "2026-09-27T08:00:00.000Z"
    expect(getPreseasonAccessPhase({ status: "upcoming", scheduledStartAt: startsAt, secretDaysBefore: 7, now: Date.parse("2026-09-19T08:00:00.000Z") })).toBe("locked")
    expect(getPreseasonAccessPhase({ status: "upcoming", scheduledStartAt: startsAt, secretDaysBefore: 7, now: Date.parse("2026-09-20T08:00:00.000Z") })).toBe("secrets")
    expect(getPreseasonAccessPhase({ status: "upcoming", scheduledStartAt: startsAt, secretDaysBefore: 7, now: Date.parse(startsAt) })).toBe("active")
    expect(getPreseasonAccessPhase({ status: "upcoming", scheduledStartAt: startsAt, secretDaysBefore: null, now: Date.parse("2026-09-26T08:00:00.000Z") })).toBe("locked")
  })

  it("detects one opening when every round-one match shares Madrid date and global venue despite different courts and times", () => {
    const opening = detectPreseasonOpening({
      matches: [
        match({ id: "m1", scheduledAt: "2026-09-27T08:00:00.000Z", location: locationValue("Pista 1") }),
        match({ id: "m2", scheduledAt: "2026-09-27T08:00:00.000Z", location: locationValue("Pista 2") }),
        match({ id: "m3", scheduledAt: "2026-09-27T09:30:00.000Z", location: locationValue("Pista 1") }),
        match({ id: "m4", scheduledAt: "2026-09-27T09:30:00.000Z", location: locationValue("Pista 2") }),
      ],
      leagueLocations: [pando],
    })

    expect(opening).toMatchObject({
      round: 1,
      startsAt: "2026-09-27T08:00:00.000Z",
      endsAt: "2026-09-27T11:30:00.000Z",
      matchCount: 4,
    })
    expect(opening?.locationLabel).toContain("Pando")
    expect(opening?.locationLabel).not.toContain("Pista")
    expect(opening?.calendarLocation).not.toContain("Pista")
  })

  it("does not invent an opening when round one is incomplete, spans dates or uses different venues", () => {
    expect(detectPreseasonOpening({ matches: [match(), match({ id: "m2", scheduledAt: null })], leagueLocations: [pando] })).toBeNull()
    expect(detectPreseasonOpening({ matches: [match(), match({ id: "m2", scheduledAt: "2026-09-28T08:00:00.000Z" })], leagueLocations: [pando] })).toBeNull()

    const other = { ...pando, id: "other", name: "Lasesarre", googlePlaceId: "place-lasesarre" }
    expect(detectPreseasonOpening({
      matches: [match(), match({ id: "m2", location: JSON.stringify({ ...other, selectedCourt: "Pista 1" }) })],
      leagueLocations: [pando, other],
    })).toBeNull()
  })

  it("strips court identity from safe opening locations", () => {
    const safe = getSafePreseasonLocation({ scheduleLocation: locationValue("Pista 2"), leagueLocations: [pando] })
    expect(safe?.label).toBe("Portugalete - Pando")
    expect(safe?.label).not.toContain("Pista 2")
    expect(safe?.calendarLocation).not.toContain("Pista 2")
    expect(safe?.storedValue).not.toContain('"selectedCourt":"Pista 2"')
  })

  it("redacts pairings and all schedule metadata while locked", () => {
    const redacted = redactPreseasonMatch({ match: match(), phase: "locked", leagueLocations: [pando] })
    expect(redacted.teamA).toEqual([])
    expect(redacted.teamB).toEqual([])
    expect(redacted.scheduledAt).toBeNull()
    expect(redacted.location).toBeNull()
    expect(redacted.sets).toEqual([])
    expect(redacted.pointsA).toBeNull()
    expect(redacted.courtBooking.isReserved).toBe(false)
  })

  it("exposes only safe round-one schedule metadata during secrets and keeps later rounds hidden", () => {
    const roundOne = redactPreseasonMatch({ match: match(), phase: "secrets", leagueLocations: [pando] })
    expect(roundOne.teamA).toEqual([])
    expect(roundOne.teamB).toEqual([])
    expect(roundOne.scheduledAt).toBe("2026-09-27T08:00:00.000Z")
    expect(roundOne.location).not.toContain("Pista 1")

    const roundTwo = redactPreseasonMatch({ match: match({ round: 2 }), phase: "secrets", leagueLocations: [pando] })
    expect(roundTwo.scheduledAt).toBeNull()
    expect(roundTwo.location).toBeNull()
  })

  it("persists the setting, redacts access snapshots server-side and keeps admins exempt", async () => {
    const [migration, access, settingsApi, createApi, mutations] = await Promise.all([
      read("supabase/migrations/20260820235500_add_preseason_secret_phase.sql"),
      read("src/app/api/access/route.ts"),
      read("src/app/api/leagues/[id]/seasons/[seasonId]/settings/route.ts"),
      read("src/app/api/leagues/[id]/seasons/route.ts"),
      read("src/lib/serverSeasonMutations.ts"),
    ])

    expect(migration).toContain("preseason_secret_days_before integer")
    expect(migration).toContain("BETWEEN 1 AND 90")
    expect(settingsApi).toContain("preseasonSecretDaysBefore")
    expect(createApi).toContain("preseasonSecretDaysBefore")
    expect(mutations).toContain("preseason_secret_days_before")
    expect(access).toContain("redactPreseasonMatch")
    expect(access).toContain("preseasonSecretSettingsResult.error ? []")
    expect(access).toContain("canSeeCompetitionAdminData(hydratedMatch.leagueId)")
    expect(access).toContain('if (phase !== "active")')
  })

  it("suppresses existing match activity and push side channels until scheduled start", async () => {
    const [activity, push, matchAccess, availability] = await Promise.all([
      read("src/lib/serverActivity.ts"),
      read("src/lib/serverPushDispatch.ts"),
      read("src/lib/serverMatchAccess.ts"),
      read("src/app/api/leagues/[id]/matches/[matchId]/availability/route.ts"),
    ])

    expect(activity).toContain("hiddenMatchIds")
    expect(activity).toContain("!viewer.isCompetitionAdmin")
    expect(activity).toContain("event.matchId")
    expect(push).toContain('reason: "scheduled_season_prestart"')
    expect(push).toContain('seasonRow?.status === "upcoming"')
    expect(push).toContain("scheduledStartMs > Date.now()")
    expect(matchAccess).toContain("(!user.isSuperuser || !isAdmin)")
    expect(matchAccess).toContain("experienceMode")
    expect(matchAccess).toContain('seasonRow.status === "upcoming" && !isAdmin')
    expect(availability).toContain("getServerMatchActor(matchId, { requireLeagueAccess: true })")
    expect(availability).toContain("access.actor.match.participantIds")
  })

  it("shows the secret opening on HOME and creates a pairing-free calendar event", async () => {
    const [home, countdown, calendar, settings] = await Promise.all([
      read("src/app/page.tsx"),
      read("src/components/season/SeasonStartCountdown.tsx"),
      read("src/components/season/PreseasonOpeningCalendarButton.tsx"),
      read("src/components/season/ScheduledStartSettingsPanel.tsx"),
    ])

    expect(home).toContain("detectPreseasonOpening")
    expect(home).toContain("preseasonSecretDaysBefore={playerPreseasonSecretDaysBefore}")
    expect(countdown).toContain('data-preseason-phase="secrets"')
    expect(countdown).toContain('tx("JORNADA DE APERTURA")')
    expect(countdown).toContain('tx("¡NOVEDADES!")')
    expect(countdown).toContain('tx("DESCUBRIRÁS TODOS LOS EMPAREJAMIENTOS EN")')
    expect(countdown).not.toContain('tx("EMPAREJAMIENTOS SECRETOS")')
    expect(calendar).toContain('text: `${tx("Jornada 1")} · ${leagueName}`')
    expect(calendar).not.toContain("teamA")
    expect(calendar).not.toContain("teamB")
    expect(calendar).not.toContain("player")
    expect(settings).toContain("Activar Fase secretos")
    expect(settings).toContain("días antes del inicio")
  })
})
