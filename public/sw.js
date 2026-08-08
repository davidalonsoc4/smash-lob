const CACHE_VERSION = "smash-lob-v1.4.10"
const APP_SHELL = [
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)))
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("smash-lob-") && key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    event.waitUntil(self.skipWaiting())
  }
})

self.addEventListener("fetch", (event) => {
  const request = event.request

  if (request.method !== "GET") {
    return
  }

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) {
    return
  }

  if (request.mode === "navigate") {
    if (url.pathname === "/offline") {
      event.respondWith(
        caches.match("/offline").then((cached) => cached || fetch(request)),
      )
      return
    }

    event.respondWith(
      fetch(request).catch(() => Response.redirect("/offline", 302)),
    )
    return
  }

  if (APP_SHELL.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    )
  }
})

self.addEventListener("push", (event) => {
  let payload = {}

  try {
    payload = event.data ? event.data.json() : {}
  } catch {
    payload = {}
  }

  const title = payload.title || "Smash & Lob"
  const url = payload.url || "/activity?scope=mine"
  const options = {
    body: payload.body || "Tienes una actualización en tu liga.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: payload.tag || "smash-lob-notification",
    renotify: false,
    data: {
      url,
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const targetUrl = new URL(
    event.notification.data?.url || "/",
    self.location.origin,
  ).href

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const sameOriginClient = clients.find((client) => {
          try {
            return new URL(client.url).origin === self.location.origin
          } catch {
            return false
          }
        })

        if (sameOriginClient) {
          if ("navigate" in sameOriginClient) {
            return sameOriginClient.navigate(targetUrl).then((client) =>
              client ? client.focus() : sameOriginClient.focus(),
            )
          }

          return sameOriginClient.focus()
        }

        return self.clients.openWindow(targetUrl)
      }),
  )
})
