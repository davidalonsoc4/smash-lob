import { APP_VERSION } from "@/lib/appVersion"

export type PwaDiagnostic = { schema: 1; values: Record<string, string | number | boolean> }
const color = /^(absent|unavailable|transparent|#[\da-f]{3,8}|(?:rgba?|hsla?|oklch|oklab|lab|lch)\([\d\s.,%/+-]+\)|color\((?:srgb|display-p3)[\d\s.,%/+-]+\))$/i
const textRules: Record<string, RegExp> = {
  appVersion: /^\d+\.\d+\.\d+$/, capturedAt: /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/,
  platform: /^(Android|iOS|other)$/, browser: /^(Chrome|Safari|Firefox|other)$/,
  browserVersion: /^(\d{1,3}(\.\d{1,5}){0,3}|unavailable)$/, osVersion: /^(\d{1,3}([._]\d{1,3}){0,2}|unavailable)$/,
  theme: /^(dark|light|unknown)$/, visualStyle: /^(classic|competition|unknown)$/,
  colorScheme: /^(normal|light|dark|light dark|dark light|only light|only dark)$/,
  controller: /^(absent|unavailable|installing|installed|activating|activated|redundant)$/,
  waiting: /^(absent|unavailable|installing|installed|activating|activated|redundant)$/,
  active: /^(absent|unavailable|installing|installed|activating|activated|redundant)$/,
  cacheVersions: /^(unavailable|absent|smash-lob-v\d+\.\d+\.\d+(\|smash-lob-v\d+\.\d+\.\d+){0,3})$/,
  rootBackground: color, bodyBackground: color, manifestTheme: color, manifestBackground: color,
}
const numbers = ["width", "height", "visualHeight", "screenWidth", "screenHeight", "pixelRatio", "safeBottom", "manifestStatus"]
const booleans = ["systemDark", "standalone", "iosStandalone", "online", "controlled"]
export function sanitizePwaDiagnostic(input: unknown): PwaDiagnostic | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null
  const raw = input as { schema?: unknown; values?: unknown }
  if (raw.schema !== 1 || !raw.values || typeof raw.values !== "object" || Array.isArray(raw.values)) return null
  const source = raw.values as Record<string, unknown>, values: PwaDiagnostic["values"] = {}
  for (const [key, rule] of Object.entries(textRules)) {
    if (source[key] === undefined) continue
    if (typeof source[key] !== "string" || source[key].length > 128 || !rule.test(source[key])) return null
    values[key] = source[key]
  }
  for (const key of numbers) {
    if (source[key] === undefined) continue
    if (typeof source[key] !== "number" || !Number.isFinite(source[key]) || source[key] < 0 || source[key] > 20_000) return null
    values[key] = source[key]
  }
  for (const key of booleans) {
    if (source[key] === undefined) continue
    if (typeof source[key] !== "boolean") return null
    values[key] = source[key]
  }
  if (typeof source.themeColors !== "string" || source.themeColors.length > 512 || !source.themeColors.split("|").every((value) => color.test(value))) return null
  values.themeColors = source.themeColors
  return values.appVersion && values.capturedAt ? { schema: 1, values } : null
}
export async function collectPwaDiagnostic(): Promise<PwaDiagnostic> {
  const root = document.documentElement, ua = navigator.userAgent
  const safeColor = (value: string | null) => value && value.length <= 128 && color.test(value) ? value : "unavailable"
  const browser = ua.match(/(?:Chrome|CriOS)\/([\d.]+)/) ?? ua.match(/Firefox\/([\d.]+)/) ?? ua.match(/Version\/([\d.]+).*Safari/)
  const os = ua.match(/Android ([\d.]+)/) ?? ua.match(/(?:CPU (?:iPhone )?OS|iPhone OS) ([\d_]+)/)
  const probe = document.createElement("div")
  probe.style.cssText = "position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom,0px)"
  document.body.append(probe)
  const safeBottom = Number.parseFloat(getComputedStyle(probe).paddingBottom) || 0
  probe.remove()
  const values: PwaDiagnostic["values"] = {
    appVersion: APP_VERSION, capturedAt: new Date().toISOString(), platform: /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "other",
    browser: /Chrome|CriOS/.test(ua) ? "Chrome" : /Firefox/.test(ua) ? "Firefox" : /Safari/.test(ua) ? "Safari" : "other",
    browserVersion: browser?.[1] ?? "unavailable", osVersion: os?.[1] ?? "unavailable",
    theme: textRules.theme.test(root.dataset.theme ?? "") ? root.dataset.theme! : "unknown", visualStyle: textRules.visualStyle.test(root.dataset.visualStyle ?? "") ? root.dataset.visualStyle! : "unknown", colorScheme: getComputedStyle(root).colorScheme || "normal",
    systemDark: window.matchMedia("(prefers-color-scheme: dark)").matches, standalone: window.matchMedia("(display-mode: standalone)").matches,
    iosStandalone: (navigator as Navigator & { standalone?: boolean }).standalone === true, online: navigator.onLine,
    rootBackground: safeColor(getComputedStyle(root).backgroundColor), bodyBackground: safeColor(getComputedStyle(document.body).backgroundColor),
    themeColors: [...document.querySelectorAll('meta[name="theme-color"]')].slice(0, 4).map((meta) => safeColor(meta.getAttribute("content"))).join("|") || "absent",
    width: window.innerWidth, height: window.innerHeight, visualHeight: window.visualViewport?.height ?? window.innerHeight,
    screenWidth: window.screen.width, screenHeight: window.screen.height, pixelRatio: window.devicePixelRatio, safeBottom,
    controlled: false, controller: "absent", active: "absent", waiting: "absent", cacheVersions: "unavailable",
    manifestStatus: 0, manifestTheme: "unavailable", manifestBackground: "unavailable",
  }
  try {
    values.controlled = Boolean(navigator.serviceWorker?.controller)
    values.controller = navigator.serviceWorker?.controller?.state ?? "absent"
    const registration = await navigator.serviceWorker?.getRegistration()
    values.active = registration?.active?.state ?? "absent"
    values.waiting = registration?.waiting?.state ?? "absent"
    values.cacheVersions = (await caches.keys()).filter((key) => /^smash-lob-v\d+\.\d+\.\d+$/.test(key)).slice(-4).join("|") || "absent"
  } catch { values.cacheVersions = "unavailable" }
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 5_000)
  try {
    const response = await fetch("/manifest.webmanifest", { cache: "no-cache", signal: controller.signal })
    values.manifestStatus = response.status
    if (response.ok && !response.redirected && response.headers.get("content-type")?.includes("json")) {
      const manifest = await response.json()
      values.manifestTheme = typeof manifest.theme_color === "string" && color.test(manifest.theme_color) ? manifest.theme_color : "absent"
      values.manifestBackground = typeof manifest.background_color === "string" && color.test(manifest.background_color) ? manifest.background_color : "absent"
    }
  } catch { /* Offline/protected manifests remain explicitly unavailable. */ }
  finally { clearTimeout(timer) }
  const report = sanitizePwaDiagnostic({ schema: 1, values })
  if (!report) throw new Error("invalid-diagnostic")
  return report
}
