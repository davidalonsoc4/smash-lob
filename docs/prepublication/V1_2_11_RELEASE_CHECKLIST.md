# Smash & Lob v1.2.11 — comprobación de publicación

## Validación local

- `npm ci`
- `npx playwright install chromium`
- `npm run release:check`
- Confirmar que el repositorio queda limpio después de las pruebas.
- Confirmar que el workflow `release quality` queda en verde en la rama y en `staging`.
- Confirmar versión `1.2.11` en `package.json`, `package-lock.json`, `src/lib/appVersion.ts`, `public/sw.js` y changelog.

## Base de datos

- Crear backup de PROD antes de ejecutar migraciones.
- Confirmar que PRE tiene aplicadas todas las migraciones hasta `20260803203000`.
- Ejecutar `docs/prepublication/identity-audit.sql` en PRE.
- Revisar manualmente las filas con `missing_snapshot = true`.
- Revisar manualmente las filas con `snapshot_matches_account_name = true`.
- Probar con un jugador histórico real: vincular, mostrar identidad global y desvincular.
- Confirmar que al desvincular se recuperan nombre e iniciales históricas y no queda fotografía en `players.avatar_url`.
- Repetir la auditoría de solo lectura en PROD antes de migrar.

## PRE

- `https://pre.smashandlob.com/settings` muestra Laboratorio de avatares.
- Los dos editores requieren sesión y funcionan.
- Notion comienza con Estilo 1 en todas las categorías y Restablecer recupera esos valores.
- `https://pre.smashandlob.com/api/experimental/avatar-lab/dicebear-big-smile` sin sesión devuelve error de autenticación y no contenido público.
- Subir una imagen de perfil, recortarla y comprobarla en dos ligas.
- Confirmar que la cabecera `X-Smash-Lob-Snapshot-Bytes` de `/api/access` queda por debajo de 1 MB. Documentar cualquier excepción.
- Probar alta por invitación con una cuenta nueva.
- Probar jugador, administrador, creador y espectador.
- Registrar y corregir un resultado.
- Descargar calendario, clasificación, resumen y exportaciones.
- Activar y desactivar notificaciones en un dispositivo real.
- Comprobar la PWA tras actualizar desde una versión anterior.

## PROD antes de comunicar la publicación

- `https://smashandlob.com/settings` no muestra Laboratorio.
- La búsqueda de Ajustes no devuelve Laboratorio.
- `/experimental/avatar-lab` devuelve 404.
- Los dos endpoints `/api/experimental/avatar-lab/*` devuelven 404.
- Login Google, invitación y apertura de una liga funcionan.
- La versión visible es `v1.2.11`.
- No hay errores nuevos en logs de Vercel ni Supabase.
- Mantener disponible el commit anterior de `main` para rollback.
