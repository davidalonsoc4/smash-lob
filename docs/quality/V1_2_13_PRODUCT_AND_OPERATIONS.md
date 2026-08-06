# v1.2.13 — Producto y preparación operativa

## Cambios visibles

- Cuando la temporada activa está terminada, Inicio muestra accesos directos a **Historial y estadísticas** y **Compartir resumen de temporada**.
- El segundo acceso abre la sección `#compartir-resumen-temporada` del resumen de la temporada seleccionada.
- Registro de cambios continúa disponible para jugadores y espectadores.
- Un usuario normal recibe un resumen deliberadamente genérico; el superadministrador recibe el detalle técnico completo en la misma ruta.

## Observabilidad preparada

- Los logs estructurados de servidor pueden enviarse a un webhook privado sin bloquear la respuesta de la aplicación.
- Los errores de navegador se reducen a una huella, ruta, tipo e incidencia; el mensaje original no se persiste en los logs del servidor.
- La ruta de salud informa únicamente si el webhook y Redis distribuido están configurados, nunca sus valores.
- Variables: `OBSERVABILITY_WEBHOOK_URL`, `OBSERVABILITY_WEBHOOK_TOKEN` y `OBSERVABILITY_MIN_LEVEL`.

## Protección de ramas

`quality/github/release-branches-ruleset.json` protege `main` y `staging` frente a borrados y force-push. No obliga todavía a usar pull requests ni bloquea el flujo de merge directo.

- Revisar: `npm run github:rulesets:review`
- Aplicar: `npm run github:rulesets:apply`
- Requiere un token de GitHub con permiso de administración del repositorio.

## Rate limiting distribuido

La implementación ya utiliza Redis REST cuando existen `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`. Sin ambas variables conserva el fallback en memoria.

## QA autenticada de PRE

El workflow `.github/workflows/qa-pre.yml` está desactivado hasta crear:

- secret `QA_PRE_STORAGE_STATE_B64`;
- variable `QA_PRE_ENABLED=true`.

La sesión pertenece a una cuenta QA normal, no superadmin, y se usa para comprobar las rutas autenticadas principales y la variante pública del changelog.
Esta prueba remota queda excluida de `npm run test:e2e`; se ejecuta únicamente mediante `npm run qa:pre` con `playwright.qa.config.ts`.

## Backup cifrado de Supabase

El workflow `.github/workflows/supabase-backup.yml` genera por separado roles, esquema y datos `public`, calcula hashes y sube únicamente un paquete cifrado AES-256.

Permanece desactivado hasta crear los secrets:

- `SUPABASE_ACCESS_TOKEN`;
- `SUPABASE_DB_PASSWORD`;
- `SUPABASE_PROJECT_REF`;
- `BACKUP_ENCRYPTION_PASSPHRASE`;

además de la variable `SUPABASE_BACKUP_ENABLED=true`.

## Comprobación de preparación

`npm run external:readiness` muestra qué integraciones están listas sin imprimir credenciales. `--strict` permite convertir cualquier integración pendiente en error para una comprobación posterior.
