export const MEDIA_KIT_ICON_PREFIX = "media-kit-icon:"

const iconBodies = {
  trophy: '<path d="M8 4h8v3a4 4 0 0 1-8 0V4Z"/><path d="M8 6H5v1a4 4 0 0 0 4 4M16 6h3v1a4 4 0 0 1-4 4M12 11v5M9 20h6M10 16h4v4"/>',
  star: '<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>',
  medal: '<circle cx="12" cy="14" r="5"/><path d="m9 9-3-6h4l2 4 2-4h4l-3 6M10 14l1.3 1.3L14 12.5"/>',
  crown: '<path d="m4 7 4 4 4-6 4 6 4-4-2 11H6L4 7ZM6 21h12"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
  shield: '<path d="M12 3 5 6v5c0 4.6 2.8 8 7 10 4.2-2 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.7 2.7L16 9"/>',
  bolt: '<path d="m13 2-7 11h5l-1 9 8-12h-5V2Z"/>',
  flame: '<path d="M13 3c1 4-2 5-2 8 0 1.5 1 2.5 2 2.5 2 0 3-2.2 2-4.5 3 2 4 4.3 4 6.5A7 7 0 0 1 5 15c0-3.7 2.1-6.8 5.6-9.6-.2 3 1 3.8 2.4 4.6"/>',
  heart: '<path d="M20 8.5c0 5-8 10-8 10s-8-5-8-10A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 2.5Z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h3M14 14h2M8 17h2"/>',
  users: '<circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20c.5-4 2.4-6 5.5-6s5 2 5.5 6M14 15c3.8-.8 6 1 6.5 4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5S18.8 16 19.5 21"/>',
  racket: '<ellipse cx="10" cy="9" rx="5.5" ry="7" transform="rotate(40 10 9)"/><path d="m14 14 6 6M16 16l-2 2M6 7l7 5M7 12l5-7"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M5 7c4 1 7 5 7 10M19 6c-4 2-6 6-5 11"/>',
  court: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M12 4v16M3 12h18M7 4v16M17 4v16"/>',
  chart: '<path d="M4 20V5M4 20h16M8 17v-4M12 17V8M16 17v-7M20 17V4"/>',
  balance: '<path d="M12 3v18M5 6h14M7 6l-4 7h8L7 6ZM17 6l-4 7h8l-4-7ZM8 21h8"/>',
  repeat: '<path d="m17 3 3 3-3 3M4 10V8a2 2 0 0 1 2-2h14M7 21l-3-3 3-3M20 14v2a2 2 0 0 1-2 2H4"/>',
  book: '<path d="M4 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4V4ZM20 4h-4a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h4V4Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
  megaphone: '<path d="M4 11v3h4l9 4V7l-9 4H4ZM8 14l2 6h3l-2-5"/>',
  pin: '<path d="M12 21s6-5.6 6-12a6 6 0 1 0-12 0c0 6.4 6 12 6 12Z"/><circle cx="12" cy="9" r="2"/>',
  coins: '<ellipse cx="9" cy="7" rx="5" ry="2.5"/><path d="M4 7v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V7M4 11v4c0 1.4 2.2 2.5 5 2.5 1 0 2-.2 2.7-.4M14 11c3.3 0 6 1.1 6 2.5S17.3 16 14 16s-6-1.1-6-2.5M8 14v4c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-4"/>',
} as const

export type MediaKitIconId = keyof typeof iconBodies

export const MEDIA_KIT_ICON_OPTIONS: Array<{ id: MediaKitIconId; label: string }> = [
  { id: "trophy", label: "Trofeo" }, { id: "star", label: "Estrella" }, { id: "medal", label: "Medalla" }, { id: "crown", label: "Corona" }, { id: "target", label: "Objetivo" },
  { id: "shield", label: "Escudo" }, { id: "check", label: "Completado" }, { id: "bolt", label: "Energía" }, { id: "flame", label: "Racha" }, { id: "heart", label: "Compromiso" },
  { id: "clock", label: "Tiempo" }, { id: "calendar", label: "Calendario" }, { id: "users", label: "Parejas" }, { id: "user", label: "Jugador" }, { id: "racket", label: "Pala" },
  { id: "ball", label: "Pelota" }, { id: "court", label: "Pista" }, { id: "chart", label: "Clasificación" }, { id: "balance", label: "Equilibrio" }, { id: "repeat", label: "Rotación" },
  { id: "book", label: "Reglas" }, { id: "info", label: "Información" }, { id: "megaphone", label: "Anuncio" }, { id: "pin", label: "Ubicación" }, { id: "coins", label: "Cuota" },
]

export function mediaKitIconToken(id: MediaKitIconId) {
  return `${MEDIA_KIT_ICON_PREFIX}${id}`
}

export function getMediaKitIconId(value: string | null | undefined): MediaKitIconId | null {
  if (!value?.startsWith(MEDIA_KIT_ICON_PREFIX)) return null
  const id = value.slice(MEDIA_KIT_ICON_PREFIX.length) as MediaKitIconId
  return id in iconBodies ? id : null
}

export function mediaKitIconDataUrl(value: string | MediaKitIconId, color = "#d7a544") {
  const iconId = getMediaKitIconId(value) ?? (Object.prototype.hasOwnProperty.call(iconBodies, value) ? value as MediaKitIconId : null)
  if (!iconId) return null
  const safeColor = /^#[0-9a-f]{6}$/i.test(color) ? color : "#d7a544"
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${safeColor}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${iconBodies[iconId]}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
