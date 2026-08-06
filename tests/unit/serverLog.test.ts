import { afterEach, describe, expect, it, vi } from "vitest"
import { logServerEvent } from "@/lib/serverLog"

const originalEnvironment = {
  commit: process.env.VERCEL_GIT_COMMIT_SHA,
  deployment: process.env.VERCEL_DEPLOYMENT_ID,
  region: process.env.VERCEL_REGION,
}

function restoreEnvironment(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
  } else {
    process.env[name] = value
  }
}

afterEach(() => {
  restoreEnvironment("VERCEL_GIT_COMMIT_SHA", originalEnvironment.commit)
  restoreEnvironment("VERCEL_DEPLOYMENT_ID", originalEnvironment.deployment)
  restoreEnvironment("VERCEL_REGION", originalEnvironment.region)
  vi.restoreAllMocks()
})

describe("structured server observability", () => {
  it("adds deployment metadata without accepting arbitrary context", () => {
    process.env.VERCEL_GIT_COMMIT_SHA = "1234567890abcdef"
    process.env.VERCEL_DEPLOYMENT_ID = "dpl_test"
    process.env.VERCEL_REGION = "fra1"
    const logger = vi.spyOn(console, "info").mockImplementation(() => undefined)

    logServerEvent("info", "quality_test", {
      requestId: "request-1234",
      route: "/api/test",
      unknown: "secret",
    } as never)

    const entry = JSON.parse(String(logger.mock.calls[0]?.[0]))
    expect(entry).toMatchObject({
      message: "quality_test",
      commitSha: "1234567890ab",
      deploymentId: "dpl_test",
      region: "fra1",
      requestId: "request-1234",
      route: "/api/test",
    })
    expect(entry).not.toHaveProperty("unknown")
  })
})
