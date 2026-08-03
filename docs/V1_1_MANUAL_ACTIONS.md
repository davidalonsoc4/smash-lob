# Publicación y acciones manuales v1.1

## Aceptación cerrada

La candidata `v1.1.0-rc.1` fue validada en PRE con OAuth real, invitaciones,
aislamiento entre ligas, flujos persistentes, exportaciones, PWA, accesibilidad y
notificaciones. El arranque offline en frío y la recuperación de sesión mediante
**Reintentar** se verificaron físicamente el 3 de agosto de 2026.

La prueba física de un endpoint push caducado `404/410` se omite por decisión de
aceptación. Diez pruebas automatizadas cubren que `404/410` elimina únicamente la
suscripción caducada y que un error reintentable no la elimina. Se considera un
riesgo residual bajo y no bloqueante.

## Migración de Producción

La publicación incluye:

`20260802233000_revoke_previous_league_invites.sql`

La migración:

- revoca invitaciones históricas todavía activas cuyo código ya no coincide con el
  código vigente de la liga;
- conserva la invitación vigente de cada liga;
- redefine la regeneración de invitaciones para revocar las anteriores antes de
  crear la nueva;
- limita la función a `service_role`.

Antes de aplicarla en PROD se debe enlazar explícitamente el proyecto de Producción,
ejecutar `supabase db push --linked --dry-run` y detener la publicación si aparece
cualquier migración pendiente distinta de `20260802233000`. No se debe usar `reset`,
`migration repair` ni reactivar códigos antiguos. Después se vuelve a enlazar PRE.

## Flujo de publicación

1. Sincronizar `feature/v1.1-stability-hardening` con `staging`.
2. Aplicar el parche final `1.1.0` y ejecutar todas las validaciones.
3. Publicar la rama y fusionarla en `staging`.
4. Comprobar que únicamente la migración esperada está pendiente en PROD y aplicarla.
5. Fusionar `staging` en `main`, validar y publicar.
6. Crear la etiqueta anotada `v1.1.0`.
7. Volver a enlazar Supabase con PRE y regresar a la rama de trabajo.
8. Verificar `https://smashandlob.com/changelog` y los flujos críticos de Producción.

## Rollback

- Código: revertir el commit de merge de `v1.1.0` mediante un commit nuevo y volver a
  desplegar; no reescribir historial ni usar `push --force`.
- Vercel: restaurar el último deployment verificado de `main` si el nuevo deployment
  no queda operativo.
- Base de datos: crear una migración de avance. No reactivar invitaciones antiguas;
  regenerar un código nuevo por liga es la reversión segura.
- La migración solo revoca códigos obsoletos y no modifica temporadas, partidos,
  resultados, miembros ni estadísticas.
