# Estado de torneos

Objetivo global: ACTIVO, no completado. Primer hito incompleto: **T05**.

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

## T04 checkpoint — descansos generales configurables

- Parejas fijas guardadas en commits `be0072d5` y `0dab0a17`, sin publicar. Árbol limpio confirmado antes de empezar descansos.
- Planificador, preview, horarios derivados e inicio real admiten pausa adicional de 1–60 min cada 1–100 rondas; ninguna pausa tras la última ronda, mantiene al menos dos minutos de seguridad. Se añade a la transición y no cambia descansos individuales ni emparejamientos.
- Nueva migración CLI `20261024053002_rapid_tournament_break_schedule.sql`, aditiva y solo local. RPC planificada reutiliza las RPC de crear rotativo/fijo, valida reserva y persiste pausas/horarios de manera atómica. Defaults cero para todos los torneos anteriores. Harness PostgreSQL 13 migraciones PASS con fijos/rotativos, intervalo y margen correctos y escritura autenticada rechazada; ampliando matriz también a Mexicano.
- Formulario/copia/API/GET/directo/audio conectados. Descanso general identificado en seguimiento, aviso habla de pausa real incluyendo cambio. 55 tests de planificación/timing y 58 de API/copia PASS; i18n/fuente PASS, typecheck PASS antes de última ampliación E2E. Fuente 135893/136000, sin nuevos clientes ni dependencias.
- E2E móvil mixto con descanso y contador 07:00 en curso, terminal 45715, log `.quality-artifacts/tournaments-t04-breaks-e2e.log`. Validate completo terminal 93204, log `.quality-artifacts/tournaments-t04-breaks-validate.log`. Confirmar ambos resultados y repetir SQL ampliado; no cerrar T04 con gates en curso.

Checkpoint de descansos validado: E2E móvil 9/9 PASS y matriz fija con descansos 8/8 móvil/escritorio claro/oscuro PASS. SQL ampliado 13 migraciones PASS con Americana/Mexicano × fijo/rotativo. Validate PASS 272 archivos/1235 tests, tipos/lint/build/presupuestos (1226910 bytes gzip/103 chunks; cinco warnings previos). Auditoría añade reparto individual de pistas y distingue observaciones de un calendario inválido.

Pulido final T04: resumen actualiza ronda al siguiente límite de horario y al recuperar visibilidad usando offset de servidor, sin intervalo continuo fuera de Seguimiento; finalizado no muestra próxima ronda y borrador americano conserva preview inicial aunque pase la fecha prevista. Mexicano borrador explica que la primera ronda se genera al iniciar. Typecheck y lint PASS antes del último ajuste de texto/preview, 24 tests de motores/pausas PASS. E2E móvil de resumen/pausa en curso terminal 35760, log `.quality-artifacts/tournaments-t04-summary-e2e.log`; confirmar y tipos/lint finales antes de cerrar T04 y pasar a T05.

## T04 cerrado localmente

- Último E2E de resumen/pausa 4/4 PASS tras precisar el selector del enlace Seguimiento dentro de la navbar (antes encontraba dos accesos legítimos y fallaban los tests). Tipos/lint finales PASS, 24 tests focalizados PASS; fuente 135914/136000 y diff correctos.
- Evidencia acumulada: validate completo PASS 272 archivos/1235 tests, matriz de descansos 8/8 móvil/escritorio claro/oscuro, móvil con regresiones rotativas 9/9, SQL con trece migraciones y cuatro combinaciones de formato/pareja PASS. Preserva plantilla original 12/2/6 y cuenta exacta por equipo, clocks/avisos reales, identidad/copia/origen y rutas/nav actuales.
- Pausas adicionales configurables no sustituyen los descansos individuales: estos se derivan de jugadores/pistas/rondas y se equilibran automáticamente. UI lo explica y muestra parámetros y tiempos por jugador, reserva y margen reales. Observaciones de variedad/pistas no se confunden con imposibilidad ni se anuncia equilibrio perfecto universal.
- Sin cambios remotos, tres migraciones nuevas del objetivo preparadas. OAuth/PWA/audio físico y gate Supabase completo siguen explícitos para T09. Objetivo integral continúa; quedan T05–T09.

Siguiente T05: inspeccionar solo contratos/modelos/rutas/formulario existentes necesarios para tradicionales. Implementar motores separados y acotados de eliminación/grupos/mixto (hasta 24 jugadores, combinaciones viables), con byes/semillas/manual, tercer puesto/consolación y calendarios. Reutilizar identidad, participantes, permisos y presentación; integrar SQL/API/UI y probar cada formato antes de habilitarlo. No rehacer ni degradar rápidos ni ligas. Empezar por esquema/contrato puro verificable y knockout; no marcar T05 completo con solo knockout.

