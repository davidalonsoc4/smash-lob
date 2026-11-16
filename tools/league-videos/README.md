# league-videos

Proyecto Remotion independiente (no forma parte de la app Next.js) para los vídeos de comunicación de la liga.
Está excluido del `typecheck` y del lint de la app (ver `tsconfig.json` y `eslint.config.mjs` de la raíz).

```bash
cd tools/league-videos
npm ci
npx remotion studio                    # vista previa
npx remotion render BienvenidaRapida out/01-bienvenida.mp4 --crf=27
```
En entornos sin acceso a la descarga de Chrome de Remotion, añadir
`--browser-executable=<ruta a chromium> --chrome-mode=chrome-for-testing`.

- Estándar de voz y post-proceso del audio: [VOICE_STANDARD.md](VOICE_STANDARD.md)
- Plan de la serie y reglas de contenido: [SERIE.md](SERIE.md)
- Plantilla por liga: cambia `LeagueConfig` (nombre, acento, logo, jugadores, fechas); el resto se adapta solo.
