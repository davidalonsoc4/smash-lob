# v1.2.12 — Automatización de calidad

## Gates autocontenidos

- Reproducción completa de migraciones en Supabase local.
- `db lint` sobre el esquema y funciones PostgreSQL.
- Pruebas pgTAP de RLS, grants, funciones de servidor e identidad histórica.
- Actualización desde `20260802233000` con datos heredados y aplicación de las migraciones posteriores.
- Dump lógico de esquema y datos, restauración en una base temporal y comprobación de un registro centinela.
- Matriz central de autorización para anónimo, suspendido, usuario sin liga, espectador, jugador, participante, administrador, creador y superusuario.
- Inventario generado de cada ruta y método API; solo cuatro combinaciones públicas están permitidas explícitamente.
- Presupuestos de líneas, componentes cliente, páginas cliente y tamaño máximo de rutas API.
- Presupuestos del build para JavaScript total, chunks y assets.
- Lighthouse CI sobre inicio anónimo, error de autenticación y privacidad.
- Cuatro jobs independientes en GitHub Actions con artefactos de diagnóstico.

## Comandos

```text
npm run validate
npm run release:check
npm run database:quality
npm run performance:lighthouse
npm run quality:full
```

`database:quality` necesita Docker y reconstruye por completo la base Supabase local del proyecto; no debe usarse para conservar datos locales. `performance:lighthouse` necesita Chromium disponible. GitHub Actions instala y ejecuta ambos entornos automáticamente.

## Integraciones externas pendientes

Estas mejoras requieren cuentas o credenciales externas y no se activan en esta versión:

- sesión Google exclusiva de QA para OAuth real;
- credenciales de Redis/KV: el adaptador distribuido ya está implementado y activa automáticamente el backend compartido cuando existen `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`;
- proveedor de observabilidad y alertas;
- reglas de protección obligatoria de ramas en GitHub;
- verificación programada de backups gestionados de Supabase.

La aplicación mantiene un fallback local seguro cuando Redis no está configurado. Los logs JSON incluyen versión, commit, despliegue y región cuando Vercel proporciona esos metadatos.
