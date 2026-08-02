import { describe, expect, it } from "vitest"
import { isExpiredPushSubscriptionStatus } from "@/lib/serverPushDispatch"

describe("expired push subscriptions", () => {
  it.each([404, 410])("treats HTTP %s as expired", (status) => {
    expect(isExpiredPushSubscriptionStatus(status)).toBe(true)
  })

  it.each([null, 400, 401, 429, 500])("does not delete on HTTP %s", (status) => {
    expect(isExpiredPushSubscriptionStatus(status)).toBe(false)
  })
})
