import { afterEach, describe, expect, it, vi } from "vitest"
import {
  PREPRODUCTION_APP_URL,
  PRODUCTION_APP_URL,
  getPublicAppBaseUrl,
} from "@/lib/appUrl"

describe("public app URLs", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("keeps the official production origin", () => {
    const request = new Request("https://smashandlob.com/invite/ABC")
    expect(getPublicAppBaseUrl(request)).toBe(PRODUCTION_APP_URL)
  })

  it("keeps the official PRE origin", () => {
    const request = new Request("https://pre.smashandlob.com/spectate/ABC")
    expect(getPublicAppBaseUrl(request)).toBe(PREPRODUCTION_APP_URL)
  })

  it("canonicalizes a staging Vercel host to PRE", () => {
    const request = new Request(
      "https://smash-lob-git-staging-example.vercel.app/invite/ABC",
    )
    expect(getPublicAppBaseUrl(request)).toBe(PREPRODUCTION_APP_URL)
  })

  it("does not trust an arbitrary forwarded host", () => {
    vi.stubEnv("NEXT_PUBLIC_APP_VARIANT", "production")
    vi.stubEnv("NEXT_PUBLIC_APP_URL", PRODUCTION_APP_URL)

    const request = new Request("https://attacker.example/invite/ABC", {
      headers: {
        "x-forwarded-host": "attacker.example",
        "x-forwarded-proto": "https",
      },
    })
    expect(getPublicAppBaseUrl(request)).toBe(PRODUCTION_APP_URL)
  })
})
