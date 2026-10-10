# Índice de las 40 incidencias

Base 6fa8c72, 10/10/2026. Fichas completas en AUDITORIA_GENERAL.md. CONFIRMADO siempre se limita a la evidencia de cada ficha; no implica explotación o prueba sobre datos reales.

| ID | Gravedad | Confirmación | Origen | Módulos | Título |
|---|---|---|---|---|---|
| BUG-001 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M01/M02 | El guard de autenticación puede restaurar privilegios o datos de perfil revocados concurrentemente |
| BUG-002 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M01/M15 | La exportación personal omite membresías y temporadas al confundir ID de cuenta e ID de jugador |
| BUG-003 | P1 | CONFIRMADO EN ALCANCE INDICADO | Histórico | M01/M02/M14 | Eliminar cuenta declara anonimización completa aunque conserva identidad asociada o fallen borrados auxiliares |
| BUG-004 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M01/M17 | La confirmación de eliminación en inglés/euskera se rechaza silenciosamente |
| BUG-005 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M02/M14 | Suscripciones Push aceptan destinos HTTPS internos arbitrarios |
| BUG-006 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04 | La lista de espera muestra posición 1 a cualquier jugador |
| BUG-007 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04/M14 | Salir de la lista de espera impide volver a entrar |
| BUG-008 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M02/M03 | Un código de invitación incorrecto permite leer una liga con su UUID |
| BUG-009 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M03/M07/M11 | La previsualización pública de invitación incluye pagos y notas de incidencias |
| BUG-010 | P2 | PROBABLE | Nuevo | M04/M01/M02 | La promoción de lista de espera no se reconoce en la sala de espera |
| BUG-011 | P2 | PROBABLE | Nuevo | M04 | Una plaza ofrecida en lista de espera puede ser ocupada por otra inscripción |
| BUG-012 | P2 | PROBABLE | Nuevo | M04/M14 | La caducidad de una promoción no hace avanzar automáticamente la cola |
| BUG-013 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M03 | Un fallo al crear la membresía deja una liga creada tras responder error |
| BUG-014 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04/M06 | El borrado de una temporada puede perder partidos y dejar la temporada intacta |
| BUG-015 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04 | Borrar una temporada cambia la temporada activa aunque se elimine otra |
| BUG-016 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04/M14 | Un fallo al iniciar una temporada deja cerrada la anterior |
| BUG-017 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04/M05 | Duplicar una temporada pierde su duración personalizada |
| BUG-018 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04 | Dos duplicaciones concurrentes pueden crear dos próximas temporadas |
| BUG-019 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04 | La compensación fallida de duplicación deja una temporada incompleta |
| BUG-020 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M05 | Cuatro duraciones aceptadas fallan al generar el calendario |
| BUG-021 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M05 | Una reordenación parcial mezcla partidos de jornadas diferentes |
| BUG-022 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M05 | Un error durante la reordenación deja cambios parciales de jornadas |
| BUG-023 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M06/M12 | Un resultado modificado puede conservar confirmaciones del resultado anterior |
| BUG-024 | P1 | PROBABLE | Nuevo | M05/M06 | El guard SQL de regeneración puede competir con un resultado concurrente |
| BUG-025 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M07/M06/M12 | Resolver una incidencia informa éxito aunque falle la limpieza de votos y confirmaciones |
| BUG-026 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M08 | Las recomendaciones no convierten la disponibilidad entre zonas horarias |
| BUG-027 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M09/M10 | El límite de mensajes hace desaparecer propuestas aprobadas y su estado |
| BUG-028 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M11 | Dos pagos simultáneos pueden sobrescribirse pese a responder éxito |
| BUG-029 | P3 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M11 | El reparto redondeado puede diferir dos céntimos entre jugadores |
| BUG-030 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M06/M12/M13 | Un empate permitido se trata de forma distinta en ranking y estadísticas |
| BUG-031 | P3 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M12/M13/M15 | Las posiciones de empate difieren entre detalle del partido y estadísticas |
| BUG-032 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M10/M11 | Editar participantes de un amistoso deja pagos ligados a identificadores antiguos |
| BUG-033 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M14/M21 | La cola Push oculta errores de almacenamiento y puede repetir envíos |
| BUG-034 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M16/M17 | El idioma del documento permanece en español al elegir inglés o euskera |
| BUG-035 | P2 | PROBABLE | Nuevo | M18 | La actualización automática puede recargar formularios con cambios sin guardar |
| BUG-036 | P2 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M16/M17 | La guía modal permite que el teclado vuelva a controles del fondo |
| BUG-037 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M04 | Crear una temporada puede cerrar la anterior aunque falle el alta |
| BUG-038 | P3 | CONFIRMADO EN ALCANCE INDICADO | Histórico | M21 | README identifica una versión estable antigua como actual |
| BUG-039 | P2 | CONFIRMADO EN ALCANCE INDICADO | Histórico | M14/M21 | La paginación de actividad omite eventos empatados en fecha |
| BUG-040 | P1 | CONFIRMADO EN ALCANCE INDICADO | Nuevo | M21 | Dependencias de desarrollo con avisos de seguridad, incluidos críticos en la cadena de pruebas |


## Localización por pantalla/operación

| Pantalla/operación | Incidencias relacionadas |
|---|---|
| Cuenta y Ajustes → Mis datos | 001, 002, 003, 004 |
| Invitación / acceso público de liga | 008, 009 |
| Notificaciones / Push / tarea programada | 005, 012, 033 |
| Temporada / inscripción / sala de espera | 006, 007, 010, 011, 012 |
| Crear liga | 013 |
| Administración → alta/inicio/borrado/duplicación de temporada | 014, 015, 016, 017, 018, 019, 037 |
| Administración → calendario / jornadas | 020, 021, 022, 024 |
| Partido → resultados / incidencia | 023, 025, 030 |
| Disponibilidad / coordinación / chat con propuestas | 026, 027 |
| Partido / amistoso → pagos y reservas | 028, 029, 032 |
| Amistoso → editar jugadores | 032 |
| Ranking / estadísticas / exportación | 030, 031 |
| Actividad / historial | 039 |
| Idioma / ayuda / actualización PWA | 034, 035, 036 |
| Repositorio / desarrollo / CI | 038, 040 |

Todos los IDs usan prefijo BUG-. Las filas comparten incidencias; no sumar para calcular total. No hay cambio aplicado.
