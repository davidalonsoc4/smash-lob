# M01/M02 — cuenta, autenticación y autorización

Base: 6fa8c72, auditoría sin correcciones. Revisión del código actual y pruebas aisladas; no se han usado cuentas reales.

| Área | Evidencia actual | Resultado y límite |
|---|---|---|
| Proveedor Google | src/auth.ts, readAuthEnvironment y pruebas de entorno | Configuración centralizada, errores con código de incidencia; OAuth real sigue como gate manual, no simulado como éxito. |
| Autologin local | src/lib/serverLocalDevAuth.ts | Exige development, flag 1 y email válido; no se activa en build de producción. |
| Identidad | src/lib/serverAuth.ts | Email de sesión normalizado, no confiado al body. Suspensión comprobada antes del upsert. BUG-001: sobrescritura concurrente de datos/privilegios. |
| Roles | src/lib/authorizationPolicy.ts y serverLeagueAccess.ts | Deniega anónimo/suspendido; distingue acceso, miembro, admin, creador y participante. Superusuario no obtiene automáticamente match:participant. Opciones requireMember/requireAdmin revisadas en llamadores API. |
| Pago de inscripción | API registration-payment | Llamada sin opciones al helper, pero comprobación posterior obliga admin o playerId propio y temporada mutable de la misma liga; no se clasifica como bypass por la búsqueda estática. |
| Perfil | API account/profile y RPC versionada server_update_user_profile | Nombres acotados, lados/mano enumerados, disponibilidad normalizada. Zona horaria solo se acota a 100 caracteres en esta API; no se ha demostrado efecto funcional, se conserva como observación de consistencia, no bug confirmado. |
| Avatares | serverImageValidation/imageUrl y API account/profile PATCH | Limita bytes de data URL y formatos raster; rate limit 10/min. Acepta cualquier HTTPS mientras CSP solo permite determinados hosts: investigar renderizado antes de clasificar. |
| Exportar datos | Handler real con dobles, esquema versionado | BUG-002: cuenta vs jugador y columnas inexistentes; errores se ocultan. |
| Eliminar cuenta | Handler real con dobles, esquema versionado, contrato v1.15.4 | BUG-003: operación parcial y errores ignorados; no se verificó sobre datos reales. |
| Idiomas de confirmación | Callback real y traducciones EN/EU | BUG-004; la frase visible no coincide con el literal aceptado. Captura UI pendiente. |
| Entradas comunes | serverRequest.ts | UUID, moneda, URL y fechas acotadas. parseJsonBody convierte JSON inválido a null; no hay límite global de body explícito en este helper. No se demuestra DoS ni fallo de plataforma. |
| Cabeceras | next.config.ts | CSP, nosniff, DENY, referrer-policy y permissions-policy; HSTS condicionado a VERCEL_ENV production. unsafe-inline permite scripts Next; no se infiere XSS solo por esa directiva. |
| Cookies/CSRF | NextAuth y rutas propias | No hay guard común de Origin en las APIs propias; no se demostró petición cross-site autenticada. No se etiqueta como vulnerabilidad confirmada sin comprobar cookies/origen real. |
| Supabase/RLS | API_SECURITY_INVENTORY, migraciones/tests pgTAP; CI anterior mismo código | El service_role requiere autorización de aplicación. La presencia de un guard por búsqueda no prueba alcance correcto; revisiones de recursos continúan por módulo. No se ejecutaron resets ni consultas directas a PRE. |
| Endpoints Push | notifications/subscribe + web-push instalado | BUG-005: acepta loopback HTTPS y construye la petición al destino. No se envió tráfico al destino, alcance de red queda pendiente. |
| Rate limit | serverRateLimit y suite existente | Backend Redis opcional, fallback local si ausente/error. Límite distribuido no se presupone desplegado. No se provocó carga real. |

## Gates de esta auditoría

- validate: exit 0, 219 archivos / 858 pruebas, tsc/build y presupuestos correctos; cuatro warnings previos.
- Lint adicional de BalancedCalendarAuditPanel, OrganizationBallsSettingsPanel y SeasonRulesSettings: exit 0.
- Playwright: 76/76 sin actualizar snapshots; mocks/placeholder, móvil/escritorio y PWA.
- Cuenta: cuatro reproducciones aisladas; seguridad: una reproducción aislada, todas correctas.
- Una primera ejecución del harness específico usó por error la configuración con extensión .txt: Vitest no aplicó aliases y ejecutó pruebas fuera del ámbito previsto. Fallo de infraestructura del harness, no regresión de aplicación. Corregido usando copia temporal .mts y filtro explícito: 1/1 correcto. No se cambió la configuración funcional de pruebas.

## Bloqueos y continuidad

Se preparó visual-fixture-proxy.mjs.txt para aislamiento de API y bloqueo de escrituras. La revisión automática rechazó dos arranques del servidor aislado; no proporcionó una causa concreta. El segundo ya conservaba el control de confianza del host. No se insiste con otras formas de lanzar la misma operación ni se usa la sesión personal de localhost como alternativa. El proxy no se arrancó. Continúa disponible evidencia de navegador de la suite recién ejecutada y análisis estático; revisar esas capturas antes de establecer conclusiones visuales. OAuth real, eliminación/exportación de cuenta real y esquema desplegado permanecen bloqueados por las restricciones de esta auditoría.

Estado: código de M01/M02 revisado en este alcance; validación visual adicional pendiente/bloqueada. Las comprobaciones de recursos y RLS específicos se registrarán en sus módulos. No equivale a garantizar ausencia de vulnerabilidades.
