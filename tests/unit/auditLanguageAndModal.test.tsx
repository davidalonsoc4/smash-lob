// @vitest-environment jsdom
import React from "react"
import { afterEach, expect, it, vi } from "vitest"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { I18nProvider, useI18n } from "@/i18n/I18nProvider"
import { GuidedTourOverlay } from "@/components/onboarding/GuidedTourOverlay"
const tour = vi.hoisted(() => ({ active: true, close: vi.fn() }))
vi.mock("next/navigation", () => ({ usePathname: () => "/" }))
vi.mock("@/features/onboarding/OnboardingProvider", () => ({ useOnboarding: () => ({ activeTour: tour.active ? { title: "Fixture tour", steps: [{ title: "Step", description: "Fixture", side: "center" }] } : null, currentStepIndex: 0, nextStep: vi.fn(), previousStep: vi.fn(), skipTour: vi.fn(), closeTour: tour.close }) }))
vi.stubGlobal("React", React)
afterEach(() => { cleanup(); localStorage.clear(); tour.active = true; vi.clearAllMocks(); document.documentElement.lang = "es" })
function LocaleProbe() {
  const { setLocale } = useI18n()
  return <><button onClick={() => setLocale("en")}>English</button><button onClick={() => setLocale("eu")}>Euskera</button></>
}
it("updates document language for each selected locale", () => {
  render(<I18nProvider><LocaleProbe /></I18nProvider>)
  expect(document.documentElement.lang).toBe("es")
  fireEvent.click(screen.getByText("English"))
  expect(document.documentElement.lang).toBe("en")
  fireEvent.click(screen.getByText("Euskera"))
  expect(document.documentElement.lang).toBe("eu")
})
it("contains Tab and Shift+Tab, prevents programmatic escape and restores the opening control", async () => {
  const interaction = userEvent.setup()
  tour.active = false
  const content = () => <I18nProvider><button>Open help</button><GuidedTourOverlay /></I18nProvider>
  const view = render(content())
  const openingControl = screen.getByText("Open help")
  openingControl.focus()
  tour.active = true
  view.rerender(content())
  const dialog = screen.getByRole("dialog")
  expect(dialog.contains(document.activeElement)).toBe(true)
  const buttons = Array.from(dialog.querySelectorAll<HTMLButtonElement>("button")).filter((button) => button.tabIndex >= 0)
  buttons.at(-1)!.focus()
  await interaction.tab()
  expect(document.activeElement).toBe(buttons[0])
  await interaction.tab({ shift: true })
  expect(document.activeElement).toBe(buttons.at(-1))
  openingControl.focus()
  expect(dialog.contains(document.activeElement)).toBe(true)
  tour.active = false
  view.rerender(content())
  expect(document.activeElement).toBe(openingControl)
  expect(openingControl.closest("[inert]")).toBeNull()
})
