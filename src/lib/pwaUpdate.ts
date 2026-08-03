export const PWA_UPDATE_RELOAD_FALLBACK_MS = 4_000

type WaitingServiceWorker = Pick<ServiceWorker, "postMessage">

type ReloadScheduler = (
  callback: () => void,
  delayMs: number,
) => number

export function requestPwaUpdate(
  waitingWorker: WaitingServiceWorker,
  reload: () => void,
  scheduleReload: ReloadScheduler = (callback, delayMs) =>
    setTimeout(callback, delayMs) as unknown as number,
) {
  try {
    waitingWorker.postMessage({ type: "SKIP_WAITING" })
  } catch {
    // A reload still lets the browser finish or rediscover the update.
  }

  return scheduleReload(reload, PWA_UPDATE_RELOAD_FALLBACK_MS)
}
