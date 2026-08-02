import { describe, expect, it } from "vitest"
import { applyPrivateNoStore } from "@/lib/serverResponse"

describe("private no-store responses", () => {
  it("disables browser, shared CDN and Vercel CDN caching", () => {
    const response = applyPrivateNoStore(new Response("ok"))

    expect(response.headers.get("cache-control")).toBe(
      "private, no-store, max-age=0",
    )
    expect(response.headers.get("cdn-cache-control")).toBe("no-store")
    expect(response.headers.get("vercel-cdn-cache-control")).toBe("no-store")
  })
})
