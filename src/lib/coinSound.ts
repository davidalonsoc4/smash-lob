/**
 * Sounds of the coin toss, made with the Web Audio API (no audio files): the air while the coin is thrown and a metal "ting" for
 * every time it hits the floor, softer each time. They start with the toss, which is always a touch of the person, so the browser lets them play.
 */
let context: AudioContext | null = null
let noise: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    if (!context) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctor) return null
      context = new Ctor()
    }
    if (context.state === "suspended") void context.resume()
    return context
  } catch {
    return null
  }
}

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  if (noise) return noise
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1
  noise = buffer
  return buffer
}

/** The air of the toss: a rush of filtered noise that rises and fades. `power` is from 0 to 1. */
export function playCoinWhoosh(power = 0.6) {
  const ctx = audio()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const length = 0.9 + 0.3 * power
    const source = ctx.createBufferSource()
    source.buffer = noiseBuffer(ctx)
    const filter = ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.Q.value = 1.2
    filter.frequency.setValueAtTime(500, now)
    filter.frequency.exponentialRampToValueAtTime(2200, now + length * 0.35)
    filter.frequency.exponentialRampToValueAtTime(700, now + length)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.16 + 0.12 * power, now + length * 0.25)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + length)
    source.connect(filter).connect(gain).connect(ctx.destination)
    source.start(now, Math.random())
    source.stop(now + length + 0.05)
  } catch { /* no sound is not a problem */ }
}

/** A hit of the coin on the floor: a short click and a metal ring. `strength` is from 0 to 1 (the first hit is the loudest). */
export function playCoinHit(strength = 1) {
  const ctx = audio()
  if (!ctx) return
  try {
    const now = ctx.currentTime
    const level = 0.05 + 0.22 * Math.min(1, Math.max(0, strength))
    const master = ctx.createGain()
    master.gain.value = level
    master.connect(ctx.destination)
    // The ring: a few partials that do not go together, like a metal disc.
    for (const [frequency, share, decay] of [[2350, 1, 0.34], [3560, 0.6, 0.24], [5230, 0.35, 0.16], [7400, 0.18, 0.1]] as const) {
      const oscillator = ctx.createOscillator()
      oscillator.type = "sine"
      oscillator.frequency.value = frequency * (1 + 0.01 * (Math.random() - 0.5))
      const envelope = ctx.createGain()
      envelope.gain.setValueAtTime(share, now)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + decay * (0.6 + 0.4 * strength))
      oscillator.connect(envelope).connect(master)
      oscillator.start(now)
      oscillator.stop(now + decay + 0.05)
    }
    // The click of the impact.
    const click = ctx.createBufferSource()
    click.buffer = noiseBuffer(ctx)
    const high = ctx.createBiquadFilter()
    high.type = "highpass"
    high.frequency.value = 3000
    const clickGain = ctx.createGain()
    clickGain.gain.setValueAtTime(0.9, now)
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03)
    click.connect(high).connect(clickGain).connect(master)
    click.start(now, Math.random())
    click.stop(now + 0.04)
  } catch { /* no sound is not a problem */ }
}
