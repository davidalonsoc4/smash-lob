type Snapshot<T> = { data: T | null; failed: boolean; refreshing: boolean }

export function createSessionResource<T>(load: (signal: AbortSignal) => Promise<T | null>, freshnessMs = 60_000) {
  let snapshot: Snapshot<T> = { data: null, failed: false, refreshing: false }
  let expiresAt = 0
  let controller: AbortController | null = null
  let pending: Promise<void> | undefined
  let staleWhilePending = false
  const listeners = new Set<() => void>()

  function publish(next: Snapshot<T>) {
    snapshot = next
    listeners.forEach(listener => listener())
  }

  function cancel() {
    controller?.abort()
    controller = null
    pending = undefined
    staleWhilePending = false
  }

  function refresh() {
    if (pending || Date.now() < expiresAt) return pending
    const request = new AbortController()
    controller = request
    pending = load(request.signal).then(data => {
      if (controller !== request) return
      expiresAt = data !== null ? Date.now() + freshnessMs : 0
      publish({ data, failed: data === null, refreshing: false })
    }, () => {
      if (controller === request) publish({ ...snapshot, failed: snapshot.data === null, refreshing: false })
    }).finally(() => {
      if (controller === request) {
        controller = null
        pending = undefined
        if (staleWhilePending) {
          staleWhilePending = false
          expiresAt = 0
          if (listeners.size) void refresh()
        }
      }
    })
    publish({ ...snapshot, refreshing: true })
    return pending
  }

  function invalidate() {
    expiresAt = 0
    cancel()
    if (listeners.size) return refresh()
  }

  /**
   * Like `invalidate`, but never aborts a request in flight: if one is running, a single
   * follow-up refresh starts when it ends. Realtime notices use it so bursts of events
   * produce at most one request at a time instead of one aborted-and-restarted request each.
   */
  function revalidate() {
    expiresAt = 0
    if (pending) {
      staleWhilePending = true
      return pending
    }
    if (listeners.size) return refresh()
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    refresh,
    cancel,
    invalidate,
    revalidate,
    update(updateData: (data: T | null) => T) {
      publish({ ...snapshot, data: updateData(snapshot.data), failed: false })
    },
    discard() {
      publish({ data: null, failed: false, refreshing: false })
      return invalidate()
    },
  }
}
