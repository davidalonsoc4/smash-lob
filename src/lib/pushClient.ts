export type PushSupportStatus =
  | "supported"
  | "unsupported"
  | "missing_public_key"
  | "permission_denied"

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

export function getPushSupportStatus(): PushSupportStatus {
  if (typeof window === "undefined") {
    return "unsupported"
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return "unsupported"
  }

  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
    return "missing_public_key"
  }

  if (Notification.permission === "denied") {
    return "permission_denied"
  }

  return "supported"
}

export async function getPushRegistration() {
  const registration = await navigator.serviceWorker.register("/sw.js")
  await navigator.serviceWorker.ready
  return registration
}

export async function getExistingPushSubscription() {
  const registration = await getPushRegistration()
  return registration.pushManager.getSubscription()
}

export async function requestPushSubscription() {
  const supportStatus = getPushSupportStatus()

  if (supportStatus !== "supported") {
    return { ok: false as const, reason: supportStatus }
  }

  const permission = await Notification.requestPermission()

  if (permission !== "granted") {
    return { ok: false as const, reason: "permission_denied" as const }
  }

  const registration = await getPushRegistration()
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    return { ok: true as const, subscription: existingSubscription }
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
    ),
  })

  return { ok: true as const, subscription }
}

export async function unsubscribeFromPush() {
  const existingSubscription = await getExistingPushSubscription()

  if (!existingSubscription) {
    return true
  }

  return existingSubscription.unsubscribe()
}
