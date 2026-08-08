import { describe, expect, it } from "vitest"
import { isLoopbackHostname } from "@/lib/localDevAuth"

describe("local development auth", () => {
  it("only accepts loopback hostnames on the client", () => {
    expect(isLoopbackHostname("localhost")).toBe(true)
    expect(isLoopbackHostname("127.0.0.1")).toBe(true)
    expect(isLoopbackHostname("::1")).toBe(true)
    expect(isLoopbackHostname("pre.smashandlob.com")).toBe(false)
    expect(isLoopbackHostname("smashandlob.com")).toBe(false)
  })
})
