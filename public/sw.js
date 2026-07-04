self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
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
