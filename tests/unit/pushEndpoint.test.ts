import { describe, expect, it } from "vitest"
import { isTrustedPushEndpoint } from "@/lib/pushEndpoint"

describe("Push destination boundary", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/token", "https://android.googleapis.com/gcm/send/token",
    "https://updates.push.services.mozilla.com/wpush/v2/token", "https://web.push.apple.com/token",
    "https://wns2-example.notify.windows.com/token",
  ])("supports the provider endpoint %s", (endpoint) => expect(isTrustedPushEndpoint(endpoint)).toBe(true))
  it.each([
    "https://127.0.0.1/private", "https://[::1]/private", "https://169.254.169.254/latest/meta-data",
    "https://10.0.0.1/", "https://localhost/", "https://internal.example/",
    "https://fcm.googleapis.com.evil.test/", "https://evilpush.apple.com/",
    "https://fcm.googleapis.com@evil.test/", "https://user@fcm.googleapis.com/token",
    "https://fcm.googleapis.com:8443/token", "http://fcm.googleapis.com/token",
    "https://web.push.apple.com/token#fragment", " https://fcm.googleapis.com/token", "not-a-url",
  ])("rejects untrusted or ambiguous endpoint %s", (endpoint) => expect(isTrustedPushEndpoint(endpoint)).toBe(false))
})
