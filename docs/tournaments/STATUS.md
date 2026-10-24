# Estado de torneos

Objetivo global: ACTIVO, no completado. Primer hito incompleto: **T03**.

## Checkpoint 24/10/2026 — inventario inicial

- Árbol limpio al retomar; rama `codex/tournament-development`, base staging b67df81a comprobada como ancestro. HEAD inicial 1515ab27 solo documenta la publicación anterior.
- Leídos AGENTS, planes de hardening/v1.1, auditoría de navegación anterior, rutas/servicios/motores/formulario de torneos, modelos personales y perfil de liga. La auditoría anterior es histórica, no describe el hub actual.
- Auto-Resume 0.6.13 habilitado, watcher activo, compatibilidad `structurally_compatible`. Interrupción 4bf34dcaa09938059b662e4dd629f4d75d8adae2c6bdeb58a8ce1ab72fa77daa: `turn_started`, recuperación ejecutándose; no reenviar.
- Defecto confirmado: POST de torneos vuelve a validar nombres de usuarios vinculados con el valor por defecto 12, rechazando tamaños válidos de 8–16. Corregir y cubrir antes de ampliar modelos.
- No migraciones, operaciones de datos ni despliegues remotos durante este objetivo.

T01 completado: nombres canónicos validados con tamaño elegido. Gates: 60 tests / 7 archivos, TypeScript, lint focalizado y diff correctos. Sin modificación de esquema ni operaciones remotas.

Siguiente paso T02: contratos y validación compartida de puntuación/configuración, integrando primero los flujos legacy. Mantener opciones nuevas sin activar hasta completar persistencia y pantallas.

## T02 checkpoint — contratos integrados

- `tournamentConfiguration.ts`: contratos comunes y planificación pura 4–24 con parejas fijas/rotativas, tiempo real por jugador, descansos, margen, viabilidad y advertencia de igualdad matemática; la API legacy consume su validación sin activar combinaciones nuevas en DB/UI.
- `tournamentResult.ts`: única validación estricta de puntos para API y los dos rankings; resultados históricos negativos/fuera de rango no se computan.
- Página de torneo usa adaptador de configuración legacy en lugar de doble cast; calendarios rechazan pistas duplicadas simultáneas, IDs duplicados y rondas/pistas no enteras.
- 114 tests / 10 archivos, TypeScript, ESLint focalizado, i18n y diff correctos. En curso validate completo (`.quality-artifacts/tournaments-t02-validate.log`) y E2E torneos (sesiones de terminal 36416 y 18066, si todavía existen).
- Presupuesto de fuente aumentado explícitamente de 135300 a 135450 para contratos compartidos nuevos (135341 líneas medidas antes del último ajuste de integridad); sin aumento de componentes cliente ni páginas.
- Docker, psql y Supabase no están en PATH. Antes del gate DB de futuras migraciones, localizar herramientas instaladas o preparar entorno local; no sustituirlo por datos PRE/personales.

T02 cerrado: validate completo PASS (267 archivos, 1156 tests; lint 0 errores/5 warnings preexistentes; typecheck/build/presupuestos correctos). E2E 8/8 torneos móvil/escritorio, claro/oscuro, incluye Axe. Se reutilizan los adaptadores y componentes existentes; no extraer presentaciones adicionales hasta que una vista nueva las necesite. No hay nuevas modalidades visibles aún.

Siguiente T03: ampliar persistencia/configuración y flujo guiado de forma compatible, con pruebas SQL aisladas. Es un hito grande y seguirá abierto hasta cubrir identidad, origen, duplicación, parejas y preview integrado.
