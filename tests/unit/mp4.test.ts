import { describe, expect, it } from "vitest"
import { inspectMp4, moveMoovToFront } from "@/lib/mp4"

function box(type: string, ...payload: Uint8Array[]) {
  const body = payload.reduce((total, part) => total + part.length, 0)
  const out = new Uint8Array(8 + body)
  const view = new DataView(out.buffer)
  view.setUint32(0, out.length)
  for (let index = 0; index < 4; index++) out[4 + index] = type.charCodeAt(index)
  let offset = 8
  for (const part of payload) { out.set(part, offset); offset += part.length }
  return out
}
const u32 = (...values: number[]) => { const out = new Uint8Array(values.length * 4); const view = new DataView(out.buffer); values.forEach((value, index) => view.setUint32(index * 4, value)); return out }
const ascii = (text: string) => Uint8Array.from([...text].map((char) => char.charCodeAt(0)))

function hdlr(handler: string) { return box("hdlr", u32(0, 0), ascii(handler), new Uint8Array(12)) }
function audioEntry(rate: number) {
  const entry = new Uint8Array(28)
  const view = new DataView(entry.buffer)
  view.setUint16(16, 2)
  view.setUint16(18, 16)
  view.setUint32(24, rate * 65536)
  return box("mp4a", entry)
}
function track(handler: string, chunkOffset: number, sampleEntry: Uint8Array) {
  const stsd = box("stsd", u32(0, 1), sampleEntry)
  const stco = box("stco", u32(0, 1, chunkOffset))
  return box("trak", box("mdia", hdlr(handler), box("minf", box("stbl", stsd, stco))))
}

/** ftyp + free + mdat(payload) + moov, the layout many encoders produce (index at the end). */
function build(options: { faststart: boolean; rate?: number }) {
  const ftyp = box("ftyp", ascii("isom"), u32(0), ascii("isom"))
  const free = box("free")
  const payload = Uint8Array.from({ length: 64 }, (_, index) => index + 1)
  const mdat = box("mdat", payload)
  const makeMoov = (payloadOffset: number) => box("moov", box("mvhd", new Uint8Array(100)),
    track("vide", payloadOffset, box("avc1", new Uint8Array(78))),
    track("soun", payloadOffset + 16, audioEntry(options.rate ?? 48000)))
  const sizeOfMoov = makeMoov(0).length
  const payloadStart = options.faststart ? ftyp.length + free.length + sizeOfMoov + 8 : ftyp.length + free.length + 8
  const moov = makeMoov(payloadStart)
  const parts = options.faststart ? [ftyp, free, moov, mdat] : [ftyp, free, mdat, moov]
  return { blob: new Blob(parts as BlobPart[], { type: "video/mp4" }), payload, payloadStart, moovSize: moov.length }
}

async function bytesAt(blob: Blob, start: number, length: number) {
  return new Uint8Array(await blob.slice(start, start + length).arrayBuffer())
}

describe("mp4 helpers", () => {
  it("detects an index at the end and the audio sample rate", async () => {
    const { blob } = build({ faststart: false, rate: 44100 })
    expect(await inspectMp4(blob)).toMatchObject({ faststart: false, hasVideo: true, hasAudio: true, audioSampleRate: 44100, fragmented: false })
  })

  it("detects an index at the start", async () => {
    const { blob } = build({ faststart: true, rate: 48000 })
    expect(await inspectMp4(blob)).toMatchObject({ faststart: true, audioSampleRate: 48000 })
  })

  it("moves the index to the front without touching the media data", async () => {
    const { blob, payload, payloadStart, moovSize } = build({ faststart: false })
    const moved = await moveMoovToFront(blob)
    expect(moved).not.toBeNull()
    expect(moved!.size).toBe(blob.size)
    expect(await inspectMp4(moved!)).toMatchObject({ faststart: true, hasVideo: true, hasAudio: true })
    // The chunk offsets now point at the same bytes, which moved by the size of the index.
    const shifted = payloadStart + moovSize
    expect(await bytesAt(moved!, shifted, payload.length)).toEqual(payload)
    const reread = await moveMoovToFront(moved!)
    expect(reread).toBeNull()
  })

  it("keeps the chunk offsets consistent with the moved data", async () => {
    const { blob, payload } = build({ faststart: false })
    const moved = (await moveMoovToFront(blob))!
    const bytes = new Uint8Array(await moved.arrayBuffer())
    const view = new DataView(bytes.buffer)
    // Find both stco boxes and check each first offset lands inside the payload region.
    const marker = [0x73, 0x74, 0x63, 0x6f]
    const offsets: number[] = []
    for (let index = 0; index < bytes.length - 16; index++) {
      if (marker.every((value, step) => bytes[index + step] === value)) offsets.push(view.getUint32(index + 12))
    }
    expect(offsets).toHaveLength(2)
    expect(bytes.slice(offsets[0], offsets[0] + payload.length)).toEqual(payload)
  })

  it("leaves a file that is not an MP4 alone", async () => {
    const junk = new Blob([new Uint8Array(200).fill(7)])
    expect(await inspectMp4(junk)).toBeNull()
    expect(await moveMoovToFront(junk)).toBeNull()
  })

  it("does nothing for a video that already has the index first", async () => {
    const { blob } = build({ faststart: true })
    expect(await moveMoovToFront(blob)).toBeNull()
  })
})

describe("mp4 audio rate from the AAC config", () => {
  it("falls back to esds when the sample entry declares 0", async () => {
    // AudioSpecificConfig 0x11 0x90 = AAC-LC, frequency index 3 (48000 Hz), stereo.
    const esds = box("esds", u32(0), Uint8Array.from([0x03, 0x19, 0, 0, 0, 0x04, 0x11, 0x40, 0x15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x05, 0x02, 0x11, 0x90]))
    const entryPayload = new Uint8Array(28)
    const entry = box("mp4a", entryPayload, esds)
    const ftyp = box("ftyp", ascii("isom"), u32(0), ascii("isom"))
    const mdat = box("mdat", new Uint8Array(16))
    const moov = box("moov", track("soun", 40, entry))
    const info = await inspectMp4(new Blob([ftyp, mdat, moov] as BlobPart[]))
    expect(info?.audioSampleRate).toBe(48000)
  })
})
