import { CHAT_LIST_ACCOUNT_HEADER } from "@/lib/chatListMemory"

type ChatRequest = { account: string; url: string; startedAt: number; response: Promise<Response | null> }

// One pending navigation per tab. It is consumed by the destination and never persisted.
let pending: ChatRequest | undefined

export function getMatchChatEntryEndpoint(pathname: string) {
  const match = /^\/match\/([\w-]+)\/chat\/?$/.exec(pathname)
  return match ? `/api/matches/${match[1]}/chat` : null
}

export function warmChatEntry(account: string, url: string) {
  if (pending?.account === account && pending.url === url && Date.now() - pending.startedAt < 30_000) return
  pending = { account, url, startedAt: Date.now(), response: fetch(url, { cache: "no-store" }).catch(() => null) }
}

export async function fetchChatEntry(account: string | null | undefined, url: string) {
  const request = pending
  if (request?.account === account && request?.url === url) {
    pending = undefined
    if (Date.now() - request.startedAt < 30_000) {
      const response = await request.response
      if (response) return response
    }
  }
  return fetch(url, { cache: "no-store" })
}

const previewFreshnessMs = 12_000
const previews = new Map<string, { account: string; expiresAt: number; controller: AbortController; data: Promise<unknown> }>()

export function clearChatEntryPreviews() {
  previews.forEach(preview => preview.controller.abort())
  previews.clear()
}

export function scheduleChatEntryPreviews(account: string | null | undefined, first?: string, second?: string) {
  if (!account || !first) return
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  if (connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? "")) return
  let cancelled = false
  const timer = window.setTimeout(async () => {
    for (const url of new Set([first, second])) {
      if (!url || cancelled || document.hidden || !navigator.onLine) break
      const existing = previews.get(url)
      if (existing?.account === account && existing.expiresAt > Date.now()) {
        await existing.data
        continue
      }
      existing?.controller.abort()
      previews.delete(url)
      if (previews.size >= 2) break
      const controller = new AbortController()
      const data = fetch(`${url}?markRead=0&preview=1`, {
        cache: "no-store", priority: "low", signal: controller.signal,
        headers: { [CHAT_LIST_ACCOUNT_HEADER]: encodeURIComponent(account.trim().toLowerCase()) },
      }).then(response => response.ok ? response.json() : null).catch(() => null)
      previews.set(url, { account, expiresAt: Date.now() + previewFreshnessMs, controller, data })
      window.setTimeout(() => {
        if (previews.get(url)?.controller === controller) previews.delete(url)
        controller.abort()
      }, previewFreshnessMs)
      await data
    }
  }, 350)
  return () => { cancelled = true; window.clearTimeout(timer) }
}

export async function openChatWithPreview(
  account: string | null | undefined, url: string, show: (payload: unknown) => void, load: () => Promise<void>,
) {
  const preview = previews.get(url)
  if (!preview || preview.account !== account || preview.expiresAt <= Date.now() || preview.controller.signal.aborted) return load()
  let complete = false
  void preview.data.then(data => {
    if (data && !complete && !preview.controller.signal.aborted && preview.expiresAt > Date.now()) show(data)
  })
  try {
    await load()
  } finally {
    complete = true
    preview.controller.abort()
  }
}
