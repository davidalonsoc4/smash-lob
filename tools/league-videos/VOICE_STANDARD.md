# Estándar de voz — serie de vídeos de la liga

Decidido el 16-nov-2026 tras pruebas A/B con el organizador.

## Voz y generación (ElevenLabs)
- Voz: **David Martin – Confident and Friendly** (`jtfxplhZxnBzQICVwoQn`), modelo **Eleven v3**.
- Texto: frases cortas; **solo exclamaciones en la frase de apertura y en la de cierre**. Números de fechas en letras
  ("veinte de diciembre", "el uno de diciembre"). No usar etiquetas `[excited]` (cuestan créditos y no aportaron).
- Generar la toma completa de cada vídeo y transcribirla con Scribe (gratis) para obtener los tiempos de palabra
  (`words.json`).

## Post-proceso (`scripts/retime_voice.py`, valores por defecto)
| Parámetro | Valor |
|---|---|
| Pausa tras . ! ? | 0,7–0,9 s (se alarga lo corto y se recorta lo largo) |
| Pausa tras , : ; | 0,3–0,5 s |
| Cola al final (silencio tras la última palabra) | 1,8 s (el vídeo "respira" y hace fundido a negro) |
| Velocidad (`--tempo`) | 1,0 = natural (no se acelera la voz) |
| Realce de presencia (`--presence`) | desactivado por defecto |
| Volumen | −16 LUFS (loudnorm) |

> Historial: el 16-nov se probó ×1,05 y ×1,08 con presencia; el organizador lo encontró apresurado y se dejó velocidad natural.
> Los vídeos no llevan música de fondo por ahora (solo voz y efectos de sonido).

Ejemplo (reproduce el audio y los tiempos del vídeo 1):
```
python3 scripts/retime_voice.py assets/video01/david-full-1.mp3 assets/video01/words-take1.json \
  public/voice-01-david.mp3 src/voice01.ts \
  --cuts "liga!,jornadas.,nuevo.,ti.,individual.,pista.,app."
```
`--cuts` lista las palabras tras las que hay corte de escena (en mitad de la pausa).

## Notas
- Scribe adelanta ~0,4 s el inicio de la primera palabra de cada frase; la herramienta lo corrige con los silencios medidos.
- Con esta voz la primera pausa tras una exclamación sale larga (~1,5 s); la herramienta la recorta a 0,9 s.
- Requiere `ffmpeg` y Python 3.
