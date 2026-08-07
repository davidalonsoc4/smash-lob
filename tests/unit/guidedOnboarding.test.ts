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

    const expectedFloatingCopy = {
      es: [
        ["[data-tour='floating-settings']", "Ajustes", "Gestiona tu perfil"],
        ["[data-tour='floating-notifications']", "Notificaciones", "Consulta avisos sobre partidos"],
        ["[data-tour='floating-share-spectators']", "Compartir con espectadores", "acceso de solo lectura"],
        ["[data-tour='floating-invite-players']", "Invitar jugadores", "vincular a los jugadores pendientes"],
        ["[data-tour='floating-help']", "Ayuda visual", "guía de la pantalla actual"],
      ],
      en: [
        ["[data-tour='floating-settings']", "Settings", "Manage your profile"],
        ["[data-tour='floating-notifications']", "Notifications", "Review updates about matches"],
        ["[data-tour='floating-share-spectators']", "Share with spectators", "read-only access"],
        ["[data-tour='floating-invite-players']", "Invite players", "connect players who are still pending"],
        ["[data-tour='floating-help']", "Visual help", "guide for the current screen"],
      ],
      eu: [
        ["[data-tour='floating-settings']", "Ezarpenak", "Kudeatu profila"],
        ["[data-tour='floating-notifications']", "Jakinarazpenak", "Ikusi partiden"],
        ["[data-tour='floating-share-spectators']", "Ikusleekin partekatu", "irakurketa-soileko sarbidea"],
        ["[data-tour='floating-invite-players']", "Jokalariak gonbidatu", "lotu gabe dauden jokalarientzako"],
        ["[data-tour='floating-help']", "Laguntza bisuala", "uneko pantailaren gida"],
      ],
    } as const

    for (const locale of ["es", "en", "eu"] as const) {
      const localizedHome = getOnboardingTours(locale).find((tour) => tour.key === "home")!
      const floatingSteps = localizedHome.steps.slice(-5)
      for (const [index, [selector, title, descriptionFragment]] of expectedFloatingCopy[locale].entries()) {
        expect(floatingSteps[index]).toMatchObject({ selector, title })
        expect(floatingSteps[index]?.description).toContain(descriptionFragment)
      }
    }

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
