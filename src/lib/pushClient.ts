export type PushSupportStatus =
  | "supported"
  | "unsupported"
  | "missing_public_key"
  | "permission_denied"

export type PushAutoRegistrationResult =
  | { ok: true }
  | {
      ok: false
      reason:
        | PushSupportStatus
        | "permission_default"
        | "auto_disabled"
        | "missing_subscription"
        | "subscribe_failed"
    }

const pushAutoDisabledStorageKey = "smash-lob-push-auto-disabled"
const pushAutoPermissionPromptedStorageKey = "smash-lob-push-auto-permission-prompted"

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

export function isPushAutoRegistrationDisabled() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(pushAutoDisabledStorageKey) === "true"
}

export function setPushAutoRegistrationDisabled(disabled: boolean) {
  if (typeof window === "undefined") {
    return
  }

  if (disabled) {
    window.localStorage.setItem(pushAutoDisabledStorageKey, "true")
    return
  }

  window.localStorage.removeItem(pushAutoDisabledStorageKey)
}

export function hasPushAutoPermissionBeenPrompted() {
  if (typeof window === "undefined") {
    return false
  }

  return window.localStorage.getItem(pushAutoPermissionPromptedStorageKey) === "true"
}

export function setPushAutoPermissionPrompted() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(pushAutoPermissionPromptedStorageKey, "true")
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

async function createPushSubscription() {
  const registration = await getPushRegistration()
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    return existingSubscription
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string
    ),
  })
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

  const subscription = await createPushSubscription()

  return { ok: true as const, subscription }
}

export async function ensurePushSubscriptionForLeague({
  leagueId,
  playerId,
  requestPermissionIfNeeded = false,
}: {
  leagueId: string
  playerId: string | null
  requestPermissionIfNeeded?: boolean
}): Promise<PushAutoRegistrationResult> {
  const supportStatus = getPushSupportStatus()

  if (supportStatus !== "supported") {
    return { ok: false, reason: supportStatus }
  }

  if (isPushAutoRegistrationDisabled()) {
    return { ok: false, reason: "auto_disabled" }
  }

  if (Notification.permission === "default") {
    if (!requestPermissionIfNeeded) {
      return { ok: false, reason: "permission_default" }
    }

    setPushAutoPermissionPrompted()

    const permission = await Notification.requestPermission()

    if (permission !== "granted") {
      return { ok: false, reason: "permission_denied" }
    }
  }

  if (Notification.permission !== "granted") {
    return { ok: false, reason: "permission_denied" }
  }

  try {
    const subscription = await createPushSubscription()

    if (!subscription) {
      return { ok: false, reason: "missing_subscription" }
    }

    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        leagueId,
        playerId,
        subscription: subscription.toJSON(),
      }),
    })

    if (!response.ok) {
      return { ok: false, reason: "subscribe_failed" }
    }

    return { ok: true }
  } catch {
    return { ok: false, reason: "subscribe_failed" }
  }
}

export async function unsubscribeFromPush() {
  const existingSubscription = await getExistingPushSubscription()

  if (!existingSubscription) {
    return true
  }

  return existingSubscription.unsubscribe()
}
