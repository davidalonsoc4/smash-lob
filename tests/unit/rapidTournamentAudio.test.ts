// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"
import { DEFAULT_RAPID_AUDIO, loadRapidAudio, parseRapidAudio, saveRapidAudio } from "@/lib/rapidAudioSettings"

let audio: typeof import("@/lib/rapidTournamentAudio")
const spoken: SpeechSynthesisUtterance[] = [], gains: number[] = [], played = vi.fn(), stop = vi.fn(), cancel = vi.fn()
const voices = [{ voiceURI: "es-test", lang: "es-ES", localService: true }, { voiceURI: "en-test", lang: "en-GB", localService: true }]
class AudioStub {
  state = "suspended"; currentTime = 0; destination = {}
  async resume() { this.state = "running" }
  async suspend() { this.state = "suspended" }
  createOscillator() { return { frequency: { value: 0 }, connect() {}, disconnect() {}, start: played, stop, onended: null } }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime(value: number) { gains.push(value) } }, connect() {}, disconnect() {} } }
  async decodeAudioData() { return {} }
  createBufferSource() { return { connect() {}, disconnect() {}, start: played, stop, buffer: null, onended: null } }
}
describe("rapid tournament audio preferences and sequencing", () => {
  beforeEach(async () => {
    vi.useFakeTimers(); vi.resetModules(); spoken.length = 0; gains.length = 0; played.mockClear(); stop.mockClear(); cancel.mockClear(); localStorage.clear()
    Object.defineProperty(document, "hidden", { value: false, configurable: true })
    vi.stubGlobal("AudioContext", AudioStub)
    vi.stubGlobal("SpeechSynthesisUtterance", class { text: string; constructor(text: string) { this.text = text } })
    vi.stubGlobal("speechSynthesis", { getVoices: () => voices, cancel, speak: (utterance: SpeechSynthesisUtterance) => spoken.push(utterance) })
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) })))
    audio = await import("@/lib/rapidTournamentAudio")
    await audio.enableRapidAudio("tournament")
    await vi.runAllTimersAsync()
  })
  afterEach(() => { audio.disableRapidAudio(); vi.useRealTimers(); vi.unstubAllGlobals() })
  it("validates stored choices and recovers from corrupt or unavailable storage", () => {
    expect(parseRapidAudio({ sound: "invalid", intensity: 99, countdown: "true" })).toEqual(DEFAULT_RAPID_AUDIO)
    saveRapidAudio({ ...DEFAULT_RAPID_AUDIO, language: "both", sound: "gong", voiceEs: "es-test", countdown: false })
    expect(loadRapidAudio()).toMatchObject({ language: "both", sound: "gong", voiceEs: "es-test", countdown: false })
    localStorage.setItem("smash-lob:rapid-audio:v1", "{")
    expect(loadRapidAudio()).toEqual(DEFAULT_RAPID_AUDIO)
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw Error("blocked") })
    expect(loadRapidAudio()).toEqual(DEFAULT_RAPID_AUDIO)
  })
  it("speaks English then Spanish after completion and a 600 ms pause, using each selected voice", async () => {
    const settings = { ...DEFAULT_RAPID_AUDIO, mode: "voice" as const, language: "both" as const, voiceEn: "en-test", voiceEs: "es-test" }
    audio.playRapidAudio("tournament", { en: "Round three starts", es: "Comienza la ronda tres" }, "es", false, settings)
    await vi.advanceTimersByTimeAsync(0)
    expect(spoken).toHaveLength(1); expect(spoken[0]).toMatchObject({ lang: "en-GB", voice: voices[1], volume: 1 })
    await vi.advanceTimersByTimeAsync(2000); expect(spoken).toHaveLength(1)
    spoken[0].onend?.call(spoken[0], new Event("end") as SpeechSynthesisEvent)
    await vi.advanceTimersByTimeAsync(599); expect(spoken).toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1); expect(spoken[1]).toMatchObject({ lang: "es-ES", text: "Comienza la ronda tres", voice: voices[0] })
  })
  it("cancels the second language when muted, hidden, or replaced by a new cue", async () => {
    for (const action of ["mute", "hidden", "new"] as const) {
      await audio.enableRapidAudio("tournament"); spoken.length = 0
      Object.defineProperty(document, "hidden", { value: false, configurable: true })
      audio.playRapidAudio("tournament", { en: "First", es: "Second" }, "es", false, { ...DEFAULT_RAPID_AUDIO, mode: "voice", language: "both" })
      await vi.advanceTimersByTimeAsync(0); spoken[0].onend?.call(spoken[0], new Event("end") as SpeechSynthesisEvent)
      if (action === "mute") audio.disableRapidAudio()
      else if (action === "hidden") { Object.defineProperty(document, "hidden", { value: true, configurable: true }); audio.suspendRapidAudio() }
      else audio.playRapidAudio("tournament", { es: "Replacement" }, "es", false, { ...DEFAULT_RAPID_AUDIO, mode: "voice" })
      await vi.advanceTimersByTimeAsync(2000)
      expect(spoken.map((item) => item.text)).not.toContain("Second")
    }
  })
  it("supports all four sounds, stronger bounded gain, tone-only and voice-only modes", async () => {
    for (const sound of ["beep", "bell", "whistle", "gong"] as const) {
      played.mockClear(); audio.playRapidAudio("tournament", { es: "Test" }, "es", false, { ...DEFAULT_RAPID_AUDIO, mode: "tone", sound })
      expect(played).toHaveBeenCalled(); expect(spoken).toHaveLength(0)
    }
    expect(Math.max(...gains)).toBeGreaterThan(.18); expect(Math.max(...gains)).toBeLessThan(1)
    played.mockClear(); audio.playRapidCountdown("tournament", 3, "es", { ...DEFAULT_RAPID_AUDIO, mode: "tone" }); expect(played).toHaveBeenCalledTimes(1)
    played.mockClear(); audio.playRapidAudio("tournament", { es: "Test" }, "es", false, { ...DEFAULT_RAPID_AUDIO, mode: "voice", voiceEs: "missing" })
    await vi.advanceTimersByTimeAsync(0); expect(played).not.toHaveBeenCalled(); expect(spoken[0].voice).toEqual(voices[0])
  })
  it("previews three prepared numbers before the message and cancels pending preview steps", async () => {
    played.mockClear(); audio.previewRapidAudio("tournament", { es: "Test" }, "es", { ...DEFAULT_RAPID_AUDIO, mode: "voice" })
    expect(played).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(2000); expect(played).toHaveBeenCalledTimes(3); expect(spoken).toHaveLength(0)
    await vi.advanceTimersByTimeAsync(1001); expect(spoken[0].text).toBe("Test")
    spoken.length = 0; audio.previewRapidAudio("tournament", { es: "Cancelled" }, "es", DEFAULT_RAPID_AUDIO)
    audio.disableRapidAudio(); await vi.advanceTimersByTimeAsync(5000); expect(spoken).toHaveLength(0)
  })
  it("ships bounded countdown samples shorter than one second and loads them only once", async () => {
    for (const lang of ["en", "es"]) for (const number of [1, 2, 3]) {
      const wav = readFileSync(`public/audio/tournament/${lang}-${number}.wav`)
      expect(wav.toString("ascii", 0, 4)).toBe("RIFF")
      expect(wav.readUInt16LE(20)).toBe(1); expect(wav.readUInt16LE(22)).toBe(1)
      const duration = wav.readUInt32LE(40) / wav.readUInt32LE(28)
      expect(duration).toBeGreaterThan(.1); expect(duration).toBeLessThan(.5)
      let peak = 0; for (let offset = 44; offset < wav.length; offset += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(offset)))
      expect(peak).toBeLessThanOrEqual(28000); expect(peak).toBeGreaterThan(27000)
    }
    await audio.enableRapidAudio("tournament")
    expect(fetch).toHaveBeenCalledTimes(6)
  })
})
