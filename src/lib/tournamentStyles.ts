import type { CSSProperties } from "react"
import { getContrastColor } from "./visualStyle"
export function tournamentAccentStyle(accent?: string | null): CSSProperties | undefined {
  if (!accent || !/^#[0-9a-f]{6}$/i.test(accent)) return undefined
  return { "--t-primary": accent, "--t-primary-text": getContrastColor(accent),
    "--t-accent": `color-mix(in srgb, ${accent} 72%, var(--t-text))` } as CSSProperties
}
