import { describe, expect, it } from "vitest"
import { createProgressItem, hasCompletedCurrentTour } from "@/features/onboarding/progress"
import { getOnboardingTours, getTourForPathname } from "@/features/onboarding/tours"

describe("guided onboarding", () => {
  const playerAudience = {
    isSuperuser: false,
    isSpectator: false,
    isLeagueAdmin: false,
  }

  it("offers contextual tours for the main player screens", () => {
    const tours = getOnboardingTours("es").filter((tour) => tour.audience(playerAudience))
    expect(tours.map((tour) => tour.key)).toEqual([
      "app-introduction",
      "home",
      "matches",
      "ranking",
      "statistics",
    ])
    expect(getTourForPathname({ pathname: "/matches", locale: "es", audience: playerAudience })?.key).toBe("matches")
  })

  it("only exposes season administration to managers", () => {
    expect(getOnboardingTours("es").find((tour) => tour.key === "season-admin")?.audience(playerAudience)).toBe(false)
    expect(getOnboardingTours("es").find((tour) => tour.key === "season-admin")?.audience({ ...playerAudience, isLeagueAdmin: true })).toBe(true)
  })

  it("respects tour versions when deciding whether to show again", () => {
    const tour = getOnboardingTours("es").find((item) => item.key === "home")!
    const progress = {
      home: createProgressItem({ tourKey: "home", tourVersion: tour.version, status: "completed" }),
    }
    expect(hasCompletedCurrentTour(progress, tour)).toBe(true)
    expect(hasCompletedCurrentTour(progress, { ...tour, version: tour.version + 1 })).toBe(false)
  })
})
