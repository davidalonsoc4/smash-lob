# Checklist de aceptación v1.1

## Local automatizado

- [x] `npm ci`
- [x] comprobación de secretos
- [x] línea base de seguridad
- [x] URLs públicas
- [x] ESLint
- [x] TypeScript
- [x] unitarias e integración
- [x] build de producción
- [x] Playwright móvil/escritorio
- [x] Axe sin impactos críticos o graves en pantallas públicas cubiertas
- [x] referencias visuales públicas estables
- [x] `git diff --check`

## Contratos cubiertos

- [x] destino de invitación de jugador y espectador tras login
- [x] rechazo de redirección externa
- [x] variables Auth.js obligatorias
- [x] URLs PRE/PROD canónicas
- [x] clasificación, sets y desempates básicos
- [x] validadores UUID/texto/fecha/zona/importe/URL/invitación
- [x] protección de fórmula CSV/Excel
- [x] aislamiento de baja push entre ligas
- [x] limpieza push 404/410
- [x] rate limit con `429` y `Retry-After`
- [x] caché PWA versionada, limpieza y actualización solicitada

## Pendiente manual/externo

- [x] credencial service role dedicada disponible localmente/PRE
- [x] OAuth Google real con cuenta nueva y existente
- [x] invitación inválida y caducada contra datos PRE
- [x] usuario suspendido y usuario sin acceso contra PRE
- [x] flujos persistentes de liga/temporada/partido/resultado
- [x] aislamiento cruzado completo con dos ligas de fixtures PRE
- [x] compartir resumen y descargar Excel/CSV en navegador real autenticado
- [ ] alta, baja y endpoint push expirado en dispositivo real
- [x] Axe y visuales de las ocho pantallas autenticadas representativas
- [x] push/merge de rama, despliegue y smoke tests de PRE
- [x] confirmación visible de `v1.1.0-rc.1` en `pre.smashandlob.com`

No se promoverá a PRE ni se declarará cerrado el OAuth real mientras haya casillas
externas críticas sin evidencia.