## T05 checkpoint — motores tradicionales y planificación

- `traditionalTournament.ts` reutiliza la validación de parejas de T04 y el validador de puntos. Cuadro estándar de 2–12 parejas, cabezas de serie, sorteo determinista/manual, byes sin partidos ficticios, tercer puesto y consolación de perdedores de primera ronda. Consolación requiere al menos dos perdedores reales (sin contar byes); UI deberá explicar esta combinación, no fingir participantes.
- Grupos equilibrados por reparto serpiente o distribución manual; todos contra todos incluso con tamaños impares. Mixto clasifica por victorias/diferencia/puntos a favor y separa parejas del mismo grupo en el cuadro cuando es viable. Empates deportivos conservan posición compartida; un cruce ambiguo requiere decisión explícita de orden entre empatados, sin promover equipos con peor resultado.
- Resultados incluyen identidad de ambas parejas: una corrección que cambiaría rivales de un cruce ya disputado se rechaza. No se declara campeón antes de completar los partidos obligatorios. Grupos sin eliminatorias identifica ganadores de cada grupo, no inventa una clasificación conjunta de grupos distintos.
- Planificación automática y validación manual comparten conflictos de pista/equipo, dependencias y transición; admite fechas separadas por semanas y partidos pendientes de programar. La previsión utiliza rivales posibles y puede ser conservadora; final/tercer puesto simultáneos permitidos al ser rivales excluyentes.
- Primeras 122 pruebas focalizadas PASS; typecheck final PASS tras cambiar helper `never` por declaración de función para estrechamiento correcto de tipos. ESLint y fuente PASS. Nueva matriz exhaustiva mixta pendiente de ejecutar. Presupuesto fuente +450 justificado por dos módulos puros nuevos (136251 líneas medidas), sin dependencias ni nuevos clientes.
- T05 NO completo: sin persistencia/API/formulario tradicional todavía. No activar controles hasta verificar el recorrido integrado. Sin operaciones remotas.

Siguiente: confirmar matriz completa, guardar motor como commit local; diseñar persistencia aditiva con calendario/grafo pendiente sin jugadores ficticios, conservando identidad/roster/permisos existentes. Integrar creación, resultados y avance protegido por concurrencia, y vistas adaptadas antes de cerrar T05.

Matriz ampliada confirmada: 194 tests/4 archivos PASS (130 tradicionales), incluidos todos los tamaños/grupos/clasificados mixtos viables. ESLint/diff correctos; typecheck PASS confirmado. Guardar motor y continuar T05 por persistencia, sin anunciar todavía tradicionales disponibles.

## T05 checkpoint — persistencia tradicional local

- Motor guardado en `c5bbc961`. Nueva migración CLI `20261024082119_traditional_tournament_state.sql`, solo local: misma identidad/roster/origen/cuentas/invitaciones, estado tradicional con cuadro, resultados identificados, calendario parcial o completo, órdenes explícitos de empate y revisión para concurrencia. RLS y ejecución exclusiva de servicio; ningún acceso nuevo público/autenticado.
- Creación reutiliza validación atómica de cuentas/nombres/origen/parejas, retirando dentro de la transacción las filas temporales de planificación rápida sin crear partidos falsos. Fuentes pendientes y byes quedan en el cuadro, no como participantes inventados.
- RPC tradicional verifica creador/suspensión/estado/revisión; solo un resultado por operación, sin borrar resultados ni alterar participantes disputados. Revalida ganadores/perdedores/clasificación, empate eliminatorio, fuentes previas, parejas y conflictos/dependencias de calendario. Fin exige todos los resultados obligatorios; funciones legacy no pueden cambiar su estado.
- PostgreSQL aislado PASS con 14 migraciones: creación/inicio/resultados/final de los tres formatos, tercer puesto/consolación, corrección incompatible rechazada, clasificación/tie orders, revisión obsoleta, aislamiento de rol/creador, rollback, byes y grupo de 24 jugadores/66 partidos. Se corrigió un alias ambiguo text/uuid y se parentetizaron CASE dentro de IF antes de repetir; sin modificar migraciones previas ni bases remotas.
- Motor añade validación deportiva: con cuatro parejas no permite simultáneamente tercer puesto y consolación, pues duplicarían el mismo enfrentamiento. 194 pruebas focalizadas PASS. Había un warning nuevo de variable no usada en harness; retirado, repetir lint/gates antes del commit.
- T05 abierto: falta conectar API común, creación, calendario/clasificaciones/seguimiento y E2E. No activar el selector tradicional hasta integrar y validar.

