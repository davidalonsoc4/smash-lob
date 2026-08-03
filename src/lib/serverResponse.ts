const privateNoStoreHeaders = {
  "Cache-Control": "private, no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Vercel-CDN-Cache-Control": "no-store",
} as const

export function applyPrivateNoStore<T extends Response>(response: T): T {
  for (const [name, value] of Object.entries(privateNoStoreHeaders)) {
    response.headers.set(name, value)
  }

  return response
}
