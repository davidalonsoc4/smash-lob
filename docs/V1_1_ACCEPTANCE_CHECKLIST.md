# Checklist de aceptación v1.1

## Local automatizado

- [x] `npm ci`
- [x] comprobación de secretos
- [x] línea base de seguridad
- [x] URLs públicas
- [x] ESLint
- [x] TypeScript
- [x] unitarias e integración: 17 archivos y 66/66 pruebas
- [x] build de producción
- [x] Playwright: 14/14 E2E
- [x] regresiones PWA repetidas: 10/10
- [x] Axe sin impactos críticos o graves en las ocho pantallas cubiertas
- [x] 16 referencias visuales móvil/escritorio estables
- [x] auditoría npm sin vulnerabilidades
- [x] `git diff --check`
- [x] GitHub Actions `v1.1 quality #20` con jobs `quality` y `browser` correctos

## Contratos cubiertos

- [x] destino de invitación de jugador y espectador tras login
- [x] rechazo de redirección externa
- [x] variables Auth.js obligatorias
- [x] URLs PRE/PROD canónicas
- [x] clasificación, sets y desempates básicos
- [x] validadores UUID/texto/fecha/zona/importe/URL/invitación
- [x] protección de fórmula CSV/Excel
- [x] aislamiento de baja push entre ligas
- [x] limpieza push 404/410 cubierta mediante diez pruebas automatizadas
- [x] rate limit con `429` y `Retry-After`
- [x] caché PWA versionada, limpieza y actualización solicitada

## Validación manual y externa en PRE

- [x] credencial service role dedicada disponible localmente/PRE
- [x] OAuth Google real con cuenta nueva y existente
- [x] invitación inválida y caducada contra datos PRE
- [x] usuario suspendido y usuario sin acceso contra PRE
- [x] flujos persistentes de liga/temporada/partido/resultado
- [x] aislamiento cruzado completo con dos ligas de fixtures PRE
- [x] compartir resumen y descargar Excel/CSV en navegador real autenticado
- [x] alta y baja push verificadas físicamente en Android y Supabase PRE
- [x] actualización controlada de la PWA verificada físicamente en Android
- [x] arranque offline en frío y recuperación de sesión con **Reintentar** verificados físicamente
- [x] Axe y visuales de las ocho pantallas autenticadas representativas
- [x] push/merge de rama, despliegue y smoke tests de PRE
- [x] confirmación visible de `v1.1.0-rc.1` en `pre.smashandlob.com`

## Riesgo residual aceptado

La reproducción física de un endpoint push realmente caducado que responda `404` o
`410` se omite por decisión explícita de aceptación. El comportamiento está cubierto
por diez pruebas automatizadas y no bloquea la publicación de `v1.1.0`. El riesgo
residual aceptado es que, ante una diferencia no reproducida del proveedor, una
suscripción obsoleta pudiera permanecer temporalmente almacenada; no afecta a los
datos de las ligas ni al funcionamiento de las suscripciones válidas.

Con la prueba offline física superada y este riesgo documentado, la candidata
`v1.1.0-rc.1` queda aceptada para promoción a `v1.1.0`.