Siguiente: guardar persistencia tras lint/migraciones/diff; añadir adaptador servidor de estado y comandos tradicionales (resultado/sorteo/calendario/empate/inicio/fin con revisión), reutilizando autenticación/rutas/permisos actuales. Después integrar formulario y vistas, validar móvil y cerrar T05 solo con recorrido completo.

## T05 checkpoint — API común tradicional

- Persistencia guardada en `3351609b`. POST `/api/tournaments` acepta los tres formatos tradicionales, exige parejas fijas y reutiliza toda la validación canónica de origen/cuentas/copia/roster. Genera cuadro y planificación automática o manual mediante los motores, sin aceptar un grafo arbitrario del cliente.
- GET existente añade estado tradicional cuando corresponda; lectura decodifica JSONB y reconstruye el cuadro canónico. PATCH `/api/tournaments/[id]/traditional` valida creador, revisión y comandos de sorteo/inicio/resultados/calendario/desempate/final. SQL repite permisos/estado/revisión; corrección incompatible, final pendiente, empates eliminatorios, datos malformados y estado finalizado se rechazan.
- Reinicio rápido para pruebas no se anuncia en tradicionales mientras no tenga implementación propia. Creación tradicional todavía NO activada en formulario; falta presentar las vistas nuevas y E2E antes de ofrecerla.
- 211 tests/5 archivos PASS (motores, JSONB, servidor, API clásica y nueva), tipos y lint focalizado PASS, inventario API 112 rutas/157 métodos y fuente 136439/136450 PASS; el presupuesto anterior cubre el adaptador sin ampliación adicional, sin nuevos clientes/dependencias. Validate completo en curso: `.quality-artifacts/tournaments-t05-backend-validate.log`, terminal 32499; no cerrar ni comprometer gates antes de confirmar.

Siguiente: confirmar validate y guardar API. Integrar tradicionales en el formulario común y las cinco rutas actuales con editor de resultado compartido, orden manual/semillas, tabla de grupos/cuadro, edición de calendario y mensajes de empate claros. Añadir traducciones y E2E de los tres recorridos, sin alterar rápidos/ligas.

Validate backend confirmado PASS: 276 archivos/1398 tests, TypeScript, lint 0 errores/cinco avisos preexistentes, build/presupuestos correctos (1227165 bytes gzip/103 chunks). Añadidas tres pruebas de mapeo de lectura/privacidad: 84 pruebas de adaptador/servidor/API PASS tras mockear autenticación en el nuevo test para no cargar NextAuth real en Vitest. E2E de regresión rápida móvil en curso, terminal 48043, log `.quality-artifacts/tournaments-t05-backend-e2e.log`. No dar por verificados UI/E2E tradicionales todavía.

Checkpoint API validado: E2E móvil 9/9 PASS, Americana/Mexicano fijos y rotativos, claro/oscuro, copia/origen/24 jugadores/directo y resultados. Último typecheck (incluye nuevos tests de mapeo) PASS. Auto-Resume habilitado, watcher activo y cero recuperaciones pendientes. Guardar API como commit local y continuar con presentación/creación tradicional; no repetir motores/persistencia y no cerrar T05 con backend solamente.

## T05 checkpoint — editor visual compartido

- API guardada en `87223fd0`. `TournamentMatchResult.tsx` extrae la tarjeta/editor que ya utilizaba la página rápida, conservando estilos, pares, inputs/validaciones, endpoint PUT y comportamiento. Añade solo título contextual y callback opcional para resultados tradicionales, sin duplicar formulario ni consultas.
- Seis pruebas de interacción nuevas PASS: guardado legacy, callback tradicional/conflicto visible, rechazo de campos vacíos/0–0, borrador/finalizado/participante de solo lectura. Junto al adaptador JSONB: 15 tests PASS. Lint, i18n y fuente 136453/136500 PASS; presupuesto +50 por interfaz compartida (14 líneas netas), sin nuevo cliente/directiva ni dependencias.
- Revisión React focalizada: hooks incondicionales, datos por props, callback controlado, sin waterfall ni estado global nuevo, etiquetas/teclado conservados. Tipos en curso terminal 1560; E2E fijo móvil claro/oscuro en curso terminal 4979, log `.quality-artifacts/tournaments-t05-shared-editor-e2e.log`. Confirmar ambos antes de commit o cambiar páginas.
- T05 sigue abierto; formulario y vistas tradicionales aún no activados. Siguiente: presentar datos tradicionales con este editor y el tema/nav actuales, terminar configuración/orden manual/calendario y E2E antes de habilitar creación.

