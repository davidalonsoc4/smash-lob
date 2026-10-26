export type RapidAudioSettings = { sound: "beep" | "bell" | "whistle" | "gong" | "chime" | "horn" | "sonar" | "arcade"; intensity: "soft" | "normal" | "loud"; mode: "both" | "tone" | "voice"; language: "app" | "es" | "en" | "both"; countdown: boolean }
export const RAPID_AUDIO_KEY = "smash-lob:rapid-audio:v1"
export const DEFAULT_RAPID_AUDIO: RapidAudioSettings = { sound: "beep", intensity: "loud", mode: "both", language: "app", countdown: true }
export function parseRapidAudio(value: unknown): RapidAudioSettings {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const choice = <T extends string>(key: string, allowed: readonly T[], fallback: T) => allowed.includes(raw[key] as T) ? raw[key] as T : fallback
  return { sound: choice("sound", ["beep", "bell", "whistle", "gong", "chime", "horn", "sonar", "arcade"], "beep"), intensity: choice("intensity", ["soft", "normal", "loud"], "loud"), mode: choice("mode", ["both", "tone", "voice"], "both"), language: choice("language", ["app", "es", "en", "both"], "app"), countdown: typeof raw.countdown === "boolean" ? raw.countdown : true }
}
export function loadRapidAudio(): RapidAudioSettings { try { return parseRapidAudio(JSON.parse(localStorage.getItem(RAPID_AUDIO_KEY) ?? "null")) } catch { return { ...DEFAULT_RAPID_AUDIO } } }
export function saveRapidAudio(settings: RapidAudioSettings) { try { localStorage.setItem(RAPID_AUDIO_KEY, JSON.stringify(parseRapidAudio(settings))) } catch { /* Preferences still apply for this screen when storage is unavailable. */ } }
