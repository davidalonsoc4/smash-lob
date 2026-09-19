import { describe, expect, it } from "vitest"
import { NextRequest } from "next/server"
import { proxy } from "@/proxy"

describe("public spectator route proxy", () => {
  it("allows the anonymous view route through the proxy", () => {
    const response = proxy(new NextRequest("https://smashandlob.com/spectate/SP-58ZK-GUD9D-FDE3/view"))
    expect(response.status).not.toBe(404)
  })
})
