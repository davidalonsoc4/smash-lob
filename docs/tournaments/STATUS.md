# Estado de torneos

Objetivo global: ACTIVO, no completado. Primer hito incompleto: **T04**.

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

## T03 checkpoint — duplicación independiente

- Ajustes ofrece Duplicar torneo al creador. Formulario existente precargado con participantes/cuentas, formato, reserva, calentamiento y nombres de pistas; fecha futura por defecto revisable. Sin copiar resultados, estado, inicio real ni progreso; no arrastra una temporada de torneo.
- GET sigue el permiso existente; interfaz rechaza rol participante y POST vuelve a exigir creador del torneo original. Los vínculos copiados se validan contra el directorio disponible, conservando las restricciones SQL de creación.
- 22 tests de borrador/API pasan, tipos/lint/i18n y fuente correctos. E2E móvil claro/oscuro con creación de copia independiente en curso (terminal 2700).
- T03 no completo. RPC actuales requieren liga compartida para vincular cuentas: la copia de cuentas vinculadas solo por invitación aún necesita ampliación SQL. No conceder ese permiso solo en TypeScript, porque SQL lo rechazaría. Próximo: terminar E2E y checkpoint/commit; ampliar parámetros/esquema con tests DB aislados. No desbloquear formatos todavía no integrados.

Checkpoint de duplicación validado: 23 tests unitarios/API, tipos, lint e i18n correctos; dos E2E móviles claro/oscuro PASS incluyendo crear copia, doce resultados pendientes y original finalizado intacto. Los intentos iniciales fallaron por selectores del test (status ambiguo, ruta esperada sin /calendar y Borrador no aislado del metadato); corregidos sin cambiar el flujo existente. Build de Playwright correcto. Guardar commit local y seguir T03 por persistencia configurable y compatibilidad SQL, todavía sin cerrar el hito.

## T03 checkpoint — creación configurable y SQL real

- PostgreSQL 17.11 portátil descargado de EDB; SHA-256 4b8db0930c38f6ef845db919551dedda3b6b845aeb0927b3d79a6e8e9e4537cf verificado antes de ejecutar. Herramientas y datos descartables en `.quality-artifacts/`, clúster dedicado en 127.0.0.1:55439, sin servicio Windows ni credenciales remotas. `pg_ctl` puede detenerlo usando exclusivamente `.quality-artifacts/postgres-tournaments-data`.
- CLI Supabase 2.111.0 creó `20261024003812_configurable_rapid_tournaments.sql`. Solo se ha aplicado en bases de prueba locales desechables. Añade configuración 4–24, rondas/tiempos configurables, logo/acento y RPC atómica, mantiene las RPC antiguas. Nuevo sorteo conserva IDs/cuentas y rechaza torneo iniciado.
- `node scripts/check-tournament-database.mjs` PASS con 11 migraciones históricas de torneos, fixtures mínimos, creación/persistencia, tiempos, copia de cuenta sin liga compartida, suspensión, rollback y permisos públicos. Test nuevo de sorteo PASS: identidad intacta, creador ajeno rechazado, tras iniciar bloqueado. No equivale a `database:quality` completo de Supabase/pgTAP.
- Formulario conectado al nuevo contrato; reutiliza logo/crop de liga, tema local con contraste, reserva y opciones avanzadas. Algoritmos adaptados a límites nuevos; para Mexicano >16, selección determinista por participación/descanso evita explosión combinatoria. Optimización exhaustiva legacy <=16 conservada.
- Auditoría distingue requisitos obligatorios (integridad/participación) y optimizaciones (variedad/rachas); advertencias no declaran inválida una configuración matemáticamente viable. UI usa `allPassed` para no anunciar Todo correcto con advertencias.
- 53 pruebas focalizadas PASS. i18n PASS tras añadir traducciones. TypeScript detectó `allPassed` ausente en fallback Mexicano; corregido y en repetición (terminal 3875). No continuar hacia pasos nuevos si persiste el error.
- Presupuesto fuente +550 líneas para configuración, contratos y UI ampliados; sin nuevas dependencias ni componentes cliente. Hay cambios sin commit.

Siguiente: confirmar typecheck; importar hasta 24 jugadores de liga, cubrir API configurada/copia y SQL de origen, actualizar E2E de tamaños/tiempos/identidad, ejecutar gates y commit. T03 sigue abierto; aún no están implementados parejas fijas ni tradicionales.

## T03 checkpoint — origen y formulario integrado

