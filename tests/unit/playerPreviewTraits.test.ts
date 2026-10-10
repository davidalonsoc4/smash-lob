import { afterEach, describe, expect, it, vi } from "vitest"
import { getPlayerPreviewTraits } from "@/lib/playerPreviewTraits"

afterEach(() => vi.unstubAllEnvs())
function environment(host: string, variant = "pre", database = "miadjotkucgluwbrgeih.supabase.co") {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", `https://${host}`)
  vi.stubEnv("NEXT_PUBLIC_APP_VARIANT", variant)
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `https://${database}`)
}
describe("player preview traits", () => {
  it.each(["localhost", "127.0.0.1", "pre.smashandlob.com"])("returns stable valid fixtures on %s", host => {
    environment(host)
    const traits = getPlayerPreviewTraits("fixture-player")
    expect(["drive", "reves", "versatile"]).toContain(traits.preferredSide)
    expect(["right", "left"]).toContain(traits.dominantHand)
    expect(getPlayerPreviewTraits("fixture-player")).toEqual(traits)
  })
  it("does not replace account data", () => {
    environment("localhost")
    expect(getPlayerPreviewTraits("fixture-player", "fixture-user").preferredSide).toBeNull()
  })
  it.each([
    ["smashandlob.com", "pre", "miadjotkucgluwbrgeih.supabase.co"],
    ["localhost", "prod", "miadjotkucgluwbrgeih.supabase.co"],
    ["pre.smashandlob.com", "production", "miadjotkucgluwbrgeih.supabase.co"],
    ["localhost", "pre", "production.example.com"],
    ["unknown.example.com", "pre", "miadjotkucgluwbrgeih.supabase.co"],
  ])("excludes unsafe configuration %s %s %s", (host, variant, database) => {
    environment(host, variant, database)
    expect(getPlayerPreviewTraits("fixture-player")).toEqual({ preferredSide: null, dominantHand: null })
  })
  it("fails closed without configuration", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "")
    expect(getPlayerPreviewTraits("fixture-player").preferredSide).toBeNull()
  })
})
