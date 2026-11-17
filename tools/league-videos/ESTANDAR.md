# Línea guía de los vídeos de la liga

Guía única para producir **todos** los vídeos de la serie con el mismo aspecto, voz, música y ritmo.
Decidida con el organizador el 16-nov-2026 a partir del vídeo 1 (`BienvenidaRapida`). Detalles de voz en
[VOICE_STANDARD.md](VOICE_STANDARD.md); plan de la serie y reglas de contenido en [SERIE.md](SERIE.md).

## 1. Formato y estilo
- **1080×1920 (9:16), 30 fps, 30–45 s.** Comprimido a < 16 MB para WhatsApp (`--crf=27` da ~5 MB).
- Estética **Competition** de la app (fondo casi negro, superficies oscuras) con el **acento de la liga** (`LeagueConfig.accent`,
  PRO League `#d7a544`). El contraste del texto se calcula solo.
- **Zonas seguras de Instagram:** contenido entre ~250 px (arriba) y ~340 px (abajo); subtítulos a 390 px del borde inferior.
- **Subtítulos palabra a palabra** con la palabra activa en el acento, en una sola línea (nunca partidos en dos filas).
- Componentes de la app recreados (`src/appUi.tsx`): cabecera, píldoras de pareja, marcador, ranking, tarjeta de apertura,
  barra de pestañas, pantalla de economía. Se usan datos de ejemplo con la etiqueta "EJEMPLO · DATOS FICTICIOS".

## 2. Estructura de un vídeo
1. **Gancho** (1,5–2 s): frase corta en pantalla grande.
2. **5–8 escenas** de ≤ 6 s, una idea por escena, con el elemento visual de la app que la explica.
3. **Cierre** "Nos vemos en la pista" con **1,8 s de aire** y fundido a negro (los vídeos no terminan de golpe).
4. Los cortes de escena caen **en mitad de las pausas de la voz**.

## 3. Voz
David Martin (Eleven v3), velocidad natural, pausas 0,7–0,9 s entre frases y 0,3–0,5 s tras comas, cola final de 1,8 s,
exclamaciones solo en apertura y cierre. Todo automatizado con `scripts/retime_voice.py` (ver VOICE_STANDARD.md).

## 4. Música de fondo (`scripts/add_music.py`)
- Pista instrumental **suave** generada con ElevenLabs Music (`eleven_music_v2_5`, 40 s, instrumental). La elegida está en
  `assets/music/musica-A.mp3` y se reutiliza para todos los vídeos (recortada y con fundidos).
- Prompt original (por si hay que generar otra): *"Soft, modern instrumental background track for an upbeat sports information
  reel: warm airy synth pads, gently plucked muted electric piano chords, a soft rounded kick, light finger-snap and shaker
  percussion, and a subtle round bass. Steady, unobtrusive groove around 96 BPM with a light optimistic feel, minimal melody,
  clean crisp modern production. Keep the energy constant with no big drops or builds, and end with a gentle natural
  fade-out. No vocals."*
- Mezcla: música a **−24 LUFS**, fundido de entrada 1,2 s y de salida 2,4 s, **ducking** con la voz (ratio 5) y resultado a
  **−16 LUFS**. La música se mezcla **después** del render, sobre el audio del vídeo (voz + efectos), así se puede cambiar sin
  volver a renderizar.

## 5. Transiciones (`src/kit.tsx`)
- **Base:** el contenido sale y entra por sí mismo con el fondo fijo (nada de paneles macizos que tapen la pantalla).
- **Variedad (rotación `MIX_PLAN`):** subida · deslizamiento lateral (alterna dirección) · bote de pelota · zoom suave ·
  destello tenue. Nunca la misma dos veces seguidas. La **pelota siempre botando** (aplastamiento, sombra y giro) para que se
  reconozca como pelota.
- Efecto de sonido de transición bajo (`whoosh` 0,28) y un "toc" en cada bote. Parámetro `transition` de `VideoSeries`
  (`"mix"` por defecto; `"panel"` solo para compatibilidad).
- Descartadas tras pruebas: panel dorado macizo, línea de luz diagonal, pelota en arco sin botar.

## 6. Pipeline paso a paso
1. **Guion** corto en `SERIE.md`/conversación (reglas de la voz: exclamaciones solo en apertura y cierre, fechas en letras).
2. **Voz:** generar la toma completa en ElevenLabs (David Martin, v3, 2 tomas por defecto ≈ 490 créditos cada una).
3. **Transcribir** la toma elegida con Scribe (gratis) → `words.json` (tiempo por palabra).
4. **Retiming:** `python3 scripts/retime_voice.py toma.mp3 words.json public/voice-NN.mp3 src/voiceNN.ts --cuts "…"`.
5. **Composición:** copiar `src/BienvenidaRapida.tsx`, ajustar escenas y textos, tomar los tiempos de `voiceNN.ts`
   (`BOUNDS_01`, `VOICE_01`) y registrar la composición en `src/Root.tsx`.
