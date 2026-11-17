#!/usr/bin/env python3
"""Reajusta las pausas de una locución y genera los tiempos para Remotion.

Uso:
  python3 scripts/retime_voice.py AUDIO.mp3 WORDS.json SALIDA.mp3 SALIDA.ts \
      --cuts "liga!,jornadas.,nuevo."  (usa "|" como separador si alguna palabra lleva coma: --cuts "punto,|válido.")
  (valores por defecto = ESTÁNDAR DE LA SERIE: pausas frase 0.7-0.9 s, coma 0.3-0.5 s, cola 0.6 s,
   tempo 1.08 y presencia activada; ver tools/README.md)

- Detecta los silencios reales del audio (ffmpeg silencedetect) y los empareja con cada pausa del guion.
- Corrige el inicio de la primera palabra de cada frase (Scribe lo adelanta ~0,4 s).
- Ajusta cada pausa al rango [mín, máx]: --sentence tras . ! ?   --minor tras , : ;
  (alarga las cortas y recorta las excesivas). No cambia la velocidad ni el tono de la voz.
- Escribe un .ts con VOICE_01 (palabras y tiempos) y BOUNDS_01 (cortes de escena en mitad de las pausas).
"""
import argparse, json, os, re, subprocess, sys, tempfile

def run(*a):
    return subprocess.run(a, check=True, capture_output=True, text=True)

