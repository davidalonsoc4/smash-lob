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
