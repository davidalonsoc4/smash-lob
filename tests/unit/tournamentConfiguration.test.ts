import { describe, expect, it } from "vitest"
import { planRapidTournament, readLegacyRapidConfiguration } from "@/lib/tournamentConfiguration"
import { RAPID_TOURNAMENT } from "@/lib/rapidTournament"

const defaults = { ...RAPID_TOURNAMENT, pairing: "rotating" as const }
describe("shared rapid planning", () => {
  it("preserves the legacy 12/2 planning", () => {
    expect(planRapidTournament(defaults)).toMatchObject({ ok: true, matchCount: 12, minimumMatchesPerPlayer: 4, maximumMatchesPerPlayer: 4, minimumPlayingMinutesPerPlayer: 64, maximumRestRoundsPerPlayer: 2, safetyMinutes: 7, exactParticipationPossible: true })
    expect(readLegacyRapidConfiguration({})).toEqual(expect.objectContaining({ players: 12, courts: 2, rounds: 6, preparationMinutes: 2 }))
    expect(readLegacyRapidConfiguration({ preparationMinutes: 0, courts: 1 }).preparationMinutes).toBe(0)
  })
  it.each(Array.from({ length: 21 }, (_, i) => i + 4))("plans %i individuals without requiring multiples of four", players => {
    const plan = planRapidTournament({ ...defaults, players, courts: 6 })
    expect(plan.ok).toBe(true)
    if (!plan.ok) return
    expect(plan.maximumMatchesPerPlayer - plan.minimumMatchesPerPlayer).toBeLessThanOrEqual(1)
    expect(plan.activeCourts).toBe(Math.floor(players / 4))
    expect(plan.minimumPlayingMinutesPerPlayer).toBe(plan.minimumMatchesPerPlayer * 16)
  })
  it("reports unequal participation honestly and rejects impossible fixed teams", () => {
    expect(planRapidTournament({ ...defaults, players: 11 })).toMatchObject({ ok: true, exactParticipationPossible: false })
    expect(planRapidTournament({ ...defaults, players: 11, pairing: "fixed" })).toMatchObject({ ok: false, error: "fixed_pairs_require_even_players" })
    expect(planRapidTournament({ ...defaults, players: 24, courts: 1, rounds: 1 })).toMatchObject({ ok: false, error: "insufficient_matches_for_all_players" })
  })
  it("includes warmup and every transition, retaining two minutes of safety", () => {
    expect(planRapidTournament({ ...defaults, preparationMinutes: 7 })).toMatchObject({ ok: true, safetyMinutes: 2 })
    expect(planRapidTournament({ ...defaults, preparationMinutes: 8 })).toMatchObject({ ok: false, error: "insufficient_safety_margin" })
    expect(planRapidTournament({ ...defaults, rounds: 8, roundMinutes: 10, transitionMinutes: 1 })).toMatchObject({ ok: true, scheduledMinutes: 89 })
  })
  it.each([{ players: 25 }, { players: 3 }, { players: 8.5 }, { rounds: NaN }, { courts: 0 }, { roundMinutes: 0 }, { transitionMinutes: -1 }])("rejects invalid configuration %j", patch => {
    expect(planRapidTournament({ ...defaults, ...patch }).ok).toBe(false)
  })
})