- TypeScript confirmado PASS tras reparar el fallback. Importación de liga selecciona automáticamente hasta 24 jugadores, ajusta la capacidad y conserva vínculos; para plantillas mayores muestra aviso y permite elegir. Peticiones cancelables para evitar mezclar temporadas al cambiar rápido.
- Nuevo selector de origen en el formulario independiente, con temporadas obtenidas de `/api/tournaments/sources`: solo ligas administradas, o acceso de superusuario. POST y RPC vuelven a validar permisos, temporada y cuentas; el selector no concede permisos.
- DB local PASS: 11 migraciones, snapshot de liga persistido, aislamiento de organizador, temporada ajena rechazada, original/copia independientes. 53 pruebas focalizadas PASS e i18n/tipos correctos. Inventario de API desactualizado detectado por gate y regenerado: 111 rutas/156 métodos, check PASS.
- E2E ampliado con 24 jugadores, tiempos manuales, reserva insuficiente, importación completa y resumen por jugador; ejecución en curso, terminal 78957, log `.quality-artifacts/tournaments-t03-e2e.log`. No cerrar T03 hasta resolver sus resultados y validate completo.

Checkpoint: E2E 10/10 PASS, móvil/escritorio, Americana/Mexicano, importación y configuración. DB local repetida PASS incluyendo guardar/corregir resultado, rechazar usuario ajeno y no finalizar incompleto. Detectados mensajes sonoros con tiempos fijos; ahora se construyen según calentamiento/transición configurados (22 tests de timing/audio PASS y 54 tests API/configuración PASS). Identidad/logo/acento añadidos al E2E final móvil, en ejecución terminal 3715, log `.quality-artifacts/tournaments-t03-final-e2e.log`. Validate completo terminal 60993 en curso, lint 0 errores/5 warnings previos. Plan ajusta dependencia: inscripción por parejas fijas con T04, tradicionales con T05, sin reducir alcance global.

## T03 cerrado localmente

- `npm run validate` PASS: 270 archivos / 1192 tests, typecheck/build/presupuestos correctos (1223383 bytes gzip/103 chunks), lint 0 errores/5 warnings previos. Log `.quality-artifacts/tournaments-t03-validate.log`.
- E2E 10/10 PASS móvil/escritorio; repetición con nuevo audio 2/2 happy paths móviles PASS. Prueba final de logo/crop/acento y configuración 24 jugadores PASS; fallo previo era selector accesible de un logo decorativo, corregido en test. Captura revisada: resumen coherente y sin overflow a 393 px. Log `.quality-artifacts/tournaments-t03-identity-e2e.log`.
- `database:tournaments` PASS: 11 migraciones, creación y sorteo atómicos, tiempos, copia, snapshot de liga, resultados/correcciones, RLS en seis tablas, acceso público/autenticado denegado e invoker/search_path verificados. PostgreSQL aislado, sin datos personales; no es el gate Supabase completo.
- Migración nueva pendiente de aplicación remota. En entornos sin ella, el formulario muestra un error de actualización necesaria, no promete que quitar cuentas permita crear. No se publica ni se modifica PRE/PROD.
- Auto-Resume verificado: habilitado, watcher activo, cero recuperaciones pendientes, 0.6.13 structurally_compatible. No reenviar interrupciones recuperadas.

Siguiente T04: parejas fijas para Americana/Mexicano, empezando por contrato/algoritmo puro y tests; integrar persistencia, creación, clasificación por equipo y directa antes de habilitar la opción. Mantener jugadores, algoritmos y resultados de torneos rotativos actuales. T05–T09 siguen pendientes, no considerar terminado el objetivo integral.

## T04 checkpoint — motor de parejas fijas

- T03 guardado en commits locales `226c1183` (SQL/harness) y `e6718c11` (flujo integrado). Sin push, PRE ni PROD.
- `fixedRapidTournament.ts`: valida equipos completos/disjuntos 4–24, genera Americana fija y Mexicano incremental determinista conservando compañeros, distribuye participación/descansos/pistas y calcula clasificación de pareja reutilizando los rankings existentes, sin duplicar puntos. No está conectado a UI/RPC aún, opción sigue bloqueada.
- 41 tests de motor fijo + regresiones Americana/Mexicano PASS. Primer test suponía una distribución de pistas matemáticamente incompatible con todos los rivales distintos (cuatro parejas/tres rondas); corregida la expectativa y documentada la limitación, no relajada la integridad/participación.
- Porcentajes de torneos de hasta cien rondas podían convertirse a Infinity/Infinity con marcadores grandes; nueva conversión finita para presentación, conservando fracciones BigInt para los desempates. Test explícito con 100 resultados PASS.
- Fuente 135738 líneas bajo 136000. Typecheck/lint y pruebas complementarias en curso, no cerrar ni habilitar todavía T04.

