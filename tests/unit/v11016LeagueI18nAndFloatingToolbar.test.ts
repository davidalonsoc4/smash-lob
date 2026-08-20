import { readFile } from "node:fs/promises"
import { describe, expect, it } from "vitest"
import { translateLeagueText } from "@/i18n/leagueText"

const read = (path: string) => readFile(path, "utf8")

describe("v1.10.16 league i18n and UI polish", () => {
  it("translates representative league UI, feedback and dynamic text to English and Basque", () => {
    expect(translateLeagueText("en", "Reglamento oficial")).toBe("Official rules")
    expect(translateLeagueText("eu", "Reglamento oficial")).toBe("Araudi ofiziala")

    expect(translateLeagueText("en", "Calendario de enfrentamientos")).toBe("Fixtures calendar")
    expect(translateLeagueText("eu", "Calendario de enfrentamientos")).toBe("Neurketen egutegia")

    expect(translateLeagueText("en", "No se ha podido guardar tu voto.")).toBe(
      "Your vote could not be saved.",
    )
    expect(translateLeagueText("eu", "No se ha podido guardar tu voto.")).toBe(
      "Ezin izan da zure botoa gorde.",
    )

    expect(translateLeagueText("en", "Subir fila 2")).toBe("Move row 2 up")
    expect(translateLeagueText("eu", "Subir fila 2")).toBe("Igo 2. errenkada")
    expect(translateLeagueText("en", "Debes pagar a Unai")).toBe("You must pay Unai")
    expect(translateLeagueText("eu", "Debes pagar a Unai")).toBe("Unai(r)i ordaindu behar diozu")

    expect(translateLeagueText("en", "2 mensajes sin leer")).toBe("2 unread messages")
    expect(translateLeagueText("eu", "2 mensajes sin leer")).toBe("2 mezu irakurri gabe")
    expect(translateLeagueText("en", "2 fechas seleccionadas")).toBe("2 selected dates")
    expect(translateLeagueText("eu", "2 fechas seleccionadas")).toBe("2 data hautatuta")

    expect(translateLeagueText("en", "Ver Smash & Lob Pro League")).toBe(
      "View Smash & Lob Pro League",
    )
    expect(translateLeagueText("eu", "Ver Smash & Lob Pro League")).toBe(
      "Ikusi Smash & Lob Pro League",
    )
    expect(
      translateLeagueText(
        "en",
        "Sigue Smash & Lob Pro League · Temporada 1 en Smash & Lob como espectador.",
      ),
    ).toBe(
      "Follow Smash & Lob Pro League · Season 1 on Smash & Lob as a spectator.",
    )
    expect(
      translateLeagueText(
        "eu",
        "Sigue Smash & Lob Pro League · Temporada 1 en Smash & Lob como espectador.",
      ),
    ).toBe(
      "Jarraitu Smash & Lob Pro League · 1. denboraldia Smash & Lob-en ikusle gisa.",
    )
    expect(translateLeagueText("en", "Me viene bien · 3 votos")).toBe(
      "Works for me · 3 votes",
    )
    expect(translateLeagueText("eu", "No puedo · 2 votos")).toBe(
      "Ezin dut · 2 boto",
    )
  })

  it("keeps the fixture VS centred while giving fixture names the surrounding free width", async () => {
    const exportImage = await read("src/lib/seasonExportImages.ts")

    expect(exportImage).toContain(
      "const regularScoreCenterX = defaultCenterX + defaultCenterWidth / 2",
    )
    expect(exportImage).toContain(
      "const scoreCenterX = fixturesOnly ? x + width / 2 : regularScoreCenterX",
    )
    expect(exportImage).toContain("const fixtureVsHalfGap = 24")
    expect(exportImage).toContain("scoreCenterX - fixtureVsHalfGap - leftX")
    expect(exportImage).toContain("scoreCenterX + fixtureVsHalfGap")
    expect(exportImage).toContain("rightContentEdge - rightX")
    expect(exportImage).toContain('fixturesOnly ? "VS" : getMatchScore(match)')
  })

  it("reflows floating top actions instead of reserving a missing invite-button slot", async () => {
    const shell = await read("src/components/layout/AppShell.tsx")

    expect(shell).toContain("data-floating-top-toolbar")
    expect(shell).toContain('className={`flex items-center gap-2')
    expect(shell).toContain("{shouldShowHelpButton ? <FloatingHelpButton /> : null}")
    expect(shell).toContain("{hasPlayerInviteControl ? <InviteFloatingControls /> : null}")
    expect(shell).not.toContain("rightOffsetPx")

    const [invite, spectator] = await Promise.all([
      read("src/components/invite/FloatingInviteShareButton.tsx"),
      read("src/components/spectator/FloatingSpectatorShareButton.tsx"),
    ])
    expect(invite).toContain('? tx("Enlace copiado")')
    expect(spectator).toContain('const title = tx(`Ver ${leagueName}`)')
    expect(spectator).toContain(
      'const text = tx(`Sigue ${leagueName} · ${seasonName} en Smash & Lob como espectador.`)',
    )
    expect(spectator).toContain(
      'title={copied ? tx("Enlace copiado") : tx("Compartir con espectadores")}',
    )
  })

  it("keeps generated league images connected to the selected locale", async () => {
    const [calendar, summary, mediaKit, provider] = await Promise.all([
      read("src/lib/seasonExportImages.ts"),
      read("src/lib/seasonSummaryImage.ts"),
      read("src/lib/leagueMediaKitImage.ts"),
      read("src/i18n/I18nProvider.tsx"),
    ])

    for (const source of [calendar, summary, mediaKit]) {
      expect(source).toContain("translateLeagueText")
      expect(source).toContain("locale")
    }

    expect(provider).toContain("tx: (source: string) => string")
    expect(provider).toContain("translateLeagueText(locale, source)")
  })
})
