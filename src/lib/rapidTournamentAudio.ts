import { loadRapidAudio, type RapidAudioSettings } from "./rapidAudioSettings"
export type RapidSpeech = Record<string, string>
let context: AudioContext | null = null, enabledFor: string | null = null, generation = 0
const timers = new Set<ReturnType<typeof setTimeout>>(), sources = new Set<AudioScheduledSourceNode>(), samples = new Map<string, AudioBuffer>()
let loading: Promise<void> | null = null
export function rapidAudioEnabled(id: string) { return enabledFor === id }
function later(callback: () => void, delay: number) { const timer = setTimeout(() => { timers.delete(timer); callback() }, delay); timers.add(timer) }
export function cancelRapidPlayback() { generation++; timers.forEach(clearTimeout); timers.clear(); sources.forEach((source) => { try { source.stop() } catch {} }); sources.clear(); window.speechSynthesis?.cancel() }
export async function enableRapidAudio(id: string) {
  try {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Constructor) return false
    if (!context || context.state === "closed") { context = new Constructor(); samples.clear(); loading = null }
    await context.resume()
    if (context.state !== "running") return false
    enabledFor = id
    if (!loading) {
      const decoder = context
      loading = Promise.all(["en", "es"].flatMap((lang) => [1, 2, 3].map(async (number) => {
        const key = `${lang}-${number}`, response = await fetch(`/audio/tournament/${key}.wav`)
        if (!response.ok) throw new Error("sample_unavailable")
        const buffer = await decoder.decodeAudioData(await response.arrayBuffer())
        if (context === decoder) samples.set(key, buffer)
      }))).then(() => {}).catch(() => { loading = null })
    }
    return true
  } catch { return false }
}
export function suspendRapidAudio() { cancelRapidPlayback(); void context?.suspend().catch(() => {}) }
export function disableRapidAudio() { enabledFor = null; suspendRapidAudio() }
function audible(id: string) { return enabledFor === id && context?.state === "running" && !document.hidden }
function level(settings: RapidAudioSettings) { return settings.intensity === "loud" ? .95 : settings.intensity === "normal" ? .4 : .18 }
function track(source: AudioScheduledSourceNode, gain: GainNode) { sources.add(source); source.onended = () => { sources.delete(source); source.disconnect(); gain.disconnect() } }
function tone(settings: RapidAudioSettings, warning = false, countdown = false) {
  if (!context) return
  const now = context.currentTime
  const patterns: Record<RapidAudioSettings["sound"], number[][]> = {
    beep: (countdown ? [0] : [0, .16, .32]).map((offset) => [warning ? 660 : 880, offset, .1, .9]),
    bell: [[1046, 0, .9, .65], [1568, 0, .7, .25]], whistle: [[2400, 0, .55, .8]], gong: [[220, 0, 1.2, .6], [440, 0, .9, .25]],
    chime: [[784, 0, .18, .8], [1046, .2, .18, .8], [1318, .4, .3, .8]],
    horn: [[196, 0, .7, .5], [294, 0, .7, .4]], sonar: [[1200, 0, .3, .8], [1200, .45, .3, .8]],
    arcade: [[523, 0, .1, .8], [659, .12, .1, .8], [784, .24, .1, .8], [1046, .36, .2, .8]],
  }
  const notes = patterns[settings.sound]
  for (const [frequency, offset, duration, strength] of notes) {
    const oscillator = context.createOscillator(), gain = context.createGain(), start = now + offset
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(level(settings) * strength, start + .015); gain.gain.linearRampToValueAtTime(0, start + duration)
    oscillator.connect(gain); gain.connect(context.destination); track(oscillator, gain); oscillator.start(start); oscillator.stop(start + duration + .02)
  }
}
function languages(settings: RapidAudioSettings, locale: string) { return settings.language === "both" ? ["en", "es"] : [settings.language === "app" ? locale : settings.language] }
function speak(id: string, text: RapidSpeech, locale: string, settings: RapidAudioSettings, token: number) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return
  const langs = languages(settings, locale)
  const next = (index: number) => {
    if (token !== generation || !audible(id) || index >= langs.length) return
    const lang = langs[index], utterance = new SpeechSynthesisUtterance(text[lang] ?? text.es)
    utterance.lang = lang === "eu" ? "eu-ES" : lang === "en" ? "en-GB" : "es-ES"
    const voices = window.speechSynthesis.getVoices()
    utterance.voice = voices.find((voice) => voice.lang.toLowerCase().startsWith(lang) && voice.localService) ?? voices.find((voice) => voice.lang.toLowerCase().startsWith(lang)) ?? null
    if (utterance.voice) utterance.lang = utterance.voice.lang
    utterance.volume = settings.intensity === "soft" ? .5 : settings.intensity === "normal" ? .8 : 1
    let advanced = false
    const done = () => { if (!advanced && token === generation) { advanced = true; if (index + 1 < langs.length) later(() => next(index + 1), 600) } }
    utterance.onend = done; utterance.onerror = done
    try { window.speechSynthesis.speak(utterance) } catch { done() }
  }
  next(0)
}
export function playRapidAudio(id: string, text: RapidSpeech, locale: string, warning = false, settings = loadRapidAudio()) {
  if (!audible(id)) return
  cancelRapidPlayback()
  try {
    if (settings.mode !== "voice") tone(settings, warning)
    if (settings.mode !== "tone") { const token = generation; later(() => speak(id, text, locale, settings, token), settings.mode === "both" ? 500 : 0) }
  } catch { /* A device audio failure must not affect the tournament clock. */ }
}
export function playRapidCountdown(id: string, number: number, locale: string, settings = loadRapidAudio()) {
  if (!audible(id) || !settings.countdown || !context) return
  cancelRapidPlayback()
  try {
    const language = languages(settings, locale)[0], buffer = samples.get(`${language === "es" ? "es" : "en"}-${number}`)
    if (settings.mode === "tone" || !buffer) { tone({ ...settings, sound: "beep" }, false, true); return }
    const source = context.createBufferSource(), gain = context.createGain()
    source.buffer = buffer; gain.gain.setValueAtTime(level(settings), context.currentTime); source.connect(gain); gain.connect(context.destination); track(source, gain); source.start()
  } catch { /* Countdown is optional; the anchored clock keeps running. */ }
}
export function previewRapidAudio(id: string, text: RapidSpeech, locale: string, settings: RapidAudioSettings) {
  if (!audible(id)) return
  cancelRapidPlayback()
  if (!settings.countdown) { playRapidAudio(id, text, locale, true, settings); return }
  playRapidCountdown(id, 3, locale, settings)
  later(() => { playRapidCountdown(id, 2, locale, settings); later(() => { playRapidCountdown(id, 1, locale, settings); later(() => playRapidAudio(id, text, locale, true, settings), 1000) }, 1000) }, 1000)
}
