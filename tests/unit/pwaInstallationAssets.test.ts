import { afterEach, describe, expect, it, vi } from "vitest"
import manifest from "@/app/manifest"
import { PREPRODUCTION_APP_URL, PRODUCTION_APP_URL } from "@/lib/appUrl"

afterEach(() => vi.unstubAllEnvs())

describe("installation assets behind PRE deployment protection", () => {
  it("uses the existing public PRE images for anonymous native icon downloads", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", PREPRODUCTION_APP_URL)
    const value = manifest()
    expect(value.name).toBe("Smash & Lob PRE")
    expect(value.icons?.map((icon) => icon.src)).toEqual([
      `${PRODUCTION_APP_URL}/icon-pre-192.png`,
      `${PRODUCTION_APP_URL}/icon-maskable-pre-192.png`,
      `${PRODUCTION_APP_URL}/icon-pre-512.png`,
      `${PRODUCTION_APP_URL}/icon-maskable-pre-512.png`,
    ])
    expect(value).toMatchObject({ id: "/", start_url: "/launch?source=pwa", scope: "/" })
    expect(value.theme_color).toBe("#000000")
    expect(value).not.toHaveProperty("background_color")
  })

  it("preserves Production branding and its same-origin asset paths", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL)
    const value = manifest()
    expect(value.name).toBe("Smash & Lob Padel")
    expect(value.icons?.map((icon) => icon.src)).toEqual([
      "/icon-192.png", "/icon-maskable-192.png", "/icon-512.png", "/icon-maskable-512.png",
    ])
    expect(value).toMatchObject({ id: "/", start_url: "/launch?source=pwa", scope: "/" })
    expect(value.theme_color).toBe("#000000")
  })
})
