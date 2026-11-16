/**
 * Runs `task` one at a time. Calls made while it is running collapse into a single
 * follow-up run that starts after the current one ends, so the last trigger always
 * results in a run that began after it, without piling up concurrent requests.
 *
 * Chats use it for realtime "refresh" notices: with N people writing, every message
 * would otherwise start N overlapping full reloads on every device.
 */
export function createCoalescedRunner(task: () => Promise<unknown>) {
  let running: Promise<void> | null = null
  let queued = false

  return function run(): Promise<void> {
    if (running) {
      queued = true
      return running
    }

    running = (async () => {
      try {
        do {
          queued = false
          try {
            await task()
          } catch {
            // A failed run must not stop later ones.
          }
        } while (queued)
      } finally {
        running = null
      }
    })()

    return running
  }
}