Siguiente paso: confirmar gates, guardar checkpoint del motor. Crear migración aditiva de parejas fijas (no editar `20261024003812`, ya guardada), relación de equipos e invariantes de partidos/sorteo/resultados. Conectar creación, origen/duplicación, ranking por equipo, calendario/directo y pruebas SQL/API/E2E antes de desbloquear la opción. No retirar ni alterar flujos rotativos.

Checkpoint del motor validado: 41 tests de motores y 90 complementarios PASS, ESLint y typecheck PASS. Typecheck detectó campos adicionales id/court en literales legacy al ampliar el contrato; mantenidos como opcionales y repetición correcta. Guardar commit local; siguiente acción es migración de persistencia de parejas fijas, no repetir T03 ni activar controles todavía.

## T04 checkpoint — persistencia e integración fija

- Migración nueva `20261024011921_fixed_pair_rapid_tournaments.sql`, creada por CLI; no modifica migraciones anteriores. Añade pairing/pair_number al roster existente, RPC fija que reutiliza validación atómica común, triggers de integridad de parejas e inmutabilidad tras inicio. Sin tablas duplicadas ni temporadas de torneo.
- Harness SQL PASS con doce migraciones: creación fija, pares inválidos y cruces mezclados rechazados, Mexicano incremental/idempotente, bloqueo sin resultados y cambios de pareja tras inicio. Primera ejecución falló por literal integer en un argumento smallint del test; cast explícito y repetición correcta. Nuevo control de inicio revisa pares y calendario completo antes de iniciar Americana fija.
- API de crear/sortear y generación Mexicano conectadas al motor; lecturas incluyen pairing y números de pareja. Copia conserva equipos. Formulario permite fijas/rotativas con asignación editable validada, source/cuentas conservados. Página adapta ranking por equipo y campeón sin duplicar puntos; auditoría no exige rotación de compañero en formato fijo.
- 57 tests focalizados PASS, i18n PASS tras añadir es/en/eu, lint focalizado PASS. Typecheck en repetición, terminal 67574. UI fija todavía en desarrollo: falta E2E del flujo completo y gates finales; no cerrar T04 ni publicar.

Siguiente: añadir pruebas API específicas de fijas/errores/sorteo, copia y servidor Mexicano fijo; E2E móvil claro/oscuro de creación/editar parejas/sortear/iniciar/resultados/ranking/campeón. Corregir regresiones de lecturas legacy si aparecen, ejecutar validate, actualizar evidencias y commit local.

### T04 — gates de integración fija

- 69 pruebas focalizadas PASS: API fija Americana/Mexicano, asignaciones no válidas, sorteo sin cambiar parejas/IDs, servidor incremental y copia fija. Corregido el parámetro de `it.each` que expandía arrays y ocasionó fallo de typecheck al arrancar el primer E2E; repetición de tipos y tests correcta, con arrays completos verificados.
- PostgreSQL local repetido PASS con doce migraciones; inicio de Americana rechaza parejas cambiadas que invaliden los partidos ya guardados. Tras iniciarse se bloquean cambios de pareja. Resultados de liga permanecen independientes.
- Transición cero: un solo countdown por frontera y mensaje combinado fin/inicio; 23 tests timing/audio PASS. Registro de resultado ahora exige ambos campos y usa el validador compartido, no convierte un vacío en cero. Ranking de Americana fija adapta solo métricas porcentuales y no muestra el rating Mexicano como puntuación del campeón.
- E2E móvil 9/9 PASS: cuatro flujos fijos claro/oscuro, cinco regresiones de creación/importación/Mexicano rotativo. Captura de ranking fijo a 393 px revisada. `npm run validate` PASS: 271 archivos/1223 tests, tipos/build/presupuestos, lint cero errores/cinco warnings anteriores; 1225818 bytes gzip/103 chunks. Log `.quality-artifacts/tournaments-t04-validate.log`.
- Repetición final fija con marcador vacío y viewport real de cada proyecto en curso, terminal 30068, log `.quality-artifacts/tournaments-t04-final-fixed-e2e.log`. No declarar T04 cerrado todavía: además de confirmar estos gates, queda concretar descansos configurables dentro de rápidos, conservando descansos individuales equilibrados. Reglas de puntuación/desempates completos tienen dueño explícito en T06 (no se han omitido del objetivo).

Checkpoint fijo validado: repetición final 8/8 PASS, móvil 393 px y escritorio, claro/oscuro, ambos formatos; incluye campos vacíos, parejas editadas, sorteo, los seis resultados, ranking por cuatro equipos, campeón y copia. Guardar commits locales y continuar T04 con descansos configurables. Propuesta mínima siguiente: descanso general adicional de duración/frecuencia elegidas, sumado a transiciones, visible en planificación, reserva y seguimiento/audio; descansos individuales siguen derivados y equilibrados según jugadores/pistas/rondas. Implementar y verificar antes de dar por completo T04.
