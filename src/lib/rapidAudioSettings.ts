export type RapidAudioSettings = { sound: "beep" | "bell" | "whistle" | "gong"; intensity: "soft" | "normal" | "loud"; mode: "both" | "tone" | "voice"; language: "app" | "es" | "en" | "both"; voiceEs: string; voiceEn: string; countdown: boolean }
export const RAPID_AUDIO_KEY = "smash-lob:rapid-audio:v1"
export const DEFAULT_RAPID_AUDIO: RapidAudioSettings = { sound: "beep", intensity: "loud", mode: "both", language: "app", voiceEs: "", voiceEn: "", countdown: true }
export function parseRapidAudio(value: unknown): RapidAudioSettings {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {}
  const choice = <T extends string>(key: string, allowed: readonly T[], fallback: T) => allowed.includes(raw[key] as T) ? raw[key] as T : fallback
  return { sound: choice("sound", ["beep", "bell", "whistle", "gong"], "beep"), intensity: choice("intensity", ["soft", "normal", "loud"], "loud"), mode: choice("mode", ["both", "tone", "voice"], "both"), language: choice("language", ["app", "es", "en", "both"], "app"), voiceEs: typeof raw.voiceEs === "string" ? raw.voiceEs.slice(0, 300) : "", voiceEn: typeof raw.voiceEn === "string" ? raw.voiceEn.slice(0, 300) : "", countdown: typeof raw.countdown === "boolean" ? raw.countdown : true }
}
export function loadRapidAudio(): RapidAudioSettings { try { return parseRapidAudio(JSON.parse(localStorage.getItem(RAPID_AUDIO_KEY) ?? "null")) } catch { return { ...DEFAULT_RAPID_AUDIO } } }
export function saveRapidAudio(settings: RapidAudioSettings) { try { localStorage.setItem(RAPID_AUDIO_KEY, JSON.stringify(parseRapidAudio(settings))) } catch { /* Preferences still apply for this screen when storage is unavailable. */ } }
