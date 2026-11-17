/**
 * Lossless MP4 helpers that run in the browser before a chat video is uploaded:
 *  - read whether the index (moov) is at the start of the file ("faststart") and the audio sample rate;
 *  - move the index to the start without re-encoding, so the video starts playing before it is fully downloaded.
 * Re-encoding audio (for example to 48 kHz) is not possible here: it needs ffmpeg in the export step.
 */

export type Mp4Info = {
  faststart: boolean
  hasVideo: boolean
  hasAudio: boolean
  /** Sample rate declared by the audio track, or null when there is no audio. */
  audioSampleRate: number | null
  fragmented: boolean
}

type TopBox = { type: string; offset: number; size: number; header: number }

const CONTAINERS = new Set(["moov", "trak", "mdia", "minf", "stbl"])
const MAX_TOP_BOXES = 64
const MAX_MOOV_BYTES = 16 * 1024 * 1024

async function readBytes(blob: Blob, start: number, end: number) {
  return new Uint8Array(await blob.slice(start, end).arrayBuffer())
}

function fourcc(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3])
}

async function readTopBoxes(file: Blob) {
  const boxes: TopBox[] = []
  let offset = 0
  while (offset + 8 <= file.size && boxes.length < MAX_TOP_BOXES) {
    const head = await readBytes(file, offset, Math.min(offset + 16, file.size))
    const view = new DataView(head.buffer)
    let size = view.getUint32(0)
    const type = fourcc(head, 4)
    let header = 8
    if (size === 1) {
      if (head.length < 16) return null
      size = Number(view.getBigUint64(8))
      header = 16
    } else if (size === 0) size = file.size - offset
    if (size < header || offset + size > file.size) return null
    boxes.push({ type, offset, size, header })
    offset += size
  }
  return boxes
}

type Child = { type: string; start: number; end: number; body: number }

function children(bytes: Uint8Array, start: number, end: number) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const found: Child[] = []
  let offset = start
  while (offset + 8 <= end) {
    let size = view.getUint32(offset)
    const type = fourcc(bytes, offset + 4)
    let header = 8
    if (size === 1 && offset + 16 <= end) { size = Number(view.getBigUint64(offset + 8)); header = 16 }
    else if (size === 0) size = end - offset
    if (size < header || offset + size > end) break
    found.push({ type, start: offset, end: offset + size, body: offset + header })
    offset += size
  }
  return found
}

function walk(bytes: Uint8Array, start: number, end: number, visit: (box: Child, path: string[]) => void, path: string[] = []) {
  for (const box of children(bytes, start, end)) {
    visit(box, path)
    if (CONTAINERS.has(box.type)) walk(bytes, box.body, box.end, visit, [...path, box.type])
  }
}

const AAC_RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350]

/** Some encoders leave the rate at 0 in the sample entry and only declare it in the AAC config (esds). */
function sampleRateFromEsds(bytes: Uint8Array, entryStart: number, entryEnd: number) {
  const esds = children(bytes, entryStart + 36, entryEnd).find((child) => child.type === "esds")
  if (!esds) return null
  let offset = esds.body + 4
  while (offset + 2 <= esds.end) {
    const tag = bytes[offset++]
    let length = 0
    for (let count = 0; count < 4 && offset < esds.end; count++) {
      const byte = bytes[offset++]
      length = (length << 7) | (byte & 0x7f)
      if (!(byte & 0x80)) break
    }
    if (tag === 0x03) offset += 3
    else if (tag === 0x04) offset += 13
    else if (tag === 0x05) {
      if (offset + 2 > esds.end) return null
      const index = ((bytes[offset] & 0x07) << 1) | (bytes[offset + 1] >> 7)
      return AAC_RATES[index] ?? null
    } else offset += length
  }
  return null
}

export async function inspectMp4(file: Blob): Promise<Mp4Info | null> {
  const boxes = await readTopBoxes(file)
  if (!boxes || !boxes.some((box) => box.type === "ftyp")) return null
  const moov = boxes.find((box) => box.type === "moov")
  const mdat = boxes.find((box) => box.type === "mdat")
  if (!moov || moov.size > MAX_MOOV_BYTES) return null
  const bytes = await readBytes(file, moov.offset, moov.offset + moov.size)
  const view = new DataView(bytes.buffer)
  let hasVideo = false
  let hasAudio = false
  let audioSampleRate: number | null = null
  walk(bytes, 8, bytes.length, (box, path) => {
    if (box.type === "hdlr" && path.at(-1) === "mdia") {
      const handler = fourcc(bytes, box.body + 8)
      if (handler === "vide") hasVideo = true
      if (handler === "soun") hasAudio = true
    }
    if (box.type === "stsd" && path.at(-1) === "stbl") {
      // stsd: version/flags(4) entry_count(4), then the first sample entry (size, type, ...).
      const entry = box.body + 8
      const kind = fourcc(bytes, entry + 4)
      if (kind === "mp4a" || kind === "Opus" || kind === "ac-3" || kind === "ec-3") {
        // Audio sample entry: 8 header + 6 reserved + 2 index + 8 reserved + 2 channels + 2 bits + 4 + 4 rate (16.16).
        const declared = view.getUint32(entry + 32) >>> 16
        audioSampleRate = declared || (kind === "mp4a" ? sampleRateFromEsds(bytes, entry, entry + view.getUint32(entry)) : null)
      }
    }
  })
  return {
    faststart: !mdat || moov.offset < mdat.offset,
    hasVideo,
    hasAudio,
    audioSampleRate: hasAudio ? audioSampleRate : null,
    fragmented: boxes.some((box) => box.type === "moof"),
  }
}

/**
 * Returns the same video with the index before the media data (no re-encoding), or null when it is already
 * that way, is fragmented, or its structure is not one this function can safely rewrite.
 */
export async function moveMoovToFront(file: Blob): Promise<Blob | null> {
  const boxes = await readTopBoxes(file)
  if (!boxes || boxes.some((box) => box.type === "moof")) return null
  const moov = boxes.find((box) => box.type === "moov")
  const firstMdat = boxes.find((box) => box.type === "mdat")
  if (!moov || !firstMdat || moov.offset < firstMdat.offset || moov.size > MAX_MOOV_BYTES) return null

  const bytes = await readBytes(file, moov.offset, moov.offset + moov.size)
  const view = new DataView(bytes.buffer)
  const shift = moov.size
  let patched = 0
  let unsafe = false
  walk(bytes, 8, bytes.length, (box) => {
    if (box.type === "stco") {
      const count = view.getUint32(box.body + 4)
      if (box.body + 8 + count * 4 > box.end) { unsafe = true; return }
      for (let index = 0; index < count; index++) {
        const at = box.body + 8 + index * 4
        const value = view.getUint32(at) + shift
        if (value > 0xffffffff) { unsafe = true; return }
        view.setUint32(at, value)
      }
      patched++
    } else if (box.type === "co64") {
      const count = view.getUint32(box.body + 4)
      if (box.body + 8 + count * 8 > box.end) { unsafe = true; return }
      for (let index = 0; index < count; index++) {
        const at = box.body + 8 + index * 8
        view.setBigUint64(at, view.getBigUint64(at) + BigInt(shift))
      }
      patched++
    }
  })
  if (unsafe || patched === 0) return null

  const parts: BlobPart[] = []
  for (const box of boxes) {
    if (box === moov) continue
    if (box === firstMdat) parts.push(bytes)
    parts.push(file.slice(box.offset, box.offset + box.size))
  }
  return new Blob(parts, { type: file.type || "video/mp4" })
}
