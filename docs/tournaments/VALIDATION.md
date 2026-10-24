# Validación de torneos

## Evidencia inicial

- Base staging b67df81a: la entrega anterior pasó validate (264 archivos / 1098 tests), workflow remoto #410 y health PRE. Evidencia heredada, no afirmar que cubre este objetivo nuevo.
- T01 PASS: `npx vitest run tests/unit/rapidTournament.test.ts tests/unit/dynamicMexicano.test.ts tests/unit/serverDynamicMexicano.test.ts tests/unit/rapidTournamentTiming.test.ts tests/unit/rapidTournamentAudio.test.ts tests/integration/rapidTournamentRoutes.test.ts tests/integration/rapidTournamentInvites.test.ts` (60 tests / 7 archivos). Cuentas registradas 8/10/16 y duplicación de nombre canónico cubiertas.
- T01 PASS: `npm run typecheck`, ESLint en API y test modificados, `git diff --check`.
- Se mantendrán aquí comandos, resultados y limitaciones por hito. No marcar DB/RLS comprobada solo por tests de mocks o lectura de SQL.

## Matriz de aceptación final (pendiente)

T03 duplicación (parcial): 23 unitarias/API PASS, typecheck/lint/i18n/fuente/diff PASS. `npx playwright test tests/e2e/rapid-tournament.spec.ts --grep 'creates and completes' --project=mobile-chromium --workers=2`: 2/2 PASS, build de producción del harness y Axe del flujo existente incluidos; copia con doce marcadores pendientes y original sin modificar. No se ha comprobado SQL de cuentas fuera de liga compartida, que sigue siendo una limitación explícita de esta entrega parcial.

T02 PASS: 114 pruebas focalizadas/10 archivos; `npm run validate` completo (267 archivos, 1156 tests), 0 errores lint/5 warnings existentes, typecheck/build/presupuestos (1220695 bytes gzip, 104 chunks). Log: `.quality-artifacts/tournaments-t02-validate.log`. `npx playwright test tests/e2e/rapid-tournament.spec.ts --workers=2`: 8/8 móvil/escritorio claro/oscuro incluyendo creación, importación, Americana completa, Mexicano y Axe. Sin migraciones nuevas, sin afirmar DB nueva verificada.

- Rápidos: Americana/Mexicano × rotativas/fijas × tamaños viables hasta 24; participación/descansos/pistas, repeticiones auditadas, reserva/timing/audio.
- Tradicionales: eliminación/grupos/mixto, byes/semillas/manual, tercer puesto/consolación, avance idempotente sin empate eliminatorio inválido.
- Resultados: puntos/juegos/sets/tie-breaks, reglas de cierre, desempates ordenables, confirmación/aprobación y correcciones con historial.
- Permisos: creador/admin/participante/espectador/sin acceso; lecturas y mutaciones cruzadas, carreras de invitación y resultado, RLS y RPC local.
- Gestión: editar calendario, bajas/sustituciones/aplazamientos, recálculos seguros, duplicación, eliminación y fin.
- Integración: hub/navbar/Atrás, Mis Partidos, perfil/filtros/periodos/RACHA, métricas compatibles y no duplicadas; chats y notificaciones.
- Economía: cuotas/pagos/gastos/bolas/premios/balances, aislamiento y coherencia monetaria.
- UI: CLÁSICO/COMPETITION permitido, claro/oscuro, es/en/eu, móvil estrecho, teclado/Axe, PWA y regresiones liga/amistosos.
- Manuales: OAuth real y audio/bloqueo/altavoz/PWA física requieren pruebas explícitas posteriores, sin afirmar cobertura automática.
