#!/usr/bin/env node
/**
 * Prepares MP4 videos for the league chat without touching the picture:
 *   - the video track is copied as it is (no re-encoding, no quality loss);
 *   - the audio is converted to AAC at 48 kHz (192 kbps, transparent for speech and music);
 *   - the index (moov) goes at the start of the file so playback starts before the download ends.
 *
 * Usage:
 *   node scripts/prepare-chat-videos.mjs <video-or-folder>... [--out <folder>] [--ffmpeg <path>] [--dry-run]
 *
 * ffmpeg is looked up in --ffmpeg, then FFMPEG_PATH, then the PATH. The originals are never modified: the
 * result goes to "<input folder>/listos-para-chat" unless --out says otherwise.
 */
import { spawnSync } from "node:child_process"
import { existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { basename, dirname, extname, join, resolve } from "node:path"

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const option = (name) => {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : null
}
const valueFlags = new Set(["--out", "--ffmpeg"])
const inputs = args.filter((arg, index) => !arg.startsWith("--") && !valueFlags.has(args[index - 1]))

if (flag("--help") || inputs.length === 0) {
  console.log("Uso: node scripts/prepare-chat-videos.mjs <vídeo-o-carpeta>... [--out <carpeta>] [--ffmpeg <ruta>] [--dry-run]")
  process.exit(inputs.length === 0 && !flag("--help") ? 1 : 0)
}

const dryRun = flag("--dry-run")
const ffmpeg = option("--ffmpeg") ?? process.env.FFMPEG_PATH ?? "ffmpeg"

if (!dryRun) {
  const probe = spawnSync(ffmpeg, ["-version"], { encoding: "utf8" })
  if (probe.error || probe.status !== 0) {
    console.error(`No encuentro ffmpeg ("${ffmpeg}"). Instálalo, o pásalo con --ffmpeg <ruta> o la variable FFMPEG_PATH.`)
    process.exit(2)
  }
}

function listVideos(path) {
  const full = resolve(path)
  if (!existsSync(full)) throw new Error(`No existe: ${path}`)
  if (statSync(full).isFile()) return extname(full).toLowerCase() === ".mp4" ? [full] : []
  return readdirSync(full)
    .filter((name) => extname(name).toLowerCase() === ".mp4")
    .sort()
    .map((name) => join(full, name))
}

const files = inputs.flatMap(listVideos)
if (files.length === 0) {
  console.error("No hay ningún .mp4 en lo que me has pasado.")
  process.exit(1)
}

let failures = 0
for (const file of files) {
  const outDir = option("--out") ? resolve(option("--out")) : join(dirname(file), "listos-para-chat")
  const output = join(outDir, basename(file))
  if (output === file) {
    console.error(`${basename(file)}: la salida coincidiría con el original, no lo toco.`)
    failures += 1
    continue
  }
  const command = [
    "-y", "-i", file,
    "-map", "0:v:0", "-map", "0:a:0?",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
    "-movflags", "+faststart",
    output,
  ]
  if (dryRun) {
    console.log(`${ffmpeg} ${command.map((part) => (/\s/.test(part) ? `"${part}"` : part)).join(" ")}`)
    continue
  }
  mkdirSync(outDir, { recursive: true })
  const result = spawnSync(ffmpeg, command, { encoding: "utf8" })
  if (result.status !== 0) {
    console.error(`${basename(file)}: ffmpeg ha fallado.\n${(result.stderr ?? "").split("\n").slice(-6).join("\n")}`)
    failures += 1
    continue
  }
  const before = (statSync(file).size / 1048576).toFixed(2)
  const after = (statSync(output).size / 1048576).toFixed(2)
  console.log(`${basename(file)}: ${before} MB -> ${after} MB (vídeo intacto, audio a 48 kHz, índice al principio)`)
}

process.exit(failures ? 1 : 0)
