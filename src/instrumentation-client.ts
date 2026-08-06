let reportsSent = 0
const MAX_REPORTS_PER_PAGE = 3

function normalizeMessage(value: unknown) {
  if (value instanceof Error) return value.message.slice(0, 500)
  if (typeof value === "string") return value.slice(0, 500)
  return "client_error"
}

function reportClientError(payload: {
  kind: "error" | "unhandledrejection"
  message: string
  route: string
  source?: string | null
}) {
  if (reportsSent >= MAX_REPORTS_PER_PAGE) return
  reportsSent += 1

  void fetch("/api/observability/client-error", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
    cache: "no-store",
  }).catch(() => undefined)
}

window.addEventListener("error", (event) => {
  reportClientError({
    kind: "error",
    message: normalizeMessage(event.error ?? event.message),
    route: window.location.pathname.slice(0, 200),
    source: event.filename?.slice(0, 200) || null,
  })
})

window.addEventListener("unhandledrejection", (event) => {
  reportClientError({
    kind: "unhandledrejection",
    message: normalizeMessage(event.reason),
    route: window.location.pathname.slice(0, 200),
  })
})
