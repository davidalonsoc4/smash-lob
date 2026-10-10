// Fixed provider domains prevent subscription URLs from becoming server-side requests
// to arbitrary hosts. Apply this both at registration and to previously stored rows.
export function isTrustedPushEndpoint(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 4096 || value.trim() !== value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.hash) return false
    const host = url.hostname.toLowerCase()
    return host === "fcm.googleapis.com" || host === "android.googleapis.com" ||
      host === "updates.push.services.mozilla.com" ||
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.push\.apple\.com$/.test(host) ||
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)*\.notify\.windows\.com$/.test(host)
  } catch {
    return false
  }
}
