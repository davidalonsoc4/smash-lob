export const MEDIA_KIT_ACCENT_OPTIONS = [
  "#d7a544",
  "#53B401",
  "#bb9448",
  "#d4643c",
  "#3d9d86",
  "#477bd1",
  "#8b5fc0",
] as const

export const DEFAULT_MEDIA_KIT_ACCENT = MEDIA_KIT_ACCENT_OPTIONS[0]

export function normalizeMediaKitAccentColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value.trim())
    ? value.trim().toUpperCase()
    : DEFAULT_MEDIA_KIT_ACCENT.toUpperCase()
}
