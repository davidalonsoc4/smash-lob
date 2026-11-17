/**
 * Automatic thumbnail for a chat video, picked in the browser before it is uploaded.
 * The preferred frame is at 2.5 s (the opening of most videos is a black frame or a transition); if that frame is
 * too dark, too bright or flat, the next candidates are tried and, as a last resort, the most contrasted one wins.
 */
export const POSTER_PREFERRED_SECONDS = 2.5
const POSTER_MAX_WIDTH = 640
const SAMPLE_WIDTH = 48
const STEP_TIMEOUT_MS = 4000
const TOTAL_TIMEOUT_MS = 12000

export type FrameSample = { time: number; luminance: number; contrast: number }

export function isUsableFrame(sample: FrameSample) {
  return sample.luminance >= 0.07 && sample.luminance <= 0.93 && sample.contrast >= 0.04
}

/** The first usable candidate (they come in order of preference), otherwise the most contrasted frame. */
export function pickPosterFrame(samples: FrameSample[]): FrameSample | null {
  const usable = samples.find(isUsableFrame)
  if (usable) return usable
  return samples.reduce<FrameSample | null>((best, sample) => (!best || sample.contrast > best.contrast ? sample : best), null)
}

/** Times to try, best first, always inside the video. */
export function posterCandidateTimes(duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return [0]
  const clamp = (value: number) => Math.min(Math.max(0.05, value), Math.max(0.05, duration - 0.05))
  const preferred = duration > POSTER_PREFERRED_SECONDS * 2 ? POSTER_PREFERRED_SECONDS : duration * 0.5
  const times = [preferred, duration * 0.2, duration * 0.4, duration * 0.6, duration * 0.8, duration * 0.1].map(clamp)
  return [...new Set(times.map((time) => Math.round(time * 100) / 100))]
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error("timeout")), ms)
    promise.then((value) => { window.clearTimeout(timer); resolve(value) }, (error) => { window.clearTimeout(timer); reject(error) })
  })
}

function once(target: HTMLVideoElement, event: string) {
  return new Promise<void>((resolve, reject) => {
    const onDone = () => { target.removeEventListener(event, onDone); target.removeEventListener("error", onError); resolve() }
    const onError = () => { target.removeEventListener(event, onDone); target.removeEventListener("error", onError); reject(new Error("video error")) }
    target.addEventListener(event, onDone, { once: true })
    target.addEventListener("error", onError, { once: true })
  })
}

function measureFrame(video: HTMLVideoElement, time: number): FrameSample | null {
  const height = Math.max(1, Math.round((SAMPLE_WIDTH * video.videoHeight) / video.videoWidth))
  const canvas = document.createElement("canvas")
  canvas.width = SAMPLE_WIDTH
  canvas.height = height
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  context.drawImage(video, 0, 0, SAMPLE_WIDTH, height)
  const { data } = context.getImageData(0, 0, SAMPLE_WIDTH, height)
  let sum = 0
  let sumSquares = 0
  const pixels = data.length / 4
  for (let index = 0; index < data.length; index += 4) {
    const value = (0.2126 * data[index] + 0.7152 * data[index + 1] + 0.0722 * data[index + 2]) / 255
    sum += value
    sumSquares += value * value
  }
  const luminance = sum / pixels
  return { time, luminance, contrast: Math.sqrt(Math.max(0, sumSquares / pixels - luminance * luminance)) }
}

export type VideoPoster = { blob: Blob; width: number; height: number; durationMs: number; time: number }

/** Returns null when the browser cannot decode the video; the chat then simply has no thumbnail file. */
export async function extractVideoPoster(file: Blob): Promise<VideoPoster | null> {
  if (typeof document === "undefined") return null
  const url = URL.createObjectURL(file)
  const video = document.createElement("video")
  video.muted = true
  video.playsInline = true
  video.preload = "auto"
  video.src = url
  try {
    return await withTimeout((async () => {
      await once(video, "loadedmetadata")
      if (!video.videoWidth || !video.videoHeight) return null
      const samples: FrameSample[] = []
      for (const time of posterCandidateTimes(video.duration)) {
        video.currentTime = time
        await withTimeout(once(video, "seeked"), STEP_TIMEOUT_MS)
        const sample = measureFrame(video, time)
        if (!sample) continue
        samples.push(sample)
        if (isUsableFrame(sample)) break
      }
      const chosen = pickPosterFrame(samples)
      if (!chosen) return null
      if (Math.abs(video.currentTime - chosen.time) > 0.02) {
        video.currentTime = chosen.time
        await withTimeout(once(video, "seeked"), STEP_TIMEOUT_MS)
      }
      const scale = Math.min(1, POSTER_MAX_WIDTH / video.videoWidth)
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(video.videoWidth * scale)
      canvas.height = Math.round(video.videoHeight * scale)
      const context = canvas.getContext("2d")
      if (!context) return null
      context.drawImage(video, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82))
      return blob ? { blob, width: video.videoWidth, height: video.videoHeight, durationMs: Math.round(video.duration * 1000), time: chosen.time } : null
    })(), TOTAL_TIMEOUT_MS)
  } catch {
    return null
  } finally {
    video.removeAttribute("src")
    video.load()
    URL.revokeObjectURL(url)
  }
}

export async function readImageSize(file: Blob): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== "function") return null
  try {
    const bitmap = await createImageBitmap(file)
    const size = { width: bitmap.width, height: bitmap.height }
    bitmap.close()
    return size.width > 0 && size.height > 0 ? size : null
  } catch {
    return null
  }
}
