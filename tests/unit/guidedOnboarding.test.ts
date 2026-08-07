import { describe, expect, it } from "vitest"
import { createProgressItem, hasCompletedCurrentTour } from "@/features/onboarding/progress"
import { getOnboardingTours, getTourForPathname, getTourStepsForLaunch } from "@/features/onboarding/tours"

describe("guided onboarding", () => {
  const playerAudience = {
    isSuperuser: false,
    isSpectator: false,
    isLeagueAdmin: false,
  }

  it("offers contextual tours for the main player screens", () => {
    const tours = getOnboardingTours("es").filter((tour) => tour.audience(playerAudience))
    expect(tours.map((tour) => tour.key)).toEqual([
      "home",
      "matches",
      "ranking",
      "statistics",
      "settings",
    ])
    expect(getTourForPathname({ pathname: "/matches", locale: "es", audience: playerAudience })?.key).toBe("matches")
  })


  it("keeps the home header and removes repeated header explanations elsewhere", () => {
    const tours = getOnboardingTours("es")
    const home = tours.find((tour) => tour.key === "home")!
    expect(home.steps[0]).toMatchObject({
      firstRunOnly: true,
      wide: true,
      title: "Bienvenido a Smash & Lob",
    })
    expect(home.steps[0]?.selector).toBeUndefined()
    expect(home.steps.slice(-5).map((step) => step.selector)).toEqual([
      "[data-tour='floating-settings']",
      "[data-tour='floating-notifications']",
      "[data-tour='floating-share-spectators']",
      "[data-tour='floating-invite-players']",
      "[data-tour='floating-help']",
    ])

    const firstRunSteps = getTourStepsForLaunch(home, { includeFirstRunOnly: true })
    const repeatedSteps = getTourStepsForLaunch(home)
    expect(firstRunSteps[0]?.title).toBe("Bienvenido a Smash & Lob")
    expect(repeatedSteps[0]?.selector).toBe("[data-tour='home-header']")
    expect(repeatedSteps.some((step) => step.firstRunOnly)).toBe(false)

    for (const key of ["matches", "ranking", "statistics", "season-admin"] as const) {
      const tour = tours.find((item) => item.key === key)!
      expect(tour.steps.some((step) => step.selector?.includes("header"))).toBe(false)
    }
  })

  it("offers settings search help on the settings screen", () => {
    const tour = getTourForPathname({
      pathname: "/settings",
      locale: "es",
      audience: playerAudience,
    })
    expect(tour?.key).toBe("settings")
    expect(tour?.steps.map((step) => step.selector)).toEqual([
      "[data-tour='settings-search']",
    ])
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