Editor compartido validado: último typecheck PASS, E2E fijo móvil 4/4 PASS (Americana/Mexicano, claro/oscuro, creación/resultados/ranking/copia y Axe). Log confirmado. Guardar commit y continuar presentación tradicional; ningún gate pendiente del checkpoint, sin declarar T05 completo.

## T05 integración visual en curso — 24/10

- Formulario común ya conecta tres formatos tradicionales: parejas existentes, fuente/cuentas, grupos/clasificados, tercer puesto/consolación, semillas/orden manual, reparto manual de grupos, horarios automáticos o pendientes, tiempos estimados y preview. Controles de selección/numéricos reutilizados de rápidos; copia tradicional conserva configuración/parejas sin resultados.
- Rutas existentes adaptadas mediante `TraditionalTournamentPage`: inicio, cuadro/calendario, grupos y avance, consulta de jugador y seguimiento por resultados; editor de marcador compartido, campeón solo al finalizar. Calendario editable con bloqueos de partidos disputados y validación de dependencias/solapamientos; desempate explícito entre parejas empatadas, manteniendo sus estadísticas.
- Ajustes tradicional enlaza calendario/ranking y no ofrece temporizador rápido ni cierre legacy incompatible. Invitaciones, borrado terminado, navbar y tema siguen compartidos; no se modifica la navegación global.
- Lint inicial detectó memoización de fecha mutable: corregido usando date/time primitivos dentro del memo. Lint e i18n PASS tras traducciones es/en/eu; fuente 136900/137150, presupuesto +650 por presentaciones/controles y traducciones. Sin nuevos clientes/directivas ni dependencias. Tipos en curso, terminal 49860.
- Próximo inmediato: pruebas unitarias de setup/copia/edición y E2E sintéticos de crear→revisar→iniciar→resultados→final de los tres formatos (móvil/escritorio claro/oscuro), manual/grupos/semillas/byes/corrección y permisos; validar SQL y gates completos antes de declarar listo para pruebas. T05 sigue EN CURSO.

## T05 checkpoint final — interfaz y persistencia verificadas

- Matriz de navegador final PASS **44/44**: tres tradicionales claro/oscuro y rápidos fijos/rotativos, móvil/escritorio. Incluye crear→sortear→iniciar→resultados→campeón→recargar→duplicar, manual/grupos/semillas/byes, calendario entre semanas, empates y correcciones protegidas, participante sin controles administrativos, Axe y móvil de 320 px en inglés/euskera. Log `.quality-artifacts/tournaments-t05-final-e2e-retry.log`.
- PostgreSQL local PASS con **14 migraciones**, permisos/revisiones/rollback y recorridos usando los motores reales de la aplicación→SQL→lectura canónica→resultados→fin. Log `.quality-artifacts/tournaments-t05-canonical-sql.log`. No sustituye el gate completo Supabase/pgTAP/restore de T09 ni las pruebas OAuth/PWA físicas.
- Regresión inicial detectó referencias aria-describedby retiradas en el formulario rápido: restauradas; solo se actualizó la expectativa intencional de que Tradicional ya está disponible. Repetición 44/44 correcta. Inicio bloqueado mientras haya cambios de sorteo sin aplicar. Calendario disputado bloqueado también en servidor, además de SQL.
- Revisión visual móvil 393 px realizada, capturas conservadas en `.quality-artifacts/t05-mobile-*.png`. Sin dependencias nuevas ni datos remotos. Auto-Resume habilitado y watcher activo; la recuperación actual está en ejecución.
- Pendiente inmediato: confirmar `npm run validate` (terminal 13524, log `.quality-artifacts/tournaments-t05-final-validate-retry.log`), luego regresiones focalizadas de ligas/amistosos/hub. No ejecutar Playwright mientras lint recorre test-results: un primer intento coincidió con la limpieza de artefactos y falló por ENOENT; se repite secuencialmente. Cerrar T05 solo tras estos gates y guardar commits locales.

### Prueba manual del hito T05

1. Con las migraciones de la rama aplicadas en un entorno de pruebas autorizado, abrir `/tournaments/new`, elegir **Torneo tradicional** y eliminación, grupos o grupos y eliminatorias. Introducir parejas completas (4–24 jugadores, cantidad par); elegir origen de liga/cuentas/manual como en rápidos.
2. Configurar grupos/clasificados cuando corresponda, tercer puesto o consolación si son viables, semillas/sorteo manual y calendario automático o manual. Comprobar preview y crear; revisar calendario, volver a sortear opcionalmente e iniciar.
3. Registrar resultados desde Seguimiento o Calendario. En grupos con igualdad que impida resolver un cruce, confirmar el orden explícito de las parejas empatadas en Ranking. Completar todos los encuentros obligatorios y finalizar; comprobar campeón/ganadores de grupo y recargar.
4. Comprobar Jugador y su pareja, Ajustes sin navbar, duplicación como borrador nuevo sin marcadores y eliminación de un torneo terminado. Verificar también un rápido, una liga y un amistoso existentes.

