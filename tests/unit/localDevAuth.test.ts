import { describe, expect, it } from "vitest"
import { isLoopbackHostname } from "@/lib/localDevAuth"

describe("local development auth", () => {
  it("accepts loopback and private LAN development hosts", () => {
    expect(isLoopbackHostname("localhost")).toBe(true)
    expect(isLoopbackHostname("127.0.0.1")).toBe(true)
    expect(isLoopbackHostname("::1")).toBe(true)
    expect(isLoopbackHostname("10.0.0.25")).toBe(true)
    expect(isLoopbackHostname("172.17.107.219")).toBe(true)
    expect(isLoopbackHostname("192.168.3.2")).toBe(true)
    expect(isLoopbackHostname("172.32.0.1")).toBe(false)
    expect(isLoopbackHostname("8.8.8.8")).toBe(false)
    expect(isLoopbackHostname("pre.smashandlob.com")).toBe(false)
    expect(isLoopbackHostname("smashandlob.com")).toBe(false)
  })
})
