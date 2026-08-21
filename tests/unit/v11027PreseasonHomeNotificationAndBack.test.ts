import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.27 preseason home, notification and Back navigation", () => {
  it("keeps player HOME friendly and makes the preseason reveal visually explicit", async () => {
    const countdown = await read("src/components/season/SeasonStartCountdown.tsx")

    expect(countdown).toContain('tx("¡NOVEDADES!")')
    expect(countdown).toContain('tx("DESCUBRIRÁS TODOS LOS EMPAREJAMIENTOS EN")')
    expect(countdown).toContain('tx("Los emparejamientos todavía son sorpresa.")')
    expect(countdown).not.toContain('tx("FASE SECRETOS")')
    expect(countdown).not.toContain('tx("LOS EMPAREJAMIENTOS SE REVELAN EN")')
  })

  it("announces the state change once per programmed start through the existing scheduled job", async () => {
    const [scheduledCheck, activity, notifications, push] = await Promise.all([
      read("src/app/api/notifications/scheduled-check/route.ts"),
      read("src/lib/activity.ts"),
      read("src/lib/notificationSettings.ts"),
      read("src/lib/serverPushDispatch.ts"),
    ])

    expect(activity).toContain('| "season_opening_announced"')
    expect(notifications).toContain('"season_opening_announced"')
    expect(scheduledCheck).toContain('getPreseasonAccessPhase({')
    expect(scheduledCheck).toContain('.eq("type", "season_opening_announced")')
    expect(scheduledCheck).toContain('.contains("metadata", { scheduledStartAt, secretDaysBefore })')
    expect(scheduledCheck).toContain('type: "season_opening_announced"')
    expect(scheduledCheck).toContain('title: "¡Novedades!"')
    expect(scheduledCheck).toContain('description: "Entra en Smash & Lob para descubrir la nueva información de la Jornada 1."')
    expect(push).toContain('event.type === "season_opening_announced"')
    expect(push).toContain('return "¡Novedades!"')
  })

  it("uses client navigation for every Back fallback instead of native page reloads", async () => {
    const backButton = await read("src/components/ui/BackButton.tsx")

    expect(backButton).toContain("event.preventDefault()")
    expect(backButton).toContain("router.back()")
    expect(backButton).toContain("router.push(fallbackHref)")
    expect(backButton).toContain("router.replace(explicitReturnTo)")
  })
})