**PRE no modificado.** Para una prueba real desde PWA faltan autorización remota, aplicación de las migraciones nuevas en orden y publicación verificada. Migraciones pendientes de este objetivo: `20261024003812_configurable_rapid_tournaments.sql`, `20261024011921_fixed_pair_rapid_tournaments.sql`, `20261024053002_rapid_tournament_break_schedule.sql` y `20261024082119_traditional_tournament_state.sql`. Comprobar primero el historial real de PRE, sin reaplicar ni modificar migraciones ya aplicadas. OAuth/PWA/audio físicos permanecen gates manuales.

No confundir T05 con el objetivo integral: reglas deportivas adicionales, permisos delegados/espectadores, incidencias e historial son T06; integración global/social T07; economía T08; cierre integral T09. Ninguna se anuncia como completada.

Gates finales T05: `npm run validate` confirmado **PASS**, salida 0: **279 archivos / 1411 pruebas**, TypeScript/build/i18n/presupuestos correctos; lint 0 errores y cinco avisos previos. Build 1242275 bytes gzip/103 chunks. Regresiones focalizadas de liga/amistosos/hub en ejecución: terminal 97540, log `.quality-artifacts/tournaments-t05-league-regressions.log`. Confirmar antes de marcar completo o guardar el cierre. No repetir la matriz de torneos ya correcta si no hay nuevos cambios funcionales.

## T05 COMPLETO LOCAL — listo para pruebas del hito

Regresiones finales confirmadas **9/9 PASS, salida 0**: programación/resultados de liga claro/oscuro, calendario, reservas de amistosos, Mis Partidos, hub y rutas sin liga/espectador. Validate 1411 pruebas, matriz de torneos 44/44, SQL de 14 migraciones y revisión visual correctos. No queda un gate local fallido del hito. Harness canónico guardado en `15270e02`; interfaz, traducciones, copia y pruebas en `f62e782d`. Documentación de cierre en commit separado. Sin cambios funcionales posteriores a los gates.

Primer hito incompleto **T06**. Siguiente desarrollo del objetivo integral: ampliar reglas/puntuación y gestión con migraciones aditivas e historial, conservando estos motores y recorridos. La petición más reciente es dejar tradicionales listos para probar: entrega verificable de T05, sin afirmar completo T06–T09. Para PWA real en PRE se requiere autorización explícita de publicación y migraciones, según el GOAL/AGENTS; no ejecutar operaciones remotas por inferencia. Guía manual y migraciones arriba.

## Supabase PRE actualizado — pruebas desde local (24/10/2026)

**Nueva autorización del usuario:** «En PRE supabase puedes hacer migraciones y modificaciones, en pre código aún no, de momento vamos a testear en local». Sustituye la espera anterior solo para la base PRE. No publicar código ni ejecutar push/merge/despliegue; no tocar Producción.

- Verificado proyecto activo `smash-lob-staging`, ref `miadjotkucgluwbrgeih`, coincidente con enlace CLI y host Supabase de `.env.local`. Historial/schema inspeccionados antes de mutar. Se reutiliza CLI **2.121.0** ya almacenada, sin instalar/actualizar dependencias.
- Dry-run previo incluye exactamente las cuatro migraciones listadas arriba. `db push --linked --project-ref miadjotkucgluwbrgeih --skip-vault --yes` aplica las cuatro, salida 0; sin semillas/roles/vault. Historial SQL posterior confirma las versiones originales y nuevo dry-run informa **upToDate=true**, cero pendientes.
- Integridad previa/posterior: **5 torneos, 56 participantes, 30 rondas y 60 partidos** conservan el mismo checksum de todos sus campos previos. Nuevos campos usan defaults de compatibilidad; no se han creado participantes/torneos de prueba ni alterado marcadores.
- Tabla tradicional con RLS y sin permisos anon/authenticated; servicio autorizado. Seis RPC nuevas verificadas invoker, search_path fijo, ejecución exclusiva servicio. Advisor: ningún WARN/ERROR, solo INFO por RLS sin políticas (44 previas, 45 tras añadir tabla privada); modelo deliberado con acceso solo servidor.
- Probe REST desde configuración local, sin solicitar filas personales: configuración/parejas/estado tradicional **HTTP 200**, acceso anónimo tradicional **HTTP 401**. Servidor local `/api/health` **HTTP 200**. No se automatizó OAuth ni se usaron cuentas personales.
- Evidencia ignorada: `.quality-artifacts/tournaments-pre-migrations-{dry-run,push,verified}.log` y `tournaments-pre-schema-probe.log`. Los gates de código anteriores siguen vigentes; ningún cambio funcional en esta operación.

