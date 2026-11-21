# Cómo hacer vídeos para Instagram con Remotion, ElevenLabs y Claude

Resumen de las herramientas y los pasos para hacer vídeos cortos animados (con voz en off) y subirlos a Instagram, sin editor de vídeo tradicional.

## Qué necesitas (lo imprescindible)

1. **Un ordenador con Node.js.** Remotion se ejecuta en un ordenador (no en el móvil). Descarga él mismo el navegador que usa para renderizar.
2. **Remotion** (remotion.dev): librería para crear vídeo con código (React). Es gratis para particulares y equipos muy pequeños; si es para un negocio, revisa su licencia.
3. **ElevenLabs** (elevenlabs.io): voz en off. Necesitas una cuenta con créditos. Una locución de unos 40 s consume en torno a 650 créditos. Incluye también transcripción, que da el tiempo de cada palabra para sincronizar escenas y subtítulos con la voz.
4. **Un asistente que escriba el código de Remotion** (nosotros usamos Claude). Tú describes lo que quieres ver y él monta las animaciones, ajusta los tiempos a la voz, renderiza y corrige.
5. **Música sin derechos** (opcional). Lo más sencillo es añadir la música desde Instagram al subir el Reel.

## Formato de salida

- Vertical 1080 x 1920 px, 30 fps, vídeo `.mp4` (H.264).
- Reels: menos de 90 s (los nuestros rondan los 40 s).
- Remotion exporta el `.mp4` directamente. Pásalo al móvil (cable, AirDrop o nube) y súbelo a Instagram.

## Flujo de trabajo

1. **Guion:** escribe el texto de la locución (frases cortas, 35-45 s) y apruébalo antes de generar la voz, porque cada generación gasta créditos.
2. **Voz:** genéralo en ElevenLabs con una sola toma y descárgala.
3. **Tiempos:** transcribe la toma para obtener el instante de cada palabra. Con eso se sincronizan las escenas, las animaciones y los subtítulos.
4. **Animación:** el asistente crea las escenas en Remotion siguiendo la voz (gancho, desarrollo, cierre).
5. **Revisión:** mira capturas de las escenas clave y pide cambios (tiempos, textos, colores).
6. **Render:** exporta el `.mp4` y súbelo a Instagram (con música desde la propia app si quieres).

## Consejos

- Empieza con un vídeo de 30 s y un solo estilo visual.
- Pon una frase de gancho en los primeros 2 segundos.
- Añade subtítulos: mucha gente ve los Reels sin sonido.
- Deja respirar las pausas de la voz; no lo aceleres todo.
- Mantén siempre los mismos colores, la misma tipografía y el mismo cierre para que la serie sea reconocible.

## No es necesario

ffmpeg, scripts de Python, bases de datos, GitHub ni conversores de vídeo. Solo se usan para flujos más avanzados (ajustar pausas, mezclar música automáticamente, trabajar con un repositorio).
