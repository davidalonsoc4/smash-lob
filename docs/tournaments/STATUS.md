# Estado de torneos

Objetivo global: ACTIVO, no completado. Primer hito incompleto: **T02**.

## Checkpoint 24/10/2026 — inventario inicial

- Árbol limpio al retomar; rama `codex/tournament-development`, base staging b67df81a comprobada como ancestro. HEAD inicial 1515ab27 solo documenta la publicación anterior.
- Leídos AGENTS, planes de hardening/v1.1, auditoría de navegación anterior, rutas/servicios/motores/formulario de torneos, modelos personales y perfil de liga. La auditoría anterior es histórica, no describe el hub actual.
- Auto-Resume 0.6.13 habilitado, watcher activo, compatibilidad `structurally_compatible`. Interrupción 4bf34dcaa09938059b662e4dd629f4d75d8adae2c6bdeb58a8ce1ab72fa77daa: `turn_started`, recuperación ejecutándose; no reenviar.
- Defecto confirmado: POST de torneos vuelve a validar nombres de usuarios vinculados con el valor por defecto 12, rechazando tamaños válidos de 8–16. Corregir y cubrir antes de ampliar modelos.
- No migraciones, operaciones de datos ni despliegues remotos durante este objetivo.

T01 completado: nombres canónicos validados con tamaño elegido. Gates: 60 tests / 7 archivos, TypeScript, lint focalizado y diff correctos. Sin modificación de esquema ni operaciones remotas.

Siguiente paso T02: contratos y validación compartida de puntuación/configuración, integrando primero los flujos legacy. Mantener opciones nuevas sin activar hasta completar persistencia y pantallas.