**Listo para probar en local:** abrir `http://localhost:3000/tournaments/new` con la sesión habitual y seguir la guía T05 anterior. Persistencia en Supabase PRE actualizada; código publicado en PRE sin cambios. Primer hito incompleto T06, no iniciado en esta operación.

## T05b — ampliación a 32 jugadores en curso

Solicitud posterior del usuario: ampliar todas las modalidades y ligas a **32 jugadores totales**, equivalentes a **16 parejas** en fijas/tradicionales. Se antepone este hito acotado a T06. Mantener código local y autorización vigente solo de Supabase PRE; no publicar código ni tocar Producción.

Límites auditados: torneos usan 24 slots de un carácter, fijas/tradicionales 12 parejas; ligas tienen starters explícitos hasta 24 y restricciones 8–24 en aplicación (BBDD histórica hasta32). No basta con cambiar selectores: añadir/verificar starters 25–32, revisar duración extendida y mapear nuevos slots sin romper los existentes. Siguiente: motores/plantillas y tests, integración formulario/servidor, nueva migración por CLI, validación local completa antes de aplicar en PRE. Árbol limpio de partida en b1ed9acb.

Checkpoint T05b: límites/UI/API/motores ampliados; slots A–X existentes intactos, alfabeto de 32 caracteres `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef`, correspondencia SQL/UI explícita y lectura ordenada independientemente de collation. Nueva migración CLI `20261024180317_competition_capacity_32.sql` (aún NO aplicada): 32 participantes/16 parejas, grupos hasta8 y grafo tradicional hasta120 partidos, funciones comunes reemplazadas conservando permisos. Ninguna migración aplicada editada.

Ligas: starters explícitos nuevos 25–32 y pruebas completas; 28/29/32 basados en la fuente primaria https://www.durangobill.com/BridgeCyclicSolutions.html, comprobados por los invariantes propios. Starters restantes buscados fuera del runtime y verificados. Vueltas completas máximas nuevas verificadas: 25→6,26→7,27→5,28→6,29→5,30→6,31→6,32→6; búsqueda de remixes acotada solo para tamaños nuevos, sin alterar calendarios legacy. Se conservan vuelta/doble/personalizada. Mexicano >24 usa beam32 para evitar bloqueos de cuatro pistas, conservando reparto y sorteos legacy.

430 pruebas focalizadas de dominios/servidor/ligas PASS; 257 pruebas posteriores incluyen límites/120 partidos/Mexicano 25–32 y calendarios personalizados/máximos PASS tras resolver timeout de búsqueda. Primeros fallos de límites de grupos, expectativa de pistas disponibles y timeout de vueltas corregidos y repetidos. SQL aislado de 15 migraciones y 120 resultados tradicionales PASS (`capacity-32-sql-final.log`); el harness usa stdin para no superar el límite de argumentos Windows y deriva el tope de pasos del número real de partidos. Nueva repetición añade Americana rotativa/fija de32, resultados/copia y rechazo33: terminal55928, log `capacity-32-database-verified.log`, pendiente confirmar. Un primer fixture de ocho rondas tenía reserva60 insuficiente: corregido a120, sin relajar validación.

Typecheck y ESLint focalizados PASS (terminales77475/46049 confirmadas salida0); i18n/fuente137022/137150 PASS antes del último texto de ligas. Matriz E2E rápidos/tradicionales ampliada a8/32 jugadores, móvil/escritorio claro/oscuro: en curso terminal12392, log `.quality-artifacts/capacity-32-e2e.log`. Próximo: confirmar E2E y SQL, añadir/verificar selector de liga, validate completo secuencial; solo tras gates correctos aplicar migración PRE y verificar historial/permisos/datos. No cerrar hito ni anunciar disponible antes.

Checkpoint posterior: PostgreSQL **15 migraciones PASS**, terminal55928 salida0 y log `capacity-32-database-verified.log`: añade creación/partidos/resultados/copia con32 rotativos/fijos y rechazo33, además de tradicionales16 parejas/120 resultados. Nuevas pruebas de motores **257/257 PASS**, incluyendo Mexicano25–32 tras acotar búsqueda sin modificar legacy.

