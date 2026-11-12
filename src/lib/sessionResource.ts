type Snapshot<T> = { data: T | null; failed: boolean; refreshing: boolean }

export function createSessionResource<T>(load: (signal: AbortSignal) => Promise<T | null>, freshnessMs = 60_000) {
  let snapshot: Snapshot<T> = { data: null, failed: false, refreshing: false }
  let expiresAt = 0
  let controller: AbortController | null = null
  let pending: Promise<void> | undefined
  const listeners = new Set<() => void>()

  function publish(next: Snapshot<T>) {
    snapshot = next
    listeners.forEach(listener => listener())
  }

  function cancel() {
    controller?.abort()
    controller = null
    pending = undefined
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

  return {
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    refresh,
    cancel,
    invalidate,
    discard() {
      publish({ data: null, failed: false, refreshing: false })
      return invalidate()
    },
  }
}
