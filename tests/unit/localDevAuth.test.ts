import { describe, expect, it } from "vitest"
import { isLoopbackHostname } from "@/lib/localDevAuth"

describe("local development auth", () => {
  it("accepts loopback and the explicitly allowed LAN development host", () => {
    expect(isLoopbackHostname("localhost")).toBe(true)
    expect(isLoopbackHostname("127.0.0.1")).toBe(true)
    expect(isLoopbackHostname("::1")).toBe(true)
    expect(isLoopbackHostname("192.168.3.2")).toBe(true)
    expect(isLoopbackHostname("192.168.3.3")).toBe(false)
    expect(isLoopbackHostname("pre.smashandlob.com")).toBe(false)
    expect(isLoopbackHostname("smashandlob.com")).toBe(false)
  })
})