Primera matriz64 E2E: **60 PASS,4 fallos de prueba**. Dos esperaban20 minutos fijos del fixture24, cuando32/two courts produce correctamente10–20 (aserción actualizada); dos de Mexicano32 en escritorio leían el historial del mock antes de que terminase la petición de siguiente ronda (añadida espera explícita de persistencia y tarjeta nueva). Ningún fallo se omite: repetición focalizada junto con los ocho fijos32, selector de liga y regresiones de navegación en curso, terminal93799, log `capacity-32-regressions.log` (30 casos móvil/escritorio). Selector de liga32 y resumen32 ya PASS en móvil. Capturas móviles guardadas como `.quality-artifacts/capacity32-mobile-*.png`, ranking revisado.

Corregida lectura completa de ligas largas: máximo verificado32×31/4×6=1488 partidos. `/api/access` usa helper de paginación por1000 con el mismo alcance autorizado y orden estable; error de página posterior rechaza snapshot parcial. Dos pruebas nuevas PASS con1488 filas sintéticas y error parcial. Types PASS tras helper (19459), sin modificar permisos ni ampliar módulos de producto. Próximo: terminar repetición E2E, ejecutar validate completo secuencial y resolver cualquier gate antes de migrar PRE. Ningún cambio remoto T05b aún.

E2E final verificado: repetición de30 casos **28 PASS/2 fallos**; resumen32, selector de liga32 y regresiones de liga/amistosos/hub correctos en ambos dispositivos. Los dos fallos persistentes de Mexicano32 escritorio se diagnosticaron mediante trace/screenshot: auto-scroll mínimo dejaba el botón en el límite superior de navbar fija y no enviaba POST. Se centra el control mediante scroll nativo y se comprueba que todo el botón queda por encima de navbar antes del clic (sin force/dispatch). Espera de siguiente ronda conservada. Repetición exclusiva Mexicano32 claro/oscuro móvil/escritorio **4/4 PASS**, salida0, log `capacity-32-mexicano-final-e2e.log`. Así quedan verificados los64 casos originales y los20 de selector/regresión adicionales, mediante matriz inicial y repeticiones focalizadas; no presentar el log inicial como64/64.

`npm run validate` completo final en curso, terminal51947, log `.quality-artifacts/capacity-32-validate.log`. Confirmar salida0 antes de cerrar T05b/aplicar PRE/commits. No hay cambios funcionales pendientes de prueba específica; restan gates generales y verificación remota autorizada, sin despliegue de código.

## T05b COMPLETO — código local y Supabase PRE listos

Validate final **PASS, salida0**: **281 archivos/1570 pruebas**, tipos/lint/build/i18n/fuente/presupuestos correctos, cinco avisos previos,1242771 bytes gzip/103 chunks. Gates específicos/E2E/SQL anteriores confirmados y sin fallos pendientes. Ver VALIDATION para distinguir matriz inicial y repeticiones.

Migración `20261024180317_competition_capacity_32.sql` aplicada solo a `smash-lob-staging`/`miadjotkucgluwbrgeih` mediante CLI existente y autorización vigente. Historial y restricciones32 participantes/16 parejas/grafo120 verificados; dry-run posterior sin pendientes. Cuatro RPC/trigger conservan invoker/search_path fijo/ejecución exclusiva servicio. Checksums de5 torneos/56 participantes/30 rondas/60 partidos idénticos; ningún dato previo alterado. Advisor sin WARN/ERROR;45INFO previas. ProbeRESTlimit0 HTTP200/anónimo401 y healthlocal200. No se crearon torneos/participantes sintéticos enPRE.

Listo para prueba manual en local: ligas de **8–32 jugadores por temporada**; rápidos de **4–32 participantes**, en cantidades pares cuando las parejas son fijas; tradicionales de **4–32 jugadores, equivalentes a 2–16 parejas**. Importación/copia/manual y modalidades conservadas. Recargar `http://localhost:3000/tournaments/new` o crear temporada desde administración. Código PRE, Producción y rama remota sin cambios. Commits locales por dominio: ligas `e3e3fa75`, torneos/migración `893fce39`, comprobaciones SQL `476d5b88`; documentación en commit separado. Ningún cambio funcional posterior a los gates. Primer hito incompleto vuelve a **T06**; no iniciar otro desarrollo durante esta entrega para pruebas ni declarar terminado el objetivo integral.

## T05c — ligas por parejas solicitado

Nuevo primer hito incompleto por petición expresa, anterior a T06. Liga elige modalidad Individual de Smash & Lob o parejas fijas; hasta32 personas/16 parejas. Parejas por temporada, calendario round-robin y modos simple/doble/extendida/personalizada. Reutilizar identidad, resultados, invitaciones y pagos. Verificar sustituciones, sorteos y clasificación sin alterar temporadas existentes. Código solo local; migración aditiva antes de PRE autorizado tras gates. Implementación en curso, no disponible todavía.