def silences(audio, noise="-34dB", d=0.06):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-i", audio, "-af", f"silencedetect=noise={noise}:d={d}", "-f", "null", "-"], capture_output=True, text=True).stderr
    res, s = [], None
    for l in out.splitlines():
        m = re.search(r"silence_start: ([\d.]+)", l)
        if m: s = float(m.group(1))
        m = re.search(r"silence_end: ([\d.]+)", l)
        if m and s is not None: res.append((s, float(m.group(1)))); s = None
    return res

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("audio"); ap.add_argument("words"); ap.add_argument("out_audio"); ap.add_argument("out_ts")
    ap.add_argument("--sentence", type=float, nargs=2, default=[0.7, 0.9]); ap.add_argument("--minor", type=float, nargs=2, default=[0.3, 0.5])
    ap.add_argument("--tail", type=float, default=1.8); ap.add_argument("--cuts", default="")
    ap.add_argument("--tempo", type=float, default=1.0, help="velocidad de la locución sin cambiar el tono (estándar: 1.0 = natural)")
    ap.add_argument("--pauses", default="", help='pausas concretas tras una palabra, p. ej. "recuerda,=0.7|app?=1.0" (segundos)')
    ap.add_argument("--presence", action="store_true", help="realce de presencia + compresión suave (desactivado por defecto)")
    a = ap.parse_args()
    raw = json.load(open(a.words)); words = raw if isinstance(raw, list) else raw.get("words", raw)
    words = [w for w in words if w.get("type", "word") == "word"]
    sil = [x for x in silences(a.audio) if x[1] - x[0] >= 0.1]
    dur_total = float(run("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a.audio).stdout)
    # empareja pausas del guion con silencios reales
    pauses = {k.strip(): float(v) for k, v in (p.split("=") for p in a.pauses.split("|") if "=" in p)}
    gaps = []
    for i, w in enumerate(words[:-1]):
        t = w["text"]
        kind = "S" if re.search(r"[.!?]$", t) else ("M" if re.search(r"[,:;]$", t) else None)
        if not kind: continue
        w0, n0 = w["start"], words[i + 1]["start"]
        cand = [(s, e) for s, e in sil if s < n0 + 0.05 and e > w0 + 0.1 and s > w0 + 0.05]
        lo, hi = a.sentence if kind == "S" else a.minor
        if t in pauses: lo = hi = pauses[t]
        if cand:
            s, e = max(cand, key=lambda x: x[1] - x[0]); cur = e - s
            new = min(max(cur, lo), hi)
        else:  # sin silencio detectable: inserta entre palabras
            s = e = (w["end"] + n0) / 2 if n0 > w["end"] else w["end"]; cur = 0.0; new = lo
        gaps.append(dict(i=i, kind=kind, s=s, e=e, cur=cur, new=new, mid_old=(s + e) / 2))
    gaps.sort(key=lambda g: g["s"])
    # corrige inicios: primera palabra tras un silencio real arranca cuando termina el silencio
    for g in gaps:
        w = words[g["i"] + 1]
        if g["cur"] > 0 and w["start"] < g["e"]: w["start"] = g["e"]
    # mapa de tiempos: cada intervalo [s,e] pasa a medir `new`
    def shift(t):
        d = 0.0
        for g in gaps:
            if t >= g["e"]: d += g["new"] - (g["e"] - g["s"])
            elif t > g["s"]: d += (g["new"] - (g["e"] - g["s"])) * (t - g["s"]) / max(g["e"] - g["s"], 1e-9)
        return t + d
    # audio
    tmp = tempfile.mkdtemp(); parts = []; prev = 0.0
    def piece(name, a_, b_, fade_in=False, fade_out=False):
        # fundidos cortos en los empalmes (20 ms entrada / 40 ms salida) para evitar chasquidos al cortar la voz
        f = os.path.join(tmp, name + ".wav")
        af = []
        if fade_in: af.append("afade=t=in:st=0:d=0.02")
        if fade_out: af.append(f"afade=t=out:st={max(0.0, (b_ - a_) - 0.04):.3f}:d=0.04")
        cmd = ["ffmpeg", "-y", "-i", a.audio, "-ss", f"{a_:.3f}", "-to", f"{b_:.3f}"] + (["-af", ",".join(af)] if af else []) + ["-ar", "44100", "-ac", "1", "-c:a", "pcm_s16le", f]
        run(*cmd); parts.append(f)
    def silence(name, d_):
        f = os.path.join(tmp, name + ".wav")
        run("ffmpeg", "-y", "-f", "lavfi", "-i", "anullsrc=r=44100:cl=mono", "-t", f"{d_:.3f}", "-c:a", "pcm_s16le", f); parts.append(f)
    for k, g in enumerate(gaps):
        if abs(g["new"] - (g["e"] - g["s"])) < 0.015 and g["cur"] > 0: continue  # ya está bien
        # se conserva hasta 120 ms de la cola natural de la palabra y 50 ms antes de la siguiente (el silencio se acorta lo mismo)
        pad = min(0.12, max(0.0, g["e"] - g["s"] - 0.02)) if g["cur"] > 0 else 0.0
        pre = 0.05 if g["cur"] > 0.1 else 0.0
        if g["s"] > prev: piece(f"p{k}", max(0.0, prev - (pre if k > 0 else 0.0)), g["s"] + pad, fade_in=prev > 0, fade_out=True)
        silence(f"g{k}", max(0.05, g["new"] - pad - pre)); prev = max(prev, g["e"])
    piece("last", max(0.0, prev - 0.05), dur_total, fade_in=True); silence("tail", a.tail)
    lst = os.path.join(tmp, "l.txt"); open(lst, "w").write("".join(f"file '{p}'\n" for p in parts))
    cat = os.path.join(tmp, "cat.wav"); run("ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c:a", "pcm_s16le", cat)
    chain = []
    if abs(a.tempo - 1.0) > 1e-6: chain.append(f"atempo={a.tempo}")
    if a.presence: chain += ["highpass=f=70", "equalizer=f=250:t=q:w=1:g=-1.5", "equalizer=f=3500:t=q:w=0.9:g=2.2", "equalizer=f=9000:t=q:w=0.8:g=1.2", "acompressor=threshold=-20dB:ratio=2.5:attack=5:release=90:makeup=2"]
    chain.append("loudnorm=I=-16:TP=-1.5:LRA=11")
    run("ffmpeg", "-y", "-i", cat, "-af", ",".join(chain), "-ar", "44100", "-b:a", "160k", a.out_audio)
    # palabras con nuevos tiempos
    disp = {"and": "&", "veinte": "20", "uno": "1"}
    out = []
    for idx, w in enumerate(words):
        t = w["text"]; key = re.sub(r"[¡¿,.:!?;]", "", t).lower()
        nxt = re.sub(r"[¡¿,.:!?;]", "", words[idx + 1]["text"]).lower() if idx + 1 < len(words) else ""
        # "and"→"&" siempre; "veinte"/"uno"→cifra solo si van seguidos de "de" (fechas)
        use = key == "and" or (key in ("veinte", "uno") and nxt == "de")
        d = (disp[key] + re.sub(r"[^,.:!?;]", "", t)) if use else t
        d = re.sub(r"(?i)em-?bi-?p[ií]", "MVP", d)  # la voz dice "Em-Bi-Pí"; en pantalla se muestra MVP
        out.append({"w": d, "s": round(shift(w["start"]) / a.tempo, 3), "e": round(shift(min(w["end"], words[min(words.index(w) + 1, len(words) - 1)]["start"] if w is not words[-1] else w["end"])) / a.tempo, 3)})
    # cortes de escena (en mitad de cada pausa ajustada)
    wanted = [c.strip() for c in a.cuts.split("|" if "|" in a.cuts else ",") if c.strip()]
    bounds = [0.0]; wi = 0
    for g in gaps:
        if wi < len(wanted) and words[g["i"]]["text"] == wanted[wi]:
            bounds.append(round((shift(g["s"]) + g["new"] / 2) / a.tempo, 3)); wi += 1
    end_t = round((shift(words[-1]["end"]) + a.tail) / a.tempo, 3); bounds.append(end_t)
    open(a.out_ts, "w").write("// Generado por tools/retime_voice.py (pausas: frase %.2f-%.2fs, coma %.2f-%.2fs).\n" % (*a.sentence, *a.minor) +
        "export type VoiceWord = { w: string; s: number; e: number };\nexport const VOICE_01: VoiceWord[] = " + json.dumps(out, ensure_ascii=False) + ";\nexport const BOUNDS_01: number[] = " + json.dumps(bounds) + ";\n")
    print(f"duración original {dur_total:.2f}s -> nueva {end_t:.2f}s  | cortes de escena: {len(bounds)-1}")
    for g in gaps: print(f"  tras «{words[g['i']]['text']}»  pausa {g['cur']:.2f}s -> {g['new']:.2f}s")
    if wi != len(wanted): print("AVISO: no se encontraron todos los cortes pedidos", wanted[wi:], file=sys.stderr)

main()
