# Respaldo previo a publicación — 26/10/2026

Estado: **COPIA LOCAL CIFRADA Y VERIFICADA**. Sin publicación ni migraciones de PROD.

## Identidad preservada

- Aplicación: v1.15.22, commit `9578fe006063108cfcab93956fe23e1eb402f37c`.
- Vercel: `dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz`, READY, main; deployment y dominio de PROD sin cambios al finalizar.
- Supabase PROD: `szycbwdzestcmimziyey`, smash-lob, eu-west-1, PostgreSQL 17.
- Snapshot entre 18:09:35 y 18:10:13 CET (17:09:35–17:10:13 UTC).
- Inventario: 39 tablas públicas, 62 migraciones, 0 buckets y 0 objetos Storage. Archivo PostgreSQL completo de 1.723.358 bytes antes de cifrar; no se limita a public.

## Archivos y custodia

Carpeta final: `C:\Users\USER\SmashLobBackups\prod-20261026-180334-verified`.

Contiene seis payloads AES-256-GCM: bundle Git, instantánea tar del código, base PostgreSQL custom, roles sin contraseñas, inventario Storage y estado de CLI. Además: BACKUP.json, SHA256SUMS.txt, recover.mjs y README.md. Total aproximado: 86,4 MB. Ningún payload en claro dentro de la carpeta final.

La clave aleatoria de 32 bytes está fuera del respaldo, en `C:\Users\USER\.smashlob-backup-keys\prod-20261026-180334.key`. Carpeta de respaldo y clave tienen ACL privada del usuario actual. La clave no está en Git, en los logs ni en la carpeta final. Conservarla por separado al trasladar la copia; recover.mjs admite `--key` para recuperar en otro equipo.

SHA256 de BACKUP.json: `1ec99bd64b5ec6bef60c10fcda89010a7991fe6988d257806d06e1f1b0f79c6e`.

La carpeta previa, sin sufijo -verified, queda como trabajo privado y no forma parte del paquete entregado. La limpieza automática fue rechazada por la política del entorno; se utilizó copia a una carpeta final nueva, sin borrar ni sobrescribir los originales. No compartir esa carpeta de trabajo.

## Verificaciones realizadas

- Git bundle verify correcto y código exacto de main, sin mover main ni v1.0.0.
- Exportación mediante rol de conexión de CLI y SET ROLE postgres por sesión; no se modificaron datos de aplicación, políticas ni migraciones.
- Datos exportados directamente a cifrado, sin archivo de datos en claro ni contenido de registros en pantalla.
- Todos los archivos cifrados descifrados y comprobados por autenticación GCM, longitud y hash de contenido.
- pg_restore 17 leyó y decodificó completamente el archivo: 2.299.171 bytes de SQL extraíbles, descartados sin ejecutar ni guardar en claro.
- Lector independiente recover.mjs, en proceso nuevo y con la clave guardada, verifica los seis payloads y ambos hashes por archivo.
- Carpeta final copiada y comparada con sus fuentes por SHA256; lista de comprobaciones para todos los archivos entregados.
- Inventario Storage antes/después: vacío. Sin archivos externos de Supabase que copiar en este snapshot.
- Health PROD 200/v1.15.22/prod; deployment, main y tag v1.0.0 intactos al terminar. El enlace local del repositorio sigue siendo PRE `miadjotkucgluwbrgeih`.

## Recuperación

Desde la carpeta final, sin conectar con ninguna base:

```powershell
node recover.mjs --verify --key "RUTA_A_LA_CLAVE"
```

Solo para una recuperación autorizada, `--extract` descifra en una carpeta nueva decrypted-private dentro del respaldo protegido; falla si ya existe y no sobrescribe. No restaura SQL automáticamente. Las instrucciones completas están en README.md del respaldo.

Código: comprobar compatibilidad con las migraciones aplicadas antes de recuperar el deployment conservado en Vercel. Instant Rollback puede desactivar la asignación automática de despliegues; revisar su estado después. No ejecutar rollback de código ni revertir SQL por rutina.

Datos: último recurso. Elegir y validar explícitamente el destino, proteger escrituras y conservar el estado afectado. Revisar roles, esquemas gestionados, extensiones y permisos antes de restaurar; no aplicar ciegamente el archivo completo sobre una base Supabase inicializada. La recuperación puede perder cambios posteriores al snapshot.

## Límites y condiciones antes de publicar

- Se verifica integridad y extracción completa, **no se ha ejecutado una restauración real**. No se han usado datos PROD en pruebas automatizadas ni fixtures.
- Es una copia local; para cubrir pérdida del equipo, duplicar los payloads cifrados en otro soporte y custodiar la clave por separado. No se han subido datos de PROD a GitHub ni otros servicios.
- Contraseñas de roles, variables Vercel y secretos Google OAuth no se exportan; siguen en sus almacenes actuales y requieren configuración segura si se reconstruye la plataforma.
- Base y Storage no son una transacción conjunta. Renovar el respaldo justo antes de migrar si continúa el uso de la aplicación.
- El backup no aplica las 18 migraciones pendientes ni sustituye la aceptación manual de la candidata PRE descrita en V1.15.36_RELEASE.md. La subida a PROD requiere nueva autorización.