T05c checkpoint: modalidad inmutable al crear liga, parejas por temporada persistidas con pair_number y herencia en sustituciones; calendarios round-robin 2–16 parejas, simple/doble/extendida/personalizada, clasificación conjunta sin duplicar puntos y perfiles individuales conservados. API/duplicación/sorteo/origen y UI integrados. 30 pruebas nuevas de motor/API y seis de regresión PASS; PostgreSQL aislado de nueva migración PASS (RLS/roles reales, resultados/correcciones y sustitución). Primer E2E detectó reinicialización del fixture de temporada en cada navegación; corregido seed a una sola vez por sesión, repetición12 casos en curso37360. Tipos PASS; lint sin errores/cinco avisos previos, i18n/fuente PASS antes de últimas dos traducciones. Presupuesto +400 líneas para módulos puros/presentación y +5 techo de MatchDataProvider, sin dependencias ni nuevos clientes. No cerrar ni aplicar PRE antes de validar recorrido/gates completos.

T05c validación: E2E20/20 PASS móvil/escritorio, parejas simple/doble/personalizada, alta de liga y regresiones de partido/selector32, Axe sin violaciones graves. Validate general:1600/1601 PASS, fallo de coherencia en tres botones nuevos sin centrado explícito; corregidos y repetición37 tests PASS. Al revisar captura se detectó que el seed de tema se perdía al navegar: corregido fixture y añadida aserción real dark antes de capturar; repetir E2E. No cerrar ni migrar PRE hasta validate completo correcto.

T05c cierre en verificación: validate general PASS1601 tests/283 archivos, tipos/lint/build/presupuesto1248616bytes gzip/103chunks. Dos casos adicionales incorporan clasificación con dos suplentes temporales y nombres de pareja retirada, 37 pruebas focalizadas PASS; nueva repetición completa en curso50592 sustituida por terminal actual (ver pair-leagues-validate-verified.log). PostgreSQL real aislado PASS con resultados/correcciones, sustituciones permanentes y temporales, rechazo de equipos inválidos y escrituras sin permiso. E2E40 en curso96052, ligas/calendario manual/oscuro real ya correctos, último rápido de escritorio pendiente. No migración remota todavía; dry-run PRE solo20261024195529_fixed_pair_leagues.sql.

## T05c COMPLETO — listo para pruebas locales (25/10/2026)

Modalidad al crear liga: «Individual de Smash & Lob» o «Por parejas fijas». Parejas por temporada2–16equipos/4–32personas; simple/doble/hasta6vueltas/personalizada/manual, descansos con número impar, resorteo sin cambiar compañeros, duplicación y clasificación conjunta. Home/Ranking/estadísticas de temporada/espectadores e invitaciones conservan contexto y metadatos; perfiles e histórico agregado siguen individuales. Resultados contados una sola vez por equipo; historial conserva identidad en reemplazos/suplentes y nombres de una pareja retirada. Ligas previas intactas e individuales. No hay autoinscripción abierta en el modo nuevo: la organización define parejas y cada persona reclama su perfil con las invitaciones existentes.

Gates confirmados: validate PASS283archivos/1603pruebas, tipos/lint/build/presupuestos, cinco warnings previos;44 pruebas focalizadas posteriores de metadatos públicos/invitaciones PASS y lint final selectivo PASS; i18n/fuente final137479/137550 PASS. E2E40/40 PASS con móvil/escritorio/tema oscuro real/manual/Axe/regresiones rápidas y tradicionales. PostgreSQL aislado PASS con roles reales, resultados/correcciones, reemplazos/suplentes y rechazos. Todos los fallos anteriores corregidos; evidencia y comandos en VALIDATION.

Aplicada y verificada solo la migración nueva20261024195529_fixed_pair_leagues.sql en smash-lob-staging/miadjotkucgluwbrgeih, con autorización PRE vigente. Historial, columnas/defaults/restricciones y cuatro funciones invoker/search_path fijo/servicio verificados. Dry-run posterior sin pendientes, advisor sin WARN/ERROR, RESTlimit0 HTTP200 y healthlocal200. Checksums de8ligas/16temporadas/142participantes/328partidos/5torneos idénticos antes/después; las8ligas siguen individuales y ninguna temporada previa tiene pair_number. Sin fixtures/datos personales de prueba enPRE, push, merge, despliegue ni Producción. Commit funcional local47320b27.

Para probar: recargar local, Mis ligas→Crear liga→Por parejas fijas y preparar una temporada. Ver pasos en VALIDATION. Primer hito pendiente vuelve aT06; esta entrega cierra únicamente la modalidad de ligas solicitada, no el objetivo integral de torneos. No comenzar otro dominio durante la entrega para pruebas.
