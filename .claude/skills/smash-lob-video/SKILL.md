---
name: smash-lob-video
description: Diseña y automatiza vídeos promocionales de Smash & Lob con Remotion y ElevenLabs. Úsala para guiones, locución, subtítulos, sincronía, previews y renders.
---

# Vídeos de Smash & Lob (desde el repositorio de la app)

Esta skill documenta el flujo creativo. El proyecto de vídeo **puede estar fuera** de este repositorio: primero confirma dónde está `video-studio` y si hay un proyecto Remotion real. No lo inventes ni lo incluyas en deploy de la PWA.

1. Inspecciona composición, assets y timeline de Remotion existentes. Reutiliza escenas y versiones antes de crear otra plataforma.
2. Mensaje de marca: **«La excusa perfecta para jugar más»**. Resalta parejas que rotan por jornada y clasificación individual sin convertirlo en tutorial técnico. Mantén el estilo del vídeo disponible en el proyecto, no presupongas que el piloto está renderizado.
3. Referencia vocal ElevenLabs **David Martin — Confident and Friendly**, Voice ID `jtfxplhZxnBzQICVwoQn`, velocidad `1.03`, estabilidad `0.35`, similitud `0.75`, estilo `0.15`. Confirma que la voz está disponible y que la API/modelo admite esos controles antes de lanzar una generación; no supongas coste cero.
4. Genera primero guion, plan de escenas y estimación de tiempos; solicita aprobación del guion antes de consumir créditos de audio o vídeo.
5. Usa ElevenLabs MCP para previsualización/voz; si no devuelve un archivo local reutilizable, ofrece exportación autorizada o integración API/CLI como fase aparte. **No afirmar que el audio se guarda automáticamente** por conectar un MCP.
6. Sincroniza narración y escenas mediante duraciones reales del audio, agrega subtítulos revisables, valida cortes y el formato vertical/horizontal.
7. Renderiza previews antes del MP4 definitivo, verifica codec, duración, sincronía y ausencia de assets sin licencia. Confirma renders en archivo antes de reportarlos.
8. Mantén audio generado, logos y capturas en el proyecto de vídeo, no en `src/` de la PWA si no son necesarios.

Si el usuario pide un vídeo completo, separa plan, generación de recursos, previsualización y render final. Nunca subir vídeo ni publicar en redes sin autorización.
