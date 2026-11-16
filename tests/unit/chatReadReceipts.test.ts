import { describe, expect, it } from "vitest"
import { READ_RECEIPT_BROADCAST_EVERY, shouldAnnounceRead } from "@/lib/chatReadReceipts"

describe("read receipt announcements", () => {
  it("always lets the last reader announce", () => {
    expect(shouldAnnounceRead(0)).toBe(true)
  })

  it("announces only every few readers while others are still behind", () => {
    const announced = Array.from({ length: 8 }, (_, index) => 7 - index).filter(shouldAnnounceRead)
    expect(announced).toEqual([4, 0])
    expect(announced.length).toBeLessThanOrEqual(Math.ceil(8 / READ_RECEIPT_BROADCAST_EVERY))
  })

  it("keeps the announcements per message well below one per reader in a large league", () => {
    const readers = 15
    const announced = Array.from({ length: readers }, (_, index) => readers - 1 - index).filter(shouldAnnounceRead)
    expect(announced.length).toBeLessThanOrEqual(5)
  })
})
