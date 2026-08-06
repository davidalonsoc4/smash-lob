import { describe, expect, it } from "vitest"
import { isAvatarLabRequest } from "@/lib/avatarLabAccess"

describe("Avatar Lab host access", () => {
  it("is enabled on the official PRE domain", () => {
    expect(
      isAvatarLabRequest(new Request("https://pre.smashandlob.com/experimental/avatar-lab")),
    ).toBe(true)
  })

  it("is disabled on the production domain even if configuration is stale", () => {
    expect(
      isAvatarLabRequest(new Request("https://smashandlob.com/experimental/avatar-lab")),
    ).toBe(false)
  })

  it("rejects a forwarded PRE host on the production URL", () => {
    expect(
      isAvatarLabRequest(
        new Request("https://smashandlob.com/experimental/avatar-lab", {
          headers: { "x-forwarded-host": "pre.smashandlob.com" },
        }),
      ),
    ).toBe(false)
  })

  it("remains available in local development", () => {
    expect(
      isAvatarLabRequest(new Request("http://localhost:3000/experimental/avatar-lab")),
    ).toBe(true)
  })
})
