import { NextRequest } from "next/server"
import { describe, expect, it } from "vitest"
import { proxy } from "@/proxy"

describe("Avatar Lab request proxy", () => {
  it("returns a real 404 response on the production host", () => {
    const response = proxy(
      new NextRequest("https://smashandlob.com/experimental/avatar-lab"),
    )

    expect(response.status).toBe(404)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("continues the request on PRE and local hosts", () => {
    for (const url of [
      "https://pre.smashandlob.com/experimental/avatar-lab",
      "http://localhost:3100/experimental/avatar-lab",
    ]) {
      const response = proxy(new NextRequest(url))
      expect(response.headers.get("x-middleware-next")).toBe("1")
    }
  })
})
