# Validación de torneos

## Evidencia inicial

- Base staging b67df81a: la entrega anterior pasó validate (264 archivos / 1098 tests), workflow remoto #410 y health PRE. Evidencia heredada, no afirmar que cubre este objetivo nuevo.
- T01 PASS: `npx vitest run tests/unit/rapidTournament.test.ts tests/unit/dynamicMexicano.test.ts tests/unit/serverDynamicMexicano.test.ts tests/unit/rapidTournamentTiming.test.ts tests/unit/rapidTournamentAudio.test.ts tests/integration/rapidTournamentRoutes.test.ts tests/integration/rapidTournamentInvites.test.ts` (60 tests / 7 archivos). Cuentas registradas 8/10/16 y duplicación de nombre canónico cubiertas.
- T01 PASS: `npm run typecheck`, ESLint en API y test modificados, `git diff --check`.
- Se mantendrán aquí comandos, resultados y limitaciones por hito. No marcar DB/RLS comprobada solo por tests de mocks o lectura de SQL.

## Matriz de aceptación final (pendiente)

- Rápidos: Americana/Mexicano × rotativas/fijas × tamaños viables hasta 24; participación/descansos/pistas, repeticiones auditadas, reserva/timing/audio.
- Tradicionales: eliminación/grupos/mixto, byes/semillas/manual, tercer puesto/consolación, avance idempotente sin empate eliminatorio inválido.
- Resultados: puntos/juegos/sets/tie-breaks, reglas de cierre, desempates ordenables, confirmación/aprobación y correcciones con historial.
- Permisos: creador/admin/participante/espectador/sin acceso; lecturas y mutaciones cruzadas, carreras de invitación y resultado, RLS y RPC local.
- Gestión: editar calendario, bajas/sustituciones/aplazamientos, recálculos seguros, duplicación, eliminación y fin.
- Integración: hub/navbar/Atrás, Mis Partidos, perfil/filtros/periodos/RACHA, métricas compatibles y no duplicadas; chats y notificaciones.
- Economía: cuotas/pagos/gastos/bolas/premios/balances, aislamiento y coherencia monetaria.
- UI: CLÁSICO/COMPETITION permitido, claro/oscuro, es/en/eu, móvil estrecho, teclado/Axe, PWA y regresiones liga/amistosos.
- Manuales: OAuth real y audio/bloqueo/altavoz/PWA física requieren pruebas explícitas posteriores, sin afirmar cobertura automática.
