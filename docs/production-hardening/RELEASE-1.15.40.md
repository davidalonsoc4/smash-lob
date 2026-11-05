# Publicación v1.15.40

Publicada y verificada el 5 de noviembre de 2026. Incluye el chat general por temporada, los cambios de Competiciones y la alineación de los indicadores de Inicio de liga.

- PRE: PR #64, commit `32fe555da63ebc92da61919dcf1a04adad9e1bac`, despliegue `dpl_Mu42Nh3UXNGAkBPRVZqWWfvMr2tn` READY en `pre.smashandlob.com`. Health `1.15.40/pre`, service worker `1.15.40`, manifest 200 y API de torneos disponible (401 sin sesión).
- PROD: PR #65, commit `d70b29ecb4d905773416f6643ef2864e1cb45f0d`, despliegue `dpl_22rTNCDYWbucGQCiRGCNmX2txEfk` READY en `smashandlob.com`. Árbol `935be18671e13b7b2370df146e8a170bc4e4eb19`, idéntico a PRE. Health `1.15.40/prod`, portada disponible, SW `1.15.40`, manifest 200, API de chat 401 sin sesión y páginas, API e invitaciones de torneos 404.
- Validación: 1694 pruebas y compilación local correctas. CI #429 pasó código, navegador/PWA, migraciones/restauración y Lighthouse. Las comprobaciones remotas fueron de lectura o acceso sin sesión de aplicación. OAuth real y uso del chat con cuentas reales permanecen manuales.

## Migraciones y recuperación

PROD recibió `20261104141440`, `20261104151343` y `20261104152546` en ese orden. La comprobación posterior confirmó el historial sin pendientes, RLS, permisos de tablas y RPC, tres triggers habilitados y borrado en cascada de mensajes al eliminar una cuenta. PRE ya tenía las tres migraciones. El smoke de v1.15.36 pasó entre la actualización de esquema y la integración de código.

Respaldo cifrado previo a la migración en `C:/Users/USER/SmashLobBackups/prod-20261105T072221848Z-before-v1.15.40-verified`. Verificación independiente de seis payloads y extracción completa del archivo PostgreSQL correctas. SHA256 del manifiesto `1e258e47328a2ff4e3b2224dbfaf4415248db720379e16fc7db8632eaf71820f`.

El despliegue de código anterior es `dpl_8pZMykEoZ9y42W1sXBFJoWmruA8K` (`1bc3f70e`). Si hay una incidencia de código, se puede recuperar ese despliegue y evaluar el esquema por separado. Una restauración de datos requiere valorar los cambios posteriores al respaldo.
