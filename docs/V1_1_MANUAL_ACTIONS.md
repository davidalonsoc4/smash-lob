# Acciones manuales v1.1

## Antes de PRE

- Completar `SUPABASE_SERVICE_ROLE_KEY` en el entorno local/PRE sin copiar la de PROD.
- Confirmar en Vercel PRE, sin imprimir valores, las variables indicadas en README.
- Disponer de dos cuentas Google dedicadas a pruebas: organizador y miembro/espectador.
- La candidata añade `20260802233000_revoke_previous_league_invites.sql`.
  Antes de aplicarla, conservar una copia de las filas afectadas de `invites` sin
  incluir códigos y ejecutar `supabase db push --linked --dry-run` contra PRE.

## Verificación manual

1. Abrir una invitación de jugador nueva en `pre.smashandlob.com` sin sesión.
2. Iniciar sesión con la cuenta dedicada y comprobar que vuelve al mismo código y
   conserva `leagueId`.
3. Repetir con invitación de espectador.
4. Validar usuario nuevo, existente, suspendido, invitación inválida/caducada y
   usuario sin acceso.
5. Con fixtures de PRE: entrar en liga, reclamar identidad histórica, crear temporada,
   programar partido, registrar/corregir resultado, cambiar de liga, compartir resumen,
   exportar CSV/Excel y cerrar sesión.
6. Instalar la PWA, publicar una revisión de PRE y confirmar que el aviso permite
   actualizar ahora o más tarde. Probar también `/offline`.
7. Activar y desactivar push en un dispositivo dedicado; confirmar que el endpoint
   desaparece en PRE y que respuestas 404/410 limpian endpoints caducados.

El OAuth real y los flujos persistentes no se consideran superados hasta completar
esta lista con cuentas y datos dedicados.

## Publicación autorizada en PRE

Solo después de todas las validaciones y con autorización para la operación remota:

```powershell
Set-Location -LiteralPath 'D:\DEVELOP\smash-lob'; git push -u origin feature/v1.1-stability-hardening; git switch staging; git pull --ff-only origin staging; git merge --no-ff feature/v1.1-stability-hardening; npm ci; npm run validate; npm run test:e2e; git push origin staging; git switch feature/v1.1-stability-hardening
```

El comando no toca `main`, no crea etiquetas y no publica en PROD. El despliegue de
Vercel PRE debe inspeccionarse después y el dominio debe mostrar `v1.1.0-rc.1`.

## Rollback

- Código PRE: revertir el commit de merge en `staging` con un commit nuevo y volver a
  desplegar; no reescribir historial ni forzar push.
- Vercel PRE: restaurar el último deployment verificado de `staging`.
- Base de datos PRE: si fuera necesario revertir la función de regeneración, crear
  una migración de avance que restaure la definición versionada en
  `20260715003000_fix_server_regenerate_league_invite.sql`. No reactivar
  automáticamente invitaciones ya revocadas: generar un código nuevo por liga es
  el rollback seguro. La copia previa de `id`, `league_id` y `revoked_at` permite
  auditar exactamente las filas modificadas sin almacenar códigos.
- La rama `main`, la etiqueta `v1.0.0`, Supabase PROD y Vercel PROD deben permanecer
  intactos durante todo el proceso.
