# M05/M06/M07 — revisión en curso

## Calendario

Barrido puro 102 casos: 98 correctos, cuatro fallos (BUG-020), no ocultados. Reordenación: entrada incompleta mezcla jornadas (BUG-021); fallo intermedio deja cambio parcial (BUG-022). Control de permutación completa correcto.
Reparación normal exige upcoming, longitud coincidente y partidos pristine. Reroll permite estados distintos expresamente, rechaza resultados, valida conjunto completo en SQL y elimina estado de los anteriores emparejamientos. Resize bloquea seasons. Riesgo de concurrencia con result documentado como probable BUG-024, PostgreSQL pendiente. No se afirma que transacción implique serialización universal.

## Resultados y confirmaciones

Revisados handlers result PUT/DELETE, result-lock PUT, result-confirmations POST/PUT/DELETE, guard serverMatchAccess y derivación resultConfirmations. Acceso exige liga, participación o administración según operación; finished read-only salvo excepción explícita del superusuario; calendario progresivo oculta partidos no revelados.
PUT valida juegos 0..7, sets válidos 6-0..4/7-5/7-6, cantidad según requires_three_sets, incidentes abiertos y bloqueo. Participante puede corregir como reportador o tras disputa; administración puede corregir salvo bloqueo vigente. DELETE requiere admin y no bloqueado; conserva horario si existe y reinicia marcador. Comparte secuencia no atómica de borrado de confirmaciones con PUT (BUG-023), no se crea otra ficha del mismo patrón.
Result-lock exige admin, finished y modo distinto de none; registro de actividad tolera fallos sin alterar respuesta de negocio. Confirmar exige participante distinto del reportador y estado pendiente; lectura colectiva limita 200 IDs y filtra ligas del usuario/espectador.
Tres comprobaciones adicionales pasan: límites exactos de 24 horas, disputa/bloqueo/modos; exclusión de ajenos/otros partidos/reportador y aceptación de los tres restantes; transición exacta inicio/120 minutos y prioridades finished/postponed/fecha inválida. Evidencia resultados-limites.*. No prueba concurrencia SQL ni permisos reales de Google.
En amistosos el resultado se guarda con PATCH action=result, exige ganador y no usa confirmaciones de liga; no se extiende BUG-023 automáticamente a ese flujo. Revisar edición de participantes y permisos en M10.

## Incidencias y sustituciones

POST incidente valida tipo/motivo 3..500, permiso allow_player_incidents o admin, evita duplicar abierto/resuelto. PUT exige admin e incidencia abierta, valida resolución/puntuación y exige sets/ganador cuando corresponda. DELETE limpia incidencia y marcador si resolución excepcional. BUG-025 reproduce éxito falso al fallar limpieza dependiente.
Aplazar exige admin/participante, no abierto/finalizado/ya aplazado y programación previa; borra fecha/lugar, sin borrar transferencias explícitamente (decisión de conservación pendiente de contraste con UI).
Asignación de sustituto delega RPC vigente 20260720213000 con FOR UPDATE sobre match; bloquea finished, valida original, liga, pool activo, no titular de temporada ni duplicado; actualiza equipos y pagos transaccionalmente. No se atribuye carrera genérica de asignación ignorando este lock. Lectura/actualización tienen permiso allow_player_substitutions y participante/admin. Pendiente desasignación, reemplazo permanente, visual y cruces de cuenta vinculada.

Estado final: complemento de manuales, desasignación y reemplazo SQL en M08-M15-revision.md. Concurrencia PostgreSQL de BUG-024 permanece bloqueada/probable; no se declara probada por lectura SQL.
