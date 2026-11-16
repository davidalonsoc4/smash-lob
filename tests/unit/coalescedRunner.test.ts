import { describe, expect, it } from "vitest"
import { createCoalescedRunner } from "@/lib/coalescedRunner"
import { createSessionResource } from "@/lib/sessionResource"

function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => { resolve = done })
  return { promise, resolve }
}

describe("createCoalescedRunner", () => {
  it("never overlaps runs and collapses a burst into one follow-up", async () => {
    const gates = [deferred(), deferred(), deferred()]
    let started = 0
    let active = 0
    let maxActive = 0
    const run = createCoalescedRunner(async () => {
      const gate = gates[started++]
      active += 1
      maxActive = Math.max(maxActive, active)
      await gate.promise
      active -= 1
    })

    const first = run()
    run()
    run()
    run()
    expect(started).toBe(1)

    gates[0].resolve()
    await Promise.resolve()
    await Promise.resolve()
    expect(started).toBe(2)

    gates[1].resolve()
    await first
    expect(started).toBe(2)
    expect(maxActive).toBe(1)
  })

  it("starts a new run for triggers that arrive after it finished", async () => {
    let runs = 0
    const run = createCoalescedRunner(async () => { runs += 1 })
    await run()
    await run()
    expect(runs).toBe(2)
  })

  it("keeps working after a failed run", async () => {
    let runs = 0
    const run = createCoalescedRunner(async () => {
      runs += 1
      if (runs === 1) throw new Error("boom")
    })
    await expect(run()).resolves.toBeUndefined()
    await run()
    expect(runs).toBe(2)
  })
})

describe("session resource revalidate", () => {
  it("keeps the request in flight and refreshes once more afterwards", async () => {
    const gates = [deferred(), deferred()]
    const signals: AbortSignal[] = []
    let calls = 0
    const resource = createSessionResource(async (signal) => {
      const index = calls++
      signals.push(signal)
      await gates[index]?.promise
      return index + 1
    }, 30_000)
    resource.subscribe(() => undefined)

    void resource.refresh()
    void resource.revalidate()
    void resource.revalidate()
    void resource.revalidate()
    expect(calls).toBe(1)
    expect(signals[0].aborted).toBe(false)

    gates[0].resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toBe(2)

    gates[1].resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(resource.getSnapshot().data).toBe(2)
    expect(calls).toBe(2)
  })

  it("does not start a follow-up after being cancelled", async () => {
    const gate = deferred()
    let calls = 0
    const resource = createSessionResource(async () => {
      calls += 1
      await gate.promise
      return calls
    }, 30_000)
    resource.subscribe(() => undefined)

    void resource.refresh()
    void resource.revalidate()
    resource.cancel()
    gate.resolve()
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(calls).toBe(1)
  })
})
