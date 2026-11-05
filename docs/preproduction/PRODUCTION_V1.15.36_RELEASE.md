# Publicación v1.15.36 en PROD

Estado: PUBLICADA Y VERIFICADA,26/10/2026 21:05 CET, con autorización expresa para main/PROD y sus migraciones. [Aplicación en Producción](https://smashandlob.com). No se amplían funcionalidades ni se dan por completados los hitos pendientes de torneos.

## Candidata y controles

- PR: https://github.com/davidalonsoc4/smash-lob/pull/58, staging a main.
- Candidata PRE: `ca4f4ebc6581516bfd77fdfd3d110a3b26e793e3`; árbol `7abd2e4917a0fb9cf1d37aac173d2b0dd6995eeb`, idéntico al resultado calculado de fusionar con main.
- Base PROD: v1.15.22, `9578fe006063108cfcab93956fe23e1eb402f37c`, deployment `dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz` conservado. v1.0.0 no se modifica.
- CI415,416 y417 aprobados. CI417: cuatro jobs PASS (código/build, navegador/accesibilidad/PWA, SQL/restauración y Lighthouse);1656 pruebas unitarias/integración,265 E2E PASS y2 recuperadas en reintento,1 omisión prevista. Repetición focalizada de los dos casos, dos veces cada uno:4/4 PASS sin modificar fuente ni tolerancias.
- Dry-run: exactamente18 migraciones pendientes, sin semillas ni roles adicionales. Los archivos coinciden con los de staging probado; no se editan migraciones aplicadas.
- Compatibilidad PRE respecto a catálogo PROD:376 columnas,31 contratos de función y permisos de39 tablas conservados;7 tablas nuevas con RLS privadas y39 funciones nuevas no expuestas a clientes. No se leen registros deportivos para estas comprobaciones.

## Respaldo y migración

Respaldo renovado inmediatamente antes de migrar: `C:/Users/USER/SmashLobBackups/prod-20261026-210105-before-v1.15.36-verified`. Seis payloads AES-256-GCM, clave protegida separada del paquete,10 archivos y86.420.940 bytes. Hash SHA256 de BACKUP.json: `de85e144e251e589b3371b8bdba953b63af4f0c83fd373586a41273618f404f6`. Verificación independiente6/6 y extracción completa del archivo PostgreSQL a salida descartada PASS. Storage vacío. Las copias anteriores se conservan; ver PROD_BACKUP_2026-10-26.md.

Aplicadas las18 migraciones originales desde un directorio privado vinculado a PROD; el repositorio sigue vinculado a PRE. Historial remoto80/80 idéntico a PRE, dry-run sin pendientes. Comprobación de catálogo posterior:376 columnas,31 contratos RPC y39 permisos de tablas conservados;7 nuevas tablas privadas con RLS y39 funciones nuevas privadas. Advisors:0 WARN/ERROR y1 INFO por tablas de servidor sin políticas de cliente. Smoke del código anterior1.15.22 correcto sobre el esquema ampliado antes de fusionar. Aviso local de CLI: no pudo cachear catálogo sin Docker; aplicación e historial remotos confirmados correctamente.

## Verificación posterior

PR58 fusionada: `1bc3f70eb100cdc56bc58775d5a1ee281ea56fa6`, confirmado con fetch de origin/main. Árbol `7abd2e4917a0fb9cf1d37aac173d2b0dd6995eeb`, idéntico a staging probado. Despliegue Production iniciado automáticamente con ese SHA: `dpl_8pZMykEoZ9y42W1sXBFJoWmruA8K`.

Vercel confirmó READY, target Production, SHA exacto y alias `smashandlob.com`. Smoke oficial `npm run smoke:prod` PASS. Comprobación ampliada18/18 PASS: versión1.15.36/entorno prod y health sin caché, service worker versionado, manifiesto independiente sin marca PRE, páginas principales200, APIs protegidas401 sin sesión y laboratorio experimental404 en PROD. La primera ejecución del helper adicional usó por error `/leagues/new`; se verificó que el enlace y ruta reales son `/league/new`, se corrigió exclusivamente el helper no versionado y se repitió completo. No fue necesario modificar código de aplicación.

PRE conserva staging `ca4f4ebc6581516bfd77fdfd3d110a3b26e793e3` y versión1.15.36/pre:13/13 comprobaciones remotas PASS, incluyendo protección y laboratorio disponible solo en PRE. Tag nuevo `v1.15.36` publicado y resolución remota confirmada al commit de main `1bc3f70eb100cdc56bc58775d5a1ee281ea56fa6`. Tag `v1.0.0` sigue en `e9152940ec51fdc34b785aa8ea0e054c110c4040`.

Evidencias locales ignoradas: `.quality-artifacts/mc71-prod-smoke.json`, `mc71-pre-confirm.log`, `mc71-schema-after.json`, `mc71-prod-migrations-apply.log`, `mc71-browser-recheck.log` y `mc71-renew-backup.log`. CI de la PR: [run417](https://github.com/davidalonsoc4/smash-lob/actions/runs/40368771664). No nuevas dependencias, cambios funcionales ni modificaciones de migraciones ya aplicadas durante esta publicación.

## Recuperación y límites

No revertir SQL ni restaurar datos automáticamente. El código antiguo conserva sus contratos para ligas individuales, pero no ofrece las nuevas pantallas de torneos ni gestiona correctamente nuevas ligas por parejas; si ya se han usado, priorizar corrección hacia delante y valorar la recuperación de código con esa limitación. Los nuevos triggers impiden cruces incompatibles y no se deben retirar por rutina.

La copia local fue comprobada por hash, descifrado y extracción completa; no se ensayó una restauración real ni se usaron datos PROD en pruebas automatizadas. OAuth real/PWA física permanecen manuales. El límite distribuido y el webhook de observabilidad siguen sin configurar; no se añaden servicios nuevos en esta publicación. La autorización de publicar no se registra como prueba manual ejecutada.

Comprobación manual posterior: abrir/actualizar la PWA y confirmar1.15.36; acceso Google; Competiciones/Mis ligas/Mis partidos/Chats/Perfil; crear liga y revisar temporada; crear torneo y revisar calendario/resultados; invitaciones y navegación Atrás. Estas acciones no se ejecutaron sobre cuentas o datos reales mediante automatización. El desarrollo integral de torneos T06–T09 sigue pendiente según su plan; esta publicación no lo declara terminado.
