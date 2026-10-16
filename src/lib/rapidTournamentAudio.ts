let context: AudioContext | null = null
let enabledFor: string | null = null
export function rapidAudioEnabled(id: string) { return enabledFor === id }
export async function enableRapidAudio(id: string) {
  try {
    const Constructor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Constructor) return false
    if (!context || context.state === "closed") context = new Constructor()
    await context.resume()
    if (context.state !== "running") return false
    enabledFor = id
    return true
  } catch { return false }
}
export function suspendRapidAudio() {
  void context?.suspend().catch(() => {})
  window.speechSynthesis?.cancel()
}
export function disableRapidAudio() { enabledFor = null; suspendRapidAudio() }
export function playRapidAudio(id: string, text: string, locale: string, warning = false) {
  if (enabledFor !== id || !context || context.state !== "running" || document.hidden) return
  try {
    const oscillator = context.createOscillator(), gain = context.createGain(), time = context.currentTime
    oscillator.frequency.value = warning ? 660 : 880
    gain.gain.setValueAtTime(0, time)
    gain.gain.linearRampToValueAtTime(.18, time + .02)
    gain.gain.linearRampToValueAtTime(0, time + .35)
    oscillator.connect(gain); gain.connect(context.destination)
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    oscillator.start(time); oscillator.stop(time + .4)
    if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = locale === "eu" ? "eu-ES" : locale === "en" ? "en-GB" : "es-ES"
      window.speechSynthesis.speak(utterance)
    }
  } catch { /* Keep the visual timer running if the device rejects audio. */ }
}
