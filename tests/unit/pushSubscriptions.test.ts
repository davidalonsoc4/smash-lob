import { describe, expect, it, vi } from "vitest"
import {
  isExpiredPushSubscriptionStatus,
  removeExpiredPushSubscription,
} from "@/lib/serverPushDispatch"

describe("expired push subscriptions", () => {
  it.each([404, 410])("treats HTTP %s as expired", (status) => {
    expect(isExpiredPushSubscriptionStatus(status)).toBe(true)
  })

  it.each([null, 400, 401, 429, 500])("does not delete on HTTP %s", (status) => {
    expect(isExpiredPushSubscriptionStatus(status)).toBe(false)
  })

  it.each([404, 410])(
    "deletes the exact subscription after HTTP %s",
    async (statusCode) => {
      const eq = vi.fn().mockResolvedValue({ error: null })
      const deleteSubscription = vi.fn().mockReturnValue({ eq })
      const from = vi.fn().mockReturnValue({ delete: deleteSubscription })

      const removed = await removeExpiredPushSubscription({
        supabase: { from } as never,
        statusCode,
        subscriptionId: "subscription-expired",
      })

      expect(removed).toBe(true)
      expect(from).toHaveBeenCalledWith("push_subscriptions")
      expect(deleteSubscription).toHaveBeenCalledOnce()
      expect(eq).toHaveBeenCalledWith("id", "subscription-expired")
    },
  )

  it("keeps the subscription after a retryable delivery failure", async () => {
    const from = vi.fn()

    const removed = await removeExpiredPushSubscription({
      supabase: { from } as never,
      statusCode: 500,
      subscriptionId: "subscription-retryable",
    })

    expect(removed).toBe(false)
    expect(from).not.toHaveBeenCalled()
  })
})