6. **Render:** `npx remotion render <Composición> out/NN.mp4 --crf=27` (en cloud añadir
   `--browser-executable=<chromium> --chrome-mode=chrome-for-testing`).
7. **Música:** `python3 scripts/add_music.py out/NN.mp4 public/voice-NN.mp3 assets/music/musica-A.mp3 out/NN-final.mp4`.
8. **Revisión:** ver la lista de comprobación y enviar al organizador.

## 7. Lista de comprobación antes de enviar
- [ ] Duración 30–45 s; peso < 16 MB; pista de audio presente (≈ −16 LUFS).
- [ ] Subtítulos sincronizados, una sola línea, sin tapar elementos clave.
- [ ] Escenas de ejemplo con la etiqueta de datos ficticios; solo nombres de pila; ningún enfrentamiento real.
- [ ] Hora de la jornada de apertura marcada "por confirmar" mientras no esté reservada la pista.
- [ ] Final con 1,8 s de aire y fundido; transiciones variadas y suaves.
- [ ] Tipos correctos (`npx tsc --noEmit` dentro de `tools/league-videos`).

## 8. Costes orientativos (ElevenLabs, plan Starter)
Voz: ~490 créditos por toma de 35 s · Música: 600 créditos por pista de 40 s · Transcripción: 0.

## 9. Historial de decisiones (para no repetir pruebas)
Voz: Roger/Martin Osborne/Enzo/Theo/Mateo/Lucas/Daniel probadas; elegida **David Martin** (la exclamación de apertura aporta
la energía). Ritmo: ×1,05 y ×1,08 con realce resultaron apresurados → **velocidad natural**. `[excited]` no aportó y cuesta
créditos. Transiciones: ver sección 5.

## Siglas y coste de voz (añadido 17-nov)
- Las siglas se escriben para la voz como suenan mejor: MVP → "Em-Bi-Pí" (con guiones y acento). `retime_voice.py` las convierte de nuevo a "MVP" en los subtítulos.
- Evitar repetir una misma sigla más de 3 veces en un guion.
- La música (`assets/music/musica-A.mp3`) se genera una sola vez y se reutiliza: mezclarla no gasta créditos. La transcripción tampoco.
- Generar UNA toma de voz (`generations_count: 1`, ~300-600 créditos); solo pedir segunda toma si no convence.
- Música: `add_music.py` repite la música A con un cruce de 3 s si el vídeo dura más de 40 s y termina con un fundido de 3,2 s (antes se cortaba a los 40 s en los vídeos largos).

## Requisitos de salida para publicar (añadido 17-nov)
Cada vídeo se entrega en una carpeta (`out/listos-para-subir/`, no versionada) con `NN-nombre.mp4` y `NN-nombre.jpg`:
- MP4 H.264 (avc1) + AAC LC estéreo a 48 kHz, 1080x1920, 30 fps, ~1 Mbps (4-6 MB), menos de 1 min, con audio.
- `moov` al principio (faststart): `add_music.py` ya lo hace (`-movflags +faststart`) y el audio sale a 48 kHz. Para un vídeo ya mezclado:
  `ffmpeg -i entrada.mp4 -c:v copy -c:a aac -b:a 160k -ar 48000 -movflags +faststart salida.mp4` (el vídeo no se recodifica).
- Nombres en minúsculas, sin tildes ni espacios y con el orden de publicación delante (01-bienvenida, 02-presentacion-app, 03-inscripcion, 04-chat-liga, 05-organiza-partido, 06-perfil-disponibilidad, 08-subir-resultado, 09-cuenta-atras-desbloqueo, 10-clasificacion-mvp, 11-partidos-normales).
- Miniatura JPG 1080x1920 (<300 KB, ~80 KB) con un fotograma del gancho ya formado (no el primero): `npx remotion still <Comp> x.jpg --frame=<fin del gancho - 14> --image-format=jpeg --jpeg-quality=88`.
- Aviso: los vídeos salen en `yuvj420p` (rango completo) porque Remotion codifica desde fotogramas JPEG (`Config.setVideoImageFormat("jpeg")`). Es válido y se reproduce bien; si se quisiera `yuv420p` hay que renderizar de nuevo con `--image-format=png` (más pesado) o `--pixel-format=yuv420p`.
