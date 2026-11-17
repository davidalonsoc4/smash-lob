#!/usr/bin/env python3
"""Mezcla una base musical suave bajo la locución de un vídeo (o de un audio).

Uso:
  python3 scripts/add_music.py BASE.mp4|BASE.mp3 VOZ.mp3 MUSICA.mp3 SALIDA.mp4|SALIDA.mp3 [--level -24] [--duck 5]

- BASE: vídeo renderizado (voz + efectos) o un audio. VOZ: pista de voz sola (se usa para bajar la música cuando se habla).
- La música se normaliza a --level LUFS (estándar: -24), entra con fundido de 1,2 s y sale con fundido de 2,4 s.
- Ducking: sidechain con la voz (ratio por defecto 5) para que la música baje mientras se habla.
- Resultado final normalizado a -16 LUFS. El vídeo se copia sin recodificar.
"""
import argparse, subprocess, sys

def dur(path):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path], capture_output=True, text=True, check=True).stdout)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("base"); ap.add_argument("voice"); ap.add_argument("music"); ap.add_argument("out")
    ap.add_argument("--level", type=float, default=-24.0, help="nivel de la música en LUFS antes del ducking (estándar -24)")
    ap.add_argument("--duck", type=float, default=5.0, help="ratio del ducking (más alto = baja más la música al hablar)")
    a = ap.parse_args()
    d = dur(a.base)
    is_video = a.base.lower().endswith((".mp4", ".mov", ".mkv"))
    fc = (
        # la música se repite enlazada (cruce de 3 s) si el vídeo es más largo que ella; fundido final largo y suave
        f"[2:a]loudnorm=I={a.level}:TP=-3:LRA=7,aformat=sample_rates=44100:channel_layouts=stereo,asplit=2[ma][mb];"
        f"[ma][mb]acrossfade=d=3:c1=tri:c2=tri,afade=t=in:st=0:d=1.2,afade=t=out:st={max(0, d - 3.2):.2f}:d=3.2:curve=qsin,atrim=0:{d:.2f}[m];"
        f"[1:a]aformat=sample_rates=44100:channel_layouts=stereo,asplit=1[vs];"
        f"[m][vs]sidechaincompress=threshold=0.015:ratio={a.duck}:attack=20:release=450:makeup=1[md];"
        f"[0:a]aformat=sample_rates=44100:channel_layouts=stereo[b];"
        f"[b][md]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix];"
        f"[mix]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]"
    )
    cmd = ["ffmpeg", "-y", "-i", a.base, "-i", a.voice, "-i", a.music, "-filter_complex", fc]
    if is_video: cmd += ["-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-ar", "48000", "-movflags", "+faststart", "-shortest"]
    else: cmd += ["-map", "[a]", "-b:a", "160k", "-t", f"{d:.2f}"]
    cmd.append(a.out)
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-1500:], file=sys.stderr); sys.exit(1)
    print("OK ->", a.out)

main()
