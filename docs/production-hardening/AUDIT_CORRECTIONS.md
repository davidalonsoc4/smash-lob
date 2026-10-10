# Audit correction tracking

Branch: codex/audit-corrections; PR #20 targets staging. PRE publication in progress; no real-data validation. Original audit findings remain unchanged as historical evidence.

23 corrected locally; 17 open. Cumulative gate C13 passed: 922 tests / 237 files, 76 E2E, build, static checks, lint, types and zero dependency vulnerabilities. C14 passed in worker-local disposable Supabase on GitHub Actions run 38078565124: migration replay, schema lint, 38 pgTAP tests, logical restore and upgrade. The workstation still lacks Docker. Seventeen findings, including six P1, remain open. Corrected means the targeted milestone tests passed; database-dependent cases require transaction and concurrency validation.

| Finding | Severity | Status | Milestone | Original finding |
| --- | --- | --- | --- | --- |
| BUG-001 | P1 | Corrected locally | C02 | El guard de autenticación puede restaurar privilegios o datos de perfil revocados concurrentemente |
| BUG-002 | P2 | Corrected locally | C03 | La exportación personal omite membresías y temporadas al confundir ID de cuenta e ID de jugador |
| BUG-003 | P1 | OPEN |  | Eliminar cuenta declara anonimización completa aunque conserva identidad asociada o fallen borrados auxiliares |
| BUG-004 | P2 | Corrected locally | C03 | La confirmación de eliminación en inglés/euskera se rechaza silenciosamente |
| BUG-005 | P1 | Corrected locally | C02 | Suscripciones Push aceptan destinos HTTPS internos arbitrarios |
| BUG-006 | P2 | Corrected locally | C06 | La lista de espera muestra posición 1 a cualquier jugador |
| BUG-007 | P2 | Corrected locally | C06 | Salir de la lista de espera impide volver a entrar |
| BUG-008 | P1 | Corrected locally | C02 | Un código de invitación incorrecto permite leer una liga con su UUID |
| BUG-009 | P2 | Corrected locally | C02 | La previsualización pública de invitación incluye pagos y notas de incidencias |
| BUG-010 | P2 | Corrected locally | C06 | La promoción de lista de espera no se reconoce en la sala de espera |
| BUG-011 | P2 | OPEN |  | Una plaza ofrecida en lista de espera puede ser ocupada por otra inscripción |
| BUG-012 | P2 | OPEN |  | La caducidad de una promoción no hace avanzar automáticamente la cola |
| BUG-013 | P2 | OPEN |  | Un fallo al crear la membresía deja una liga creada tras responder error |
| BUG-014 | P1 | OPEN |  | El borrado de una temporada puede perder partidos y dejar la temporada intacta |
| BUG-015 | P2 | OPEN |  | Borrar una temporada cambia la temporada activa aunque se elimine otra |
| BUG-016 | P1 | OPEN |  | Un fallo al iniciar una temporada deja cerrada la anterior |
| BUG-017 | P2 | Corrected locally | C08 | Duplicar una temporada pierde su duración personalizada |
| BUG-018 | P2 | OPEN |  | Dos duplicaciones concurrentes pueden crear dos próximas temporadas |
| BUG-019 | P2 | OPEN |  | La compensación fallida de duplicación deja una temporada incompleta |
| BUG-020 | P2 | Corrected locally | C12 | Cuatro duraciones aceptadas fallan al generar el calendario |
| BUG-021 | P2 | Corrected locally | C08 | Una reordenación parcial mezcla partidos de jornadas diferentes |
| BUG-022 | P2 | OPEN |  | Un error durante la reordenación deja cambios parciales de jornadas |
| BUG-023 | P1 | OPEN |  | Un resultado modificado puede conservar confirmaciones del resultado anterior |
| BUG-024 | P1 | OPEN |  | El guard SQL de regeneración puede competir con un resultado concurrente |
| BUG-025 | P2 | OPEN |  | Resolver una incidencia informa éxito aunque falle la limpieza de votos y confirmaciones |
| BUG-026 | P2 | Corrected locally | C11 | Las recomendaciones no convierten la disponibilidad entre zonas horarias |
| BUG-027 | P2 | Corrected locally | C07 | El límite de mensajes hace desaparecer propuestas aprobadas y su estado |
| BUG-028 | P2 | OPEN |  | Dos pagos simultáneos pueden sobrescribirse pese a responder éxito |
| BUG-029 | P3 | OPEN |  | El reparto redondeado puede diferir dos céntimos entre jugadores |
| BUG-030 | P2 | Corrected locally | C04 | Un empate permitido se trata de forma distinta en ranking y estadísticas |
| BUG-031 | P3 | Corrected locally | C04 | Las posiciones de empate difieren entre detalle del partido y estadísticas |
| BUG-032 | P2 | OPEN |  | Editar participantes de un amistoso deja pagos ligados a identificadores antiguos |
| BUG-033 | P2 | Corrected locally | C09 | La cola Push oculta errores de almacenamiento y puede repetir envíos |
| BUG-034 | P2 | Corrected locally | C05 | El idioma del documento permanece en español al elegir inglés o euskera |
| BUG-035 | P2 | Corrected locally | C10 | La actualización automática puede recargar formularios con cambios sin guardar |
| BUG-036 | P2 | Corrected locally | C05 | La guía modal permite que el teclado vuelva a controles del fondo |
| BUG-037 | P1 | OPEN |  | Crear una temporada puede cerrar la anterior aunque falle el alta |
| BUG-038 | P3 | Corrected locally | C05 | README identifica una versión estable antigua como actual |
| BUG-039 | P2 | Corrected locally | C07 | La paginación de actividad omite eventos empatados en fecha |
| BUG-040 | P1 | Corrected locally | C01 | Dependencias de desarrollo con avisos de seguridad, incluidos críticos en la cadena de pruebas |

Limits: C09 Push delivery remains at-least-once. C10 edited app sessions conservatively defer automatic updates. C11 ambiguous/nonexistent DST interval endpoints are omitted. Real OAuth/PRE/device checks are manual gates.

Open work: atomic account deletion; waitlist capacity/expiry; league creation compensation; season create/start/delete/duplicate/reorder transactions; result/incident/calendar concurrency; payment mutation concurrency, cent allocation and friendly participant identity preservation.


Resume: execute C14 with the existing release-quality GitHub Actions job, which runs the same database quality script against a worker-local disposable Docker stack and synthetic fixtures. C14 passed; C15 prepares a coherent release and requires all final gates before PRE promotion. The workstation alternative is installing/starting Docker Desktop and rerunning npm run database:quality in the isolated checkout recorded in STATUS.md. No migrations have been modified or added in this correction phase.
