import { readFile } from "node:fs/promises"
import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import manifest from "@/app/manifest"
import { DELETE, GET } from "@/app/api/access-intent/route"
import {
  decodePendingAccessDestination,
  encodePendingAccessDestination,
  getPendingAccessIntentKind,
  normalizePendingAccessDestination,
  PENDING_ACCESS_INTENT_COOKIE,
} from "@/lib/pendingAccessIntent"
import { proxy } from "@/proxy"

describe("recoverable invitation entry", () => {
  it("accepts only same-origin player and spectator destinations", () => {
    expect(
      normalizePendingAccessDestination(
        "/invite/SL-8KQ4-P7M2-X9RA?leagueId=019fc39c-26cf-43e1-9d4b-9439d3366675",
      ),
    ).toBe(
      "/invite/SL-8KQ4-P7M2-X9RA?leagueId=019fc39c-26cf-43e1-9d4b-9439d3366675",
    )
    expect(normalizePendingAccessDestination("/spectate/VIEW-123")).toBe(
      "/spectate/VIEW-123",
    )
    expect(normalizePendingAccessDestination("https://evil.example/invite/code")).toBeNull()
    expect(normalizePendingAccessDestination("//evil.example/invite/code")).toBeNull()
    expect(normalizePendingAccessDestination("/settings")).toBeNull()
    expect(normalizePendingAccessDestination("/invite/code#fragment")).toBeNull()
  })

  it("round-trips the cookie payload and identifies its kind", () => {
    const encoded = encodePendingAccessDestination("/invite/SL-TEST?leagueId=league")

    expect(encoded).not.toBeNull()
    expect(decodePendingAccessDestination(encoded)).toBe(
      "/invite/SL-TEST?leagueId=league",
    )
    expect(getPendingAccessIntentKind("/invite/SL-TEST")).toBe("invite")
    expect(getPendingAccessIntentKind("/spectate/VIEW-TEST")).toBe("spectate")
  })

  it("records the exact invitation in an HttpOnly cookie at the request boundary", () => {
    const response = proxy(
      new NextRequest(
        "https://smashandlob.com/invite/SL-TEST?leagueId=019fc39c-26cf-43e1-9d4b-9439d3366675",
      ),
    )
    const cookie = response.cookies.get(PENDING_ACCESS_INTENT_COOKIE)

    expect(response.headers.get("x-middleware-next")).toBe("1")
    expect(cookie?.httpOnly).toBe(true)
    expect(cookie?.sameSite).toBe("lax")
    expect(cookie?.secure).toBe(true)
    expect(decodePendingAccessDestination(cookie?.value)).toBe(
      "/invite/SL-TEST?leagueId=019fc39c-26cf-43e1-9d4b-9439d3366675",
    )
  })

  it("redirects the PWA launch before authentication can hide the destination", () => {
    const destination = "/invite/SL-TEST?leagueId=league"
    const response = proxy(
      new NextRequest("https://smashandlob.com/launch?source=pwa", {
        headers: {
          cookie: `${PENDING_ACCESS_INTENT_COOKIE}=${encodeURIComponent(destination)}`,
        },
      }),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get("location")).toBe(
      `https://smashandlob.com${destination}`,
    )
  })

  it("expires only the recovery cookie through the cleanup endpoint", async () => {
    const response = await DELETE(
      new NextRequest("https://smashandlob.com/api/access-intent", {
        headers: {
          cookie: `${PENDING_ACCESS_INTENT_COOKIE}=${encodeURIComponent("/invite/SL-TEST")}`,
        },
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("set-cookie")).toContain(
      `${PENDING_ACCESS_INTENT_COOKIE}=`,
    )
    expect(response.headers.get("set-cookie")).toContain("Max-Age=0")
  })

  it("does not expose the HttpOnly invitation destination to browser code", async () => {
    const destination = "/invite/SL-PRIVATE"
    const response = await GET(
      new NextRequest("https://smashandlob.com/api/access-intent", {
        headers: {
          cookie: `${PENDING_ACCESS_INTENT_COOKIE}=${encodeURIComponent(destination)}`,
        },
      }),
    )
    const payload = await response.json()

    expect(payload).toEqual({ pending: true, kind: "invite" })
    expect(payload).not.toHaveProperty("destination")
  })

  it("uses a stable app id and a recovery-aware launch route", () => {
    const appManifest = manifest()

    expect(appManifest.id).toBe("/")
    expect(appManifest.start_url).toBe("/launch?source=pwa")
    expect(appManifest.scope).toBe("/")
  })

  it("keeps the existing OAuth return and clears recovery after both access flows", async () => {
    const [authGate, inviteFlow, spectatorFlow, launchPage] = await Promise.all([
      readFile("src/components/auth/AuthGate.tsx", "utf8"),
      readFile("src/components/invite/InviteFlow.tsx", "utf8"),
      readFile("src/components/spectator/SpectatorInviteFlow.tsx", "utf8"),
      readFile("src/app/launch/page.tsx", "utf8"),
    ])

    expect(authGate).toContain("buildPostAuthDestination(pathname, searchParams)")
    expect(authGate).toContain("t.auth.inviteAction")
    expect(inviteFlow).toContain("await clearPendingAccessIntent()")
    expect(spectatorFlow).toContain("await clearPendingAccessIntent()")
    expect(launchPage).toContain('redirect(pendingDestination ?? "/")')
  })
})
