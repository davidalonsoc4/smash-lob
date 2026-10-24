# Desarrollo integral de torneos

Objetivo autorizado el 24/10/2026: completar todo el alcance solicitado, por hitos verificables. Base: `origin/staging` b67df81a; rama `codex/tournament-development` (solo documentación posterior al merge). No publicar ni modificar datos remotos sin nueva autorización. Sin temporadas de torneo, doble eliminación ni pasarela de pago.

Trabajar exclusivamente en el primer hito incompleto. Cada checkpoint actualiza STATUS, DECISIONS y VALIDATION cuando corresponda, además de production-hardening/STATUS. Un hito solo se cierra con sus gates correctos; no confundir un motor probado con una funcionalidad integrada. Continuar al siguiente hito tras cerrar el anterior.

| Hito | Entrega verificable | Estado |
| --- | --- | --- |
| T01 | Inventario real y regresión de base; corregir defectos confirmados que impiden preservar flujos existentes | COMPLETO |
| T02 | Contratos compartidos de configuración, participantes, equipos, resultados, permisos y presentación; adaptadores compatibles para torneos guardados | EN CURSO |
| T03 | Creación guiada, identidad/logo/acento, 4–24 participantes según viabilidad, individual/parejas, origen de liga y duplicación; preview y validación servidor | PENDIENTE |
| T04 | Americana y Mexicano rotativos/fijos: parámetros configurables, balance auditable, generación segura, seguimiento/audio existentes | PENDIENTE |
| T05 | Tradicionales: eliminación, tercer puesto/consolación, grupos y grupos+cuadro; semillas, byes, sorteo manual/automático, calendarios editables/manuales | PENDIENTE |
| T06 | Gestión: administradores/espectadores, inscripción e invitaciones, reglas de resultado/confirmación/aprobación, historial, incidencias, sustituciones/bajas/aplazamientos y recálculos seguros | PENDIENTE |
| T07 | Mis Partidos y perfil global con métricas compatibles, filtros y RACHA/FORMA; chats y notificaciones configurables; navegación contextual | PENDIENTE |
| T08 | Economía opcional: cuotas, cobros, gastos, bolas, premios, balances y permisos reutilizados | PENDIENTE |
| T09 | Validación integral DB/API/E2E/Axe/PWA/móvil/i18n y regresiones de ligas; informe y acciones manuales | PENDIENTE |

## Gates

- T01: pruebas existentes de Americana, Mexicano, timing/audio, rutas e invitaciones, más regresiones de defectos; typecheck, lint de archivos y diff.
- T02–T08: unitarias e integración del dominio cambiado; SQL local/pgTAP si hay migración; typecheck/lint/i18n; E2E con fixtures de cada flujo visible antes de cerrarlo. No activar opciones incompletas.
- T09: `npm run validate`, `npm run test:e2e`, `npm run database:quality`, `npm run performance:lighthouse`, `npm audit --omit=dev --audit-level=high`. OAuth real y pruebas físicas en PWA son gates manuales explícitos, no automatizados con cuentas personales.

## Reanudación

Leer STATUS y DECISIONS antes de analizar de nuevo. Consultar `git status`, conservar cambios locales y ejecutar el siguiente paso escrito. Commits pequeños locales permitidos. Auto-Resume recupera interrupciones clasificadas, no lanza hitos por sí solo; conservar este chat abierto y no duplicar recuperaciones enviadas. No crear cron ni enviar mensajes a otro chat para simular continuidad.
