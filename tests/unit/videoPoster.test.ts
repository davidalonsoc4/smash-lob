import { describe, expect, it } from "vitest"
import { isUsableFrame, pickPosterFrame, posterCandidateTimes, type FrameSample } from "@/lib/videoPoster"

const frame = (time: number, luminance: number, contrast: number): FrameSample => ({ time, luminance, contrast })

describe("automatic video thumbnail", () => {
  it("prefers the frame at 2.5 s for a normal video", () => {
    expect(posterCandidateTimes(45)[0]).toBe(2.5)
  })

  it("uses the middle of a very short video and never leaves the video", () => {
    const times = posterCandidateTimes(3)
    expect(times[0]).toBe(1.5)
    for (const time of times) {
      expect(time).toBeGreaterThan(0)
      expect(time).toBeLessThan(3)
    }
    expect(posterCandidateTimes(0)).toEqual([0])
  })

  it("tries several different moments", () => {
    expect(new Set(posterCandidateTimes(45)).size).toBeGreaterThan(3)
  })

  it("rejects black, white and flat frames", () => {
    expect(isUsableFrame(frame(2.5, 0.01, 0.01))).toBe(false)
    expect(isUsableFrame(frame(2.5, 0.99, 0.01))).toBe(false)
    expect(isUsableFrame(frame(2.5, 0.5, 0.01))).toBe(false)
    expect(isUsableFrame(frame(2.5, 0.45, 0.2))).toBe(true)
  })

  it("keeps the preferred frame when it is good", () => {
    const chosen = pickPosterFrame([frame(2.5, 0.4, 0.2), frame(9, 0.5, 0.4)])
    expect(chosen?.time).toBe(2.5)
  })

  it("moves on to the next candidate when the preferred frame is black", () => {
    const chosen = pickPosterFrame([frame(2.5, 0.01, 0.0), frame(9, 0.5, 0.2)])
    expect(chosen?.time).toBe(9)
  })

  it("falls back to the most contrasted frame when none is good", () => {
    const chosen = pickPosterFrame([frame(2.5, 0.02, 0.01), frame(9, 0.03, 0.03), frame(18, 0.02, 0.02)])
    expect(chosen?.time).toBe(9)
    expect(pickPosterFrame([])).toBeNull()
  })
})
