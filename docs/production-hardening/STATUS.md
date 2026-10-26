MC40 completada localmente: texto de posición cambiada y símbolo rojo abren la misma explicación que el icono de cabecera mediante MatchSideHelp compartido; preserva metadatos, accesibilidad, teclado, Escape y propagación controlada. Flecha sustituida por SVG de 12 px, centrada con inline-flex para evitar el desplazamiento de la fuente. Ocho pruebas de interacción, TypeScript, ESLint y control de Mis partidos correctos; cuatro pruebas Playwright a 360×800 claro/oscuro, pulsación de posición y ayuda de cabecera, sin incidencias graves/críticas de Axe. Captura móvil con ayuda cerrada revisada para confirmar alineación. Sin DB, commits ni publicación.

MC40: texto rojo y flecha reutilizan MatchSideHelp/StatusHelp para tocar, pulsar Enter/Espacio y cerrar con Escape, sin navegar al perfil. Sustituido el glifo por SVG de 12 px centrado mediante inline-flex, conservando rojo. Ocho pruebas de interacción, tipos, lint y controles de Mis partidos correctos. Primera prueba de navegador apuntaba al span interior; adaptada para comprobar el control accesible que ahora contiene la etiqueta. Cuatro casos posteriores correctos; se añaden capturas con ayuda cerrada para revisar la alineación solicitada.

## MC41 — Alineación del indicador de posición recomendada
- Status: DONE locally (2026-10-23; ocho pruebas, TypeScript y ESLint correctos)
- Objective: alinear verticalmente el texto rojo y el icono ↔ con el resto de metadatos del jugador, manteniendo el indicador completamente clickable y su ayuda contextual.
- Validation: `npx vitest run tests/unit/matchSideRecommendationsPanel.test.tsx tests/unit/matchDetailPairingPanel.test.ts tests/unit/v1814MatchDetailPlayerMetadataLayout.test.ts` (8/8), `npm run typecheck` y ESLint focalizado. Sin cambios de datos, navegación ni operaciones remotas.

## MC42 — Ajuste fino del icono de posición
- Status: DONE locally (2026-10-23; ocho pruebas focalizadas y ESLint correctos)
- Objective: bajar ligeramente el SVG ↔ para que quede centrado con la línea de texto rojo, sin mover el texto ni cambiar la interacción.
- Validation: las tres suites unitarias de emparejamiento (8/8) y ESLint focalizado. Sin cambios de datos, navegación ni operaciones remotas.

## MC43 — Corrección del desplazamiento vertical del icono
- Status: DONE locally (2026-10-23; ESLint focalizado correcto)
- Objective: aplicar explícitamente el desplazamiento de 2 px hacia abajo al SVG ↔, ya que la utilidad anterior no se generaba.
- Validation: ESLint focalizado. Sin cambios de datos, navegación ni operaciones remotas.

## MC44 — Microajuste final del icono ↔
- Status: DONE locally (2026-10-23)
- Objective: bajar 1 px adicional el icono para rematar su alineación visual con el texto rojo.
- Validation: ajuste localizado, sin cambios funcionales ni remotos.

## MC45 — Selector de aplicaciones para Cómo llegar
- Status: DONE locally (2026-10-24; TypeScript, i18n, ESLint y flujo móvil correctos)
- Objective: sustituir los accesos directos a Google Maps por un selector común con Google Maps, Apple Maps, Waze y copiar ubicación.
- Validation: `npm run typecheck`, `npm run i18n:check`, ESLint focalizado, `git diff --check` y 2 pruebas Playwright móviles (claro/oscuro). Aplicado en programación de partidos, lugares de liga y comprobación de ubicación manual. Sin base de datos, dependencias ni operaciones remotas.

## MC46 — Modal centrado de navegación
- Status: DONE locally (2026-10-24; ESLint y diff check correctos)
- Objective: presentar el selector de aplicaciones centrado en pantalla, con la misma lectura visual del popup de calendario, en lugar de anclado al borde inferior.
- Validation: ajuste localizado de presentación; ESLint focalizado y `git diff --check`. Sin cambios funcionales, datos ni operaciones remotas.

## MC47 — Estilos compartidos con Añadir al calendario
- Status: DONE locally (2026-10-24; TypeScript y ESLint focalizados correctos)
- Objective: igualar los botones del selector de navegación a los del popup de calendario, eliminando bordes redundantes y añadiendo el tratamiento de modo oscuro.
- Validation: `npm run typecheck` y ESLint focalizado. Sin cambios de comportamiento, datos ni operaciones remotas.

## MC48 — Icono de copiar y chevrons unificados
- Status: DONE locally (2026-10-24; TypeScript y ESLint focalizados correctos)
- Objective: añadir chevrons a las opciones del calendario y sustituir el icono cuadrado de copiar por una versión SVG más suave y redondeada.
- Validation: `npm run typecheck` y ESLint focalizado. Sin cambios de datos ni operaciones remotas.

## MC49 — Cierre unificado de popups
- Status: DONE locally (2026-10-24; TypeScript y ESLint focalizados correctos)
- Objective: igualar «Cómo llegar» a «Añadir al calendario» usando «Cancelar» en la parte inferior y eliminando la X superior.
- Validation: `npm run typecheck` y ESLint focalizado, con la prueba móvil actualizada. Se conserva cierre por fondo y Escape.

## MC50 — Confirmación al copiar ubicación
- Status: DONE locally (2026-10-24)
- Objective: reutilizar `ActionFeedbackCenter` para mostrar el aviso verde inferior al copiar correctamente una ubicación.
- Validation: integración localizada con el sistema global de feedback; sin cambios de datos ni operaciones remotas.

## MC51 — Cierre del selector tras una acción
- Status: DONE locally (2026-10-24; TypeScript y ESLint focalizados correctos)
- Objective: cerrar «Cómo llegar» al elegir Google Maps, Apple Maps, Waze o copiar la ubicación, igual que «Añadir al calendario».
- Validation: `npm run typecheck` y ESLint focalizado. Se conserva el aviso verde de copia y el cierre por Cancelar, fondo o Escape.

## MC40 — Ayuda al pulsar la posición cambiada
- Status: DONE locally (2026-10-23; ocho pruebas de interacción, tipos, lint y cuatro casos de navegador correctos)
- Objective: texto rojo y símbolo de cambio abren la misma ayuda que el icono de Jornada, con teclado y sin navegar al perfil. Centrar el símbolo equivalente mediante SVG, por nueva indicación del usuario.
- Validation: pruebas de interacción, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

MC39 completada localmente: estado en la primera fila de Jornada, arriba a la derecha; información en la fila del contexto, debajo y alineada al extremo inferior derecho. Se mantienen texto de temporada, acciones, popup y visibilidad contextual; sin posiciones absolutas que se solapen con el contenido. Ocho pruebas, TypeScript y ESLint correctos; cuatro casos Playwright a 360×800 claro/oscuro con ayuda, Escape y resultado final correctos. Captura móvil revisada, popup dentro de pantalla y Axe sin incidencias graves/críticas. Sin DB, commits ni publicación.

## MC39 — Ayuda en el extremo inferior de Jornada
- Status: DONE locally (2026-10-23; ocho pruebas, tipos, lint y cuatro casos de navegador correctos)
- Objective: estado arriba a la derecha y ayuda debajo, alineada al borde inferior del contenido de la cabecera.
- Validation: pruebas existentes, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

MC38 completada localmente: icono de ayuda de posiciones junto a la etiqueta de estado en la tarjeta de Jornada; retirado del espacio entre parejas. MatchSideHelp reutiliza el mismo contenido y StatusHelp, con visibilidad solo cuando existen recomendaciones pendientes y sin resultado, conservando las acciones de cabecera. Ocho pruebas existentes, TypeScript y ESLint correctos; cuatro casos Playwright en viewport 360×800 claro/oscuro, popup dentro de pantalla, Escape y ausencia tras resultado correctos. Captura móvil revisada y Axe sin incidencias graves/críticas. Sin DB, commits ni publicación.

## MC38 — Ayuda de posiciones junto al estado
- Status: DONE locally (2026-10-23; ocho pruebas, tipos, lint y cuatro casos de navegador correctos)
- Objective: mover el icono desde el VS a la cabecera de Jornada, manteniendo ayuda y visibilidad contextual.
- Validation: pruebas de ayuda/posiciones, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

MC37 completada localmente como prueba visual: pendientes sin tarjeta/título exterior, parejas con más espacio y nombres de 1,25 rem, VS de 36 px y ayuda discreta debajo del VS. Mantiene nombres adaptativos con mínimo 10 px, preferencias/recomendaciones, enlaces y marcador final previo. Estilo de nombres acotado a .app-match-pairing-standalone. Copia previa local ignorada para facilitar reversión específica. Veinte pruebas, TypeScript, ESLint, tipografía y controles de Mis partidos correctos; ocho casos Playwright a 360×800 claro/oscuro, ayuda y estados de resultado, sin incidencias graves/críticas de Axe. Captura móvil revisada. Sin DB, commits ni publicación; pendiente valoración del usuario para mantener o revertir el diseño.

## MC37 — Prueba de enfrentamiento sin tarjeta exterior
- Status: DONE locally (2026-10-23; veinte pruebas, tipos, lint y ocho casos de navegador correctos; diseño de prueba pendiente de valoración)
- Objective: parejas y VS directamente sobre la pantalla, nombres algo mayores y ayuda discreta; preservar recomendaciones y marcador final.
- Validation: pruebas existentes, tipos, lint y capturas móviles claro/oscuro. Sin operaciones remotas; prueba reversible.

MC36 completada localmente: Emparejamiento adopta SectionHeader con el estilo del resto de paneles y conserva su ayuda. Programación elimina el padding acumulado entre encabezado y contenido; ambos reutilizan el margen compartido de cabecera usado en Pagos, sin modificar estilos globales. Veinte pruebas, TypeScript, ESLint y control tipográfico correctos. Cuatro casos Playwright con build correcto a 360×800 en claro/oscuro; captura móvil revisada y Axe sin incidencias graves/críticas. Sin cambios de datos, permisos, commits ni publicación.

MC36: Emparejamiento reutiliza SectionHeader con ayuda existente. Programación conserva el margen compartido de cabecera y elimina padding inferior/superior acumulado entre título y contenido, también en edición y sin programar. Veinte pruebas existentes, TypeScript, ESLint y control tipográfico correctos; comprobación móvil claro/oscuro en curso.

## MC36 — Cabecera y separación de Emparejamiento/Programación
- Status: DONE locally (2026-10-23; veinte pruebas, tipos, lint, tipografía y cuatro casos de navegador correctos)
- Objective: reutilizar SectionHeader en Emparejamiento y eliminar espacio adicional de Programación, con separación común de Pagos.
- Validation: pruebas existentes, TypeScript, lint, tipografía y comprobación móvil claro/oscuro. Sin operaciones remotas.

MC35 completada localmente: previews de liga, perfiles e historial personal reciben Población · Ubicación · Pista desde getLeagueLocationCompactText compartido. Programación reutiliza el mismo helper; PersonalMatchCard prioriza la ubicación estructurada, con fallback al texto guardado. Se conservan identificadores, resolución legacy, selectores, nombres con guiones y omisión de datos ausentes. 26 pruebas, TypeScript, ESLint y controles de ubicaciones/Mis partidos correctos. Sin DB, commits ni publicación. La propuesta posterior de reforzar la cabecera Emparejamiento queda pendiente de decisión, sin cambios adicionales.

MC35: formateador compartido actualizado y Programación reutilizándolo; tarjetas personales priorizan scheduleLocation estructurado sobre la etiqueta ya formateada. Pasan 26 pruebas y lint focalizado. Controles de ubicaciones/Mis partidos correctos tras adaptar comprobaciones literales antiguas de las etiquetas eliminadas en MC34; no cambios de comportamiento por esos controles. TypeScript en curso.

## MC35 — Ubicación uniforme en previews
- Status: DONE locally (2026-10-23; 26 pruebas, TypeScript, lint y controles de ubicaciones/Mis partidos correctos)
- Objective: Población · Ubicación · Pista mediante el formateador compartido; conservar resolución de catálogo, datos y campos ausentes.
- Validation: pruebas de ubicaciones y tarjetas, TypeScript, lint y controles de ubicaciones. Sin operaciones remotas.

MC34 completada localmente: retiradas las etiquetas Pareja A/B, su fila y el margen residual del emparejamiento. Conserva VS, jugadores, metadatos, recomendaciones y vista de resultado final. Eliminado únicamente el helper de presentación sin uso y adaptadas las expectativas visuales antiguas. Nueve pruebas existentes, tipos y lint focalizado correctos; diff sin errores. Sin datos, navegación, commits ni publicación.

## MC34 — Emparejamiento sin etiquetas redundantes
- Status: DONE locally (2026-10-23; nueve pruebas, TypeScript y ESLint focalizado correctos)
- Objective: retirar Pareja A/B y su fila del panel de emparejamiento; mantener nombres, posiciones, VS y resultados.
- Validation: pruebas existentes del panel, tipos y lint focalizado. Sin operaciones remotas.

## MC33 — COMPLETADA LOCALMENTE (2026-10-23)

Por cobrar comparte cabecera con el título y precede al chevron, con título adaptativo y sin dejar fila vacía debajo. Columna Resultado traducida, más ancha y con cifras de 24 px. Programación usa columnas iguales para mapa/calendario y muestra Población · Ubicación · Pista desde los datos existentes, también al finalizar/aplazar; evita presentar la hora anterior de un partido aplazado como vigente. Mantiene ubicaciones de texto libre cuando no existe población identificable, sin modificar datos ni resolvedor de catálogo.

Validación: 12 pruebas de formulario, TypeScript, lint sin errores (cinco avisos previos), i18n, tipografía, ubicaciones y presupuesto correctos (135207 líneas). Cuatro casos Playwright con build correcto, fixtures a 360×800, claro/oscuro y ambos proyectos; comprueban igualdad de ancho/alto de acciones y alineación vertical de etiqueta/título. Captura móvil revisada y Axe sin incidencias graves/críticas. Sin DB, nuevas dependencias, commits ni publicación.

MC33: ampliado por petición a Población · Ubicación · Pista en programación, sin inventar población para textos libres. Doce pruebas correctas con estados programado, sin fecha, finalizado y aplazado. Primera medida detecta 22 px de diferencia por padding/base flex: acciones pasan a dos columnas iguales de grid. Fixture de navegador ajustada a una ubicación persistida con id para evitar ambigüedad de dos clubes con igual nombre; se conserva el resolvedor seguro existente. Repetición en curso.

MC33: cambios de presentación aplicados, ocho pruebas de formulario correctas. Cabecera de pagos permite título adaptativo para mantener Por cobrar antes del chevron; Resultado aumenta a 24 px con título traducido y columna dedicada; acciones de Programación comparten base flex de cero para igualar ancho. Validación de tipos, lint, traducciones y geometría móvil en curso.

## MC33 — Alineación y jerarquía de paneles de Partido
- Status: IN PROGRESS (2026-10-23)
- Objective: Por cobrar en cabecera antes del chevron, Resultado destacado y botones de programación iguales. Incluir Población · Ubicación y pista, también en estados finalizado y aplazado.
- Validation: formularios, tipos, lint, i18n y navegador móvil claro/oscuro; sin operaciones remotas.

## MC32 — COMPLETADA LOCALMENTE (2026-10-23)

Programación elimina active:bg-neutral-50 de su cabecera, distingue fecha/ubicación y usa iconos de mapa/calendario con acciones compactas. Botones compartidos de 36 px, fuente 12 px, contorno secundario y acción destructiva diferenciada. Pagos presenta pista antes que bolas, importes y transferencias legibles y acciones separadas; reserva cargada reinicia la instancia por partido/estado para evitar un formulario vacío. Resultado reutiliza dos filas de parejas con nombres adaptativos (mínimo 10 px), inputs de sets y puntos calculados, manteniendo validación, avance y permisos. Guía de estilos actualizada.

Validación final sin concurrencia: npm run validate completo correcto, 1092 pruebas / 264 archivos, TypeScript, lint sin errores (cinco avisos previos), i18n y build dentro de presupuesto (1216588 bytes gzip, 104 chunks). Cuatro pruebas Playwright correctas con fixtures a 360×800 en claro/oscuro, estados previo/programado/pendiente/finalizado, pagos y expansión; capturas revisadas y Axe sin incidencias graves/críticas. Health y detalle locales HTTP 200 tras build. Sin DB, dependencias, commits ni publicación; PRE permanece intacto.

MC32: cuatro pruebas de navegador correctas tras identificar la instancia de pagos por partido/reserva; capturas de 360×800 revisadas en claro y oscuro, sin desbordamientos y Axe sin incidencias graves/críticas. Validate inicial: 1091/1092 correctas; única incidencia, timeout de 5000 ms en generación exhaustiva de torneos (5439 ms) durante compilación concurrente. Reejecución aislada pasa las ocho pruebas (2,81 s). Repetición completa sin compilaciones simultáneas en curso; no se modifica lógica ni timeout de torneos.

Diagnóstico MC32: una prueba móvil detecta estado local de pagos inicializado antes de hidratar una reserva guardada. La instancia se identifica por partido/reserva para reiniciar los campos al cambiar entre sin reserva y reserva, manteniendo borradores durante edición normal. Se repite navegador; publicación detenida hasta pasar gates.

## MC32 — Claridad visual de Programación, Pagos y Resultado
- Status: IN PROGRESS (2026-10-23); formulario con filas de parejas, ubicación destacada, acciones compactas con borde y pista antes que bolas. Ocho pruebas de flujo correctas. Gate tipográfico detectó dos tamaños fijos nuevos: sustituidos por type-caption existente antes de continuar; validación completa y navegador en curso.
- Objective: corregir pulsación clara, destacar ubicación, compactar acciones y alinear parejas con inputs. Sin cambios de permisos ni operaciones remotas.
- Validation: formularios, tipos, lint, build y navegador móvil claro/oscuro con fixtures.

## MC31 — pulido de Partido (2026-10-23)

COMPLETADA LOCALMENTE. Aplicadas exclusivamente propuestas 1/2/4/8/12/13/14/15. validate completo correcto: 1092 pruebas en 264 archivos, TypeScript, lint sin errores (cinco avisos previos), i18n y build dentro de presupuesto (1216245 bytes gzip, 104 chunks). Cuatro casos Playwright verifican las vistas sin programar, programada con entrada anticipada, pendiente de resultado y resultado guardado/corrección en 360×800, claro/oscuro y ambos proyectos; capturas móviles revisadas y Axe sin incidencias graves/críticas. Repetición final de los dos casos móviles tras aclarar «cada set ganado suma un punto» también correcta y build del navegador actualizado. Nuevas pruebas de flujo cubren marcador vacío frente a cero, exigencia de tres sets, borrador anticipado, permisos de pago, errores/reintentos, confirmación de eliminación y alternativa manual al acuerdo del chat. Servidor local verificado HTTP 200 en health y detalle. Cabeceras reutilizan SectionHeader; sin consultas, dependencias, migraciones ni cambios de permisos/reglas. Sin commits ni publicación.

Diagnóstico del build de navegador: import incorrecto del fixture allMatches en la prueba nueva; corregido sin tocar código de datos. Validaciones completas y navegador reiniciados. La programación manual sigue disponible junto al acuerdo del chat; resultado anticipado accesible por desplegable; pagos se contraen inicialmente cuando prima el resultado pendiente. Guía compartida ampliada con cabeceras y acciones de Partido.

Implementados prioridad contextual y agrupación de resultado, cabeceras SectionHeader, estilos de acciones compartidos, etiquetas Por pagar/Por cobrar y errores localizados, confirmación al eliminar datos de reserva, nombres de parejas y validación sin convertir vacíos en cero. Ocho pruebas nuevas de flujo y 18 existentes pasan; i18n correcto. Gate tipográfico adaptado para verificar el uso real de SectionHeader. Incremento neto de fuente medido de 66 líneas respecto a MC30, principalmente traducciones; presupuesto total ajustado de 135200 a 135300, sin aumentar clientes. Navegador detenido por fallo de typecheck del servidor de pruebas; se está obteniendo el diagnóstico antes de continuar.

En curso por autorización de propuestas 1/2/4/8/12/13/14/15. Mantener permisos y reglas de resultado; resto de recomendaciones pendiente. Reutilizar SectionHeader de Competiciones, estilos de acciones comunes y formularios existentes. Sin operaciones remotas.

## MC30 — orden visual del emparejamiento (2026-10-23)

COMPLETADA LOCALMENTE. PairDetails construye una lista de presentación con jugador y recomendación asociados y solo la invierte si ambos lados están resueltos: A Revés arriba, Drive abajo; B Drive arriba, Revés abajo. Pruebas verifican equipos inicialmente invertidos sin mutarlos, marcador rojo/↔ en el jugador correcto, actualización al cambiar clasificación y orden conservado con empate, sin recomendaciones o con resultado. 25 pruebas focalizadas y cuatro casos Playwright en 360×800 (claro/oscuro) correctos; TypeScript, ESLint, controles de detalle/Mis partidos y presupuesto correctos. Build de navegador correcto. No cambio de previews, símbolos, posiciones persistidas, datos ni publicación.

En curso. Hasta ahora PairDetails recorría el orden almacenado en teamA/teamB; las recomendaciones no cambiaban ese orden. Se ordena únicamente la presentación del detalle pendiente cuando ambos lados están resueltos: A Revés/Drive, B Drive/Revés. No cambiar el símbolo ↔ por petición expresa; conservar orden en empates/datos insuficientes y encuentros con resultado.

## MC29 — etiquetas de resultado (2026-10-23)

COMPLETADA LOCALMENTE. MatchOutcomeBadge compartido por MatchCard y PersonalMatchCard; todas las etiquetas Victoria/Derrota usan tamaño caption, semibold, texto normal, padding 8/2 px, fondo suave y ningún borde/anillo decorativo, conservando StatusHelp y traducciones. El modo compacto ya no cambia el resultado, solo la etiqueta de origen. Guía guardada en docs/ui-style-guide.md. Verificados 25 tests focalizados, seis casos Playwright (Home, Calendario e historial personal en móvil/escritorio), TypeScript, ESLint, i18n, control de Mis partidos y presupuesto de código; build de Playwright correcto. Revisada captura móvil y actualizadas solo cuatro referencias de Home/Calendario por el cambio aprobado. No CSS de temas, datos ni navegación modificados; no publicación ni commits.

En curso. Auditoría acotada encuentra etiquetas Victoria/Derrota en MatchCard (liga: Home, Calendario y previews) y PersonalMatchCard (Competiciones y Mis partidos); la primera conserva tamaño, borde y mayúsculas antiguos. Se extrae el estilo compacto de Actividad personal a un componente común sin cambiar cálculos ni círculos V/D de Racha. Sin acciones remotas.

## MC27 — recomendaciones de posición (2026-10-23)

COMPLETADA LOCALMENTE. npm run validate correcto: 1082 pruebas / 263 archivos, TypeScript, lint sin errores (cinco avisos previos), i18n, controles de seguridad/presupuesto y build (1213740 bytes gzip, 104 chunks). Cuatro pruebas Playwright correctas en viewport 360×800 con claro/oscuro: lados recomendados, ayuda legible sin desbordar, cierre con Escape y ausencia en encuentros con resultado. Captura móvil revisada. El primer intento visual interfería con el tutorial inicial; fixture corregida marcando únicamente esa guía como completada. ESLint focalizado posterior correcto. Revisión React: cálculo puro durante render, sin efectos/consultas adicionales ni mutación de preferencias; ayuda reutiliza portal y teclado existentes. No migraciones ni publicación de MC27; cambios permanecen locales en la rama actual.

Implementación local: helper puro para parejas Drive/Revés/Versátil, desempate solo por posición válida y distinta en clasificación de temporada; sin asignaciones arbitrarias si faltan datos o hay empate. Integrado en metadatos existentes de partidos de liga pendientes, rojo y ↔ únicamente al cambiar una preferencia fija. Ayuda estructurada y traducida es/en/eu en el icono preparado; StatusHelp acepta contenido React sin cambiar el resto de avisos. 34 pruebas focalizadas correctas, i18n y presupuesto de código correctos; validación completa y revisión móvil en curso. Sin publicación de esta parte.

Comienza implementación local tras terminar MC26. Se reutilizan preferencias y clasificación de temporada ya disponibles, sin consultas ni persistencia nuevas. Mantener emparejamiento sin avatares y metadatos debajo del nombre. Recomendaciones solo antes de finalizar el partido; cambios de preferencia fija destacados y explicación en el icono existente.

## MC26 — publicación de pendientes en PRE (2026-10-23) — COMPLETADA

PR #54 integrada en staging con commit b8d81448 tras pasar los cuatro jobs de CI. Deployment dpl_27kzsdZmY2SXgXsXE6fyiBbz6odD READY, alias pre.smashandlob.com verificado. Health autenticado con Vercel CLI confirma 1.15.34 / pre; portada y Avatar Lab 200, API Avatar Lab 401 sin sesión. Smoke público directo redirige 302 a protección SSO de Vercel; mismas comprobaciones realizadas con vercel curl, sin desactivar protección. Migraciones verificadas en catálogo, RLS activa y permisos exclusivos service_role. Main, Production y v1.0.0 intactos. OAuth y revisión física móvil siguen siendo gates manuales, sin usar cuentas personales en automatización.

Commit c1fb4e7d subido y verificado en remoto; PR #54 abierta hacia staging. CI supera código/build, Lighthouse y migraciones/pgTAP/restore; navegador aún en curso. Aplicadas por CLI únicamente 20261021223000 y 20261021233000 en miadjotkucgluwbrgeih: dry-run posterior sin pendientes, funciones verificadas SECURITY INVOKER y ejecución exclusiva service_role. Advertencia de caché local por Docker ausente no afectó a la aplicación SQL; verificación remota explícita realizada.

Gates locales superados: npm run validate completo, audit de dependencias de ejecución sin vulnerabilidades y Playwright 111 correctas / una omitida (gate manual PRE). Capturas actualizadas de cuatro pantallas en móvil/escritorio. Preparada publicación de 1.15.34; comienza commit/push y PR hacia staging, sin tocar main ni Production.

Validación completa terminada correctamente, incluido presupuesto de build (1211047 bytes gzip, 104 chunks). Primera ejecución de navegador: 99 correctas, una omitida y 12 fallos por referencias visuales y expectativas antiguas. Revisadas y regeneradas solo ocho capturas afectadas; adaptada prueba de torneo al enlace compartido, selección de perfil y clasificación final con 12 resultados. Segunda ejecución completa en curso; publicación y migraciones siguen pendientes hasta superarla.

Publicación autorizada por el usuario antes de comenzar recomendaciones de posición. Rama codex/tournament-settings-context parte del mismo commit que origin/staging (022f0549). Supabase PRE identificado como smash-lob-staging/miadjotkucgluwbrgeih; pendientes las dos migraciones locales de cierre vacío e invitación compartida. Se excluyen las capturas locales del artefacto. En curso validaciones locales y verificación de destino Vercel.

Bloqueo de gate detectado: npm audit señala vulnerabilidad crítica de Next 16.3.8; publicación detenida hasta actualizar Next/eslint-config-next a 16.4.3, versión corregida verificada en npm y advisories oficiales, y repetir gates. La primera suite completa detectó cuatro controles literales antiguos de UI pendientes de adaptación; no se publica con fallos. Dry-run de Supabase confirma exactamente las dos migraciones esperadas, sin otras pendientes.

Actualización Next/eslint-config-next 16.4.3 completada sin force; npm audit --omit=dev informa cero vulnerabilidades. Versionado de candidata 1.15.34, caché PWA y changelog coherentes. Adaptados gates visuales antiguos al diseño aprobado; 29 pruebas de los cinco archivos afectados pasan. Presupuesto permite el único componente cliente adicional StatusDot compartido (195); tamaño total 135110 líneas dentro del límite. Validación completa en curso.

Suite completa: 1061/1061 pruebas en 261 archivos, con Vitest 4.1.11 instalado desde el lockfile. Lint sin errores (cinco avisos previos); build Next 16.4.3 compilado, comprobaciones finales en curso. Playwright móvil pasa navegación/Axe; revisadas capturas actuales de Home, Calendario, Ajustes e invitación: requieren nuevas referencias por cambios de diseño aprobados. Sin migraciones aplicadas ni publicación todavía.

## MC25 — Home de Competiciones (2026-10-23)

Tras comparar capturas, se retiran definitivamente los avatares del emparejamiento, sin volver a añadir la fila superior. Nombres recuperan ancho; perfiles y chats conservan fotos. Tres pruebas focalizadas, TypeScript y ESLint correctos. Sin publicación.

Avatares restaurados a petición para comparar capturas: 24 px junto al nombre hacia el exterior de cada pareja, sin borde decorativo. Conserva nombres adaptativos y metadatos compactos; sin fila superior de fotos. Tres pruebas focalizadas, TypeScript y ESLint correctos. Comparación visual pendiente de capturas; sin publicación.

Avatares retirados del panel de emparejamiento por decisión del usuario; nombres recuperan todo el ancho. Conserva metadatos compactos, ajuste de fuente y VS. Fotos de perfil en otras pantallas intactas. Tres pruebas focalizadas, TypeScript y ESLint correctos. Sin publicación.

Anillo decorativo y separación del avatar retirados solo del emparejamiento; conserva indicador de foco al navegar con teclado. Prueba del panel, TypeScript y ESLint correctos. Sin publicación.

Prueba de avatares pendientes: foto de 24 px junto a cada nombre hacia el exterior de la pareja; retirada la fila superior de fotos. Se conserva apertura ampliada, nombres adaptativos, metadatos debajo y VS; sin fotos válidas continúa sin avatares. Tres pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Separador de metadatos corregido a punto medio por solicitud: «#1 · Revés · Diestro». Prueba del panel, TypeScript y ESLint correctos. Sin publicación.

Prueba de metadatos: «#1 - Revés - Diestro», sin «en liga», componentes separados con guiones y mayúsculas normales. Mantiene una línea bajo el nombre, datos ausentes omitidos y traducciones existentes. Tres pruebas focalizadas, TypeScript, ESLint e i18n correctos. Sin revisión visual real ni publicación.

Prueba visual solicitada: los cuatro jugadores muestran nombre arriba y línea compacta de datos debajo. Conserva ajuste de nombres hasta 10 px, elipsis, VS y avatares. Tres pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Emparejamiento: metadatos compactados en una línea periférica conservando disposición de nombres y VS; nombres usan FitText sin saltos, mínimo 10 px y elipsis después, también en tema competición. MVP conserva espacio propio y nombres completos en title. FitText recalcula al cambiar tema/tamaño de texto para este uso; comportamiento predeterminado conservado. Doce pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación. Avatares intactos.

Mayúsculas de nombres revertidas por solicitud. Auditoría de código del detalle de liga: metadatos arriba para primer jugador y debajo para segundo; avatar agrupado por pareja, VS de 32 px sobre hueco de 8 px, tratamiento de nombres largos distinto en tema competición y datos de mano ocultos si no hay lado preferido. Recomendaciones pendientes de aprobación: orden uniforme nombre/metadatos, VS sin solapar, agrupación avatar-jugador y prioridad de fecha/lugar sobre ventana oficial. No se aplican esas propuestas. Prueba del panel, TypeScript y ESLint correctos.

Prueba visual: nombres en mayúsculas mediante CSS en el panel de emparejamiento, pendientes y finalizados. Datos originales conservados. Prueba focalizada, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Datos secundarios de jugadores en emparejamiento (# en liga, lado y mano) pasan a type-micro con peso medium y espaciado normal; nombre intacto y alineación conservada. Aplicado a metadatos pendientes y finalizados del panel compartido. Prueba focalizada, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Vista previa visual de posiciones: cabecera discreta Emparejamiento y botón informativo en panel pendiente del detalle de partido de liga. Reutiliza StatusHelp con texto explícito de función futura; no asigna ni modifica posiciones, datos o clasificación. No aparece en amistosos ni resultados finalizados. Trece pruebas focalizadas, TypeScript, ESLint e i18n correctos tras completar la traducción del nuevo título. Sin revisión visual real ni publicación.

Mis torneos reutiliza presentación de estado de ligas y cálculo informativo desde startsAt: En curso verde, próximos con días/Mañana/Hoy, finalizados con texto neutro. Sin cambiar estado persistido ni inicio manual. Detalle de partido de liga usa variante soft del badge (sin anillo/borde, texto normal semibold y relleno compacto); detalle amistoso mantiene variante existente. Veintisiete pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Estados de preview de liga en la misma fila: En curso con punto/texto verde adaptado a oscuro; inicio programado futuro muestra días, Mañana u Hoy/hora de Madrid. Sin fecha programada mantiene Próximamente. Temporada truncable para conservar altura, sin nuevas filas ni bordes. Catorce pruebas focalizadas incluidas fechas inválidas, ausencia de cuenta atrás y cambio horario de Madrid; TypeScript, ESLint e i18n correctos. Sin revisión visual real ni publicación.

Previews de ligas/torneos reservan una tarjeta activa y una próxima cuando existen ambas; si solo hay un grupo se muestran hasta dos. Próximas por fecha de inicio ascendente, sin fecha por creación reciente. Ligas usan temporada actual y ajustes de inicio; sin alterar listas completas ni añadir reglas temporales. Doce pruebas focalizadas verifican selección, orden, visibilidad y listas completas; TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Último encuentro unificado en Home, etiquetas accesibles, traducción estructurada y avisos visibles. Separación cabecera/contenido centralizada en --app-section-content-gap (8 px), compartida por SectionHeader y las tres secciones de Competiciones. Ver todas/todos deja de elevar la cabecera; objetivo táctil ampliado mediante pseudo-elemento. Veinte pruebas focalizadas, TypeScript, ESLint, i18n y diff correctos. Sin revisión visual real ni publicación.

Espaciado inferior del indicador revisado en Home de liga/Competiciones: eliminado padding inferior y reducida a 8 px la separación de sección tras carruseles con indicador, sin reducir objetivos táctiles ni alterar secciones sin carrusel. Catorce pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Corrección: carruseles de próximos/últimos vuelven a validar disponibilidad e identidad del partido. Un encuentro coincidente muestra una tarjeta fija sin indicador; dos distintos conservan orden personal/liga. Un contexto sin encuentro no añade panel vacío. Pruebas de regresión de coincidencia y disponibilidad añadidas; 16 pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación. Sustituye la decisión anterior de mostrar siempre ambos contextos.

Mis Partidos activa compactBadges en próximos e histórico, reutilizando exactamente etiquetas de origen/resultado de Competiciones: color contextual de liga, sin borde, menor relleno y peso semibold; conserva detalle informativo y navegación. Trece pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Chats de liga/global y tarjetas comparten StatusDot: círculo de 6 px alineado arriba/derecha, colores semánticos y zona pulsable de 20 px con explicación accesible; solo lectura conserva gris. Validación conjunta: 40 pruebas focalizadas (Home, carrusel, ayuda de estado y Chats), TypeScript, ESLint, i18n y diff correctos. Sin revisión visual real ni publicación.

Último partido de Home replica el carrusel próximo: personal a la izquierda inicialmente, liga a la derecha, indicador temático pulsable y misma altura contextual. Mantiene consulta de último jugado/pendiente, MVP y resultados; estado vacío si no hay partido personal. Retiradas funciones sin uso del antiguo selector colapsable. Validación conjunta: 40 pruebas focalizadas, TypeScript, ESLint, i18n y diff correctos. Sin revisión visual real ni publicación.

Calendario de liga reutiliza compactScheduleHint: aviso de programación con una sola línea centrada y el mismo recuadro compacto que Home. Tres pruebas de calendario, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Home de liga: aviso compacto solo con Añadir fecha, hora y lugar, centrado horizontal y verticalmente. Carrusel estira ambas tarjetas a la misma altura según el contenido y centra sus metadatos; alcance CSS limitado al próximo partido de Home. Siete pruebas focalizadas, TypeScript y ESLint correctos. Pendiente revisión visual en móvil; sin publicación.

Indicador activo de carrusel de Home de liga y Competiciones usa bg-foreground (color de texto del tema) en lugar de negro fijo; conserva puntos inactivos grises. Once pruebas focalizadas, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Texto secundario del aviso compacto de programación sustituido por «Coordínalo desde el chat», con traducciones inglesa y euskera. Cuatro pruebas focalizadas, ESLint e i18n correctos. Sin revisión visual real ni publicación.

Home de liga: próximo partido con panel personal fijo a la izquierda (inicial) y de liga a la derecha, incluso si coinciden. Sin próximo personal conserva estado vacío. Indicador inferior raya/punto como Competiciones, pulsable y accesible por teclado; sustituye el selector Liga/Mío. Se mantiene carrusel compartido con separación y snap. Validación: 21 pruebas focalizadas, TypeScript, ESLint y diff correctos. Sin revisión visual real ni publicación.

Separador tenue entre jornadas visibles del Calendario, sin línea encima de la primera y con la separación anterior repartida a ambos lados. Adaptado a tema claro/oscuro. Tres pruebas de calendario, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

Cabeceras de Calendario de liga compactadas: Próximo se sustituye por rango cuando hay fechas; activa muestra Hasta junto al indicador y vencida muestra Venció junto al aviso existente. Fechas sin fila inferior, con ajuste de línea en anchos pequeños; misma cabecera para jornadas secretas y visibles. Próximo sin fechas conserva etiqueta; traducciones inglesa y euskera incluidas. Validación: 28 pruebas focalizadas, TypeScript, ESLint, i18n y diff correctos. Sin revisión visual real ni publicación.

Patrón de punto extendido a previews mediante variante de MatchStatusBadge: Home/Calendario de liga, Mis partidos, Actividad personal y listas del jugador. Detalle conserva texto; resultados personales conservan Victoria/Derrota. Cabeceras de jornada intactas porque describen un estado distinto al del partido. Validación: 23 pruebas focalizadas correctas, incluida interacción del punto con nombre accesible sin activar la tarjeta; TypeScript, ESLint y diff correctos. Revisadas pautas React de componentes compartidos y accesibilidad. Sin publicación ni revisión visual real.

Corregida la alineación del círculo visible: extremo superior alineado con la etiqueta y extremo derecho con el panel de nombres. La zona pulsable se extiende hacia abajo y a la izquierda; ya no centra el punto dentro de ella. Ocho pruebas del hub, TypeScript y ESLint correctos. Sin revisión visual real ni publicación.

El punto se ajusta al margen interior de la tarjeta: comparte la línea superior de la etiqueta de competición y la columna derecha del contenido, sin desplazamientos negativos. Ocho pruebas del hub, TypeScript, ESLint focalizado y diff correctos; sin publicación ni revisión visual real.

El indicador de estado se reduce a 6 px dentro de un objetivo táctil de 20 px y se alinea arriba a la derecha de la tarjeta, manteniendo tooltip y accesibilidad. Ocho pruebas del hub, TypeScript, ESLint focalizado y diff correctos; sin publicación ni revisión visual real.

El estado no finalizado de Actividad personal se representa como el indicador circular de Chats, con color por estado, tooltip y etiqueta accesible. Victoria y Derrota conservan su texto. Ocho pruebas del hub, TypeScript, ESLint focalizado y diff correctos; sin publicación ni revisión visual real.

La etiqueta contextual de estado pendiente («Programado») usa ahora mayúsculas normales, peso semibold y espaciado normal: conserva el color semántico sin competir con el partido. Alcance limitado a Actividad personal. Ocho pruebas del hub, TypeScript, ESLint focalizado y diff correctos; sin publicación ni revisión visual real.

Segunda pasada de etiquetas compactas: origen sin borde y estados sin anillo, conservando fondos y colores contextuales. Limitado a Actividad personal mediante la prop existente. Ocho pruebas del hub, TypeScript y ESLint correctos. Sin publicación ni revisión visual real.

Etiquetas de origen y estado compactadas solo en Actividad personal: menor relleno y peso semibold, sin forzar mayúsculas. Colores, bordes y tarjetas completas de Mis partidos conservan su presentación actual mediante una prop explícita. Ocho pruebas del hub, TypeScript y ESLint correctos. Sin publicación ni revisión visual real.

Corregida la interpretación de la franja: se sustituye la barra plana por un degradado interior suave, reducido a .72rem para no invadir el logo, limitado a la esquina izquierda de cada tarjeta y usando el color de liga. El texto contextual de Actividad personal pasa a peso semibold y mayúsculas normales, de menor intensidad. Ocho pruebas del hub, TypeScript, ESLint y diff correctos. Sin publicación ni revisión visual real.

Acceso discreto de calendario a la derecha inferior del próximo partido, reutilizando CalendarEventButton (Google/ICS), con nombre accesible y por encima del enlace de tarjeta. Espacio reservado para evitar solapar fecha/localización. Solo en Home de Competiciones. Validación pendiente.

Metadatos del próximo partido centrados verticalmente en el espacio restante bajo el emparejamiento. Regla limitada al carrusel de Competiciones; MatchEventMeta solo añade un atributo de identificación sin alterar otras pantallas. Ocho pruebas del hub y ESLint correctos. Pendiente comprobación visual móvil.

Tres ajustes acordados: texto contextual a la derecha de Actividad personal, sin botón de alternancia ni fila adicional; franja de liga mediante variable local y regla prioritaria frente al tema; tarjetas del carrusel estiradas a la altura del contenido mayor sin altura fija ni recorte. Etiquetas de origen/estado intactas. Ocho pruebas del hub, TypeScript y ESLint correctos. Sin publicación ni revisión visual real.

Corrección solicitada: restaurada cabecera Actividad personal con título contextual e intercambio en su fila anterior. Eliminados el enlace Ver Mis partidos y el refresco de la cabecera, incluida su lógica sin uso. Validación: ocho pruebas del hub, ESLint y TypeScript correctos; pruebas adaptadas a la retirada explícita del refresco.

Simplificación adicional autorizada: contador y fila independiente retirados, intercambio junto al título, puntos como indicador único; acceso Mis partidos conservado incluso sin actividad. Retirados + de cabeceras y métricas de liga del resumen; acciones sin subrayado y menor peso, estado de liga como texto secundario y Actualizar como icono accesible. Las ocho pruebas del hub pasan tras corregir el acceso Mis partidos en el estado vacío. Sin cambios remotos ni validación visual real.

Segunda pasada: retirado el fondo envolvente de Actividad; título contextual único, contador de posición y puntos del carrusel. Logos de liga centrados verticalmente, temporada/estado y participación distribuidos en la tarjeta. Torneos compactados con fecha/estado compartiendo fila adaptable. Accesos + de creación solo para creators y contadores históricos retirados de ambas cabeceras del resumen. Ocho pruebas del hub, TypeScript y ESLint focalizado correctos. Pendiente revisión visual real en móvil; sin publicación.

Actividad destacada mediante superficie propia e indicador del carrusel. Tarjetas de liga con acento propio, temporada y estado; contador de ligas retirado del resumen para no confundir total histórico con tarjetas visibles. Torneos con icono propio y estado separado de la fecha. Validación: 8 pruebas del hub, TypeScript, ESLint focalizado y diff correctos. No se ha realizado verificación visual en navegador ni build adicional para este cambio de presentación. Sin cambios remotos.

## MC24 — estados y navegación en curso (2026-10-21)

Mis ligas recupera la etiqueta Próximamente usando el estilo de estado existente. Las invitaciones de jugador de torneo solo se ofrecen al creador de un torneo abierto con al menos un participante sin cuenta. La función SQL existente ya rechaza generar enlaces cuando todos están vinculados. Navbar usa Inicio/Ranking con traducciones y FitText; Ranking se conserva por corrección expresa del usuario; enlaces superiores conservan destino y usan la flecha común. Validación: 19 pruebas focalizadas correctas, i18n, presupuesto fuente, ESLint, TypeScript, build y diff correctos. La última corrección restaura únicamente el texto Ranking original. Sin cambios remotos.

## MC23 — creación y acceso contextual en curso (2026-10-21)

Crear liga y Crear torneo solo se ofrecen con canCreateLeagues y returnTo=/leagues. Retirados de Ajustes de liga y resto de contextos. Unirme usa el título genérico y reconoce códigos/enlaces de liga y tokens/enlaces de torneo, manteniendo el caso del token y reutilizando el flujo de selección/vinculación ya implementado. Validación: 15 pruebas focalizadas (códigos/enlaces, mayúsculas, permisos/contexto e invitaciones), TypeScript, ESLint focalizado, i18n, presupuesto fuente, control de Mis partidos, diff y build correctos. Completado localmente. La vinculación de torneos en PRE requiere la migración compartida pendiente de MC22. Sin cambios de base de datos ni remotos.

## MC22 — ubicación de invitaciones corregida (2026-10-21)

El panel de invitaciones se muestra en Ajustes generales al volver desde un torneo y en su administración. La pantalla Jugador queda dedicada al calendario individual. Ambos accesos y el botón flotante reutilizan FloatingSpectatorShareButton: jugador solo para creador en torneo abierto, espectador bloqueado como próximamente y compartir aplicación. El contexto incluye returnTo para conservar el torneo desde Ajustes. QR, logo, descarga y compartir usan el mismo flujo de ligas y aceptan la URL del torneo sin convertirla en una invitación de liga.

Validación focalizada: TypeScript, ESLint, i18n y 11 pruebas de selector/permisos/rutas correctos. La primera ejecución del gate detectó una comprobación literal de href obsoleta; se conservó el enlace inline original para mantener el control. El presupuesto se ajustó mínimamente a 135200 líneas y 194 clientes por las pantallas de administración/invitación añadidas (135126 líneas medidas), sin ampliar límites de rutas ni páginas. Gate completado por etapas: controles del repositorio, ESLint (cinco avisos preexistentes), TypeScript y build correctos. La suite completa ejecutó 1042 pruebas; 1040 pasaron y dos comprobaciones literales antiguas de Ajustes fallaron. Se actualizaron para las tres variantes de Ajustes y el href contextual; repetición de ambos archivos 9/9 correcta. No se ha validado contra datos reales ni aplicado la migración pendiente. Sin cambios remotos.

## MC22 — invitación compartida de torneo en curso (2026-10-21)

Se inicia la corrección de Ajustes de torneo, estado final de clasificación y acceso de participantes manuales. Se sustituirá el enlace individual por una invitación privada común con selección explícita de un perfil libre, manteniendo el acceso directo existente para jugadores ya vinculados a una cuenta. Sin cambios remotos.

Implementación local: Ajustes de torneo ya no muestra la navbar propia; Ranking pasa a «Clasificación final» tan pronto estén registrados todos los partidos y la tabla recibió cabecera compacta, líder destacado y mejor lectura móvil. La pantalla Jugador usa ahora un enlace común de 30 días para plazas manuales. El enlace muestra únicamente los perfiles libres, exige sesión y la función SQL atómica bloquea torneo/invitación, impide reclamar un perfil ya vinculado y evita que una cuenta reclame dos perfiles. Las cuentas ya asociadas siguen apareciendo directamente en Competiciones. Se conserva la antigua ruta individual para no invalidar enlaces anteriores, pero ya no se genera desde la interfaz.

Se añadió la migración aditiva 20261021233000_add_shared_rapid_tournament_invites.sql; no se ha aplicado a PRE. Validación: i18n, lint, TypeScript, migraciones, inventario API (110 rutas/155 métodos), diff sin espacios y 19 pruebas focalizadas correctas. El build ya completó correctamente con las nuevas rutas. Sin despliegue, commit ni operación remota. Estado: DONE local; PRE requiere aplicar la migración aditiva y publicar el código bajo solicitud explícita.
## MC21 — cierre de torneos de prueba en curso (2026-10-21)

El cierre ordinario exige que todos los resultados estén registrados. Se añadió «Finalizar sin resultados» en la zona sensible de Administración de torneo: solo se muestra al creador si el torneo está en borrador/en curso y ningún partido tiene marcador. Tras confirmarlo usa la nueva ruta protegida y habilita el borrado habitual. La función SQL aditiva `20261021223000_finish_empty_rapid_tournament.sql` bloquea cualquier torneo con resultado parcial o completo, exige creador y solo permite estados borrador/en curso; no se ha aplicado a PRE.

Validación: inventario API actualizado a 109 rutas/154 métodos, pruebas de integración de rutas y migración 20/20, comprobaciones tipográficas 8/8, i18n, TypeScript, ESLint focalizado, identidad de migraciones, `git diff --check` y build correctos. Para usar la acción contra la base de PRE falta aplicar exclusivamente esta migración y publicar el código bajo una solicitud explícita de PRE.

## MC21 — ajustes contextuales completados localmente (2026-10-21)

Corrección aplicada: el engranaje de todas las pantallas, incluidos los torneos, vuelve a abrir siempre Ajustes generales con `returnTo` a la pantalla exacta de origen. Desde un torneo, Ajustes mantiene perfil, idioma, apariencia/tema, sonidos y avisos, notificaciones, ayuda y acceso a Competiciones; oculta disponibilidad de temporada, actividad/pagos, desvinculación y administración de la liga activa.

Para el creador, Ajustes carga el permiso real del torneo y presenta en Administración el botón «Administrar torneo», que abre la pantalla contextual ya creada. Esa pantalla conserva el borrado protegido: confirmación, creador y torneo finalizado. Un participante no ve el bloque ni el botón. La navegación de Ajustes, las ligas y el esquema de datos permanecen sin cambios.

Validación de la corrección: `npm run i18n:check`, ESLint focalizado, `npm run typecheck`, `git diff --check` y 12 pruebas focalizadas correctas. El build previo de MC21 incluyó correctamente la ruta `/tournaments/[id]/settings`; no se requieren migraciones, dependencias, cambios remotos ni despliegue.

Último ajuste: el acceso de Ajustes se denomina «Unirme a una competición existente» para preparar invitaciones de torneos. Desde un torneo, el botón existente «Panel de administrador» es ahora el único acceso de Administración y abre la administración contextual del torneo; no puede llevar a Administración de liga. La eliminación sigue protegida por creador y estado finalizado. I18n, TypeScript, lint focalizado y las 12 pruebas focalizadas vuelven a pasar.

## MC21 — implementación inicial sustituida (2026-10-21)

Auditoría aplicada: hasta ahora `/settings` recibía el contexto de la última liga activa aunque se abriera desde Competiciones o un torneo. Desde Competiciones se muestra ahora una variante sin disponibilidad de temporada, pagos/actividad de liga, desvinculación, modo de experiencia ni Administración de liga; se conservan perfil, idioma, apariencia, avisos, notificaciones, acceso a Competiciones, invitación, creación de liga autorizada y ayuda.

El botón flotante de Ajustes de cualquier `/tournaments/:id/*` abre `/tournaments/:id/settings`, que conserva la navbar propia del torneo. La nueva pantalla ofrece el enlace a los avisos y una zona sensible contextual: el borrado solo aparece operativo para el creador cuando el torneo está finalizado, solicita confirmación y reutiliza el DELETE/RPC existente, sin cambios de RLS ni de esquema. Los participantes solo reciben el mensaje de permiso insuficiente. El buscador global de Ajustes queda oculto para la variante de Competiciones, evitando resultados de administración de liga.

Validación: `npm run i18n:check`, ESLint focalizado, `npm run typecheck`, `npm run build` y 12 pruebas unitarias focalizadas (contexto de Ajustes, tipografía y centrado de acciones) correctas. Un primer `npm test` completo señaló dos controles nuevos de estilo, corregidos y repetidos de forma focalizada; la ejecución global se detuvo al quedar bloqueada tras esos fallos, por lo que no se declara como evidencia completa. Sin base de datos, migraciones, dependencias, commits, despliegue ni cambios remotos.

## MC20 — completado localmente (2026-10-20)

Los tres enlaces superiores de vuelta de creación y detalle de torneos muestran «Competiciones» y conservan su destino `/leagues`: carga/error del detalle, cabecera del torneo y formulario de creación. Títulos de pantalla, Ajustes y textos informativos no cambian. Se actualizaron las dos comprobaciones E2E de regreso al listado. Validación local: `npm run i18n:check`, ESLint focalizado, `npm run typecheck` y recorrido Playwright de torneo fijo en cuatro variantes correcto. Sin base de datos, dependencias, despliegue ni commits.

## MC19 — publicación en PRE en curso (2026-10-21)

El usuario ha autorizado la publicación de los cambios pendientes para pruebas. Antes de tocar PRE se verificará la rama frente a `origin/staging`, se ejecutarán los gates locales y el `dry-run` de Supabase deberá confirmar que `20261020164339_add_dynamic_mexicano_tournaments.sql` es la única migración pendiente. Solo entonces se aplicará esa migración en PRE, se integrará el código en `staging` y se comprobará el despliegue; `main`, Producción y `v1.0.0` siguen fuera de alcance.

## MC19 — completado localmente (2026-10-20)

Leída la especificación completa y auditado el límite inicial del dominio. La Americana flexible ya concentra configuración y planificación en `rapidTournament.ts`, y persiste el calendario entero mediante RPC transaccional. El Mexicano reutilizará jugadores, pistas, duración, rondas, partidos, resultados y permisos existentes; se añadirá un formato persistido, semilla reproducible y una operación atómica para crear únicamente la siguiente ronda. No se han modificado todavía lógica funcional, migraciones ni datos remotos.

Motor puro `dynamicMexicano.ts` añadido sin tocar el generador de Americana. Selecciona participantes priorizando partidos jugados y descansos, evita descansos consecutivos cuando existe alternativa y construye emparejamientos mediante búsqueda exhaustiva pequeña o beam search acotada grande, con margen de equilibrio de tres puntos y criterios de rotación/rivales. Rating R=100×(F+3)/(F+C+6), clasificación y semilla determinista incluidos. Prueba focalizada: 16/16 casos correctos, con 8/2, 12/2, 12/3, 16/3, 10/2 y 7/1, simulaciones completas, equidad ≤1, descansos, rotación, reproducibilidad y variación de semilla. Persistencia e interfaz aún pendientes; no se ha tocado ninguna base remota.

Persistencia e integración inicial completadas localmente. La migración aditiva `20261020164339_add_dynamic_mexicano_tournaments.sql`, creada con Supabase CLI 2.121.0, amplía formato/ranking y semilla, crea torneos dinámicos sin partidos anticipados, serializa cada generación con bloqueo de fila y trata la repetición como idempotente. Solo permite avanzar tras completar la ronda anterior y bloquea corregir resultados cuando ya existe una posterior. Formulario, inicio, acción Generar siguiente ronda, calendario generado, clasificación R y reinicio temporal reutilizan rutas/tablas/pantallas actuales; Americana conserva sus RPC y generador. Gates focalizados: 36/36 pruebas, ESLint sin avisos y TypeScript correctos. Migración no aplicada; faltan pruebas de interfaz, validación SQL/local completa y gates globales.

Estado de ronda persistido como pending/generated/completed y actualizado dentro de las mismas transacciones. La clasificación dinámica muestra PJ, descansos, V/E/D, puntos, diferencia y rendimiento; no declara campeón antes de finalizar todas las rondas. E2E de torneos 8/8 correcto en móvil/escritorio: Americana clara/oscura completa, roster de liga y Mexicano con creación vacía, ronda inicial, resultados, siguiente ronda y bloqueo visual del histórico. I18n, API security (108 rutas/153 métodos), TypeScript, ESLint y presupuesto pasan; el total medido 134791 requirió ampliar únicamente el presupuesto total de 134600 a 135000 por el nuevo motor y cobertura, sin cambiar límites de clientes/páginas/rutas. Docker/Podman no están disponibles, por lo que el replay SQL local no puede ejecutarse; migración sigue sin aplicar. Gate global en curso.

MC19 completado localmente. `npm run validate` correcto: 254 archivos/1033 pruebas, lint sin errores y cinco avisos preexistentes ajenos, TypeScript, build y presupuesto de 1210708 bytes gzip/103 chunks. Después del gate se añadieron cuatro controles directos de la capa servidor; bloque focal final 37/37 y TypeScript/presupuesto correctos. E2E de torneos 8/8 y repetición móvil del Mexicano con tabla contextual correctos. Revisión React: sin nueva frontera cliente, hooks condicionales ni controles sin nombre; consultas independientes del generador servidor paralelizadas. Migración aditiva preparada y no aplicada. No hay Docker, Podman ni psql para replay/lint SQL local; esta es la única validación pendiente antes de aplicar en PRE. Sin commits, push, despliegue ni datos remotos; Americana, ligas y navegación no se han modificado funcionalmente.

## MC18 — completado localmente (2026-10-19)

En el formulario de torneos, reserva y calentamiento indican los minutos; los desplegables muestran un chevron propio y la puntuación usa «Puntuación por tiempo» y «Por porcentaje de puntos ganados». El aviso para completar manualmente jugadores vinculados aparece solo si hay plazas libres. Logística muestra «3 minutos entre rondas» y conserva el margen de seguridad, sin la duración total programada.

El resumen reúne la modalidad/formato, jugadores, pistas totales y simultáneas, reserva, calentamiento, planificación automática, rondas, duración por partido y juego acumulado por pista, transiciones, participación y minutos por jugador, total de partidos, margen de seguridad y puntuación. Se eliminaron los minutos agregados de todos los jugadores y de las pistas, y la duración total del torneo.

Validación: `npm run validate` correcto (252 archivos/1012 pruebas; lint sin errores y cinco avisos preexistentes en archivos ajenos; TypeScript, build y presupuesto correctos: 1208731 bytes gzip/103 chunks). E2E de creación y calendario 4/4 en móvil/escritorio y temas claro/oscuro; importación de temporada 2/2, incluida la plaza manual. Sin DB, dependencias, despliegue ni commits.

## MC17 — completado (2026-10-19)

Mis ligas recupera el diseño de la lista de producción con logo, descripción, selección de liga activa y métricas de jugadores, partidos y líder. Se eliminan Próximamente y Toca para entrar de las tarjetas; el estado Próximamente se omite y se mantienen los demás badges de estado/permisos. Pruebas unitarias 8/8, E2E de la pantalla 4/4 en móvil/escritorio y tema claro/oscuro; `npm run validate` completo correcto (252 archivos/1012 pruebas, lint con 5 avisos existentes, TypeScript, build y presupuesto). PRE v1.15.33 está desplegado en `pre.smashandlob.com`, deployment `dpl_HBC5cfdfVhvfD9XUzhU8HPKqHSbu` READY; health 200, app 1.15.33/environment pre, interfaz y service worker 200, smoke autenticado de avatar 401 esperado. El smoke local sin bypass devuelve 302 por protección Vercel. CI #403 permanecía en cola al verificar. Sin cambios de base de datos.

## MC16 — completado (2026-10-19)

Formulario ajustado con controles de flechas en una línea para jugadores, pistas, alquiler y preparación; las opciones avanzan por los valores permitidos. Pistas/reserva quedan antes de participantes y Logística muestra solo valores calculados. Resumen actualizado con rangos matemáticos por jugador y minutos/partidos acumulados del torneo, para que los datos coincidan con el sorteo aleatorio definitivo. Versión v1.15.32 y traducciones actualizadas. Validación local: `npm run validate` correcto (252 archivos/1012 pruebas, TypeScript, lint, build y presupuesto); E2E de torneos 6/6. CI #400 completada con éxito; su salida confirmó 109 E2E correctos y replay SQL, lint, pgTAP y restauración correctos. Se corrigieron los dos errores de lint SQL en la migración nueva `20261019154207_fix_rapid_tournament_flexible_function_lint.sql`, sin editar migraciones anteriores; aplicada y verificada únicamente en PRE `miadjotkucgluwbrgeih`, con funciones `SECURITY INVOKER`, ejecución concedida a `service_role` y denegada a `authenticated`/`anon`. PR #50 integrado en `staging` (`ef11cad66b7bb5937ea0d64b90906ae94642ca21`); Vercel deployment `dpl_HdL3xpGxD4UD4sQX9XPPbtCXNpKZ` READY con alias `pre.smashandlob.com`. Health devuelve 200 con environment `pre` y versión `1.15.32`; `/tournaments/new`, `/tournaments`, `/leagues`, `/personal-matches` y `/sw.js` responden 200. `main` permanece en `9578fe006063108cfcab93956fe23e1eb402f37c`; Production y `v1.0.0` intactos.

## MC13 — completado (2026-10-19)

Importación de temporada implementada: administración de liga/temporada muestra Organizar torneo y los torneos vinculados; el formulario carga todos los jugadores, permite elegir exactamente doce para el formato actual y conserva los `user_id` disponibles. El servidor comprueba permisos, pertenencia de cada jugador a la temporada y cuenta vinculada. Persistencia del origen mediante `source_league_id`/`source_season_id`; creación independiente sin cambios de flujo ni efecto sobre clasificación de liga. Selector de usuarios de la app habilitado en PRE con su migración. Sin sincronización posterior.

Migraciones aplicadas y verificadas exclusivamente en PRE `smash-lob-staging` (`miadjotkucgluwbrgeih`): `20261018223638_rapid_tournament_account_access.sql`, `20261018223650_add_tournament_league_source.sql` y `20261018223744_allow_source_parent_deletion.sql`. `list_migrations` confirmó las tres versiones; introspección confirmó las columnas de cuenta/origen, RLS activo y privilegios de tablas/RPC reservados a `service_role`. Se retiró mediante una migración adicional el constraint de pareja que podía impedir borrar una liga o temporada; la API valida la pareja al crear. No se tocaron Production ni sus datos; no se desplegó código.

Compatibilidad de creación/listado conservada con esquemas anteriores a MC13; en PRE ya están instaladas las columnas necesarias. Las cuentas se seleccionan desde la búsqueda común y las plazas permanecen editables, desvinculando la cuenta al editar el nombre.

El selector de cuentas sigue el patrón de inscripción de ligas: búsqueda común con resultados limitados, chips y opción de quitar; elegir una persona ocupa la primera plaza libre. También se elimina el desplegable repetido en las doce filas.

Implementados: validación visible del sorteo con tabla de participación individual; el test confirma 12 partidos, 4 por jugador, 2 descansos, 64 minutos, sin descansos consecutivos, máximo 2 partidos seguidos, 4 compañeros, 8 rivales y 2 usos por pista. Añadidos ajustes informativos bloqueados para cuenta atrás previa y calendario oculto. El formulario permite vincular jugadores a cuentas registradas con membresía en alguna liga compartida con el organizador, y el sorteo conserva el vínculo.

Acceso privado de participantes mediante invitaciones tokenizadas: solo se persiste el hash; el token es de un solo uso y caduca en 30 días. La vista pública revela únicamente torneo/plaza; reclamar requiere autenticación y las mutaciones siguen reservadas al creador. Inventario de seguridad actualizado.

Verificación final local: `npm run validate` correcto (1005 pruebas/251 archivos, TypeScript, ESLint sin errores y cuatro avisos existentes, build de 1201854 bytes gzip y presupuestos). E2E de torneos: 6/6 en móvil/escritorio y claro/oscuro, incluidos creación independiente e importación de roster. Pruebas focalizadas de rutas/invitaciones: 14/14. `git diff --check` correcto.

El primer `npm run validate` detectó tamaños fijos en píxeles; se sustituyeron por tipografía semántica. El segundo detectó el límite de líneas y la prueba global encontró botones sin centrado. Se consolidó el flujo de invitación en el cliente de torneo, se convirtió su página en Server Component, se amplió el presupuesto global de 134000 a 134500 (sin elevar el límite de módulos cliente) y se centraron los botones; los gates completos posteriores pasaron.

No hay Docker/Podman ni `psql` local; el gate SQL se completó en el PRE expresamente autorizado, usando solo introspección de esquema/permisos y sin insertar datos reales. La CLI no estaba instalada; las migraciones versionadas se aplicaron mediante el conector Supabase y se alinearon los nombres de archivo con las versiones remotas sin alterar su contenido.

Revisión final de carrera: la reclamación de invitación toma bloqueos en el mismo orden que el sorteo y la renovación de invitaciones (torneo y luego invitación), evitando ciclos de bloqueo.

Recordatorio solicitado por el usuario para esta rama: en próximas peticiones y al terminar el desarrollo, recordar la idea de un sistema de amigos en la app. Queda pendiente para más adelante; no implementarlo ahora.

## MC09PRE — Publicación v1.15.28 en PRE (DONE)

Solicitud explícita del usuario para publicar las mejoras de perfiles unificados y Competiciones. Candidato preparado en `codex/mis-competiciones` sobre `origin/staging` 8ca12315. Versión actualizada a v1.15.28 en package, lock, etiqueta visible, changelog, service worker y smoke checks para que la PWA detecte la actualización. Sin cambios SQL ni dependencias.

Gates locales: `npm run validate` correcto (998 pruebas, lint sin errores y cuatro avisos previos, TypeScript, build 1194262 bytes gzip/103 chunks y presupuesto); suite E2E completa 107 passed/1 skip esperado; auditoría de dependencias de producción sin vulnerabilidades. La primera ejecución de E2E detectó siete snapshots de escritorio desactualizados por el cambio intencional de «Mis Competiciones» a «Competiciones»; se actualizaron esas capturas y la repetición completa pasó. `git diff --check` correcto.

PR #46 integrado en `staging` con SHA `b342d196f94849b01baa29476b2ce7ff28d93202`; los cuatro jobs de CI 39142665387 pasan. Vercel deployment `dpl_CHzyiFGi6c6JhWu2amG34epKsFAS` está READY para ese SHA y `pre.smashandlob.com` apunta al mismo deployment. Con `vercel curl` autenticado se confirmó health 200/version 1.15.28/environment pre; home, manifest, ligas, Mis partidos y torneos responden 200; service worker usa `smash-lob-v1.15.28`; API de Avatar Lab requiere sesión (401). El smoke HTTP sin autenticación recibió 302 de Deployment Protection; se completaron las mismas comprobaciones usando el acceso autenticado de Vercel. Sin cambios SQL ni dependencias; no se tocó main, Production ni v1.0.0.

# MC09 — Perfiles unificados y disponibilidad contextual (2026-10-18, DONE)

Retorno de Mis partidos a Competiciones, secciones condicionadas por membresía real o permiso creator y Action Bar global constante. Perfiles global y de liga comparten tarjeta de identidad, pestañas Resumen / Parejas y rivales / Cara a cara y grafismo dorado FORMA en orden cronológico. La liga mantiene puntos, diferencia, temporadas, MVP y estadísticas de liga; el perfil global conserva filtros, relaciones y estadísticas agregadas. El perfil sin resultados conserva sus pestañas y presenta el estado vacío del filtro. Una cuenta espectadora no se cuenta como miembro para Mis ligas.

Validación final: npm run validate pasa (998/998 pruebas, ESLint sin errores y cuatro avisos preexistentes, TypeScript, build y presupuesto). 28 E2E móviles de navegación, actividad, QR y accesibilidad pasan; cuatro flujos focalizados tras la corrección de membresía vuelven a pasar, incluyendo perfil global y retorno desde Mis partidos. Se actualizan las capturas móviles afectadas por la Action Bar fija. El límite total de src sube de 133900 a 134000 para admitir 56 líneas netas legibles del módulo compartido. Sin commits, publicación, cambios de base de datos ni dependencias. Limitación: torneos rápidos almacenan participantes por nombre manual sin vínculo de cuenta; no se atribuyen sus resultados al perfil ni se muestran filtros de torneo.

# MC08 — Contexto de invitaciones y cabecera (2026-10-18, DONE)

Opciones disponibles según permisos y contexto real de Liga; desde Competiciones se comparte solo la app y su QR se abre directamente. En una liga, las opciones autorizadas aparecen con textos descriptivos y sin opciones deshabilitadas. Home muestra «Competiciones» en una sola línea, ajustando la fuente para evitar cortes y solapamientos a320/393px. Las futuras invitaciones de torneos como espectador/jugador quedan pendientes hasta ampliar sus participantes.

Validación final:35 pruebas focalizadas en nueve archivos; nueve E2E móviles con fixtures pasan, incluyendo QR con logo, acceso de admin/no admin, reapertura, Axe y cabecera a320/393px. TypeScript, ESLint, build de Playwright, i18n, tipografía, control Mis partidos y presupuesto133852/133900 pasan. Capturas y logs en .quality-artifacts/mc08-20261018. Sin commits, publicación, cambios de DB ni dependencias.
# MC07 — Invitaciones con botones (2026-10-18, DONE)

Cierre local: tres botones iniciales, sin combo ni acciones Descargar/Compartir antes de elegir. Seleccionar sustituye las opciones por el QR y sus acciones; cerrar limpia selección/preview/errores e invalida respuestas pendientes. Reabrir muestra siempre los tres botones. Se conservan permisos y caché de enlaces. Cuatro pruebas pasan, incluidos cierre durante generación y respuestas tardías; TypeScript, ESLint, i18n y presupuesto133824/133900 correctos. Build y recorrido móvil a320px con tres QR reales/logo, reapertura, permisos y Axe pasan; capturas revisadas. Evidencia en .quality-artifacts/mc07-20261018. Sin commits, publicación, DB ni dependencias.

Se sustituye el combo por tres botones iniciales. Tras elegir desaparecen las opciones y se muestran QR/acciones; cerrar invalida solicitudes pendientes y restablece la elección. Se mantienen permisos, enlaces y diseño QR existentes. Sin publicación ni operaciones DB.

# MC06 — Compartir invitaciones y color de liga (2026-10-18, DONE)

Cierre local: selector previo al QR con Espectador, Jugador (administradores) y App/crear cuenta, reutilizando generación/diseño con logo y enlaces existentes. Compartir app no genera invitaciones de liga y funciona sin membresía; opciones restringidas deshabilitadas. Respuestas tardías descartadas, errores no habilitan acciones y caché evita regenerar al alternar tipos. Se conserva aviso de revocación del flujo de jugadores. Badges usan accentColor de su propia liga y mezclas claro/oscuro con contraste; fallback estable si no se dispone de esa liga. Ayuda de estado y control de navegación son hermanos dentro de la tarjeta, sin controles anidados; navegación intacta.50 pruebas focalizadas/integración, TypeScript, ESLint, controles i18n/Mis partidos/tutoriales/presupuesto y build correctos. Nueve E2E móviles pasan: tres QR reales con logo, restricción no admin, colores en hub/Mis partidos y Axe claro/oscuro, gestos y vuelta entre contextos. Capturas revisadas; evidencia en .quality-artifacts/mc06-20261018. Presupuesto133810/133900 líneas,192clientes/49páginas. Sin commits, publicación, dependencias, migraciones ni operaciones de DB real. Recordatorio de amigos permanece al inicio de este documento.

Se reutilizan los enlaces existentes de espectador y jugador y el QR con marca. Jugadores conserva permiso de administrador; compartir la app usa su URL pública sin acceso a ligas. Selector previo al QR, sin nuevas tablas/API. Etiquetas actuales por hash; se conectarán al accentColor disponible en el contexto y se adaptarán por tema, conservando fallback si no se conoce la liga.

Implementado selector con descarte de respuestas tardías, caché de enlaces por tipo y aviso de renovación de jugador conforme al flujo existente. Compartir la app disponible también sin liga. Etiquetas conectadas a userLeagues/accentColor y variables claro/oscuro; corregida la regla Competition que antes forzaba el color global.43 pruebas focalizadas pasan. TypeScript detectó tres opciones de consulta exclusivas de Playwright usadas en Testing Library; corregidas y pendiente repetir tipos. i18n actualizado en inglés/euskera; presupuesto aumenta100 líneas por la UI y traducciones, sin nuevos componentes cliente ni dependencias. E2E móvil pendiente con fixtures.

Tipos y lint correctos; primer E2E7/9 pasan, incluidos los tres QR reales con marca y permisos. Axe detecta ayuda de estado interactiva anidada dentro del botón de la tarjeta de liga, preexistente en PersonalMatchCard. Corrección acotada en el componente tocado: navegación como control superpuesto hermano del contenido, con ayuda accesible por separado; mismo destino y activación de liga. Se repiten recorridos sin desactivar reglas Axe. Control estático Mis partidos actualizado al nuevo argumento accentColor.

# MC05 — Icono, navbar y ligas (2026-10-18, DONE)

Cierre local: SVG con dos flechas opuestas centradas, sin burbuja y con nombre accesible; navbar global en cuatro columnas iguales. Etiquetas usan todo el ancho de la casilla con espaciado tipográfico compacto y ajuste existente, sin cortes a320/393px. Bordes de ligas uniformes, retirando el resaltado por última liga activa. Listado Mis ligas con panel mínimo128px, logo mayor, descripción, temporada y jornadas completadas/totales; resumen conserva tamaño compacto.35 pruebas focalizadas correctas; TypeScript, ESLint, i18n, tipografía, control Mis partidos y presupuesto133737/133800 pasan. Seis recorridos móviles correctos con build, gestos, contexto/Atrás, geometría y Axe claro/oscuro. Capturas320/393px revisadas. BottomNav de Ligas sin cambios. Evidencia en .quality-artifacts/mc05-20261018. Sin commits, publicación, dependencias ni DB; disponible en desarrollo local.

Navbar global con cuatro columnas ponderadas y borde de liga condicionado al contexto activo confirmados. Se igualarán columnas y bordes; tarjetas del listado con descripción, temporada y jornadas, manteniendo resumen compacto. Icono SVG con flechas opuestas sin fondo. Validación solo con fixtures, sin cuentas reales ni publicación.

Cambios implementados;35 pruebas focalizadas, TypeScript, lint y controles i18n/Mis partidos/presupuesto pasan. Primer E2E:5/6 correctos, pero a320px Competiciones se parte por el padding interior al igualar columnas. La etiqueta utiliza ahora el ancho completo del botón sin alterar su geometría, tipografía base ni los estilos de Ligas. Pendiente repetir los seis recorridos; no se cierra el hito hasta corregir el ajuste móvil.

# DEVORIGIN01 — Origen local de desarrollo (2026-10-18, CANCELLED)

Usuario indica que ha resuelto el ajuste y cancela esta intervención. Validación interrumpida; no se afirma cierre técnico ni se reinicia su servidor.

La configuración permitía 192.168.3.2 pero no 192.168.3.34. Añadido el hostname exacto según la documentación instalada de allowedDevOrigins; se conservan los demás hosts y DEV_ALLOWED_ORIGINS. Solo afecta al servidor de desarrollo. Pendiente comprobar lint y respuesta HTTP tras recarga de configuración.

# MC04 — Controles compactos y navegación coherente (2026-10-18, DONE)

Cierre local: selector solo↔ con nombre accesible/tooltip,28px de alto; espacio0,75rem entre paneles incluido en selección/alineación/snap y probado con gesto corto y botón. Badge sin flex-grow, ancho según texto; FitText mide sin restar1px artificial y conserva una reducción máxima proporcional. Navbar global y torneo reutilizan clases existentes de Ligas para grid/items/iconos/tipografía/radios, con72px de base y7px verticales. Comparación real:73px con borde,58px de item,16px de icono,11px de fuente y12px de radio, idénticos en las tres barras a320px. BottomNav y sus reglas CSS sin cambios, verificados por diff. Conservados colores accesibles del torneo en oscuro.18 pruebas focalizadas pasan;8 E2E móviles correctos, incluidos ambos happy paths de torneo, Axe y geometría a320/393px, badges cortos/largos, controles, swipes y vuelta entre contextos. ESLint, TypeScript, controles Mis partidos/i18n/tipografía/presupuesto y build E2E correctos;133732/133800 líneas,192clientes/49páginas. Capturas revisadas en .quality-artifacts/mc04-20261018. Sin commits, publicación, dependencias ni operaciones DB; PRE sigue en1.15.27 anterior a estos ajustes.

Confirmado: Ligas usa72px de base,7px de padding vertical y52px de botón; global62px y torneos4rem con geometría propia. Se reutilizarán las clases app-bottom-nav-grid/item/active/icon sin editar BottomNav ni sus reglas CSS. Selector de actividad solo icono con aria-label, gap del carrusel incorporado al cálculo de paso y badges sin flex-grow. Validación móvil con datos ficticios; sin publicación ni cambios remotos.

Implementado icono28px, gap0,75rem y paso del carrusel incluyendo gap; etiquetas ajustadas al contenido y FitText sin reducción artificial en etiquetas cortas. Global reutiliza geometría de Ligas: comparación DOM de altura/padding/gap/tipo/radio/iconos correcta a320/393px;18 pruebas focalizadas, ESLint/TypeScript y seis recorridos del hub correctos. Torneo claro pasa; Axe detectó color inactivo heredado del estilo compartido sobre fondo oscuro. Se conserva la paleta accesible del torneo con selector local específico, manteniendo geometría común. Se repite claro/oscuro y se comprueba navbar73px incluyendo borde, botones58px e iconos16px. Sin tocar BottomNav ni las reglas CSS de Ligas.

# MC03PRE — Publicación de tarjetas/actividad (2026-10-18, DONE)

Publicación confirmada: PRE1.15.27, staging8ca12315f75a1a633aa297fe1e19899353a4b647, Vercel dpl_JBRnMauzLg7oPJQPZeaKvfNxgfiT READY/preview y alias pre.smashandlob.com verificados sobre ese mismo commit. Script remoto completo exit0: health200/version1.15.27/environment pre, SWcache1.15.27 y manifiesto PRE; seis WAV idénticos por SHA256; /leagues, /leagues/all, /tournaments y /personal-matches200; listado API y acciones DELETE/restart401 sin sesión con UUID ficticio. CI386/39115400354 cuatro jobs success,992 pruebas/249archivos,101 E2E correctos y un skip previsto sin flaky; build1216597bytes gzip/103chunks y runtime audit0vulnerabilidades. Snapshot Home original conservada y tres repeticiones táctiles finales correctas a320/393px. Main9578fe00, tagv1.0.0e9152940 y Productiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz permanecen intactos. Sin operaciones DB ni dependencias nuevas. Evidencia en .quality-artifacts/mc03-pre-release-20261018 (CI/despliegue/verificación, validate y recorridos). Uso físico de PWA/OAuth queda para el usuario. Cierre documental en rama de trabajo sin republicar staging.

Usuario autoriza publicar PRE para pruebas desde el móvil. Se prepara1.15.27 sobre codex/mis-competiciones ddd0a141, staging81542712; main9578fe00 y tagv1.0.0e9152940 verificados. Incluye los cambios locales MC03/MC03H, sin DB ni dependencias. Validación con lock exacto en copia aislada; conservar localhost3000 y excluir adjuntos privados. Proyecto/team Vercel confirmados; pendiente verificar dominio/alias y gates completos antes de integrar staging.

Candidata c313f22d5d7674aca25b6125e85c3faa51f960f9 registrada y push/SHA remoto verificados. PR45 draft creada/adjunta hacia staging; CI382/39113795198 en cola. Copia aislada1212 archivos idénticos; auditoría runtime0vulnerabilidades. validate y E2E completos en curso con entorno ficticio de Playwright. Dominio PRE vinculado a staging; baselinePREdpl_12iorNLo5raX1zLssBbkkBhAUZQH, Productiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz verificados. Sin integrar staging todavía.

Gate personal-matches:check detiene validate por contrato fuente que aún exige grid-cols-4 uniforme. Se actualizan el control y dos pruebas de fuente para verificar las cuatro proporciones actuales y exactamente cuatro href; sin relajar la cantidad de destinos ni cambiar la UI validada. Publicación detenida hasta repetir y cerrar los gates con la candidata corregida.

validate completo sobre a50331fb correcto:990 pruebas/249archivos, lint0errores/4avisos previos, tipos y build1216370bytes gzip/103chunks. E2E100 correctos y un skip táctil de escritorio; captura Home móvil falla por187píxeles y se reproduce al repetir. Corregido el contenedor: con una sola tarjeta MatchSlides conserva el contenido original sin scroll ni observador; al llegar una segunda activa snapping. Dos pruebas de componente y capturas Home móvil/escritorio pasan con referencias intactas. Se registra la corrección y repiten gates completos/CI antes de integrar staging.

Candidata final e4d48aa3a9a686058beec4c2afa79beed0feab5f: commit/push remoto verificados, copia aislada idéntica (1212 archivos). CI384/39114268286 ejecuta los cuatro jobs; validate/E2E completos repetidos en paralelo, sin modificar imágenes de referencia. Sigue pendiente la integración de PR45 a staging.

E2E final local correcto:101 recorridos y un skip previsto (gesto táctil exclusivo móvil en proyecto escritorio),5,1min. Incluye Home original, controles y swipe, ligas/amistosos/torneos y PWA/offline; referencias visuales intactas. CI384 ya confirma código/build, DB y Lighthouse; navegador remoto y cierre de validate local pendientes.

CI384 detiene publicación por gesto corto en la nueva prueba táctil (los otros100 pasan): offset intermedio tras cerrar la sesión CDP inmediatamente al soltar. Se mantiene CDP hasta completar snapping, sin ampliar tiempos ni tolerancias. MatchSlides también alinea explícitamente en scrollend cuando el índice seleccionado no cambia; prueba unitaria cubre offset40px→0 sin depender de un rerender. Validate local completo de e4d48aa3 pasa:991 pruebas, lint0errores/4avisos y build1216401bytes/103chunks. Pendiente validar y ejecutar CI con estas correcciones; no se ha integrado staging.

Candidata401fb529663060f37a1f7ad66184c53b0e107702 y push remoto confirmados. Corrección final:10 pruebas focalizadas, lint/tipos/control Mis partidos y presupuesto133720/133800 correctos; tres repeticiones táctiles completas a320/393px pasan,1,2min, sin ampliar umbrales ni modificar snapshots. CI385/39114819522 en curso para cerrar los cuatro gates sobre esta SHA. Evidencia final en .quality-artifacts/mc03-pre-release-20261018; todavía sin integración ni publicación PRE.

CI385 vuelve a detectar offset intermedio en gestos y un primer intento de geometría tras resize (luego correcto). Log/ZIP/trazas descargados en ci385: el estado real queda desplazado sin cierre efectivo del navegador. Se añade cierre por160ms de inactividad del scroll, respetando dedo apoyado, sin intervalos y con limpieza al desmontar; el evento scrollend conserva cierre inmediato. Prueba con reloj simulado cubre ausencia de scrollend, dedo apoyado y limpieza. La aserción de navbar espera el ResizeObserver/RAF tras resize sin relajar límites. Publicación sigue detenida hasta validar la nueva candidata.

Candidata99d3bf6879e9335f6e5cd53c2e291b8d072bf551 registrada y push remoto verificado; CI386/39115400354 en curso. Once pruebas focalizadas, ESLint, TypeScript, control Mis partidos y presupuesto133728/133800 correctos. Tres repeticiones táctiles nuevas a320/393px pasan (55s), con ajuste por reposo y dedo apoyado cubiertos. Se espera CI completa de esta SHA; ninguna integración a staging ni cambio de PRE hasta cerrar el fallo remoto.

CI386/39115400354 completa success en sus cuatro jobs:992 pruebas/249archivos, lint0errores/4avisos previos, build1216597bytes gzip/103chunks;101 recorridos E2E y un skip esperado, sin flaky/fallos ni cambios de snapshots, DB/restauración y Lighthouse correctos. PR45 ready e integrada tras comprobar base/head/mergeable; staging8ca12315f75a1a633aa297fe1e19899353a4b647 verificado remoto, árbol idéntico a99d3bf68. Main9578fe00/tagv1.0.0e9152940 intactos. Pendiente READY/alias/health/PWA del despliegue PRE.

# MC03H — Selector de actividad en cabecera (2026-10-18, DONE)

Una sola fila con título activo a la izquierda y botón para alternar al otro encuentro a la derecha; eliminados selectores separados y título duplicado dentro del carrusel. El botón cambia entre Último partido y Próximo partido, conservando swipe y metadatos compactos del último encuentro. Ocho pruebas del hub correctas; ESLint selectivo, TypeScript, i18n y presupuesto133712/133800 correctos. Build y recorrido E2E móvil pasan: alineación vertical, sin solapamiento y borde derecho exacto a320/393px, botones y gestos en ambos sentidos, Liga/Mío y Axe. Capturas a escala CSS revisadas en .quality-artifacts/mc03h-20261018. Cambio local, sin commits/publicación ni operaciones DB.

Se retira la fila independiente de selectores y se coloca un único botón para ir al otro encuentro a la derecha del título activo. Mantiene la tarjeta deslizante y el acceso a Mis partidos; comprobar geometría y alternancia a320/393px.

# MC03 — Etiquetas y tarjetas deslizables (2026-10-18, DONE)

Cierre local: Competiciones conserva el plural, centrado, con más ancho que Chats y ajuste tipográfico limitado; etiquetas completas comprobadas mediante geometría real a320/393px. Origen de partidos reduce texto hasta0,625rem y después permite líneas completas, sin elipsis. Swipe nativo en Liga/Mío y Próximo/Último, snap obligatorio a ancho completo, botones conservados y slides inactivos inert. Seis E2E móviles pasan (incluyen claro/oscuro, listados, Atrás, espectadores/sin ligas, gestos largos/cortos, selección explícita y Axe sin errores graves/críticos). Capturas a escala CSS revisadas en .quality-artifacts/mc03-20261018. Barrido completo989/989 en248archivos y comprobación final10/10 en3archivos, incluyendo la nueva prueba de FitText (990 pruebas distintas cubiertas). TypeScript, ESLint de archivos tocados, i18n/tipografía/Mis partidos y presupuestos correctos:133709/133800 líneas,192clientes/49páginas; build1216392bytes gzip/103chunks. El primer build directo no recibió las variables ficticias de pruebas: repetido con el entorno de playwright.config.ts, correcto, sin cuentas o servicios reales. La fixture táctil requería esperar navegación antes de recargar y marcar la ayuda introductoria completada; corregida sin cambios del flujo real. Sin fallos pendientes, commits, publicación, dependencias ni DB; PRE continúa en1.15.26 anterior a estos cambios.

Revisión acotada: falta text-center y break-words divide Competiciones. Se mantiene el nombre plural con ajuste limitado; etiquetas de origen adaptativas con salto legible como último recurso. Se reutilizará un panel de scroll nativo con snap obligatorio para Liga/Mío y Próximo/Último, conservando selección explícita, privacidad y tarjetas existentes. Sin dependencias ni operaciones remotas.

Implementados FitText y MatchSlides compartidos, sin nuevas fronteras cliente. Scroll nativo snap obligatorio y panel inactivo inert; selectores y encabezado sincronizados al terminar el gesto. Liga conserva las comprobaciones de permisos/MVP/pelotas por partido. Actividad ofrece próximo/en curso y último aplicando las mismas reglas de privacidad/fechas. Primer barrido completo989/989 pasa; tipos, lint selectivo, i18n/tipografía/Mis partidos correctos. La prueba a320px detectó redondeo y mínimo tipográfico insuficiente con el padding inicial: medición fraccionaria, margen1px y padding ajustados, en reverificación. El presupuesto global sube100 líneas (133800) para los dos componentes pequeños reutilizados; sin ampliar clientes/páginas ni límites por archivo.

# MC02PRE — Publicar navegación global (2026-10-18, DONE)

Publicación verificada: PRE1.15.26 en staging8154271255bd5d6bf29485e3633d16eaddcbcc55, despliegue dpl_12iorNLo5raX1zLssBbkkBhAUZQH READY/preview y alias pre.smashandlob.com confirmado. Health200/version1.15.26/environment pre, SWcache1.15.26 y manifiesto PRE correctos; seis WAV con hashes idénticos al origen. /leagues, /leagues/all, /tournaments y /personal-matches responden200; listado API y acciones DELETE/restart con UUIDv4 ficticio responden401 sin sesión. Script de verificación completo termina exit0. Gates: validate987 pruebas/247archivos, E2E100/100, auditoría runtime0vulnerabilidades y CI380/39093637488 cuatro jobs success. Main9578fe00, tagv1.0.0e9152940 y Productiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz intactos. Sin operaciones DB ni dependencias nuevas. Evidencia en .quality-artifacts/mc02-pre-release-20261018. Google OAuth y uso físico de la PWA quedan para comprobación manual del usuario; cierre documental solo en rama de trabajo, sin republicar staging.

Usuario autoriza publicación PRE y aviso al terminar. Preparación1.15.26 sobre codex/mis-competiciones, validación aislada con lock exacto. Referencias iniciales verificadas: ramaaa600a81, staging673deac9, main9578fe00, tagv1.0.0e9152940. Solo navegación ya implementada y controles/versionado necesarios; sin DB ni dependencias. Adjuntos privados excluidos.

Candidata6652823e3bd234724c4b69d0028fabb8963c86a3 registrada, push y SHA remoto verificados; PR44 draft hacia staging creada/adjunta. Copia aislada1208 archivos idénticos; tres archivos abiertos por el sistema no se copiaron y la comparación confirmó que ya eran idénticos. Auditoría runtime0vulnerabilidades; validate y E2E globales en curso. Alias iniciales: PREdpl_AM3mLruHNpRYobDrdMQXXC7n3NDw, Productiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz. Sin publicación todavía.

E2E local completo100/100 correcto (4,5min), incluidos PWA/offline, ligas, amistosos, resumen/listados y torneos. CI380/39093637488 ya confirmó código/build, migraciones/pgTAP/restauración y Lighthouse; navegador remoto en curso. validate local termina sus pruebas/build; sin integración hasta cerrar ambos gates.

Gates completos correctos: validate987 pruebas/247archivos, lint0errores/4avisos previos, TypeScript/build1214985bytes gzip/103chunks; E2E100/100 y auditoría runtime0vulnerabilidades. CI380/39093637488 success en los cuatro jobs. PR44 integrada tras comprobar base/head/mergeabilidad: staging8154271255bd5d6bf29485e3633d16eaddcbcc55 con árbol idéntico al validado. Pendiente READY y comprobaciones PRE; sin cambios de main/Production/v1.0.0.

# MC02 — Navbar global y resumen de Competiciones (2026-10-18, DONE)

Cierre local: resumen y dos listados comparten PersonalMatchesNav con Competiciones/Mis partidos/Chats/Mi perfil y un único destino activo. Ligas y torneos mantienen sus barras sin modificaciones en BottomNav/TournamentNav. Tarjetas, permisos, orden, creación/invitación, archivos y liga recordada conservados. E2E: diez recorridos del hub en móvil/escritorio, claro/oscuro, Atrás/recarga, Chats/Perfil, entrada a liga, cuentas sin ligas y espectadores; dos happy paths de torneo completos con vuelta al hub/listado y barra exclusiva. Dos repeticiones adicionales a320px verifican límites reales del texto de cada destino, sin solapamientos. Capturas revisadas y Axe sin impactos graves/críticos. Barrido unitario: 985/987 pasan; dos contratos de código del buscador se adaptaron a /leagues/all y sus13 pruebas repetidas pasan (cobertura final987 sin fallos pendientes). Los primeros E2E del hub requerían desambiguar el acceso a crear amistoso, que aparece dos veces en Mis partidos; selector corregido sin cambiar la aplicación. TypeScript, ESLint selectivo sin errores/avisos nuevos, controles Mis partidos/i18n/tipografía/presupuesto y build1214984 bytes gzip/103chunks correctos. Presupuesto133646/133700,192clientes/49páginas cliente, sin ampliaciones. Evidencia en .quality-artifacts/mc02-20261018. Sin commits, publicación, nuevas dependencias ni operaciones DB; PRE permanece en1.15.25 sin esta interfaz nueva.

Solicitud: compartir PersonalMatchesNav entre hub, listados y espacio personal. Auditoría acotada confirma selección por pathname en AppShell y excepciones de LeagueEntryGate para acceso sin liga/temporada y espectadores. Se reutiliza el contenido del hub en un componente compartido con tres páginas: /leagues (resumen), /leagues/all (ligas), /tournaments (torneos). Sin pestañas ni bloque de amistosos: acceso por Mis partidos. Se conservan detalles, barras específicas y liga recordada. Implementación local sin publicación ni cambios de datos.

Implementado: mismo PersonalMatchesNav y cuatro destinos, Competiciones activa en las tres rutas; Shell monta una sola barra y reserva su espacio. Gate permite ambos listados sin depender de una temporada; buscador de ligas conservado en /leagues/all. CompetitionsOverview reutiliza las tarjetas/acciones/archivo originales; efectos no consultan actividad en listados ni torneos en listado de ligas. Nuevas páginas servidor, sin nuevos componentes cliente netos (192) y páginas cliente reducidas a49; presupuesto133644/133700. Pasan primeras27 pruebas focalizadas y TypeScript; i18n ES/EN/EU correcta. Pendientes regresión completa y cierre de recorridos móviles.

# T02PRE — Publicación en PRE (2026-10-17, DONE)

PRE1.15.25 confirmada: staging673deac919cac6f755f49baa05d97b337a5ff0ed, Vercel dpl_AM3mLruHNpRYobDrdMQXXC7n3NDw READY (77 s) y alias pre.smashandlob.com asociado al mismo commit/rama. Health ok/version1.15.25/environment pre, SWcache1.15.25 y manifiesto Smash & Lob PRE correctos; seis WAV con hashes idénticos al origen. /settings/sounds y /tournaments/new responden200. API listado y acciones DELETE/restart con UUIDv4 válido devuelven401 sin sesión; el primer probe usaba UUID inválido y devolvía404 por validación previa, corregido sin cambios de aplicación. Production sigue en dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz, main9578fe00 y tagv1.0.0e9152940 intactos. Sin nuevas operaciones DB ni dependencias. Evidencia en .quality-artifacts/t02-pre-release-20261017 (validación, E2E, auditoría y verification/deployment-and-ci.json). Código y SQL cubiertos por CI378; prueba física de audio/PWA por el usuario pendiente. Cierre documental en rama de trabajo sin nueva publicación de staging.

Usuario autoriza publicar para probar desde PWA. Se prepara v1.15.25 en codex/mis-competiciones, usando staging/PRE y validación aislada con lock exacto. Remotos iniciales comprobados: rama8e90d356, stagingda304d2a, main9578fe00 y tagv1.0.0e9152940. Migración 20261017125224 ya aplicada: no se repite ni modifica. Sin cambios en Production ni adjuntos privados.

Candidata bf3a4d9e registrada y push verificado en la rama; PR43 draft hacia staging creada y adjunta. CI377/39036817538 arrancada; publicación PRE pendiente de gates completos. Copia aislada: 1203 archivos idénticos al origen, sin diferencias de contenido. Auditoría runtime 0 vulnerabilidades. Alias iniciales comprobados: PRE dpl_3ssYNbBAp5gqRfXsFRysXjRZWeS3 y Production dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz. Dominio PRE ligado a staging. validate y E2E completos en curso. La tarjeta MCP open_deployments no está disponible; seguimiento mediante API/CLI sin cambiar el destino.

Primer E2E global: 94/96 correctos; fallan solo dos referencias visuales de Ajustes por añadir la fila Sonidos y avisos (84 px más en móvil y 64 en escritorio). Capturas actual/esperada revisadas: se conserva el resto del contenido y se actualizan exclusivamente esas dos referencias. CI377 ya confirmó código/build, pgTAP/restauración y Lighthouse; nueva candidata con referencias requiere CI del nuevo HEAD. Sin integración ni publicación todavía.

Candidata final a03d7e67179545cdf8a8c7d24758b5e04ae43b49 subida y verificada. validate termina con 971 pruebas/246 archivos, lint0errores/4avisos previos, TypeScript/build/presupuestos correctos (1214843 bytes gzip/103 chunks); auditoría runtime0vulnerabilidades. Repetición de las dos referencias de Ajustes correcta: cobertura final de los 96 casos E2E sin fallos pendientes. PR43 lista para revisión y CI378/39037110981 en curso antes de integrar staging.

CI378/39037110981 termina success en los cuatro jobs. SQL pgTAP/restauración: 81 aserciones/3 archivos pasan antes/después de restaurar, incluidas 43 de torneos. PR43 integrada tras verificar base/head/mergeable: staging673deac919cac6f755f49baa05d97b337a5ff0ed, árbol idéntico al validado. Pendiente READY y comprobación de alias/version/PWA. Sin cambios de Production.

# T02 — Avisos y gestión de finalizados (2026-10-17, DONE)

Cierre: migración 20261017125224 aplicada mediante CLI exclusivamente en PRE y registro SQL/version/nombre verificados; dry-run posterior upToDate sin pendientes. Funciones SECURITY INVOKER con search_path vacío, sin permisos anon/authenticated. Verificación SQL transaccional sintética confirmó bloqueos por estado/propietario, reinicio con nueva hora y doce marcadores vacíos, cruces intactos, segundo registro/finalización y eliminación con cascada aislada. Rollback ejecutado y cero cuentas @t02-tests.invalid restantes. Asesor de seguridad sin referencias a las funciones nuevas. pgTAP versionado ampliado a 43 aserciones, sin ejecutarlo por falta de Docker/pgTAP; la verificación SQL equivalente en PRE sí pasó. Gates finales: 971 pruebas/246 archivos, cinco E2E móviles (tres regresiones hub y dos happy paths), TypeScript, lint 0 errores/4 avisos previos, i18n/tipografía/API y presupuesto correctos; build final 1214843 bytes gzip/103 chunks. Revisadas capturas a 393×852 claro/oscuro, Axe y anchura de 320 px. Localhost responde 200 en /settings/sounds y /tournaments/new. Evidencia en .quality-artifacts/t02-20261017; copia aislada tournaments-pre-validation con lock exacto. Sin commits, publicación de interfaz, cambios de main/Production/v1.0.0 ni modificación de migraciones ya aplicadas. Para probar en la PWA del móvil falta publicar esta interfaz en PRE; volumen/voz/Bluetooth físicos siguen como comprobación manual. Reinicio temporal disponible hasta 25 octubre, eliminado por servidor desde 2026-10-26T00:00:00Z; borrado permanente solo de torneos finalizados.

Auditoría acotada: Ajustes agrupa preferencias personales (idioma, apariencia y notificaciones), con buscador central. Se añadirá Sonidos y avisos junto a Notificaciones, independiente de liga y reutilizado en Seguimiento. Preferencias locales conservan la clave actual; se ignoran voces antiguas. Reinicio temporal local/PRE hasta 25 octubre y borrado solo de finalizados mediante controles del creador y confirmación explícita. Migración nueva para reinicio atómico, sin modificar las aplicadas. Sin publicación ni commits autorizados en este hito.

Implementación: panel compartido, ocho tonos (añadidos carillón/bocina/sonar/arcade), prueba desde Ajustes, voz automática, traducciones EN/EU y entrada en buscador para jugador/espectador. Reinicio restablece los dos minutos de preparación desde now(), limpia marcadores en una transacción y conserva cruces; borrado con cascadas existentes y estado finished. API comprueba creador, estado, límite de solicitudes y ventana temporal/entorno del reinicio. Preparada 20261017125224_rapid_tournament_finished_management.sql. Primeros gates correctos: 24 pruebas de torneos y 21 de audio/API/búsqueda (cobertura solapada), TypeScript/ESLint selectivo y controles estáticos. Presupuesto total ajustado de 133500 a 133700 y clientes 191→192 por la página compartida; páginas cliente siguen en 50. Validación aislada con lock exacto; pendiente cierre E2E y SQL, sin operaciones de escritura remotas.

Gates locales: 971 pruebas/246 archivos correctos, lint global 0 errores/4 avisos previos, TypeScript y build correctos. Tres regresiones móviles del hub correctas; repetición de los dos happy paths móviles completa (44/46 s), con Ajustes/preview/persistencia/vuelta, ausencia de voces, ocho sonidos, reinicio cancelado/confirmado y borrado cancelado/confirmado. Capturas 393×852 claro/oscuro revisadas; Axe sin incidencias graves/críticas y anchura 320 px correcta. Corregido selector de prueba tras añadir indicador de desplegable (ahora pseudo-elemento CSS). PRE identificado de nuevo y CLI ligado a miadjotkucgluwbrgeih; dry-run ofrece exclusivamente 20261017125224_rapid_tournament_finished_management.sql. Se aplica solo esa migración, conforme a la autorización PRE original del módulo, sin publicar la app ni usar datos reales en pruebas. No hay Docker/pgTAP local ni pgTAP en PRE; se verificará mediante SQL transaccional sintético con rollback.

# T01APRE — Publicación de avisos en PRE (2026-10-17, DONE)

PRE1.15.24 confirmada: staging da304d2affba0300f831e9fe3df0eb30d9ef1b16, Vercel preview dpl_3ssYNbBAp5gqRfXsFRysXjRZWeS3 READY y alias pre.smashandlob.com correcto. Health ok/version1.15.24/environment pre; SWcache1.15.24 y manifiesto Smash & Lob PRE correctos. Seis WAV descargados del dominio protegido y SHA256 idéntico al local; API torneos401 sin sesión Google. Production sigue en dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz, main9578fe00 y tagv1.0.0e9152940 intactos. Sin DB, migraciones ni dependencias modificadas. Evidencia en .quality-artifacts/avisos-pre-release-20261017 (logs, verification.json y CI). Prueba física de volumen, voces y Bluetooth pendiente del usuario; no se afirma automatizada. Registros finales en rama de trabajo sin nueva publicación de staging.

Usuario autoriza publicación en PRE para pruebas móviles. Preparación v1.15.24 sobre codex/mis-competiciones, con validación aislada usando lock exacto. Se incluyen únicamente cambios de avisos ya implementados y sus pruebas; sin dependencias o DB nuevas. Adjuntos privados excluidos. Pendientes gates, subida e identificación/validación de despliegue y audios.

Candidata registrada en a9a70073, versión/SW/changelog coherentes. Vercel proyecto y ramas comprobados: PRE ligado a staging; ProductionBranch main y despliegue Production anterior intactos. Copia aislada comparada con 1199 archivos versionados: contenido idéntico (62 diferencias solo CRLF/LF). Auditoría runtime 0 vulnerabilidades. validate y E2E completos en curso; sin push todavía.

Push a9a70073 verificado en codex/mis-competiciones. PR42 draft hacia staging creada/adjunta; CI375/39026968565 iniciada en paralelo al cierre local. E2E completo 96/96 correcto (3,7 min); lint completo 0 errores/4 avisos y TypeScript correctos. validate sigue con pruebas/build. Ningún merge ni publicación PRE todavía. Rollback PRE disponible: dpl_7vkBsRohkgGTrsAUyeCupa52C523/v1.15.23.

Gates locales completos correctos: validate (967 pruebas/246 archivos, TypeScript, lint0errores/4avisos, build1211357 bytes gzip/102chunks) y 96/96 E2E, con auditoría runtime0vulnerabilidades. PR42 lista para revisión y descripción actualizada; solo falta CI y despliegue/verificación PRE. Sin cambios adicionales a la candidata a9a70073.

CI375/39026968565 completada success en los cuatro jobs. PR42 integrada tras comprobar base/head/mergeable: staging da304d2affba0300f831e9fe3df0eb30d9ef1b16, mismo árbol validado. Pendiente Vercel READY/alias y comprobaciones de versión/SW/WAV. Main/Production sin promoción.

# T01A — Avisos configurables (2026-10-17, DONE local)

Usuario autoriza configuración plegable de sonido, intensidad, modo, idioma y voces; preferencias en el dispositivo, bilingüe EN→ES con pausa y cuenta atrás en los últimos tres segundos. Implementación local sobre codex/mis-competiciones, sin operaciones remotas ni cambios de calendario/DB. Pendiente validación y revisión móvil.

Cierre: 21 pruebas focalizadas con lock exacto correctas; TypeScript, ESLint selectivo, i18n, tipografía, presupuesto (133487/133500) y build pasan. Dos happy paths móviles claro/oscuro completos comprueban voces/idioma/intensidad/sonido guardados tras recarga, vista de configuración, prueba bilingüe en orden, tres números preparados a 3/2/1 segundos, cambios de fase, resultados y cierre. Tres regresiones del hub pasan. Axe sin errores graves/críticos y 320 px sin desbordamiento en el recorrido existente. Capturas 393×852 revisadas en .quality-artifacts/avisos-torneos-20261017, junto al log final. Preview local HTTP200. Las voces reales, sonoridad y latencia Bluetooth requieren prueba física; el límite de volumen lo fija el dispositivo y la cuenta atrás usa muestras fijas. PRE permanece en la publicación anterior; sin commits, push, despliegue, DB ni dependencias nuevas.

Implementados combos nativos, cuatro señales sintetizadas, intensidad alta con margen frente a saturación, voz elegida por idioma y fallback automático. Seis muestras PCM cortas (EN/ES, menos de 0,5 s) para la cuenta atrás, precargadas una vez; bilingüe cuenta en inglés una sola vez. Mensajes EN→pausa de 600 ms tras terminar→ES; cancelación al silenciar/ocultar/cambiar ajustes/recibir otro aviso. Preferencias versionadas y validadas en localStorage. Reloj local alineado a segundos del inicio real, sin modificar horarios ni añadir polling de servidor. TypeScript, ESLint, i18n y 21 pruebas focalizadas correctos con lock exacto en copia aislada; E2E y revisión móvil en curso. No se amplía presupuesto (133487/133500 líneas).

# T01PRE — Publicación de competiciones/torneos en PRE (2026-10-17, DONE)

Publicación confirmada: staging fc51efce7a5a283934c49c5c1fefae0bad5647ff, Vercel PRE dpl_7vkBsRohkgGTrsAUyeCupa52C523 READY/preview y alias pre.smashandlob.com apuntando a ese ID. GET protegido mediante Vercel CLI: health200/version1.15.23/environment pre; sw.js cache smash-lob-v1.15.23; manifest Smash & Lob PRE/start_url launch; creación /tournaments/new200 y APIs listado/detalle401 sin sesión Google. Production permanece en dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz; main9578fe00/tagv1.0.0e9152940 verificados intactos. Sin reaplicar migraciones ni modificar datos remotos. CI PR41 completa success (cuatro jobs); árbol integrado idéntico a candidata validada. La comprobación física de Google OAuth, actualización de la PWA, voz/volumen y bloqueo en móvil la realiza el usuario; no se afirma automatizada. La evidencia y estos registros finales quedan en la rama de trabajo sin provocar una nueva publicación de staging.

CI373/38978349217 completada success en sus cuatro jobs: código/build, navegador/PWA, migraciones/pgTAP/restauración y Lighthouse. PR41 integrada tras verificar base/head/mergeable: staging fc51efce7a5a283934c49c5c1fefae0bad5647ff. Vercel confirma ProductionBranch main y dominio PRE ligado a staging. Pendiente READY/alias/health del despliegue nuevo; sin promoción Production.

Push verificado por ls-remote: codex/mis-competiciones 9911d5fe. PR41 hacia staging creada/adjunta; CI release quality373/38978349217 en cola. Main9578fe00/tagv1.0.0e9152940 intactos. No se considera el preview de rama una publicación de PRE; falta CI, merge y READY/alias/health de staging. Evidencia local copiada a .quality-artifacts/torneos-pre-release-20261017.

Gates locales completos en copia exacta: npm run validate correcto (960 pruebas/245 archivos, TypeScript, lint 0 errores/4 avisos, build 1207758 bytes gzip/102 chunks); npm run test:e2e 96/96, incluidas visuales/Axe, americanas claro/oscuro, ligas/amistosos y PWA offline. Auditorías completa/runtime 0 vulnerabilidades. Se prepara push y PR a staging; ninguna promoción a main/Production.

Dependencias exactas instaladas en copia aislada (Next16.3.8/Vitest4.1.11), auditorías completa/runtime con cero vulnerabilidades. Guards/inventario corregidos en 93ebef70; fixture pgTAP corregida en 5388d2e8 para iniciar antes de guardar resultados y ampliada a 28 aserciones de estados/propietario. No se altera SQL de migraciones. Lint completo pasa con cuatro avisos existentes; validación integral y E2E en curso. Sin push ni publicación todavía.

Usuario autoriza subida de rama y cambios a PRE para pruebas PWA. Proyecto Vercel smash-lob/prj_KKbbsbzdVsZQNvNfU1ZNvAbqwPvM verificado; credenciales PRE ligadas a staging. v1.15.23 registrada en 4fec1443, base staging integrada en bd340c38. Copia aislada gestionada tournaments-pre-validation: npm ci exacto en curso, conservando localhost (dependencias antiguas). Migraciones 20261016091645/20261016091719 verificadas ya aplicadas en PRE, sin reaplicarlas. Inventario API detectó la nueva guarda no reconocida: se registra requireRapidTournamentCreator como guarda exclusiva de propietario autenticado, sin añadir rutas públicas; inventario regenerado antes de gates. Rollback PRE dpl_6fiDVFPEcnW5vjWYG2Bu6L9KrBnK; Production dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz intacta. Adjuntos privados excluidos. Sin push aún.

# T01H — Cabeceras compactas de torneos (2026-10-16, DONE)

Comparada la Home de ligas: mismo título semántico de 1,5 rem y contexto compacto. Nombre a ancho completo; fecha breve, hora/inicio real y estado en una fila que ajusta naturalmente; ubicación debajo en 0,75 rem. Menos padding y sin chip lateral ni fila separada Inicio real. Descripción solo en Resumen, fuera de la cabecera. Compartido por Resumen, Calendario, Clasificación, Jugador y Seguimiento; creación compactada también. ESLint selectivo, TypeScript, tipografía, i18n, presupuesto (133339 líneas), build y dos happy paths móviles claro/oscuro correctos, con Axe y anchura 320 px. Capturas 393×852 de creación y seguimiento revisadas en .quality-artifacts/torneos-visual-20261016/cabecera-compacta-*.png. Sin cambios de Home, navegación, datos, migraciones, commits ni despliegue.

# T01L — Seguimiento del torneo desde inicio real (2026-10-16, DONE)

Reutilización del started_at que ya persiste la RPC de inicio, sin migración. Calendario efectivo y reloj local: 2 min de preparación, seis rondas de 16 min y cinco pausas de 3 min (113 min; margen 7 min). Inicio abre Seguimiento y habilita audio mediante gesto; controles activar/silenciar/probar y Wake Lock opcional. Tono/voz al empezar, dos minutos restantes y fin; sin música continua ni llamadas por segundo. Reloj detenido al ocultarse y recuperación al volver; avisos atrasados omitidos. Pasan 36 pruebas focalizadas (incluidas navegación de ligas/Mis Partidos), ESLint selectivo, TypeScript, i18n, tipografía, presupuesto 133338 líneas y build. Dos happy paths móviles claro/oscuro validan preparación/ronda/aviso/pausa/fin, recarga, sonido silenciado/no disponible, Wake Lock no disponible/liberado/recuperado y resultados/clasificación/finalización; tres regresiones móviles del hub pasan. Axe sin incidencias graves/críticas y anchura 320 px sin desbordamientos; capturas 393×852 revisadas en .quality-artifacts/torneos-visual-20261016/seguimiento-*.png. Preview localhost responde HTTP200. Audio y Wake Lock simulados: volumen/voz real y bloqueo físico requieren prueba manual con la PWA visible en dispositivo compatible (HTTPS en PRE). No se garantizan avisos bloqueado/en segundo plano. Sin datos remotos, migraciones, dependencias, commits ni despliegue.

# T01N — Vuelta a Mis Competiciones (2026-10-16, DONE)

Reproducido Invalid option en los tres idiomas con un torneo existente: dateStyle no admite hour/minute. Sustituido por dateStyle + timeStyle. Añadida regresión unitaria ES/EN/EU con listado no vacío y recorrido E2E de vuelta desde torneo al hub en borrador y finalizado. Pasan 8 pruebas focalizadas, ESLint selectivo, TypeScript, i18n, build y dos happy paths móviles claro/oscuro con esas vueltas al hub. Sin cambios de datos ni commit.

# T01VC — Calendario compacto para móvil (2026-10-16, DONE)

Seguimiento CSS: Descansan · 4 y los nombres empiezan en la misma línea, separados por puntos, sin cápsulas ni bordes individuales; ajuste natural de línea para nombres largos. Captura completa 393×852 revisada y actualizada; tipografía, build y los dos happy paths móviles claro/oscuro con accesibilidad y 320 px correctos. Sin cambios funcionales.

Cabeceras más bajas, tarjetas con radios de 12 px y borde de 1 px como AppCard; nombres con type-player-name compartido y ajuste multilínea. Solo Pista 1/2 en los partidos; ubicación recuperada del snapshot existente y mostrada una vez bajo la fecha. Retirados títulos Pareja 1/2 y selector rápido de rondas. ESLint, TypeScript, i18n, tipografía, presupuesto (133091 líneas) y build correctos; dos happy paths móviles claro/oscuro completos, con accesibilidad y comprobación adicional a 320 px. Capturas completas revisadas y exportadas a 393×852 píxeles a escala CSS en .quality-artifacts/torneos-visual-20261016/calendario-movil-393-compacto-{claro,oscuro}.png. Sin cambios de datos ni commit.

# T01V — Pulido visual de torneos (2026-10-16, DONE)

Creación con paneles numerados, participantes en dos columnas, opciones futuras plegadas y resumen final compacto. Calendario agrupado por ronda, parejas separadas con nombres individuales, pistas diferenciadas y descansos al pie; editor de resultados bajo demanda. Navbar con etiquetas breves y columnas que no crecen por el texto. Estilos aislados en Tournament.module.css, adaptados a claro/oscuro/Competition. ESLint selectivo, TypeScript, i18n, tipografía, presupuesto (133088 líneas) y 11 pruebas focalizadas correctos. Cuatro happy paths E2E mobile/escritorio claro/oscuro pasan, con registro de doce resultados, corrección, cierre con campeón, combos bloqueados, saltos entre rondas, 320 px, texto ampliado y nombres largos. Seis regresiones E2E del hub/amistosos correctas; Axe no detecta incidencias graves o críticas en creación/calendario. Build correcto dentro de Playwright. Capturas finales revisadas y guardadas en .quality-artifacts/torneos-visual-20261016. Sin cambios de datos, migraciones, tema de ligas, barra de gestos ni commit.

# T01 — Torneo rápido Americana 12 jugadores (2026-10-16, DONE)

Happy Path en `codex/mis-competiciones`: formulario mobile-first, plantilla fija A–L, sorteo previo a iniciar, rutas privadas por creador, resumen/calendario/clasificación individual/partidos-descansos/seguimiento, edición de marcadores y cierre con campeón(es). Incluye pruebas unitarias, integración API, prueba SQL pgTAP versionada y E2E. La migración `20261016091645_add_rapid_tournaments_v1.sql` crea cuatro tablas con RLS, accesos directos revocados y RPC transaccionales; `20261016091719_add_rapid_tournament_fk_indexes.sql` cubre las nuevas claves foráneas. Ambas aplicadas y listadas en Supabase PRE `smash-lob-staging` / `miadjotkucgluwbrgeih`. PROD `szycbwdzestcmimziyey` no se tocó. Una verificación DO en PRE validó roles, creación de 12 jugadores/seis rondas/doce partidos, inicio, bloqueo del sorteo, persistencia de doce resultados y finalización; usó una cuenta sintética borrada al terminar, y una consulta posterior confirmó cero filas de esa cuenta. Asesores Supabase: sin claves foráneas nuevas sin índice; el aviso de seguridad para estas tablas es informativo por RLS cerrado sin políticas (el API usa service role tras autenticar y comprobar propietario). No hay Docker y PRE no tiene pgTAP, así que `database:quality` no se pudo ejecutar; prueba SQL transaccional PRE sí pasó. TypeScript, traducciones, presupuesto 133500 (133044 líneas), ESLint selectivo, build, 953 tests/244 archivos y cuatro E2E mobile pasan. `npm run lint` global se interrumpió después de más de cuatro minutos sin salida, sin reportar diagnósticos; todos los archivos afectados pasan `npx eslint`. Sin migraciones previas modificadas, dependencias añadidas, commits, publicación ni cambios de Prod. No se aplicó tema de liga al torneo y ligas/amistosos siguen cubiertos por las pruebas de regresión.

- Ajuste local del alta (2026-10-16): una sola pantalla con modalidad/formato antes de información general, sin subtítulo que anticipe parámetros; ubicación del catálogo global con etiquetas duplicadas filtradas y número de pistas visible pero bloqueado en 2. La reserva de 120 minutos permanece como dato fijo de la americana; no aparece selector de duración. La sede seleccionada se guarda en los nombres de pista existentes junto al calendario, sin cambio de esquema. ESLint selectivo, i18n, TypeScript, 10 pruebas unitarias/integración y E2E mobile de creación→finalización correctos. Sin cambios de migración, datos remotos ni commit.
- Ajuste UX del alta (2026-10-16): modalidad y formato ahora son combos nativos; la configuración activa está preseleccionada y las alternativas futuras aparecen bloqueadas con sus explicaciones debajo. E2E mobile comprueba valores iniciales, opciones deshabilitadas y dos pistas fijas; ESLint, i18n y TypeScript correctos; happy path E2E pasa. Sin cambios de datos, migraciones ni commit.

# MC01P — Actividad personal más ligera (2026-10-16, local)

DONE: Ver Mis partidos pasa a la cabecera de Actividad personal; la tarjeta reutilizada recibe una opción de presentación para ocultar fecha/lugar únicamente cuando representa el último encuentro. Valor por defecto conserva historial/próximos y detalle intactos. Lint de los tres archivos afectados, TypeScript, 10 pruebas focalizadas y presupuesto de código correctos (132148 líneas). Build y seis recorridos Playwright correctos con fixtures; nueva regresión confirma ausencia de fecha/lugar en resumen y conservación en historial. Capturas móvil/escritorio revisadas; diff correcto y preview local HTTP200. Evidencia: `.quality-artifacts/mis-competiciones-20261016/e2e-hub-polish.log`. Sin cambios de datos/rutas/tema, commits ni publicación.

# Popup Competition simplificado — 2026-10-08 (publicado en PRE y PROD)

- Solo título NUEVO TEMA OSCURO DISPONIBLE, botones APLICAR AHORA / AHORA NO y línea enlazada a Temas y apariencia. Ambas acciones cierran el popup; solo Aplicar cambia el tema. Retirados descripción, confirmación y cierre extra. Traducciones EN/EU y pruebas adaptadas. 7 tests focalizados, ESLint, TypeScript, i18n, presupuesto de código y diff correctos; Título reducido a text-sm/seminegrita, como botones. Publicación PRE/PROD v1.15.8 autorizada; validación aislada completa correcta: 818 tests/212 archivos, todos los controles estáticos, lint, TypeScript, build 1096294 bytes gzip/99 chunks y auditoría runtime 0 vulnerabilidades. PRE dpl_Df7eKWyAZerwGmmaFqGBGoKJaWHg Ready; alias y health v1.15.8/pre verificados, portada/Avatar Lab 200 y API 401. Rama/staging 02c3c4a1, SHA remoto verificado. PROD dpl_GUPEGiXzsg49ymCjiqkZ2t1uc7ee Ready y dominio verificado, smoke:prod v1.15.8/prod correcto. Main/staging 02c3c4a1 coinciden. Evidencia posterior solo en rama de trabajo. Sin navegador ni cambios de localhost.

# Aviso Competition en popup — 2026-10-08 (publicado en PRE y PROD)

- Sustituido banner de Inicio por diálogo modal nativo centrado al entrar en cualquier pantalla autenticada de la aplicación, con foco y Escape gestionados por dialog; instrucciones conservadas después de aplicar y enlace a Temas cierra el popup. Cierre persistente por cuenta/dispositivo con clave v2 independiente del banner anterior. Sin cambio automático de tema. 20 tests focalizados, ESLint, TypeScript, tipografía y diff correctos; Publicación PRE/PROD autorizada por usuario, v1.15.7 preparada. Validación completa aislada correcta: npm ci, todos los controles estáticos, lint, TypeScript, 818 tests en 212 archivos, build y presupuesto (1096269 bytes gzip/99 chunks); auditoría runtime 0 vulnerabilidades. Compactado changelog para respetar límite existente sin cambiar presupuesto. Staging/rama publicados en 190b5665 y SHA remoto verificado. PRE dpl_DdYQ27oCKC85LeDPmmKQ5kGkBq7q Ready, alias pre.smashandlob.com y health v1.15.7/pre verificados; portada y Avatar Lab 200, API protegida 401. PROD dpl_HnZmCdJUmaQabxB9kN1K7hP331P3 Ready y dominio smashandlob.com verificado contra ese deployment; smoke:prod correcto v1.15.7/prod. Main/staging coinciden en 190b5665. Evidencia posterior solo en rama de trabajo, sin nuevo cambio de aplicación. Sin navegador ni cambios de localhost.

# Competition para todos — 2026-10-08 (publicado en PRE y PROD)

- Rama codex/competition-dark-polish actualizada por fast-forward a la versión publicada v1.15.5. Competition disponible para todos sin allowlist ni flags antiguos; Clásico sigue como valor por defecto. Aviso en Inicio para usuarios autenticados, aplicación explícita en oscuro, confirmación y acceso a Ajustes → Temas para revertir; cierre persistente por cuenta/dispositivo con alternativa en memoria. Traducciones EN/EU. 18 tests focalizados correctos, TypeScript, ESLint, i18n, presupuesto de código y diff correctos. Usuario autoriza promoción a PRE y PROD. Versión v1.15.6 preparada (paquetes, cache PWA, etiqueta, changelog y smoke). Validación aislada: npm ci, controles estáticos, lint, TypeScript, i18n y presupuestos correctos; auditoría runtime 0 vulnerabilidades. 817/818 tests correctos inicialmente; corregido centrado explícito del CTA detectado por la prueba transversal, repetición de 20 tests afectados correcta (cobertura total 818 sin fallos pendientes). Build y presupuesto correctos: 1096129 bytes gzip / 99 chunks. Rama y staging publicados en 3ceab008, SHA remoto verificado. PRE dpl_4k1jPZPm7pbR1b7vmeim1oJw1i6X Ready, alias pre.smashandlob.com asignado y health v1.15.6/pre verificado; portada/Avatar Lab 200 y API protegida 401. PROD dpl_E98oaGRkZuoWPXowy4AEG8DkDnsC Ready y dominio smashandlob.com verificado; smoke:prod correcto en v1.15.6/prod. Main/staging remotos coinciden en 3ceab008. Evidencia posterior publicada solo en rama de trabajo. Sin pruebas visuales ni cambios del servidor localhost.

# Publicación v1.15.5 — 2026-10-08 (publicada en PRE y PROD)

- Usuario autoriza promoción de todo lo pendiente a PRE y PROD. Origin verificado: PRE f4ec3eb2, PROD d4120627; diferencia únicamente heartbeat y documentación. Competition 90b4f0c9 más cambios locales de calendarios/pagos/chats pendientes. Sin migraciones nuevas. Validación aislada en worktree release-calendar-ui con credenciales ficticias, sin tocar servidor localhost.
- Contratos estáticos de enlace de jornada, nombres completos, puntos de estado, alineación centrada y calendario común actualizados a comportamiento acordado. Auditoría bloqueó promoción: Next 16.3.5 crítico, sharp 0.35.4 y source-map-js altos. Preparados parches explícitos Next/eslint-config-next 16.3.8, sharp 0.35.5 y source-map-js 1.2.2; lockfile actualizado y auditoría runtime con 0 vulnerabilidades. Primera validación completa correcta: 813 tests en 211 archivos, lint, TypeScript, build 1095127 bytes gzip. Dependencias corregidas instaladas y auditoría runtime repetida con 0 vulnerabilidades; Validación parcheada: todos los controles estáticos/lint/TypeScript pasan; 811 tests correctos y dos cálculos con timeout bajo ejecución concurrente. Repetición aislada de esos 8 tests pasa (20/24 jugadores en 619/962 ms). E2E: 66 correctos, cuatro referencias de Calendario/Ranking cambian por selector compartido y entrada arriba sin autoscroll, cambios solicitados; referencias revisadas y actualizadas, las cuatro repeticiones correctas. Cobertura final 813 tests y 70 E2E sin fallos pendientes; build parcheado correcto. Rollback verificado: PRE dpl_4jkYGgBRLbnYDHFRKnuxqBr78kJS y PROD dpl_48ZT2EwiHoQkH4mi6DLUsNfm4ZBG, ambos Ready. Rama y staging publicados en 60426d55, SHA remoto verificado. PRE dpl_Dkp1qWrdvtFQS8iPQN5deR4qgGuY Ready y dominio pre.smashandlob.com asignado y verificado: health v1.15.5/pre, portada/manifest/session/providers 200, Avatar Lab 200 y API protegida 401. PROD dpl_7CYAoP7AWWoHbFPJZk7hQYvqiTNr Ready; dominio smashandlob.com verificado contra ese deployment, health v1.15.5/prod y npm run smoke:prod correctos (portada, Avatar Lab oculto y API bloqueada). Main/staging remotos coinciden en 60426d55. Build parcheado 1095217 bytes gzip/99 chunks. Documentación posterior se publica solo en rama de trabajo para evitar nuevos despliegues sin cambios de aplicación. Realtime no se ha corregido; la comparación entre dos clientes PRE queda pendiente de diagnóstico. Servidor localhost y node_modules originales intactos.

# Calendarios multiplataforma — 2026-10-08 (desarrollo local)

- Chat: resumen fijado de programación también para partidos programados manualmente; retirada dependencia de courtBooking.isReserved, conservando condición de estado scheduled y fecha. 10 tests focalizados, ESLint, TypeScript y diff correctos. Sin navegador ni commit.

- Chats: etiquetas sustituidas por puntos de estado con colores correspondientes; contador de mensajes separado. Botón accesible independiente del enlace del chat (sin controles interactivos anidados) muestra/oculta texto de estado al pulsar, válido para teclado y móvil. ESLint, TypeScript y diff correctos. Sin navegador ni commit.

- Chats: separación entre fila Jornada/etiquetas y jugadores ampliada de mt-0.5 a mt-2 en las tarjetas compartidas por todos los temas. ESLint y diff correctos. Sin navegador ni commit.

- Cómo llegar y Añadir al calendario unificados en seminegrita en programación de partidos y amistosos. Peso explícito en el botón de calendario para superar el font inherit global. ESLint y diff correctos. Sin navegador ni commit.

- Transferencias pendientes propias ordenadas primero con sort estable sobre copia filtrada; tarjetas resaltadas mediante el mismo tono blue de la etiqueta. Pagadas sin resaltar, agrupación y permisos conservados. ESLint y diff correctos. Sin navegador ni commit.

- Transferencias: importe y acción agrupados en una columna derecha junto a Paga/Recibe; eliminada fila inferior independiente. Permisos conservados. ESLint y diff correctos. Sin navegador ni commit.

- Acciones de transferencia compactas, alineadas a la derecha debajo de nombres/importe: ✓ Marcar pagado para deudor o receptor autorizado, ↩ Marcar pendiente para receptor cuando ya está pagada. Permisos conservados. ESLint y diff correctos. Sin navegador ni commit.

- Transferencias: importe a la derecha de Paga/Recibe, retiradas etiquetas de estado por tarjeta. Agrupación pendiente/pagada con títulos separados, conservando controles y permisos. ESLint, i18n y diff correctos; TypeScript y 6 tests correctos. Sin navegador ni commit.

- Partido: fila título/estado centrada verticalmente; reglas de distribución app-match-header-row extendidas a todos los estilos. Panel de pagos ya compartido sin condiciones por tema: se oculta Bolas compradas por si no hay comprador y los importes de transferencia usan text-base/font-black. 13 tests focalizados, ESLint y typography:check correctos; TypeScript y diff correctos. Sin navegador ni commit.

- Etiquetas de pagos alineadas a la derecha junto al chevron; cabecera centrada verticalmente. ESLint y diff correctos. Sin navegador ni commit.

- Iteración etiqueta de pagos: vuelve junto al título; deudas propias y cobros pendientes muestran PENDIENTE - importe en azul. En caso mixto se conservan dos importes independientes, con title y nombre accesible que distinguen pagar/cobrar. Estados sin importe conservados. ESLint y diff correctos. Sin navegador ni commit.

- Reorganización Pagos y reservas: estado personal debajo de las casillas de preview, visible contraído; tarjetas de transferencia con Paga/Recibe en filas independientes, nombres completos con ajuste de línea y columna flexible. Importe y estado debajo, acciones de pago en fila propia de ancho completo. Cálculos y permisos conservados. ESLint e i18n correctos; TypeScript, quality:source y diff correctos. Sin navegador ni commit.

- Pagos y reservas: etiqueta de cabecera sustituye Guardado/Pendiente por estado económico personal: Por completar, Pendiente de pagar con importe (ámbar), Pendiente de cobrar con importe (azul), Pagar/Cobrar con importes independientes (ámbar), Tu parte saldada y Todo saldado (verde). Administradores ajenos al partido ven Pagos pendientes en lugar de una afirmación personal. Los importes se suman en céntimos y solo cuentan transferencias sin marcar pagadas. Preview Total/Pagan/Pend. conservada contraída; explicación solo expandida con mt-3 bajo cabecera. 16 tests de estados y flujos correctos, ESLint, TypeScript, i18n, quality:source y diff correctos. La primera pasada i18n detectó Pagar sin traducción, añadida y repetida correctamente. Sin navegador, commit ni publicación.

- Ajuste solicitado: retirados Recordar mi elección, Elegir otro calendario y todo acceso a preferencias persistentes. Cada pulsación abre el selector, incluso si existe una preferencia antigua en localStorage. Retiradas las reglas CSS Competition que convertían app-match-actions en una fila relativa dentro de cabecera y abrían el menú hacia abajo; vuelve el fixed original con columna vertical, right responsive y bottom con safe-area. Esa recolocación procedía del pulido visual previo, no de la exportación de calendarios. 14 tests de selector/exportación/chat correctos, ESLint e i18n correctos; TypeScript, quality:source y diff finales correctos. Sin navegador ni commit.

- Rama codex/calendar-provider-choice creada desde 90b4f0c9, manteniendo los cambios Competition ya publicados. Selector común Google Calendar / Apple Calendar y otros (.ics), preferencia opcional local y acceso para cambiarla. Integrados partido de liga, mensajes de reserva, tarjeta fijada clickable, amistosos y jornada de apertura. Sin OAuth adicional ni escritura automática en calendarios.
- Exportación ICS con UTC, duración por defecto de 120 minutos para partidos y fin real en apertura, UID estable, escaping y plegado UTF-8 a 75 octetos. Google usa los mismos instantes UTC, evitando diferencias por zona del dispositivo. Los eventos exportados son copias; no se implementa sincronización de cambios posteriores.
- 25 tests focalizados en 6 archivos correctos, incluyendo cambios de hora, caracteres especiales, identidad, preferencia, cancelación y descarga. i18n, quality:source y diff correctos. Contratos antiguos actualizados para la tarjeta clickable, manteniendo fijación sobre el historial y estilos en amistosos. TypeScript y ESLint finales correctos. Sin pruebas visuales ni navegador por petición del usuario; importación efectiva en Calendario de iPhone queda como comprobación manual en dispositivo. Sin commit ni publicación.

# Correcciones Competition oscuro — 2026-10-08 (publicadas en rama)

- Publicación autorizada por el usuario: commits 3dda9839 (visual y detalles históricos) y 5f583cc5 (selección compartida y orden cronológico) publicados en origin/codex/competition-dark-polish. SHA 5f583cc521a11b01ed17603525678908add555a3 confirmado con git ls-remote. Validación final: 52 tests en 10 archivos, TypeScript, ESLint sin errores (11 advertencias previas de Administración), i18n, secrets:check, quality:source y diff correctos. Documentación de revisión incluida a continuación; main, staging, PRE y PROD no promovidos. Las notas «sin commit» inferiores describen los checkpoints anteriores.

- Selector de temporada compartido entre HOME, Mi perfil, Calendario, Ranking y Chats. useCurrentLeagueData suscribe cambios de selección para actualizar contenido sin navegar. Cabecera Calendario ajustada: diana absoluta sin ampliar la fila del título; alturas medidas en Calendario, Ranking y Chats iguales (65,34 px en viewport actual). 34 tests focalizados correctos; contratos estructurales adaptados al componente compartido y al nombre completo en Chats ya implementado. ESLint, TypeScript, i18n, typography:check, quality:source (132195 líneas) y diff correctos. Sin commit ni publicación.

- Calendario: acceso a jornada en curso convertido en botón circular de diana a la derecha del título, con nombre accesible y tooltip; retirada la fila independiente. ESLint, TypeScript, typography:check, dos tests de calendario y diff correctos. Sin commit.

- Títulos de pantalla Competition: retirado text-transform uppercase de type-page-title; escritura original de los textos, tamaño y peso conservados. typography:check y diff correctos. Sin commit ni publicación.

- Orden de temporadas en HOME y Mi perfil: criterio compartido por created_at descendente, independiente de nombre y estado. La API de acceso incluye la fecha existente y entrega orden ascendente; snapshots de creación/duplicación/actualización conservan la fecha, y creaciones locales la añaden. Sin migraciones. Verificado tras recargar: Temporada 3, 2, 1 en ambos menús. 17 tests focalizados correctos, ESLint y TypeScript correctos, quality:source dentro del límite (132247 líneas) y diff correcto. Sin commit ni publicación.

- Calendario y Mi perfil: eliminada la llegada automática a jornada activa; botón secundario «Ir a jornada en curso» bajo Vista, desplazamiento suave con respeto a movimiento reducido. Navegación desde HOME entra arriba; vuelta desde partido conserva posición mediante restauración nativa, verificado en localhost. Mi perfil usa la temporada compartida seleccionada y el label bajo el nombre abre el mismo tipo de menú que HOME, escribe la misma selección por liga; perfiles públicos conservan su selector histórico. Verificados datos de Temporada 1 y sincronización en ambos sentidos con HOME. 17 tests en 5 archivos correctos, incluyendo fixtures de temporada terminada y próxima upcoming; ESLint, TypeScript, i18n y diff correctos. quality:source inicialmente excedía 4 líneas; añadido compactado sin cambiar presupuesto, repetición correcta (132232 líneas, 191 clientes). Sin commit, publicación ni cambios de datos remotos.
- Buscadores de ligas y ajustes centrados horizontalmente con left:50% y translateX(-50%), conservando la posición bajo los controles superiores. Verificados a 375, 768 y 1280 px: desviación horizontal cero frente al centro del viewport útil. Lupa de /leagues bajada a 14 px del borde inferior más safe-area, sin reservar navbar. Refrescar unificado mediante la clase compartida (14 px, peso 600, alto 34 px), con icono de refresco. ESLint, TypeScript, 6 tests focalizados y diff correctos. Sin commit ni publicación.

- Decisión final del usuario sobre controles superiores: retirada la superficie fija y su línea separadora. Los botones individuales de Competition usan fondo oscuro translúcido (rgba 20,21,24,0.82), desenfoque y sombra suave. Verificado en /matches con scroll y estilos calculados; ESLint, TypeScript y diff correctos. Posición y comportamiento de los controles conservados. Sin commit ni publicación.

- Ajuste posterior de barra superior: superficie fija independiente de los botones (evita desplazamiento del borde por el contenedor), línea de ancho completo del marco y márgenes simétricos. Verificado en /leagues con scroll: botones de y=10 a y=44, línea en y=54 (10 px por arriba y por abajo), superficie desde x=0 hasta x=445, excluyendo scrollbar. ESLint, TypeScript y diff correctos. No se han fijado Volver, Mis ligas o Refrescar; sin commit.

- Segunda iteración completada localmente: secciones desplegables en Administración (formularios conservados al cerrar, apertura desde enlaces incluso al repetir el mismo hash), superficies informativas con bordes neutros y lista de partidos que bloquean el resumen con enlaces a detalle. Sin commit. El primer chequeo i18n detectó una etiqueta nueva sin traducción: sustituida por «Comenzar temporada» y chequeo repetido correctamente.
- La revisión ampliada detectó y corrigió: detalle histórico limitado a temporada activa (ahora resuelve la temporada del partido y la conserva al abrir su jornada); contraste insuficiente de azul (nuevo cálculo WCAG para Competition, al menos 4,5:1, con test de los seis acentos y colores personalizados); nombres recortados y cabecera solapada con texto grande/375 px; cuatro columnas demasiado estrechas en estadísticas de escritorio; envío de chat deshabilitado aún dorado y etiqueta de fecha seleccionada con poco contraste.
- Segunda validación correcta: TypeScript, ESLint sin errores (11 advertencias preexistentes en Administración), i18n:check, quality:source y git diff --check; tanda de 41 tests en 12 archivos y tanda posterior de 17 tests de chat/jornadas en 6 archivos correctas. El test estructural del enlace a jornada se actualizó para conservar el parámetro de temporada. Sin build sobre el servidor activo del usuario ni E2E con su cuenta.
- Revisión ampliada: escritorio 1280×900 (Apariencia, partido, Chats, Estadísticas y Administración), pantalla estrecha 375×812, texto grande, acentos dorado/azul/verde/coral/violeta/hielo, teclado Enter y foco de desplegables, acceso directo a Jugadores, detalle histórico, estados vacíos/deshabilitados, carga y panel de propuesta de fecha sin enviarla. Preferencias restauradas a texto normal y color de liga, viewport restablecido. Navegador abierto en Administración para revisión. No se han cambiado datos ni enviado mensajes. Las pruebas de permisos con otras cuentas, dispositivos físicos y todos los posibles errores requieren otro entorno/datos; no se afirma cobertura exhaustiva.

- Rama local codex/competition-dark-polish creada; main, staging, PRE y PROD no se modifican. Cambios sin commit; revisión realizada en la instancia localhost:3000 existente del usuario, sin iniciar servidores ni cambiar autenticación o entorno.
- Implementados fallback de PlayerAvatar ante errores de carga, nombres completos en Chats, reserva del chat en dos líneas, desplegables de empatados y estado sin resultados en Estadísticas, explicación correcta del resumen bloqueado y de Competition solo oscuro. CSS Competition: contraste de botones de acento, estado disabled legible, superficie de barra superior y acciones de partido dentro de la cabecera, sin flotar sobre formularios.
- Perfil sin partidos terminados: mensaje único en lugar de tarjetas de récords vacías. La tarjeta compartida de exportación también explica los datos incompletos.
- Validación correcta: ESLint de los TSX modificados, TypeScript sin emisión con tsconfig.build.json, i18n:check, quality:source, git diff --check y 40 tests unitarios focalizados (11 archivos). Sin build ni E2E en la instancia personal; no se han enviado formularios ni modificado datos.
- Primera revisión visual tras recargar: Ranking y avatares de reserva, Chats y nombres completos, reserva en dos líneas, detalle de partido con scroll y Guardar resultado deshabilitado, Estadísticas activa vacía e histórica con empates desplegados, resumen incompleto, Perfil, Apariencia e inscripción/plantilla con Guardar deshabilitado. Las propuestas de reorganización y jerarquía del acento quedaron implementadas en la segunda iteración descrita arriba.

# Revisión visual Competition oscuro — 2026-10-08

- Revisada la instancia existente localhost:3000 en el navegador integrado, sin tocar código, configuración, preferencias ni formularios. Hallazgos y alcance en COMPETITION_DARK_VISUAL_REVIEW.md. Prioridades: contraste blanco/dorado en Notificaciones, solapamiento de controles flotantes, estados disabled, fallback de avatares, empates truncados, nombres ambiguos en Chats y texto incorrecto en resumen de temporada terminada con datos incompletos. Correcciones propuestas, no implementadas.

# Reversión de preparación de revisión visual — 2026-10-08

- A petición del usuario, detenidos los procesos auxiliares 3100/3101 y retiradas las referencias de tipos añadidas automáticamente a tsconfig.json. Sin diff en src, tsconfig.json, next-env.d.ts o AGENTS.md; .env.local no se editó.
- La caché .next-visual-review se trasladó fuera del repositorio a C:/Users/USER/AppData/Local/Temp/smash-lob-review-backup-20261008, y se eliminó el proxy temporal creado para fixtures. No se modifica ni reinicia el servidor habitual iniciado por el usuario desde VS Code. Heartbeat y anotaciones anteriores conservados.

# Heartbeat Supabase PROD — 2026-10-08 (publicado y ejecución remota verificada)

- Verificación remota tras configurar los Secrets: GitHub confirma ambos nombres presentes y workflow `active`. Ejecución manual `37764830386`, creada el 2026-10-08 10:38:45 UTC, sobre main `d4120627`: completed/success; job heartbeat y paso `Read at most one league ID from PROD` success, no omitidos. Archivo de main comprobado mediante API: cron `37 5 * * *`, workflow_dispatch, guardia de proyecto PROD, GET leagues?select=id&limit=1, descarte del body y --fail. Consulta real correcta; primera ejecución automática del cron todavía pendiente de observar. Evidencia: https://github.com/davidalonsoc4/smash-lob/actions/runs/37764830386. No se leen ni imprimen valores de Secrets.

- Auditoría PRE/PROD (2026-10-08): tras `git fetch origin`, main y staging coinciden en `f4ec3eb24bef652401e1e214fae63ee3e59d7e46` (0 commits exclusivos y diff vacío). Inspección de aliases y API Vercel confirma PRE `dpl_4jkYGgBRLbnYDHFRKnuxqBr78kJS` y PROD `dpl_2j865oCwRux48wMgRL7SdnSLZEGM`, ambos READY y con ese mismo githubCommitSha. Health autenticado devuelve v1.15.4/pre y v1.15.4/prod; distributedRateLimit y observabilityWebhook son false en ambos. No hay promoción de código pendiente entre estos entornos. Esta auditoría no compara los esquemas/migraciones remotos de Supabase ni todos los valores de entorno.

- H00–H23 del PLAN están DONE; esta tarea adicional queda limitada al workflow solicitado y su documentación.
- Añadido heartbeat diario/manual sin checkout: GET `public.leagues`, columna `id`, máximo una fila; sin escrituras ni migraciones.
- Secrets exclusivos `SUPABASE_PROD_URL` / `SUPABASE_PROD_SERVICE_ROLE_KEY`; validación del identificador PROD antes de enviar credenciales, sin reutilizar PRE ni el enlace CLI.
- Respuesta y diagnósticos descartados, errores HTTP y de red fallan, timeout de petición 30 s y job 2 min, permisos GitHub vacíos.
- Validación local correcta: parseo YAML con js-yaml existente, cron diario de cinco campos, declaración workflow_dispatch y `bash -n`. Paso ejecutado contra servidor HTTP local mediante wrapper de transporte con credenciales ficticias: 200 pasa; 401/403/404/500/503 y 302 fallan; método GET, ruta, select/limit y headers comprobados. Secrets ausentes y PRE/hosts ajenos fallan antes de consultar. Clave y cuerpo ficticios ausentes de logs. `npm run secrets:check` y `git diff --check` correctos.
- El usuario autorizó publicar este cambio en main el 2026-10-08. Commit de implementación `977fc0ef` y registro `d4120627` publicados en `origin/codex/supabase-prod-heartbeat` y `origin/main`; ambos SHA verificados con `git ls-remote`. Al publicar, GitHub confirmaba cero Secrets; el usuario los configuró posteriormente y la ejecución real está verificada arriba. Las pruebas locales usaron fixtures; no se modificaron staging, migraciones o el tag v1.0.0. No se solicitó despliegue de la aplicación; las integraciones automáticas de main pueden ejecutarse.

# Publicación Welcome Pack — 2026-09-14 (en curso)

# v1.15.4 — Saneamiento y hardening (2026-09-19, en curso)

- Rama `codex/v1.15.4-hardening-cleanup` creada desde `origin/main` en `01c9212`; versión de aplicación actualizada a `1.15.4`. No se ha desplegado PRE ni PROD.
- Auditoría inicial documentada en `docs/production-hardening/V1_15_4_HARDENING_AUDIT.md`.
- Separada la capacidad de crear ligas del modo visual de la liga activa.
- Añadido estado persistente de leído/no leído para notificaciones mediante la migración pendiente `20260919100000_add_notification_read_state.sql`, API autenticada y acciones individuales/globales en `/notifications`.
- La actividad administrativa admite cursor temporal (`createdAtBefore`) y devuelve `nextCursor`, manteniendo el orden estable sin ampliar artificialmente el límite por página.
- Añadidos endpoints autenticados de exportación JSON (`/api/account/export`) y solicitud de anonimización de cuenta (`/api/account/delete`, confirmación reforzada); no se despliega ni se aplica ninguna migración remotamente en esta rama.
- Privacidad, condiciones y página informativa vuelven a estar presentes en el buscador de ajustes para usuarios autenticados y espectadores.
- Se añadieron contratos unitarios de la rama para el estado de notificaciones, paginación, descubribilidad legal y autoservicio de cuenta.
- `npm run validate` y `npm run release:check` se detienen deliberadamente en `i18n:check`: al proteger de nuevo `Mis partidos` aparecen textos visibles históricos sin `tx` en sus páginas y componentes. La deuda queda identificada y no se ha rebajado el gate.
- Corregido un 404 real del acceso público por QR: `src/proxy.ts` bloqueaba cualquier `/spectate/:code/view` anónimo aunque existía la página pública. La ruta de vista ahora atraviesa el proxy sin abrir ninguna capacidad autenticada; se añadió regresión unitaria.
- Se eliminó la exclusión de `Mis partidos` del gate i18n y se conectaron sus textos visibles al sistema EN/EU. El presupuesto total se ajusta de 129.200 a 129.800 líneas para incluir las traducciones y contratos nuevos; no se aumentan límites de archivos críticos.
- Las etiquetas de origen de `Mis partidos` (liga y amistoso), que conservan colores claros inline del modo Classic, tienen ahora una presentación específica para Competition: superficie oscura, contraste legible y distinción visual entre ambos orígenes mediante `data-personal-match-origin`. Cambio local sin despliegue.
- El hero de cuenta atrás de HOME reserva menos altura en Competition en móviles para compensar la cabecera visual más alta y dejar espacio a la navbar fija; el contenido puede crecer de forma natural en dispositivos muy bajos. Cambio local sin despliegue.
- Promoción visual de Competition verificada desde `9935a769`: `release:check` pasa con 205 archivos / 792 pruebas unitarias e integración, 70 E2E, build de 1.081.745 bytes gzip y 0 vulnerabilidades runtime. `origin/staging` y `origin/main` coinciden en ese SHA. PRE quedó Ready en `dpl_3x3DZM2KPAAiLmtqMN3uNXh3vZey` con alias `pre.smashandlob.com`; PROD quedó Ready en `dpl_87zfCEHCiinLR4Ej5M9MubRvpgy` con alias `smashandlob.com`. Health PRE/PROD devuelve v1.15.4 y `npm run smoke:prod` pasa.

- En `codex/welcome-pack-stickers` queda v1.15.2 con margen exterior de seguridad de 5 mm, repetición configurable de 1 a 20 copias por diseño, recálculo del tamaño máximo para que todas quepan en una hoja A4, y relleno automático de huecos útiles con logos de liga sin solapes. Pasa typecheck, i18n, presupuestos de fuente, lint de archivos cambiados, 7 unitarias/integración dirigidas y 2 E2E del flujo de selección/repetición en móvil y escritorio. Build de producción generado por Playwright con el distDir de pruebas y sin tocar el `.next` de `npm run dev`; `release:check` completa no se repite mientras el servidor local solicitado sigue activo. Cambios solo locales, sin despliegue.

- v1.15.0 cierra `codex/anonymous-spectator-access` en el commit `3a64f9ed2a3d37d8fba95d1ff0852703c791ac6c`: la versión visible, paquetes, service worker, changelog y smoke contracts quedan sincronizados con `1.15.0`; se conserva el acceso de espectadores sin cuenta publicado en v1.14.40. `npm run release:check` pasa: 200 archivos / 757 pruebas unitarias e integración, 66 E2E, build de 1.055.668 bytes gzip y auditoría runtime con 0 vulnerabilidades. ESLint sin errores, con el warning previo de `window.location.assign()` en `SpectatorInviteFlow.tsx`. Sin migraciones nuevas. PRE deployment `dpl_AdWELZir5mqrcpfx9t6EEwjC3QGd` y Producción `dpl_97fnxuMr5YmH2RQwYo4auCm8X493` quedaron `Ready`; ambos health endpoints confirman v1.15.0 en su entorno y `npm run smoke:prod` pasa.
- Para v1.14.40, el presupuesto global de fuente se ajusta de 128.150 a 128.700 líneas y los componentes cliente máximos de 184 a 185; se conservan los límites de páginas cliente, rutas API y archivos sensibles.
- v1.14.40 implementada en `codex/anonymous-spectator-access` y publicada en PRE y Producción. `npm run release:check` supera 200 archivos / 757 pruebas unitarias e integración, 66 E2E, build de 1.055.669 bytes gzip y auditoría runtime con cero vulnerabilidades; `git diff --check` limpio. ESLint termina sin errores y conserva un warning previo de `window.location.assign()` en `SpectatorInviteFlow.tsx`. Sin migraciones nuevas.
- v1.14.39 promovida desde `staging` a `main` (`3a76d66a98fe9bf7a8ab5c8d6c681b86c64b36e5`) y publicada en Producción. Se aplicó únicamente la migración validada en PRE `20260917120000_add_manual_ball_custodian_selection.sql`; el dry-run mostró esa única migración pendiente y el lint de esquema PROD terminó sin errores. Vercel deployment `dpl_CcvETMAckFva3pQeraqBjiRiSurD` quedó `Ready`, alias `smashandlob.com`, y `/api/health` devolvió v1.14.39. `origin/main` verificado en el mismo SHA.
- Publicación v1.14.40 verificada: `staging` `ad786871f7f9d7d0f49ec8d86339fdf11b79db39`, PRE deployment `dpl_35uw4cMUC6Xq58fsBWBVr7iKqZCn` `Ready`, alias `pre.smashandlob.com`; health confirma `1.14.40/pre`. La promoción a `main` quedó en `1a3a19e953d4c8557a39794683922ff0e21ab942`; Producción deployment `dpl_CPPPJ5thpkHSspGMX76twmo6rN5a` `Ready`, alias `smashandlob.com`; `npm run smoke:prod` y `/api/health` confirman `1.14.40/prod`. La invitación y el QR ofrecen una vista pública sin sesión con API de solo lectura; chats, actividad, pagos, incidencias e identidad de cuenta quedan fuera del payload. Se preservan la fase secreta y el calendario progresivo.
- v1.14.39 validada sobre `codex/manual-ball-custodian-selection`: el selector de custodios se presenta como tarjetas con avatar y estado seleccionado; Home y Calendario solo muestran “Eres el encargado de las bolas” a la persona asignada. `npm run release:check` pasa: 199 archivos / 755 pruebas unitarias e integración, 64 E2E, build de 1.052.217 bytes gzip y auditoría runtime con 0 vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Se actualizan los presupuestos de fuente para alojar el ajuste. Merge `cc8f387` publicado y verificado en `origin/staging`. PRE apunta al deployment Vercel `dpl_HwCLJRkLJDii1rmqSZ1ZGDj9LN16` (`Ready`), construido desde `e741c60`, ancestro de `staging` con árbol idéntico; `/api/health` confirma v1.14.39. `main`, Production y el tag `v1.0.0` siguen intactos.
- v1.14.38 desplegada en PRE, rama `codex/manual-ball-custodian-selection` basada en `staging`: se añaden los modos de prioridad y selección explícita de custodios, validación de cobertura para el calendario y una migración nueva para guardar el modo y los jugadores elegibles. Los avisos de custodio se generan solo para partidos programados y se filtran, junto con el resto de avisos vinculados a partidos, durante el periodo previo al inicio. `npm run release:check` pasa: 199 archivos / 754 pruebas unitarias e integración, 64 E2E, build de 1.050.423 bytes gzip y auditoría runtime con 0 vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. La Supabase CLI se vinculó explícitamente al proyecto PRE `miadjotkucgluwbrgeih`; la única migración nueva `20260917120000_add_manual_ball_custodian_selection.sql` figura aplicada y `db lint --linked --schema public` no encuentra errores. Merge `2808ea1` publicado en `origin/staging`; deployment Vercel `Ready`, alias `https://pre.smashandlob.com` verificado con `/api/health` en versión 1.14.38. Migración aplicada en PRE; `main`, Production y el tag `v1.0.0` siguen intactos.
- v1.14.37 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): el QR de espectadores usa módulos redondeados color carbón, conserva cuadrados los patrones de localización/alineación, mantiene cuatro módulos de zona blanca y lleva el icono de la app incrustado en SVG sobre una placa central; conserva corrección de errores H y evita cubrir alineación central en códigos de mayor versión. Se amplía el presupuesto global de 127.500 a 127.600 líneas (estado: 127.567) y el del changelog de 2.480 a 2.490 (estado: 2.481). `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil, escritorio y PWA, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, compilación dentro del presupuesto (1.047.723 bytes gzip) y auditoría runtime con 0 vulnerabilidades. El E2E verifica el SVG con logo incrustado, los módulos redondeados y el margen de cuatro módulos; además lo rasteriza y decodifica con jsQR en móvil y escritorio, comprobando que el contenido coincide exactamente con la URL de espectador. El commit `2ea893e` se integró en `staging` con `113f4fc` y su preview Vercel quedó Ready. PRE está protegido por Vercel SSO para solicitudes anónimas (302 a `vercel.com/sso-api`), pero se verificó autenticado con `vercel curl`: salud `ok`, versión `1.14.37`, portada 200, Avatar Lab 200 y su API 401 sin sesión. La promoción a `main` quedó en `46f274a`; el deployment de producción `smash-ha0buepd5-davidalonsoc4-8740s-projects.vercel.app` está Ready y `npm run smoke:prod` confirma versión 1.14.37, portada disponible y Avatar Lab oculto/bloqueado. Sin cambios de base de datos ni migraciones.
- v1.14.36 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): el diálogo QR comparte la superficie del marco de la app y elimina el acento dorado; el QR conserva fondo blanco para el escaneo. `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil, escritorio y PWA, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, compilación dentro del presupuesto (1.046.811 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Tras el ajuste final de fondo, pasan ESLint, coherencia de versión y presupuesto de código, además del E2E del popup en móvil y escritorio (2/2) con comparación de color frente al marco de la app. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.35 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): mejora visual del diálogo del QR. El código se presenta en una tarjeta clara con más aire, y se refuerzan jerarquía, explicación e iconos de las acciones. Se conserva el flujo league-wide y la descarga SVG de v1.14.34. Se verifican destinos local (`localhost`), PRE (`https://pre.smashandlob.com/spectate/...`) y PROD (`https://smashandlob.com/spectate/...`); localhost solo se usa en solicitudes locales. El límite global de fuente se amplía de 127.400 a 127.500 líneas (estado actual: 127.450); no cambian los límites por archivo. `npm run release:check` superado: 199 archivos / 749 pruebas unitarias e integración, 64 E2E en móvil y escritorio, lint, typecheck, i18n, build dentro del presupuesto (1.046.897 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Lint mantiene el warning preexistente en `SpectatorInviteFlow.tsx`. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.34 (rama `codex/spectator-league-qr-safe-pwa-update`, basada en `staging`): implementado y validado localmente. Compartir espectadores abre un diálogo con QR SVG descargable y botón para compartir el enlace por liga. La PWA activa versiones pendientes tras 60 segundos sin actividad, con la pestaña visible/enfocada, sin diálogo abierto y sin foco en un campo editable; la recarga también espera a que vuelva un momento seguro. El límite global de fuente se amplía de 127.260 a 127.400 líneas para alojar el cambio (estado actual: 127.367); no cambian los límites por archivo. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 64 E2E, typecheck, i18n, build dentro del presupuesto (1.045.605 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Lint mantiene un warning preexistente en `SpectatorInviteFlow.tsx`. Sin cambios de base de datos ni migraciones, commit o despliegue.
- v1.14.33 (rama `codex/organization-assigned-balls`): la Jornada de Apertura asigna al organizador todos los partidos de la Jornada 1, y el reparto normal empieza en la Jornada 2. El total de botes cuenta cada partido de apertura una sola vez; sin calendario todavía no se muestra un conteo provisional de dos botes. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 62 E2E, lint sin errores (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, i18n, build dentro del presupuesto (1.038.295 bytes gzip) y auditoría runtime con 0 vulnerabilidades. Commit de release `96e993c`; integrado en `staging` (`bc456c3`) y `main` (`59601eb`). PRE Ready: `dpl_A3wmWLPHQyXgYK9A8GMei13DU3LZ` (`pre.smashandlob.com`). PROD Ready: `dpl_JKFvnbcxWX3qECJnEKyYdje7Fifu` (`smashandlob.com`). No requiere migración.
- v1.14.32 (rama `codex/organization-assigned-balls`): corrección de Jornada de Apertura; los dos primeros partidos con participantes de la Jornada 1 quedan fijados al organizador, cuentan como los dos botes de apertura sin duplicarlos y las jornadas siguientes vuelven al cálculo normal. Se añade “Bolas asignadas por la organización” al buscador de ajustes. El presupuesto global de fuente sube de forma acotada de 127.180 a 127.260 líneas; los límites por archivo no cambian. `npm run release:check` superado: 198 archivos / 746 pruebas unitarias e integración, 62 E2E, build dentro del presupuesto (1.038.394 bytes gzip), typecheck e i18n; auditoría runtime con 0 vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. No requiere migración; sin commit ni despliegue.
- v1.14.31 (rama `codex/organization-assigned-balls`): se suman al creador los dos botes de una Jornada de Apertura configurada; el custodio de cada partido recibe un aviso privado al quedar asignado y un recordatorio dentro de las dos horas previas. Usa el endpoint de cron ya existente, sin migraciones nuevas. Los presupuestos suben de forma acotada a 127.180 líneas totales y 6.150 para administración de temporada. `npm run release:check` superado: 198 archivos / 744 pruebas unitarias e integración, 62 E2E, build dentro del presupuesto (1.037.474 bytes gzip), typecheck e i18n; auditoría runtime con 0 vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. No se ha desplegado.
- v1.14.30 corrige las flechas de prioridad de custodios: en temporadas existentes operaban sobre la prioridad almacenada incompleta en vez del orden visible normalizado, por lo que a veces no movían jugadores. Creación y edición usan ahora el mismo reordenador. `npm run release:check` superado: 197 archivos / 738 pruebas unitarias e integración, 62 E2E, typecheck, build dentro del presupuesto (1.035.739 bytes gzip) y auditoría runtime sin vulnerabilidades; lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Cambio aún no desplegado.
- v1.14.29 añade el desglose de botes por custodio y el acceso directo al panel de bolas asignadas desde la navegación de edición de temporada. En autoinscripción se genera o prepara el calendario solo al completar la plantilla; la vista calcula los custodios sobre ese calendario completo y muestra un mensaje mientras aún no exista. Se amplía de forma acotada el presupuesto de fuente para administración de temporada a 6.120 líneas y el total a 126.520. Validación local completa superada: 197 archivos / 737 pruebas unitarias e integración, 62 E2E, lint (un warning preexistente en `SpectatorInviteFlow.tsx`), typecheck, build dentro del presupuesto y auditoría runtime sin vulnerabilidades. PRE verificada Ready en `pre.smashandlob.com` (deployment `dpl_DmERca3YXoGzadW463FsEnGmBRaT`). En PROD se aplicó únicamente la migración `20260916120000_add_organization_ball_assignment.sql`; la lista de migraciones y `db lint` quedaron limpios. v1.14.29 integrada en `main` (`1c75ca1`) y publicada Ready en `smashandlob.com` (deployment `dpl_CivzRD8ijK6YPRoqK1giWnqH8BKS`).
- v1.14.28 corrige errores reportados al probar en PRE el reparto de bolas: el formulario de creación permite ordenar nombres nuevos y usuarios de la app y resuelve las referencias temporales a jugadores reales; las temporadas activas permiten guardar otros ajustes conservando su fecha histórica de inicio, pero rechazan cambios a esa fecha. No requiere migración. Validación local completa superada: 197 archivos / 736 pruebas unitarias e integración, 62 E2E, typecheck, build dentro de presupuesto y auditoría runtime sin vulnerabilidades. Lint conserva un warning preexistente en `SpectatorInviteFlow.tsx`. Integrada en `staging` (`7d44ccf`) y PRE verificada Ready (`dpl_7y6whTL5uHECoZijBfHJFKb9HzHA`, alias `pre.smashandlob.com`). PROD y `main` intactos.
- En `codex/organization-assigned-balls` se integra v1.14.27 de bolas asignadas por la organización: migración nueva `20260916120000_add_organization_ball_assignment.sql`, configuración persistente y API de creación/edición, bloqueo tras el primer resultado, cálculo determinista del conjunto mínimo de custodios y reparto equilibrado por partido. La compra de bolas se oculta en reservas/pagos cuando la opción está activa. Typecheck, lint, build y 730 pruebas unitarias/integración pasan; queda la validación local de Supabase, bloqueada por falta de Docker/Podman.
- La comprobación de `supabase db reset --local` queda bloqueada en este equipo porque no hay Docker ni Podman disponibles (`docker: command not found`); no se ha tocado ninguna base de datos remota.
- La puerta completa de v1.14.27 pasa: 196 archivos / 730 pruebas, i18n EN/EU, lint con un warning preexistente, typecheck, build y presupuestos de producción. El presupuesto de código se amplía de forma acotada a 126.500 líneas totales, 6.100 para administración de temporada y 2.480 para el changelog para incluir este desarrollo.
- La migración `20260916120000_add_organization_ball_assignment.sql` se aplicó y verificó en el proyecto Supabase de PRE (`smash-lob-staging`, ref. `miadjotkucgluwbrgeih`). `supabase migration list` la muestra aplicada y una consulta remota confirma ambas columnas con sus valores por defecto. PROD permanece sin cambios.
- `staging` se ha integrado y publicado en PRE con el merge `c4bbb7d` (versión v1.14.27). Vercel deployment `dpl_HwQ11zAXddUV7k4HsVTKAwjRp3Sf` quedó `Ready` con alias `https://pre.smashandlob.com`; PROD sigue sin cambios.

- v1.14.26 promocionada y verificada: `release:check` pasa con 728 pruebas unitarias/integración, 62 E2E, build dentro de presupuesto y auditoría runtime sin vulnerabilidades. El código de release quedó integrado en `staging` (`e4904e6`) y `main` (`39e9ba9`), con los registros de promoción posteriores en `c069450` y `a8fa2e5`. Los despliegues Vercel finales están Ready: PRE `dpl_5T87ToXPh7S18gAEZGhiwNcQrnUp` con alias `https://pre.smashandlob.com` y PROD `dpl_FzvhGhgkba65cQG8z1nAMTF6BG7t`. La siguiente tarea se inicia en una rama nueva para bolas asignadas por la organización.
- Solicitud actual autoriza integrar feature → staging → main, sin force push ni espera/polling de Vercel. Esta autorización sustituye para esta entrega la restricción histórica de main de v1.1; el tag v1.0.0 queda intacto.
- Inicio limpio: feature y origin/feature en 6f0d4c77; origin/staging en 03681f8; origin/main en aa1dc6a. Feature contiene 94 commits ausentes de staging; staging solo añade el revert temporal 03681f8 frente a feature.
- Staging aporta frente a main d701bdb, 52c4473 y b7a853e (orígenes configurables y autenticación LAN), más cd465cd, 7b83eb8 y a302d41 (prototipo Welcome Pack), retirado temporalmente por 03681f8. Se conservará su historia y se recuperará la implementación final de feature al resolver el revert.
- Main tiene únicamente el merge aa1dc6a fuera de staging, sin contenido exclusivo. Migraciones, package.json, package-lock.json y appVersion.ts son idénticos entre las tres ramas; no hay nuevas migraciones Git que aplicar en esta entrega. No se ha auditado ni modificado la base de datos remota.
- Dos stashes preexistentes contienen propuestas visuales antiguas de overgrip y ball wrap; permanecen intactos, sin aplicar ni borrar. No son cambios activos del workspace y no se incorporan sobre los diseños posteriores.
- Primer release:check detenido en i18n por textos Welcome Pack sin traducir. Se conectan al sistema existente y se añaden traducciones EN/EU sin excluir archivos del control.
- Revisión detectó que la página seguía usando un OvergripBandPreview local antiguo: ahora importa el componente final simplificado con impresión PDF. Se corrigen medidas informativas de bolsa (50 × 130 mm, 6 por A4) y orden informativo del listado por apellido. El título de impresión del overgrip se asigna como texto para no interpolar HTML del nombre de liga.
- Presupuesto de fuente ajustado al alcance real de Welcome Pack y sus traducciones: 125.500 líneas, 183 clientes y 50 páginas cliente. Límites de rutas API y archivos críticos conservados. Pendiente repetir la puerta completa antes de cualquier push.
- La sustitución del fajín en AppCard dependía del nombre de función, frágil bajo minificación. Se elimina al importar directamente el componente final. Nueva prueba Playwright verifica el recorrido de página a PDF y sus 18 piezas por A4, usando exclusivamente fixtures.
- Auditoría runtime anticipada detectó Next.js crítico (GHSA-p293-qw3h-jr36 / GHSA-2xp9-vwfh-vxw4) y Sharp alto (GHSA-rgj7-g3m4-5g8c). Se interrumpió la validación antes de publicar. Actualización explícita a Next.js/eslint-config-next 16.3.5 y Sharp/override 0.35.4; pendiente validar lockfile y repetir release:check, sin audit fix --force.
- Instalación verificada y auditoría runtime con 0 vulnerabilidades. Correcciones compatibles adicionales en herramientas: brace-expansion 1.1.18/5.0.9 y js-yaml 4.3.2. Auditoría incluyendo desarrollo conserva dos entradas moderadas de Vitest/@vitest/mocker (GHSA-82fw-gwwq-j7x9), fuera del gate runtime; no se cambia de major del runner en esta entrega. Pruebas unitarias nuevas cubren traducciones de controles/fuentes y preservación de medidas EN/EU/ES.
- La puerta detectó un contrato visual antiguo del selector de calendario (esperaba overflow-x-auto pese al cambio 4ef8a3e): actualizado al selector compacto y complementado con comprobación real de ancho en Playwright.
- Dos pruebas exhaustivas de calendario agotaban sus tiempos bajo concurrencia automática. Aisladas pasan 24/24: caso parcial 2,17 s y todos los máximos 12,28 s. Se limita Vitest a dos workers para evitar saturación, sin ampliar tiempos ni reducir los casos o aserciones.
- El primer Playwright completo terminó 58/62. Las dos verificaciones funcionales nuevas pasaron en móvil; los fallos de HOME y acceso público fueron espera de la compilación bajo `next dev`, no una incidencia de Axe o autenticación. La suite arranca ahora build + servidor de producción con los mismos fixtures placeholder, dos workers y 15 s para aserciones/capturas. Las únicas diferencias visuales son las dos referencias de CALENDARIO, limitadas al selector compacto ya revisado; se actualizarán y volverán a ejecutar todas las E2E.
- La configuración de capturas de Playwright 1.62 no admite timeout específico en `toHaveScreenshot`; se elimina esa opción inválida tras el diagnóstico directo de `next build`. La espera general de 15 s se conserva para el contenido de página.
- Validación final de feature superada con `npm run release:check`: 193 archivos / 724 pruebas unitarias e integración, build de producción dentro de presupuesto (1.023.297 bytes gzip, 97 chunks), 62 E2E Playwright y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades. Las dos referencias visuales de CALENDARIO se actualizaron únicamente para reflejar el selector compacto; la inspección de diff confirma ese alcance.
- Se crearon los commits locales 0e18ad8 (dependencias), 2e1da67 (Welcome Pack) y f3f7d67 (validación). Un `index.lock` vacío de 2026-09-14, sin procesos Git activos, se confirmó obsoleto y se eliminó antes de los commits. Pendiente: push verificado de feature, merge normal en staging, repetir puerta y push; después merge normal de staging en main, puerta final y push.
- Feature publicada y verificada en origin como 5194537. El merge inicial de staging (`c4a184e`) resolvió automáticamente el revert temporal borrando MediaKitSectionNav y la regla ESLint necesaria para la página Welcome Pack; ambas se restauran desde la feature antes de repetir validación. No se ha publicado staging todavía.
- La primera puerta sobre staging confirmó que los dos casos exhaustivos de calendario superan sus límites de 5/30 s en este equipo, también con un único worker. Se conserva íntegro el algoritmo determinista y todas sus alternativas, pues la generación ocurre una vez por temporada; los límites de esas dos pruebas se amplían a 10/60 s para validar el resultado completo sin falsos fallos de rendimiento local. Pendiente: suite completa, puerta staging y push solo si ambas pasan.
- La selección de vueltas ya no reconstruye los conteos de parejas de todos los partidos acumulados para cada candidata: conserva los conteos de cada vuelta y los combina para puntuarla. No cambia candidatas, reglas de desempate ni auditorías; la prueba exhaustiva completa de máximos pasó de ~34 s a 15,1 s y los 24 casos focalizados pasan en 23,7 s.
- Puerta completa de `staging` superada tras la optimización: 193 archivos / 724 pruebas unitarias e integración, build de producción dentro de presupuesto (1.023.413 bytes gzip, 97 chunks), 62 pruebas Playwright y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades. Pendiente: push verificado de `staging`, promoción normal a `main` y repetición de la puerta final.
- Promoción final a `main` validada: 193 archivos / 724 pruebas, build dentro de presupuesto, 62 Playwright y auditoría runtime sin vulnerabilidades. Pendiente: push verificado de `main`.
- Ajuste local posterior en `feature/welcome-pack-media-kit`: selector de piezas en cuadrícula en móvil, guía visible de A4 vertical/horizontal, escala 100 % y ajuste manual solo si el diálogo del navegador conserva una orientación previa. Precintos y overgrips declaran páginas CSS nombradas; 9/9 pruebas focalizadas y TypeScript correctos. No se ha publicado este ajuste.
- Iteración móvil validada manualmente: los selectores vuelven al carrusel horizontal, ahora con tarjetas compactas sin etiquetas de estado y con proporción rectangular. La preview no cambia; la guía de impresión conserva orientación, escala y el ajuste manual excepcional. Pendiente: puerta completa y promoción secuencial.

# v1.13.8 — Sello azul premium reforzado (2026-08-27)

- La Carta de bienvenida mantiene la textura de papel premium y el sello orgánico, pero refuerza el azul del sello para que el logo gane presencia y legibilidad.
- Se conservan el tamaño grande del sello, su posición irregular y el solape natural con la firma sin reescalados.
- Continúa sobre `feature/v1.13.0-media-kit-welcome-letter`; al quedar cerrada esta iteración, el siguiente paso es subir todo v1.13 a PRE.

# v1.13.6 — Refuerzo visual de sello y papel (2026-08-27)

- La Carta de bienvenida refuerza la textura del papel premium para que el grano se perciba mejor sin comprometer la legibilidad.
- El sello limpio y el sello tinta recuperan presencia con un azul tinta más vivo y un contraste superior, manteniendo su colocación orgánica junto a la firma.
- Se mantiene el tamaño grande del sello, su inclinación/posición irregular y la firma sin reescalado.
- Continúa sobre `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.5 — Acabado premium de carta y sello (2026-08-27)

- La Carta de bienvenida incorpora textura sutil de papel premium, sello azul grisáceo menos intenso y mayor legibilidad del logo.
- Se conserva el sello grande y orgánico de v1.13.4 y la firma mantiene siempre su tamaño aunque exista solape.
- El cierre final deja de repetir el nombre del destinatario; el nombre continúa personalizando el saludo inicial.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.4 — Sello orgánico y firma sin restricciones (2026-08-27)

- El sello de la Carta de bienvenida aumenta a 164 px para ganar presencia en el bloque de cierre.
- Su posición varía de forma aleatoria controlada hasta ±26 px en horizontal, ±20 px en vertical y ±9° de inclinación en cada render.
- La firma conserva siempre el tamaño asociado a la tipografía elegida; no se reduce para evitar el sello y se permite el solape parcial intencionado.
- El sello mantiene sus variantes Sin sello, Sello limpio y Sello tinta y continúa usando el logo normal de la liga en cabecera.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.3 — Personalización de destinatario, logo y sello (2026-08-27)

- La Carta de bienvenida incorpora nombre del destinatario y selector Masculino/Femenino para resolver automáticamente Bienvenido/Bienvenida y cualquier tratamiento dependiente del género.
- El logo de la liga se conserva siempre normal en la esquina superior izquierda cuando existe.
- El sello queda como elemento independiente junto a la firma y ofrece Sin sello, Sello limpio y Sello tinta.
- La firma automática pasa a `Organización de {NOMBRE DE LA LIGA}` y continúa siendo editable.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.2 — Sello institucional, firma manuscrita y cierre de párrafos (2026-08-27)

- La Carta de bienvenida permite mostrar el logo original o convertirlo en un sello azul tinta, con variantes limpia e impresión orgánica.
- La firma incorpora estilos independientes del cuerpo: clásica, Allura, Petit Formal Script y Great Vibes; por defecto se usa Allura.
- El texto automático separa en bloques propios «Desde este momento…» y «Bienvenido/a a Smash & Lob», también en inglés y euskera.
- Las fuentes manuscritas se cargan bajo demanda junto a las serif premium y mantienen fallback local si la red no está disponible.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 siguen fuera de PROD hasta cerrar la rama.

# v1.13.1 — Párrafos y tipografía premium en la carta (2026-08-27)

- La Carta de bienvenida respeta saltos manuales y separa cada bloque automático con una línea completa de aire.
- Personalizar incorpora cuatro estilos: Club clásico (Cormorant Garamond + Libre Baskerville), Editorial premium (Instrument Serif + Lora), Baskerville y Lora.
- Las fuentes se cargan bajo demanda desde Google Fonts al componer la carta; el render conserva fallback serif local si la red no está disponible.
- La altura de la carta sigue calculándose antes de dibujar para reducir el cuerpo si hace falta y proteger la firma y el último párrafo.
- Continúa en `feature/v1.13.0-media-kit-welcome-letter`; v1.12 y v1.13 permanecen fuera de PROD hasta cerrar la rama.

# v1.13.0 — Carta institucional de bienvenida (2026-08-26)

- Rama: `feature/v1.13.0-media-kit-welcome-letter`.
- Media Kit incorpora el preset **Carta de bienvenida**, con diseño premium de documento institucional y texto completo editable.
- El contenido automático se construye con los datos reales de la temporada: inscripción, Jornada de Apertura, inicio programado y descansos solo aparecen cuando existen.
- La carta explica de forma breve acceso por invitación, perfil, gestión desde la app y Formato Smash & Lob; título, cuerpo, despedida y firma se pueden personalizar y restaurar.
- v1.12 continúa pendiente de PROD; v1.13 parte de v1.12.4 y se desplegarán conjuntamente cuando se cierre esta rama.

# v1.12.4 — Auditoría personalizada y creación más clara (2026-08-26)

- La auditoría de calendario deja de limitarse a 1×/2× vueltas completas: cualquier duración válida, incluida una personalizada como 11 jugadores y 13 jornadas, muestra Equilibrio del calendario y REROLL.
- El panel identifica las duraciones parciales como Personalizada y muestra cada regla aplicable; los repartos matemáticamente no exactos se describen mediante el rango optimizado realmente obtenido.
- REROLL conserva la misma protección: cualquier resultado registrado bloquea la regeneración.
- La creación separa Tipo de calendario, Duración y Visibilidad en tarjetas independientes y numeradas; Equilibrado/Manual pasan de desplegable a opciones visibles.
- No hay cambios de esquema ni migraciones nuevas.

# v1.12.2 — Auditoría adaptativa del calendario (2026-08-26)
- v1.12.2: el panel de Equilibrio del calendario adapta sus validaciones al número real de jugadores; los formatos con descansos muestran por separado partidos por jornada, máximo una aparición, descansos por jornada y jugador, ausencia de descansos consecutivos y cuartetos no repetidos.

- La misma rama `feature/v1.12.0-flexible-season-size` continúa acumulando el desarrollo v1.12.x; no se publica en PRE/PROD.
- Todos los tamaños entre 8 y 24 jugadores pueden crear temporada. Los múltiplos de cuatro conservan el calendario perfectamente equilibrado sin descansos y el resto usa un calendario equilibrado con descansos.
- Los calendarios con descansos usan N jornadas por vuelta, `floor(N/4)` partidos por jornada y `N mod 4` descansos por jornada; cada jugador descansa exactamente `N mod 4` veces por vuelta.
- El generador cíclico determinista evita descansos consecutivos, parejas repetidas y cuartetos repetidos dentro de cada vuelta y limita la repetición de rivales.
- HOME y Mis partidos identifican explícitamente las jornadas de descanso del jugador sin romper el ocultamiento progresivo de emparejamientos.
- Revisión de continuidad: el resumen de temporadas finalizadas y el fallback local de creación inicial usan también el cómputo flexible de jornadas, evitando tratar las plantillas con descansos como `N-1` jornadas.
- La auditoría, API, duplicación y calendario manual comparten las reglas flexibles. La migración `20260825214500_allow_flexible_season_player_capacity.sql` elimina únicamente la antigua exigencia SQL de múltiplo de cuatro, conservando el rango legacy 4..32 en BBDD mientras la aplicación limita nuevas temporadas a 8..24.

# v1.12.0 — Tamaño flexible de temporada (2026-08-25)

- Rama prevista: `feature/v1.12.0-flexible-season-size`, creada desde `main` en `dcdf9ea54e284e7704cbf4562c37fda236528d0f`.
- La creación de temporada usa un selector genérico de 8 a 24 jugadores, ajustable de uno en uno.
- En esta fase solo 8, 12, 16, 20 y 24 permiten crear la temporada; los demás tamaños se muestran como futuros formatos con descansos.
- La validación de tamaño se centraliza y se reutiliza en cliente, API y duplicación de temporadas.
- El generador equilibrado añade starters cíclicos verificados para 20 y 24 jugadores y conserva la auditoría de pareja única y doble oposición por vuelta.
- No hay migraciones ni cambios de datos persistidos.

# v1.10.18 — Plantillas continuistas, ubicaciones estructuradas y amistosos visibles (2026-08-19)

- Las temporadas posteriores con `roster_mode = self_registration` pueden arrancar con jugadores de la temporada anterior ya inscritos: se seleccionan por defecto en administración, se pueden desmarcar y las plazas restantes permanecen abiertas al autoregistro. La Temporada 1 conserva el autoalta del creador cuando corresponde.
- Las cuotas son estrictamente por temporada: una nueva temporada genera su registro económico con todos los jugadores inicialmente pendientes, sin heredar pagos de la anterior.
- La plantilla fija admite usuarios globales registrados en Smash & Lob mediante un directorio público limitado a nombre/avatar; el servidor crea o reutiliza el jugador de esa liga y enlaza directamente `league_memberships`.
- Los amistosos incorporan `location_id`, `location_court` y `location_snapshot`. La pista deja de formar parte de la identidad de la ubicación global y `padel_locations` pasa a ser la fuente maestra cuando existe.
- Superadmin puede borrar una ubicación del catálogo aunque tenga usos, conservando snapshots históricos; además ve liga/temporada/jornada/fecha/jugadores y puede abrir, cambiar o quitar la ubicación de partidos futuros.
- `Mis partidos > Próximos partidos` contiene exclusivamente todos los amistosos futuros. Los amistosos programados cuya fecha ya pasó pasan al historial aunque sigan `scheduled`; los partidos de Liga no aparecen nunca en Próximos.
- `Añadir al calendario` de amistosos conserva siempre sus clases de botón aunque reciba clases de layout desde `MatchScheduleForm`.
- Nueva migración aditiva `20260819173000_personal_locations_and_match_dashboard.sql`. No limpia automáticamente datos legacy de PROD: la inspección y corrección se hace de forma explícita desde Superadmin antes de eliminar duplicados.

# v1.10.17 — Contexto de Ajustes y safe area de Mis partidos (2026-08-19)

- La NAVBAR de `Mis partidos` reutiliza la misma superficie segura inferior de la NAVBAR de Liga: además del `safe-area-inset-bottom`, activa el estado raíz `data-bottom-nav-visible` para que la barra de gestos móvil conserve el fondo de la navegación.
- `AJUSTES` deja de renderizar cualquier NAVBAR inferior; al entrar desde Liga o `Mis partidos` ya no aparece de forma implícita la navegación de Liga.
- El acceso flotante a Ajustes añade un `returnTo` interno con la ruta actual y el botón `Volver` de Ajustes lo consume de forma segura; una entrada directa a Ajustes conserva HOME como fallback.
- Los chats de Liga y Amistosos ocultan el botón flotante global de Ajustes.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.16 — Liga completa en Euskera e Inglés y pulido de UI (2026-08-19)

- Se mantiene el sistema i18n existente y se completa una auditoría de las pantallas y flujos de Liga para cubrir Español, Euskera e Inglés: navegación, formularios, estados, errores, feedback, chats, economía, clasificación, estadísticas, administración, temporada programada, tutoriales y exportables.
- `I18nProvider` incorpora `tx(...)` como adaptador para texto visible heredado/dinámico; reutiliza los diccionarios `es/en/eu` existentes y no crea un segundo selector ni otra fuente de estado de idioma.
- `scripts/check-league-i18n.mjs` comprueba paridad de las claves estructuradas, cobertura de textos `tx`, plantillas dinámicas y mensajes de feedback/error, y detecta español hardcodeado en el núcleo de las pantallas de Liga.
- El exportable `Calendario de enfrentamientos` conserva el centro del `VS`, reduce el hueco central efectivo y amplía las áreas de los dos nombres para reducir recortes.
- Los controles flotantes superiores de `AppShell` se agrupan en un contenedor flex; si desaparece `Añadir` porque la plantilla está completa, `Ayuda / Tutorial` se recoloca automáticamente sin dejar un hueco.
- Los exportables de temporada y media kit reciben el locale activo para traducir también el contenido generado fuera del DOM.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.15 — Calendario preparado antes del inicio programado (2026-08-19)

- Las temporadas programadas con `roster_mode = self_registration` dejan de esperar al momento de activación para crear partidos: cuando la plantilla está completa se genera el calendario manteniendo la temporada en `upcoming`.
- `/api/access` ejecuta primero una preparación idempotente de calendarios programados y después la activación de los que ya han alcanzado `scheduled_start_at`; esto cubre también temporadas ya existentes en PRE/PROD.
- La preparación no depende de que las cuotas estén pagadas: los emparejamientos dependen de la plantilla. La activación real conserva el gate de cuotas pendiente.
- `server_start_self_registration_season` reutiliza los partidos preparados y valida que el calendario siga siendo compatible con la plantilla, evitando duplicados.
- Si un administrador libera una plaza antes del inicio, el RPC elimina el calendario preparado en la misma transacción; al completarse de nuevo la plantilla se genera uno nuevo.
- Nueva migración `20260818232000_prepare_scheduled_self_registration_calendar.sql`.
- VISTA ADMIN ON conserva acceso previo al calendario; VISTA ADMIN OFF y jugadores normales mantienen el bloqueo programado.

# v1.10.14 — VISTA ADMIN y simulación de temporada programada (2026-08-19)

- Se corrige el bypass excesivo introducido al permitir que los administradores navegasen una temporada programada: el rol real por sí solo ya no evita el bloqueo de jugador.
- `isLeagueAdmin(...)` / `canAccessAdmin` —que incorporan `isAdminViewEnabled`— gobiernan ahora el bypass visible en HOME, AppShell, CALENDARIO/PARTIDOS, detalle de PARTIDO, CHAT de Liga y selección de temporada de `useCurrentLeagueData`.
- Con VISTA ADMIN activada, creador/admin/superusuario conserva la temporada programada navegable y ve también countdown/estado programado en HOME.
- Con VISTA ADMIN desactivada, esa misma cuenta se comporta como jugador normal para las pruebas locales: navegación bloqueada, HOME previo al inicio y partidos/chats restringidos hasta el comienzo.
- Los permisos reales no se eliminan del modelo ni de servidor; el cambio afecta al modo de presentación/navegación controlado por VISTA ADMIN.
- La Jornada 1 sigue sin activarse antes de su fecha y no hay migraciones nuevas.

# v1.10.13 — Inicio programado visible también para admins (2026-08-19)

- Se corrige una regresión de v1.10.11/v1.10.12: permitir que un administrador navegue una temporada programada no debe ocultar en HOME su estado previo al inicio.
- `SeasonStartCountdown` y el panel `Próxima temporada` pasan a depender del estado programado de la temporada, no de que el usuario esté bloqueado; por tanto también aparecen para creador, administradores y superusuarios.
- El bloqueo de navegación continúa dependiendo de `isPlayerSeasonLocked` / `isScheduledSeasonHomeLocked`, de modo que los jugadores normales siguen restringidos hasta el inicio y los administradores mantienen calendario, jornadas y partidos accesibles.
- No se adelanta la activación de la Jornada 1 ni se modifica la fecha programada.
- No hay cambios de Supabase ni migraciones nuevas.

# v1.10.12 — CHAT compartido entre Liga y Amistosos (2026-08-18)

- Los chats de Liga y Amistosos reutilizan `MatchChatShared.tsx` como base común para cabecera/frame, mensajes de texto, avatares, colores de remitente, recibos de lectura, composer, estado de solo lectura, aviso de las 24 horas y ajuste al viewport/teclado móvil.
- El chat de Liga conserva como extensiones específicas las propuestas de fecha y ubicación, menciones, respuestas por gesto y confirmación de reserva; los mensajes de texto normales se renderizan con el mismo componente que los amistosos.
- El chat de Amistosos deja de mantener una segunda implementación visual: usa `MatchChatScreen`, `MatchChatTextMessage`, `MatchChatComposer`, `MatchChatReadOnlyBar`, `MatchChatWriteWindowBanner`, `useMatchChatAutoScroll` y `useMatchChatViewport`.
- Se añaden pruebas estructurales para impedir que Liga y Amistosos vuelvan a duplicar las piezas visuales comunes del chat.
- Se mantienen acumulados todos los cambios de v1.10.11: bandeja `Mis partidos > Chats`, selector flotante de jugadores, tutoriales automáticos de una sola ejecución, pago de inscripción corregido, temporada programada plenamente navegable para administradores y botón futuro de transparencia en Economía.
- No hay migraciones nuevas en v1.10.12. El chat de amistosos sigue dependiendo de la migración aditiva ya preparada `20260818213500_add_personal_match_chat.sql`; esta entrega local no la aplica a ningún Supabase remoto.
- Validación previa de v1.10.12 en el entorno de preparación: 15/15 checkers estáticos, `git diff --check`, transpilación sintáctica de 49 TS/TSX modificados y 127/127 pruebas unitarias/estructurales modificadas ejecutables sin dependencias del proyecto. La validación completa real de dependencias, lint, typecheck, suite, build, quality y E2E se repite sin short-circuit en el equipo local antes de arrancar desarrollo.

# v1.10.11 — Chats de amistosos, pagos y temporada programada para admins (2026-08-18)

- `Mis partidos > Chats` reúne todas las conversaciones de amistosos del usuario, sin filtrar por estado, con no leídos, último mensaje, Realtime y los estados Programado, Abierto 24 h, Solo lectura e Historial eliminado.
- El chat de amistosos distingue explícitamente la ausencia del esquema de chat y señala la migración pendiente `20260818213500_add_personal_match_chat.sql`; esta entrega local no aplica migraciones remotas.
- Los selectores de jugadores de amistosos pasan a popup flotante mediante portal, bloqueo de scroll, cierre con Escape y fondo difuminado, manteniendo identidad y selección manual.
- El progreso de tutoriales se considera completado por clave de recorrido, no por versión: refrescar o actualizar no vuelve a lanzar un tutorial ya visto. `chats`, `match` y `chat` quedan además admitidos por la API de progreso.
- El pago de inscripción por parte del propio jugador utiliza una ruta dedicada y autorizada server-side; ya no intenta guardar toda la configuración de temporada mediante una operación reservada a admins.
- Una temporada programada deja de bloquear a creadores, administradores y superusuarios aunque `VISTA ADMIN` esté desactivada: ven la temporada actual, calendario, jornadas, partidos y chat con normalidad. Los jugadores normales conservan el bloqueo hasta el inicio y no se altera la activación temporal de la Jornada 1.
- Economía añade al final el botón deshabilitado `Generar informe de transparencia · Próximamente`; la generación del informe queda pendiente para una entrega posterior.
- La validación local de entrega se ejecuta sin short-circuit: todos los gates se recopilan antes de fallar y, si todo pasa, `npm run dev` queda asociado al mismo PowerShell.
- Validación previa en el entorno de preparación: `git diff --check`, 15/15 checkers estáticos, inventario de seguridad actualizado a 86 rutas / 124 métodos, presupuesto de fuente en 106.952 líneas / 158 clientes / 49 páginas cliente y transpilación sintáctica de todos los TS/TSX modificados correctos. La suite real, ESLint, typecheck, build, quality y E2E se ejecutan de nuevo en el proyecto local mediante el instalador antes de arrancar desarrollo.

# v1.10.10 — PARTIDO unificado y chat de amistosos (2026-08-18)

- PARTIDO de Liga y Amistoso comparten `MatchDetailView`, `MatchDetailPairingPanel`, `MatchScheduleForm`, `CourtBookingPanel` y `MatchResultForm`; el editor de participantes se mantiene específico porque su negocio es distinto.
- El perfil REVÉS/DRIVE + DIESTRO/ZURDO del amistoso usa la misma ubicación y ciclo visual que Liga; no se inventa posición de clasificación fuera de competición.
- Los amistosos incorporan chat privado de texto para participantes vinculados con Realtime y recibos de lectura.
- Liga y amistosos permiten mensajes durante 24 horas tras registrar el resultado; las acciones de coordinación de Liga se cierran al finalizar el partido.
- Nueva migración aditiva `20260818213500_add_personal_match_chat.sql`: tablas privadas para mensajes/lecturas y función service-role para purgar chats de amistosos a los dos meses. La ruta programada de notificaciones ejecuta esa limpieza en modo best-effort.
- Esta entrega es local: no aplicar la migración ni publicar PRE/PROD hasta superar validación y revisión manual.

# v1.8.23 — Propuestas propias con contenido más ligero (2026-08-16)

- CHAT conserva el color dominante del tema en el contenedor exterior de las propuestas propias.
- Fecha, ubicación, votación, detalle de votos y badges interiores vuelven a superficies claras con texto oscuro.
- Las propuestas recibidas mantienen su presentación blanca y no cambia la lógica de votación, coordinación, reserva ni API.
- La cabecera de una propuesta propia vuelve a usar el mismo contraste `on-primary` que los mensajes enviados normales; el texto auxiliar y la hora/recibos comparten su estilo sin contaminar las superficies interiores claras.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.22 — Ajustes visuales de Chat y bandeja (2026-08-15)

- Las propuestas de ubicación centran verticalmente el nombre mientras no exista acuerdo y reservan espacio para la etiqueta `Acuerdo 4/4` cuando aparece.
- CHATS elimina los chevrons laterales de las conversaciones y recupera ese espacio para el contenido.
- Se conservan el ocultado del panel Pendiente de reserva tras confirmar y la diferenciación visual entre propuestas propias y recibidas.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.21 — Reserva pendiente desde acuerdo de fecha (2026-08-15)

- El detalle de Programación usa el formato `Jueves · 19 de Febrero de 2026 · 19:00`.
- Una fecha/hora con aprobación 4/4 pasa directamente a `awaiting_booking`; la ubicación ya no es requisito previo.
- CHAT fija el estado Pendiente de reserva sobre el historial y permite confirmar fecha, ubicación y pista o invalidar las fechas acordadas para abrir una nueva propuesta.
- Las ubicaciones aprobadas 4/4 se respetan al confirmar; sin acuerdo previo se ofrecen las ubicaciones configuradas, mientras las rechazadas 4/4 quedan señaladas y bloqueadas.
- Los votos ✓/✕ son reversibles al pulsar de nuevo el mismo voto.
- Los avisos de acuerdo de fecha y de partido programado comparten el hilo de notificación del chat; ambos incluyen a los cuatro participantes y se silencian en el dispositivo que mantiene ese CHAT visible.
- No se añaden migraciones ni se modifica el esquema de Supabase.

# v1.8.20 — Perfiles enlazados desde Chat (2026-08-15)

- Los nombres de jugadores visibles en CHAT abren su perfil mediante el `playerId` real del participante.
- El enlace se aplica al autor del bloque, detalle de votos y referencias de respuesta cuando el participante puede resolverse de forma segura.
- No hay cambios de API, permisos, Supabase, migraciones ni datos persistidos.

# v1.2.13 — Accesos de cierre y preparación operativa (2026-08-06)

- Inicio añade accesos a Historial y estadísticas y a Compartir resumen cuando la temporada está terminada.
- Registro de cambios ofrece contenido público genérico y detalle técnico exclusivo para superadministración.
- Quedan preparados observabilidad opcional, rulesets de GitHub, QA autenticada de PRE y backups cifrados de Supabase.
- Las integraciones externas permanecen desactivadas hasta configurar sus credenciales y variables.
- No se añaden migraciones ni se modifican datos persistidos.

# v1.2.12 — Automatización de calidad (2026-08-06)

- Supabase local reconstruye y prueba migraciones, actualización histórica y restauración de backup en CI.
- La autorización de liga y partido se centraliza y queda cubierta por una matriz completa de actores.
- Todas las rutas API se inventarían automáticamente y la allowlist pública queda cerrada.
- Se añaden presupuestos de código, bundle y Lighthouse con artefactos de diagnóstico.
- GitHub Actions separa los gates de código, navegador, base de datos y rendimiento.
- El rate limiting admite Redis REST compartido cuando se configuran credenciales y conserva fallback local; los logs incluyen metadatos de despliegue.
- No hay migraciones nuevas ni cambios de producto o datos persistidos.

# v1.2.11 — Valores iniciales de Notion Avatar (2026-08-06)

- Todas las categorías de Notion Avatar comienzan en el índice cero, mostrado como Estilo 1.
- Restablecer devuelve la receta completa a Estilo 1.
- La clave local experimental avanza a `smash-lob-avatar-lab-notion-v3` para no recuperar selecciones antiguas de PRE.
- No hay cambios de permisos, autenticación, API, Supabase, migraciones ni datos persistidos.
- La promoción conserva como requisitos manuales el backup de PROD y la auditoría SQL de identidades.

# v1.2.10 — Endurecimiento previo a producción (2026-08-06)

- Rama prevista: `chore/v1.2-prepublication-hardening`, creada desde `staging` en `bf605dd07bee3659a315c3ee1b0bec06daa4bfbf`.
- Avatar Lab queda habilitado únicamente en `pre.smashandlob.com` y desarrollo local; Ajustes, búsqueda, páginas y API quedan bloqueados en PROD.
- Los renderizadores experimentales requieren sesión, aplican rate limiting y no generan cachés públicas compartidas.
- Las nuevas imágenes globales se generan a 256 × 256 y se limitan a 160 KB; la lectura mantiene compatibilidad con imágenes antiguas de hasta 512 KB.
- `/api/access` publica `X-Smash-Lob-Snapshot-Bytes` y registra una advertencia estructurada cuando el snapshot supera 1 MB.
- Se añaden `/api/health`, smoke tests PRE/PROD, validación de versión, auditoría de migraciones e identidad, y checklist de promoción.
- La publicación a PROD queda bloqueada hasta superar `npm run release:check`, el smoke de PRE, la auditoría SQL y las comprobaciones manuales autenticadas del checklist.
- No se modifica ninguna migración ya aplicada; cualquier reparación de datos debe añadirse en una migración posterior y reversible.
- La regresión visual detectada en Ajustes correspondía al test: ocultaba únicamente la fila experimental y dejaba la sección vacía; v1.2.10 oculta la sección completa sin renovar snapshots.
- `npm audit --omit=dev --audit-level=high` informa cero vulnerabilidades de producción; los avisos altos de `npm ci` quedan limitados a herramientas de desarrollo.

# Avatar Lab v1.2.8 — Notion compacto (2026-08-05)

- Editor Notion reorganizado en una única vista móvil con preview y controles visibles simultáneamente.
- Eliminados presets, selección de forma y selección de fondo.
- Lienzo Notion fijo, rectangular y blanco.
- Categorías accesibles con anterior/siguiente y selector nativo; estilos centrados en navegación anterior/siguiente.
- Sin cambios en perfil, Supabase o datos de liga.

## v0.16.12 — Classic style naming and award header polish

- Renamed the visible neutral appearance style to Clásico/Classic/Klasikoa while preserving the internal `plain` storage key.
- Kept Colorido and all six palettes unchanged.
- Rounded the Home season-winner and season-MVP title bars to align with the containing cards.
- No API, permission, routing, database or remote-environment change.
- Local lint, typecheck and production build remain required before commit and promotion.

## v0.15.7 — Availability effect dependency cleanup

- ESLint exhaustive-deps warning removed from the availability screen.
- No API, permission or database changes.
- Local lint, typecheck and production build remain required before commit.

## v0.14.0 settings architecture (2026-07-24)

- Reorganized Settings into Personal, My leagues, Personal activity, Administration, Help and information, and Session.
- Player and spectator settings now share the same capability-driven visual architecture.
- Reorganized the league administration hub into General, People and access, Competition, Operations, and Data and control.
- Grouped personal notification preferences into four expandable categories.
- Added clearer internal sections to season, league, users, and administrative activity screens.
- Preserved all existing routes, anchors, APIs, permissions, and the current settings-search implementation.
- No database migration or remote change is required.


## Post-release validation fix (v0.15.5, 2026-07-24)

- Fixed two TypeScript errors introduced by actionable empty states on the Activity screen.
- Empty-state refresh actions now reuse the same refresh function as the section headers.
- No database migration, API contract, permission, or data change is required.

## v0.13.3 public changelog (2026-07-24)

- Added `/changelog` with a public-safe history of documented Smash & Lob releases starting at v0.6.2.
- Added access from player and spectator settings, the visible version footer, and the settings search index.
- Grouped minor revisions when a reliable public per-patch description is unavailable instead of inventing release details.
- Added the changelog route to the spectator allowlist.
- No database migration or remote change is required.


## v0.13.2 cumulative application-admin package (2026-07-23)

- Rebuilt the complete v0.13.x delivery from the original staging snapshot plus the v0.13.0 application-administration changes.
- Retains the v0.12.7 scheduling-panel and compact statistics season-selector refinements.
- Corrects the v0.13.1 upcoming-roster refresh so Supabase snapshots replace stale season/player membership data for the leagues represented by the snapshot.
- The correction is client-state-only and does not add or modify database migrations beyond `20260723133000_add_application_admin_controls.sql`.
- Version advanced to v0.13.2 because the previously delivered v0.13.1 package did not pass TypeScript validation.

# Production Hardening Status

## MC13 — progreso (2026-10-18)

Implementados: validación visible del sorteo con tabla de participación individual; el test confirma 12 partidos, 4 por jugador, 2 descansos, 64 minutos, sin descansos consecutivos, máximo 2 partidos seguidos, 4 compañeros, 8 rivales y 2 usos por pista. Añadidos ajustes informativos bloqueados para cuenta atrás previa y calendario oculto. El formulario permite vincular jugadores a cuentas registradas con membresía en alguna liga compartida con el organizador, y el sorteo conserva el vínculo.

Añadido acceso de participantes mediante invitaciones tokenizadas: persistencia solo del hash, token de un solo uso y caducidad a 30 días; vista pública revela únicamente torneo/plaza, reclamación autenticada y acceso de lectura para el participante. Las mutaciones siguen restringidas al creador. Inventario de seguridad actualizado. No se aplicó la migración a remoto ni se desplegó.

Verificación parcial: 15 pruebas unitarias/de rutas pasan; `i18n:check`, API security inventory y ESLint focalizado pasan. `npm run typecheck` inició correctamente y terminó sin diagnósticos visibles. No hay Docker/Podman para iniciar Postgres local; la CLI está vinculada a `smash-lob-staging`, que se mantiene intacto. Pendientes revisión SQL estática, validación completa, UI E2E de acceso/invitación y actualizar el estado final del hito.

## MC13 - Verificación y acceso a participantes de torneos (IN PROGRESS)

Solicitud: validar visualmente la plantilla con estadísticas por jugador (juego/descanso y racha máxima), mostrar opciones futuras de cuenta atrás/datos ocultos, seleccionar cuentas existentes de ligas compartidas con el organizador y permitir acceso al participante por invitación. En análisis de límites de datos y permisos. No aplicar DB remota ni publicar hasta probar auth, enlaces y aislamiento con fixtures.

## MC12 - Mejorar la legibilidad de RACHA (DONE)

Solicitud: renombrar FORMA a RACHA y destacar las V/D blancas con más tamaño y sombra de texto, conservando los círculos verdes/rojos, borde blanco y sombra en ambos perfiles. Componente compartido y prueba de regresión actualizados. `npm run validate` (999/999; repetición aislada tras timeout RPC de workers durante concurrencia con E2E), build (1195395 bytes gzip/103 chunks), E2E (107 passed/1 skip previsto), auditoría runtime (0 vulnerabilidades). PR #49 integrado; CI #395 4/4 success. PRE `dpl_CMgAqTznm19ni2NsotQQq8ABj45q` READY y alias `pre.smashandlob.com` verificado; health 200/version 1.15.31/environment pre y SW `smash-lob-v1.15.31`. Sin cambios DB/dependencias; main (`9578fe006063108cfcab93956fe23e1eb402f37c`) y tag `v1.0.0` (`e9152940ec51fdc34b785aa8ea0e054c110c4040`) intactos.

## MC11 - Colores del grafismo FORMA (DONE)

PR #48 integrado en `staging` (SHA `6ae40381b13c977acd84907b800a516f7a1b8323`); CI #392 completó los cuatro jobs correctamente. PRE apunta al deployment `dpl_CPMMW5qQ56hA8USd3rGzdbEBo1aV` (READY) del SHA integrado y el deployment reporta el alias `pre.smashandlob.com`. Smoke: `/api/health` 200 con versión 1.15.30 y entorno `pre`; `/sw.js` 200 con caché `smash-lob-v1.15.30`. Validación local: `npm run validate` (999 pruebas/250 archivos), ESLint 0 errores y 4 avisos preexistentes, TypeScript, build 1195293 bytes gzip/103 chunks; E2E 107/107 y 1 omisión prevista; `npm audit --omit=dev --audit-level=high` 0 vulnerabilidades. Sin cambios de base de datos/dependencias ni uso de cuentas personales o datos de Production. Main (`9578fe006063108cfcab93956fe23e1eb402f37c`) y tag `v1.0.0` (`e9152940ec51fdc34b785aa8ea0e054c110c4040`) permanecen intactos.

## MC10 - Ajustes de perfil y chats globales (DONE)

DONE 2026-10-18. PR #47 integrado en `staging` (SHA `1a24aef06f0b8b0883868a351686b0f37aac8e28`). Los cuatro jobs de CI #390 pasan. PRE apunta al deployment `dpl_S9c6eRhp3prJpWkrggQpLzkhKmty` (READY) construido desde ese SHA; `pre.smashandlob.com` confirma el mismo deployment. Smoke con transporte autenticado Vercel: health 200, versión 1.15.29, entorno pre; manifest y service worker 200 con caché `smash-lob-v1.15.29`; `/leagues`, `/personal-matches/chats` y `/personal-matches/profile` 200. Validación local: `npm run validate` 998 pruebas/250 archivos, ESLint 0 errores y 4 avisos preexistentes, TypeScript, build 1195300 bytes gzip/103 chunks y presupuesto; E2E 107/107 más 1 skip previsto; `npm audit --omit=dev --audit-level=high` 0 vulnerabilidades; 45 pruebas focalizadas adicionales correctas. Sin cambios de base de datos/dependencias ni pruebas con datos personales o de Production. Main (`9578fe006063108cfcab93956fe23e1eb402f37c`) y tag `v1.0.0` (`e9152940ec51fdc34b785aa8ea0e054c110c4040`) permanecen intactos.

## 2026-10-10 - Audit corrections authorized

- C15 COMPLETE: PRE https://pre.smashandlob.com now points to READY preview deployment dpl_AcYktfsnzmj4UdgMJ3VurxHhFhQN (smash-g0iq0o5dl-davidalonsoc4-8740s-projects.vercel.app), built from staging 33604ceee9a44d662fe5e7868e025638d7bebeea / merged PR #20. All four candidate jobs (38089047485) and all four staging push jobs (38089344659) SUCCESS. Authenticated Vercel transport smoke: health 200, status ok/version 1.15.10/environment pre; home 200; Avatar Lab 200; its API 401 without an app session. Anonymous health still 302 under existing Vercel SSO protection. Exact evidence: correction-evidence/C15-pre-publication.json. No migrations or remote data writes. Main and v1.0.0 refs verified unchanged; no Production promotion. Twenty-three corrections published, seventeen transaction findings remain OPEN (six P1); real OAuth/PRE/device acceptance remains manual. No user installation needed for this publication; worker-local Docker solved C14.

- C15 final candidate 76ae224fb67690d847d1127170551ccc13ad8f31 passed all four CI jobs in run 38089047485. PR #20 merged to staging at 33604ceee9a44d662fe5e7868e025638d7bebeea; merge and remote staging SHA verified. Main still 02c3c4a15ab8f74fc7f351f0a1e06ba4d8be2f46, v1.0.0 still e9152940ec51fdc34b785aa8ea0e054c110c4040. Staging push CI run 38089344659 and Vercel deployment smash-g0iq0o5dl-davidalonsoc4-8740s-projects.vercel.app in progress. PRE alias still points to v1.15.9; do not claim publication complete yet. Application/test/dependency trees match origin/staging.

- C15 final local gates PASS for v1.15.10: full validate (922 tests/237 files), 76/76 E2E with unchanged visual baselines, zero full/runtime vulnerabilities, version/source/secret checks and diff check. Build 1183262 gzip bytes / 102 JS chunks; source 132248 lines / 191 clients. All 64 candidate application/dependency/test files match the isolated validation checkout. Real OAuth/PRE/device acceptance remains manual. Final candidate push/CI and staging/PRE promotion next; no database migration required.

- C15 release metadata prepared as v1.15.10 (package/lock/app label/service-worker cache/changelog/smoke expectations). Source gate caught the changelog at 2491 lines against 2490; compacted adjacent type fields without changing behavior or raising the budget. Re-run full local release validation before final candidate push. Prior version's four CI gates passed; no PRE promotion yet.

- C14 COMPLETE using the identical script in worker-local disposable Supabase: run 38078565124/job 114290558197 SUCCESS, full migration replay, schema lint, two pgTAP files/38 tests (also rerun after upgrade), synthetic logical backup/restore and legacy identity upgrade all passed. Database artifact 11678588759 (SHA256 ceadcf558a289f07dc776b3b10d58f55658b746bb898dc1bb4a2c88ca73900e7). All four CI jobs SUCCESS. Workstation Docker still unavailable, but the prerequisite now has real-engine evidence; no PRE/Production data used. C15 starts PRE-only publication of the 23 existing corrections; 17 transaction findings remain OPEN.

- Candidate committed in domain groups fe9f9383 (toolchain), 15658bd3 (application corrections) and adeb3c90 (audit evidence), pushed and remote SHA verified. Draft PR #20 targets staging: https://github.com/davidalonsoc4/smash-lob/pull/20. Release-quality run 38078565124: code/build, browser/accessibility/PWA and Lighthouse SUCCESS; database gate still running. GitHub integration automatically built a READY branch preview smash-cc95wblvi-davidalonsoc4-8740s-projects.vercel.app; this is not PRE alias promotion. No staging merge, PRE alias change or database write. C14 remains incomplete until its database result is verified.

- C14 recovery: user delegated the next steps and connected Supabase. Read-only MCP verified PRE ACTIVE_HEALTHY and its 62 registered migration versions match the repository; no migration is pending. The plugin does not provide the missing workstation Docker runtime. Existing release-quality CI runs the identical database quality script in a disposable Ubuntu Docker stack with synthetic fixtures. Prepare a candidate PR to staging to execute C14 there; no merge/deployment or subsequent database correction before verified success. This repairs the validation prerequisite rather than accepting a failed gate. Production/main/tag remain untouched; no remote database writes.

- PRE publication requested by user after C13/C14 results. Read-only remote verification: staging b6212a007cac7ae1f7a0b809b9953e561836edc0, main 02c3c4a15ab8f74fc7f351f0a1e06ba4d8be2f46; audit corrections branch is local/uncommitted and has not been published. C14 remains the first incomplete milestone; Docker still absent from PATH. Requested an explicit exception to the AGENTS critical-validation stop rule if user wants only the 23 validated non-migration corrections promoted now. PRE publication authorization is recorded; exception pending. No push, commit or deployment performed in this follow-up.

- C14 BLOCKED: `npm run database:quality` exited 1 while starting isolated local Supabase (`LegacyDbBootstrapError: failed to inspect service`), before replay/pgTAP/schema/restore/upgrade could run. Docker/psql/pg_ctl/Supabase executables absent from PATH; Docker Desktop/CLI, PostgreSQL and Podman absent from standard installation paths. No database transaction correction accepted or migration created. Per AGENTS, stopped after this critical validation failure. Resume ONLY C14 after a local disposable Supabase engine (normally Docker Desktop) is installed/running; rerun `npm run database:quality` in C:/Users/USER/.codex/worktrees/functional-audit-check/smash-lob. Do not substitute PRE/Production or mocks for this gate. Exact low-level bootstrap cause beyond unavailable runtime not established. Evidence C14-database-quality.log; 23 locally corrected findings / 17 OPEN in AUDIT_CORRECTIONS.md, including six P1. No commit, push, deployment or real-data writes.

- C13 COMPLETE: full validate, 922 tests/237 files, 76/76 isolated browser tests (including visual snapshots, accessibility and PWA), full/runtime audits zero, diff check pass. No visual baselines changed. Placeholder OAuth logs include expected UntrustedHost errors; real OAuth/PRE remain untested manual gates. C14 starts the required local database quality prerequisite before implementing the 17 transactional findings.

- C13 full validate PASS: all static checks, lint (four pre-existing warnings), TypeScript, 922/922 tests in 237 files, production-mode build and budgets (1183261 gzip bytes / 102 JS chunks). Full and runtime dependency audits both zero. Isolated browser suite pending; no real data or existing localhost changes. Source budget preserved at 132248 lines / 191 clients.

- C13 first validation stopped at the source budget: 132314 lines/192 client files exceed existing limits (132250/191). No limits raised. Removed duplicate server activity type declarations by using shared exported types and kept the focus hook local to its sole client component, removing the unnecessary extra client module. Re-running gates before advancing.

- C12 COMPLETE: 29 tests in three files, including 85 arbitrary-ID boundary cases across 8–24 players plus existing advertised maximum tests; lint and TypeScript pass. BUG-020 resolved locally. C13 starts cumulative validation before the remaining database transaction corrections. Current tally: 23 findings corrected locally, 17 still open (not claiming completed audit remediation).

- C11 COMPLETE: nine directed tests, lint and TypeScript pass. BUG-026 resolved locally with conservative rejection of ambiguous/nonexistent DST endpoints. C12 starts on BUG-020: greedy extended-leg tie-breaking currently depends on lexical real player IDs while advertised capacity was precomputed with canonical player-1…N IDs.

- C11 implementation: saved intervals resolve using each player's zone and own local date (including adjacent dates), then compare real instants against browser-local recommendation candidates. DST-ambiguous/nonexistent endpoints and invalid zones fail closed; such exceptional slots are conservatively omitted rather than asserting false availability. Cross-zone and override regressions added; validation pending.

- C10 COMPLETE: six PWA/draft tests, lint and TypeScript pass; fixed test cleanup order before acceptance. BUG-035 conservatively protected for the edited app session. C11 starts with actual-instant availability comparison (BUG-026).

- C10 implementation: editing input/select/textarea/contenteditable blocks automatic activation and post-activation reload for the current app session, even after blur. Conservative session latch avoids assuming an asynchronous form save succeeded; clean sessions retain idle updates. No new manual update UI introduced. Tests/gates pending.

- C09 COMPLETE: 32 tests in four files, lint and TypeScript pass. BUG-033 resolved locally for explicit database errors and durable-success reporting; delivery remains at-least-once. C10 starts with draft protection for idle PWA update (BUG-035).

- C09 implementation: enqueue/lookup/update errors now fail explicitly; successful Push delivery followed by sent-state persistence failure is surfaced separately, never caught as a transport retry. Regression cases cover enqueue, lookup, sent update, transport retry update and invalid-endpoint discard. Validation pending; no real Push or database requests.

- C08 COMPLETE: four regression tests, lint and TypeScript pass. BUG-017/021 resolved locally; custom duplication length retained, incomplete round permutations rejected without writes. C09 starts on ignored Push queue database errors (BUG-033).

- C07 COMPLETE: nine tests, targeted lint and TypeScript pass after fixing the test typing. BUG-027/039 resolved locally. C08 begins on duplication length and round permutation validation; transactional failures remain open.

- C07 implementation: coordination loaded independently from the recent 60 messages; activity keyset uses created_at/id, validates cursors and advances over filtered private pages. Nine directed tests pass; lint passes. TypeScript caught a possibly undefined response in the synthetic regression test, fixed before re-running the gate. Friendly chat has no structured proposals; its recent text window is unchanged.

- C06 COMPLETE: nine tests in two files, targeted lint and TypeScript exit 0. BUG-006/007/010 resolved locally. C07 starts with chat history and activity pagination, BUG-027/039; no remote changes.

- C06 implementation: queue position computed before filtering visible rows, and API supplies authenticated ownEntry to prevent email/player-ID mismatches in promotion UI. Cancelled entry reactivation is conditional on cancelled status, clears old promotion and moves to queue end; existing waiting/promoted joins are idempotent and lookup/write errors fail explicitly. Nine targeted tests in two files and lint pass; TypeScript running. BUG-011/012 capacity/expiry remain separate and open.

- C05 COMPLETE: 10/10 targeted tests, lint, onboarding check and TypeScript exit 0. BUG-034/036/038 resolved locally. C06 is first incomplete, scoped to BUG-006/007/010; waitlist capacity/expiration races remain open for later database work.

- C05 checkpoint: html lang follows the locale effect; guided tour uses a focused modal root with keyboard Tab/Shift+Tab containment, programmatic focus containment, background inert state preservation and focus restoration. Backdrop removed from the keyboard sequence. README points to package.json instead of claiming an old deployed version. 10 targeted tests pass, including jsdom focus/language regressions; targeted ESLint and onboarding check pass; TypeScript running.

- C04 COMPLETE: 20 targeted tests, lint and TypeScript exit 0; medal row accents updated to use the shared rank rather than row index so exact ties get the same color. Six affected regression tests repeated successfully; typography gate passed. BUG-030/031 resolved locally. Final visual gate must review expected changed tie numbers/colors rather than silently update baselines. C05 is now first incomplete, scoped to BUG-034/036/038.

- C04 checkpoint: league API and shared result form reject tied set totals; ranking ignores legacy tied/empty completed results consistently with statistics. Ranking uses shared competition positions (1,1,3) across Home, table, match detail, statistics, CSV/Excel rows and ranking images. Existing ordinal tie test updated to the corrected contract. 20 targeted tests in 6 files and targeted ESLint pass; TypeScript running. BUG-029 removed from this pure-code milestone after review found the SQL substitution booking rebuild shares the same old rounding algorithm; it remains open with the financial database work.

- C03 COMPLETE: 13/13 targeted tests, targeted ESLint and TypeScript exit 0. BUG-002/004 resolved locally. C04 becomes first incomplete: money split, result winner validation and tied ranking positions (BUG-029/030/031).

- C03 implementation: account export resolves memberships by user_id, season participation by the associated player IDs and Push/preferences by user_email; any failed query returns a controlled 500 instead of a misleading partial export, with private/no-store headers. Confirmation accepts the phrase displayed for ES/EN/EU and sends the stable API token; invalid input now gives feedback. 13 targeted tests pass in 3 files, targeted lint passes; TypeScript gate running. No account deletion executed, BUG-003 remains open.

- C02 COMPLETE: full validate exit 0, 887/887 tests in 224 files, all static/lint/TypeScript/build gates pass; source/budget unchanged for UI. BUG-001/005/008/009 resolved locally; no actual Push sent. Provider allowlist also retains Microsoft's notify.windows.com channel domains (learn.microsoft.com/en-us/windows/apps/develop/notifications/push-notifications/wns-overview). C03 now first incomplete: BUG-002/004; destructive account lifecycle BUG-003 remains open for atomic database work.

- C02 implementation checkpoint: existing-account auth is read-only; new accounts use ignoreDuplicates with no role fields and a suspension recheck. Invalid invite code fallback removed; match preview selects only public game data and fee preview strips payment/expense rows. Fixed Push provider allowlist enforced at registration, league/friendly sends and retry; unsafe retries discarded without network. 36 targeted tests pass in 5 files, including revocation/creation race, valid/invalid invite, private payload exclusion and internal Push no-send; installed audit zero. Full validate in progress. Provider references: web.dev/articles/codelab-notifications-push-server, developer.apple.com/documentation/usernotifications/sending-web-push-notifications-in-web-apps-and-browsers and blog.mozilla.org/services/2016/02/20/webpushs-new-requirement-ttl-header/ . No real sends or remote data used.

- User authorizes completion of remaining audit corrections. C02 is the first incomplete milestone, scoped to BUG-001/005/008/009. Review confirms full stale auth upsert, wrong-code league fallback, private preview data, and unvalidated stored Push destinations. Implement locally with memory tests; preserve original audit evidence and existing server.

- C01 COMPLETE / BUG-040 resolved locally: final installed full and runtime audits both exit 0 with zero advisories. Full validate exit 0: 220 files / 861 tests, lint and TypeScript passed, production build passed. Playwright exit 0: 76/76 (mobile, desktop, visual comparisons, accessibility and PWA) without snapshot updates. Evidence C01-audit-installed.json, C01-audit-installed-runtime.json, C01-validate.log and C01-e2e.log. E2E logs include UntrustedHost from the existing placeholder OAuth setup; real OAuth is not validated by this suite. Vite also reports a future native-config-loader compatibility warning; current loading works and was not suppressed.
- Scope remains only C01: Vitest 4.1.11, brace-expansion patched overrides, and the scoped tinyglobby adapter plus its 3 compatibility regressions. Application source, existing lint rules and visual baselines unchanged. Existing localhost dependencies/server were not replaced; updated tools were installed and tested in the isolated checkout. No commit/push, PRE/Production promotion, data writes or migrations. Historical 40-item audit retained; 39 findings still open. Future functional work must define the next incomplete milestone before implementation.

- C01 full validate PASSED in the isolated placeholder checkout: all static gates, ESLint (0 errors / 4 existing warnings), TypeScript, full Vitest suite and production build/budget (1,181,317 gzip bytes / 102 chunks). Evidence C01-validate.log; initial failed lint attempt retained separately. Browser gate now running via the existing Playwright configuration, without personal accounts or PRE data. Still incomplete pending E2E.

- C01 full validation first attempt stopped at lint: the CommonJS adapter's required synchronous import triggered no-require-imports. Added a documented exception on that single import (no app rules or lint coverage removed). Four pre-existing unused-variable warnings remain. Restart validation after this correction; no functional milestones started.

- C01 adapter installed from a clean npm ci in the isolated checkout: installed full-tree audit exit 0, zero advisories; compatibility regression 3/3 passed (wildcards/files, default/missing/brace/array/Windows roots, real Next navigation lint violation). Corrected the relative local-package override and regenerated stale lock entries; final installed dependency uses tools/next-eslint-glob. Tracked validation inputs match the working checkout by hash. Full validate now running with Playwright placeholder environment; localhost:3000 and personal/PRE data untouched.

- C01 compatibility finding: direct tinyglobby alias returned child directories for a brace pattern, unlike fast-glob. Stopped the wider gates, replaced the alias with a scoped local adapter at tools/next-eslint-glob setting expandDirectories:false. Lockfile re-audit remains clean. Repeat compatibility tests before full validation. An initial copy attempt for MatchResultConfirmationCard.tsx encountered a Windows file lock; hashes confirmed both copies already identical, no source modification needed.

- C01 resumed by the user: scoped npm alias replaces only @next/eslint-plugin-next's fast-glob with tinyglobby 0.2.17. Source review of plugin 16.3.8 shows one consumer: getRootDirs calls globSync(pattern, { onlyDirectories: true }); tinyglobby implements this API. No lint rules/configuration removed, no Next downgrade, no advisory exclusions. Lockfile audit now exits 0 with zero vulnerabilities. Compatibility regression tests and full isolated validation still required; milestone not yet complete.

- Local branch `codex/audit-corrections`, based on `6fa8c72e`; original audit evidence retained. No remote changes authorized by this correction request.
- First incomplete milestone C01: BUG-040. Updating Vitest to 4.1.11 (compatible with the current Node 24 and existing CI Node 22) removes the old tinypool chain; updating brace-expansion overrides within their existing major lines. Next.js/ESLint versions remain unchanged.
- Registry and advisory review: braces 3.0.3 remains the latest published release and GHSA-vfj7-8cjw-p6xm lists no patched version. Re-audit the actual resolved tree before any further tests/build or functional changes. C01 is not complete.
- C01 checkpoint: package.json/package-lock.json updated locally using `npm install --package-lock-only --ignore-scripts --no-audit --no-fund` (exit 0); node_modules and the existing localhost server were not updated/restarted. This is a prepared lockfile change, not an installed or functionally accepted toolchain.
- New lockfile audit: `npm audit --package-lock-only --json` exit 1, 0 critical / 5 high / 0 moderate (previously 2 critical / 10 high / 1 moderate). Remaining chain is eslint-config-next -> @next/eslint-plugin-next -> fast-glob -> micromatch -> braces, a single unpatched root advisory. Runtime-only audit exit 0, no vulnerabilities. JSON evidence saved under `docs/production-hardening/correction-evidence/`.
- C01 BLOCKED and incomplete: no tests/build/browser runs or subsequent functional corrections after the failed security gate, as required by AGENTS.md. Do not downgrade eslint-config-next to 14.2.35 (npm's suggested incompatible major) or hide the advisory. Next step requires a compatible upstream fix or a separately reviewed replacement of the affected lint dependency chain. All other audit findings remain open; no commits, push, deployment, migrations or database writes.

Last updated: 2026-07-26 20:43:00 +02:00
Current branch at status update: `feature/v0.16-colorful-design`
Production branch confirmed from Git + Vercel: `main`
Production source version retained in this run: `v0.9.71`
Staging source commit retained in this run: `78f1986` (`v0.10.0`)
Active milestone state: `H20-H23 complete; environment isolation repair complete`

## Post-hardening fix checkpoint (v0.13.1, 2026-07-23)

- Fixed stale self-registration roster entries after a linked user leaves a league before the season starts.
- Supabase season snapshots are now authoritative for the leagues and seasons included in each refresh, so deleted `season_players` rows no longer survive in local state or localStorage.
- The existing unlink SQL function remains unchanged: it already removes the player from an upcoming self-registration roster and reopens registration. This patch only corrects client hydration.
- No database migration is required for v0.13.1.

## Post-hardening feature checkpoint (2026-07-23)

- Prepared source version `v0.13.0` on top of the current staging snapshot.
- Added global application administration for summary metrics, richer account data, account suspension/reactivation, onboarding resets, push/preference cleanup, league ownership transfer, and application-admin audit history.
- Added local migration `20260723133000_add_application_admin_controls.sql`; it has not been applied remotely by this patch.
- Account suspension is enforced in the shared server authentication boundary and renders a dedicated blocked-account screen before league providers load.
- League ownership transfer updates the league owner and both membership roles transactionally through a service-role-only SQL function.
- The v0.12.7 scheduling-panel and compact season-selector changes are retained cumulatively in this source.
- TypeScript/TSX syntax transpilation passed for every modified source file, and whitespace/conflict-marker checks are clean.
- Full dependency installation, lint, typecheck, and build could not be completed in the review container because its npm proxy returned HTTP 503 for required packages; these gates remain mandatory locally before commit.



## Product experience update — v0.16.0

- Added a fourth device-local appearance preference: `colorful`.
- The initial layout script and ThemeProvider apply the same resolved theme, preventing a light-theme flash during startup.
- Colorful styling is centralized in CSS and covers shell backgrounds, cards, statistics, ranking, bottom navigation, floating controls, forms and skeletons.
- Existing light, dark and system preferences remain supported without data migrations.
- Status colors remain semantic, and the per-league neutral-color option still takes precedence for status elements.
- Full local lint, TypeScript and production-build validation remains required before merging the feature branch.

## Final state summary

- `git fetch --all --prune` was rerun on 2026-07-16, and `git ls-remote --heads origin main release/production-hardening` confirmed both remote branches point to the same release line.
- The requested UI-only change is in place: the settings footer now renders `Beta cerrada · v0.9.68` for both player and spectator settings screens without changing `package.json`, `package-lock.json`, or `src/lib/appVersion.ts`.
- Local release gates for this final change passed: `git diff --check`, `npm run lint`, and `npm run build`.
- Preview and Production deployments for the release run reached `Ready`, and Vercel build logs tied them to `release/production-hardening` / `main` for the final release commit during rollout.
- Production env-name presence was confirmed without printing values, and the normalized checks for `QA_MODE=false`, `NEXT_PUBLIC_QA_MODE=false`, and `NEXT_PUBLIC_APP_URL=https://smash-lob.vercel.app` passed.
- The live production smoke suite passed for root, manifest, auth session/providers, Google provider metadata, cron-without-secret, protected no-session routes, and controlled invalid invite responses.
- The earlier invalid-key finding is superseded by the 2026-07-20 credential repair and the read-only REST validation recorded below.
- On 2026-07-18, the project owner completed the documented two-Google-account Production walkthrough, covering organizer, player/member, result/confirmation/MVP, and spectator flows.

## Environment isolation repair (2026-07-20)

- The local Supabase CLI link remains on PRE project `miadjotkucgluwbrgeih`; it was not switched to Production.
- Vercel Production now targets Supabase Production project `szycbwdzestcmimziyey` for the public URL, anon key, and service-role key.
- Vercel Preview defaults and the explicit Git branch `staging` overrides now target Supabase PRE project `miadjotkucgluwbrgeih` for the same three variables, preventing future Preview branches from falling back to Production.
- Both official legacy JWT pairs were validated before use: three JWT segments, expected project reference and role claims, and successful read-only HTTP checks.
- Public keys were compared exactly after storage without printing values. Service-role values were stored as Vercel Sensitive variables and cannot be read back.
- Production was rebuilt from its existing `main` deployment, preserving the v0.9.71 source line. Staging was rebuilt from its existing branch deployment, preserving v0.10.0.
- No code, data, migration, Supabase link, Production branch, or Git branch was changed as part of the remote configuration repair.
- Read-only data checks show 3 leagues in Production and 0 in PRE. The configured owner account exists in both environments and can create leagues; Production has 3 creator memberships while PRE has none.

## Verified deployment targets

- Preview credential-repair deployment id: `dpl_HppVyCzPCteV9vDJthi1c9fQESg4`
- Preview credential-repair URL: `https://smash-lmw3hmjw7-davidalonsoc4-8740s-projects.vercel.app`
- Preview stable alias (tracks subsequent `staging` commits): `https://smash-lob-git-staging-davidalonsoc4-8740s-projects.vercel.app`
- Preview status at the final post-push check: `Ready`
- Production deployment id: `dpl_ABUCNvnneZ5aTcLhwe51ChVRznBi`
- Production URL: `https://smash-op3577c8f-davidalonsoc4-8740s-projects.vercel.app`
- Production aliases:
  - `https://smash-lob.vercel.app`
  - `https://smash-lob-davidalonsoc4-8740s-projects.vercel.app`
  - `https://smash-lob-git-main-davidalonsoc4-8740s-projects.vercel.app`
- Production status: `Ready`

## Smoke-test snapshot (2026-07-20)

- `/` -> `200 text/html`
- `/api/auth/session` -> `200 application/json` with controlled anonymous response
- Production `/api/invites/CODEX-ENV-ISOLATION-CHECK-20260720` -> `404 application/json`, proving the server-side Supabase lookup completes without a credential error.
- Staging is intentionally behind Vercel Authentication. Authenticated Vercel checks returned an anonymous session and `{ "snapshot": null }` for the controlled invalid invite.
- Direct service-role REST reads completed without `401`: Production returned an exact league count of 3 and PRE returned 0.
- Production owner lookup found one account with league creation enabled and 3 creator memberships.
- PRE owner lookup found one account with league creation enabled and no memberships, consistent with an independent empty PRE dataset.

## Manual two-account verification completed

The project owner completed the interactive Production walkthrough with two Google accounts on 2026-07-18. The human-verified checklist covered:

- organizer sign-in
- opening the league
- generating a player invite
- joining with a second Google account
- claiming a player
- saving availability
- verifying calendar and ranking
- registering or reviewing a result
- verifying result confirmations and MVP voting
- opening and validating a spectator invite

This is human acceptance evidence reported by the project owner. It was not replayed independently by Codex, but it closes the final manual release check documented for the closed beta.

## Known residual risks

- Supabase platform defaults for `supabase_admin` in schema `public` remain an environment-level residual in `pg_default_acl`, although current public business tables remain owned by `postgres` and current-object grant/function audits are clean.
- Supabase security advisors still emit `RLS Enabled No Policy` informational findings on intentionally grants-closed server-only tables.
- The repo still has no automated test suite, so runtime confidence comes from static review plus Preview/Production smoke testing.
- The Google OAuth organizer/member/spectator round-trip now has human Production acceptance evidence; there is still no automated browser end-to-end suite to replay it continuously.

## Blockers

- No current release blocker is documented for the closed-beta scope.
- The application is considered Production Ready for controlled sharing with the league participants.

## v0.13.4 - Profile and navigation consistency (2026-07-24)

- Added a compact `/settings/profile` screen that unifies account-name and global profile-image editing.
- Kept create-league and join-league actions directly in Settings.
- Replaced remaining text navigation arrows with the shared `ClickableChevron` component.
- Made the current closed-beta version explicit on the public changelog card.
- No database migration is required.

## v0.14.1 - Settings polish (2026-07-24)

- Removed the duplicate application-version navigation row from Settings and restored the centered closed-beta version footer.
- Simplified the public changelog to show only release entries.
- Changed notification preference groups to load collapsed.
- Reworked per-day availability into compact expandable rows and removed the redundant profile-return button.
- Reduced Activity tab and Help screen visual scale to match the Settings architecture.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.2 - Suggestions and settings search (2026-07-24)

- Added an authenticated suggestion inbox with private per-user submission history.
- Added a superuser-only suggestion review screen with internal status and notes.
- Added migration `20260724111500_add_application_suggestions.sql`; browser roles have no direct table access.
- Replaced the inline Settings search bar with a floating search control above the bottom navigation.
- Expanded the search index to cover notification groups, season rules, operations, exports, application administration, and suggestions.
- Improved search matching for natural phrases, plurals, partial words, and small typing errors.
- Compacted Match "More actions" entries to remain on a single line.

## v0.14.3 - Contextual help and stable search dialog (2026-07-24)

- Fixed the floating Settings search dialog to a stable responsive height; only the results area scrolls when the query or result count changes.
- Added a shared multilingual season guide used by Help and by the pre-join rules acceptance screen.
- Help now documents recent application features and summarizes the active roster, calendar, schedule, round-window, scoring, confirmation, MVP, fee, incident, and substitution configuration.
- Registration, MVP, incident, and substitute explanations are omitted when those features are disabled.
- The invitation rules summary now reflects the target season instead of always showing generic fee, calendar, MVP, and substitution rules.
- No database migration, API, permission, or search-index change is required.
- TypeScript syntax transpilation and isolated strict validation of the shared guide passed. Full project lint, typecheck, and build remain mandatory locally because dependencies were unavailable in the review container.

## v0.14.4 - Floating search dialog polish (2026-07-24)

- Anchored the Settings search dialog below the top floating controls while keeping its top edge fixed.
- Made the dialog height content-adaptive up to a responsive maximum.
- Limited scrolling to the results area and only when the content exceeds the available height.
- Extended the backdrop beyond the top viewport edge to remove uncovered pixels on mobile devices.
- No database migration, API, permission, route, or search-index change is required.
## v0.14.5 - React effect validation (2026-07-24)

- Removed synchronous state updates reached directly from effects in both suggestion screens.
- Made initial suggestion loads cancel-safe so late responses do not update unmounted pages.
- Moved notification hash expansion and scrolling into animation-frame callbacks.
- No database migration, API, permission, route, or search-index change is required.

## v0.14.6 - Reopen finished season hotfix (2026-07-24)

- Added a dedicated reopen path for finished seasons instead of reusing initial season start logic.
- Reopening preserves roster mode, players, registrations, season settings, existing matches, and results.
- Existing matches are reloaded from Supabase without calendar regeneration.
- No database migration is required.



## v0.15.0 - Image crop and optimization (2026-07-24)

- Added a reusable crop editor for player avatars and league logos.
- Added drag, zoom, rotation and final-shape previews before upload.
- Normalized client images to 512 × 512 compressed WebP data URLs.
- Added file type and 12 MB input-size validation.
- No migration, API, permission or database change is required.

## v0.15.1 - Loading states and skeletons (2026-07-24)

- Added reusable skeleton primitives and page compositions.
- Replaced generic session, profile and league-transition spinners with structured loading states.
- Added route skeletons for the most-used list, ranking, settings and detail screens.
- Skeleton animation respects reduced-motion preferences.
- No migration, API, permission or persistence change is required.

## v0.15.2 - Actionable empty states (2026-07-24)

- Added a shared empty-state component with context-specific actions.
- Replaced generic empty messages across matches, notifications, activity, suggestions, announcements, substitutes and statistics.
- Added compact variants for dense administrative screens.
- No migration, API, permission or persistence change is required.

## v0.15.3 - Contextual onboarding (2026-07-24)

- Added dismissible tips for Settings search, custom availability, Match actions and Season administration.
- Added a Help control to restore dismissed tips.
- Added Spanish, English and Basque onboarding copy.
- Tip state is local to the device and does not add server-side tracking.
- No migration, API, permission or remote persistence change is required.

## v0.15.4 - Lint cleanup (2026-07-24)

- Removed the unused translation binding reported by ESLint in `ProfileCompletionGate`.
- Preserved all profile completion, onboarding, and availability behavior.
- No migration, API, permission, or persistence change is required.

## v0.15.6 - Action feedback and connection recovery (2026-07-24)

- Added a global accessible action-feedback center above the bottom navigation.
- Added persistent offline status and a connection-restored confirmation.
- Added success/error feedback to profile, availability, notification, and suggestion actions.
- Added direct retry controls for recoverable availability, notification, and suggestion failures.
- No migration, API contract, permission, or database change is required.


## v0.16.1 - Location display consistency (2026-07-25)

- Centralized readable formatting for serialized schedule locations and courts.
- Fixed scheduled-match and upcoming-match notification bodies so legacy JSON values are never shown to users.
- Applied the formatter to Activity, match schedule summaries, calendar links and CSV exports.
- Added consistent Colorful-mode accents to notification, activity and schedule cards.
- No migration, API contract, permission or persistence change is required.

## v0.16.2 - Colorful appearance palettes (2026-07-25)

- Added five prepared palettes for Colorful mode: indigo/violet, blue/turquoise, emerald, coral/pink and orange/purple.
- Centralized palette values through CSS variables used by backgrounds, surfaces, navigation, cards, forms, standings and skeletons.
- Added device-local palette persistence and early startup application to avoid visual flashes.
- Preserved semantic match, payment, warning, success and error colours independently from the selected palette.
- Added Spanish, English and Basque labels plus Settings search terms.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.3 - Independent theme and visual style (2026-07-25)

- Split appearance into Light/Dark/System base theme and Plain/Colorful visual style.
- Added a compact Themes and appearance screen and reduced the main Settings block to one summary row.
- Added dedicated dark variants for all five Colorful palettes.
- Added automatic legacy localStorage migration and early startup application without visual flashes.
- Added Spanish, English and Basque copy plus updated Settings search routing.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.4 - Visual consistency, action feedback and image viewer (2026-07-25)

- Consolidated transient save confirmations in the global accessible feedback center.
- Improved Colorful-mode contrast for primary actions, secondary text, disabled controls and semantic notices, especially in dark mode.
- Added an accessible lightbox for main league logos and player profile images.
- Preserved inline contextual errors, retry behaviour, status colours and all existing business logic.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.5 - Visual closure and Settings search (2026-07-25)

- Extended the existing floating Settings search to the main navigation hubs for Settings, league administration, leagues and application administration.
- Kept concrete action and form screens free from the additional launcher.
- Contained Colorful card accent strips inside rounded borders without globally clipping card content.
- Added subtle interaction outlines to muted buttons and links on dark Colorful palettes.
- No database migration, API contract, permission or persistence change is required.

## v0.16.6 - Dark Colorful contrast closure (2026-07-26)

- Removed palette-coloured glow from fixed top action controls in dark Colorful themes.
- Added a dedicated compact primary treatment for the invite share control.
- Restored readable muted labels on palette-primary surfaces, including player statistics and MVP summaries.
- Centralized the correction in theme CSS so selected cards and equivalent components inherit the same contrast fix.
- No database migration, API contract, permission or persistence change is required.

## v0.16.7 - Colorful card accent strip alignment (2026-07-26)

- Replaced the absolutely positioned Colorful card accent strip with a layered card background.
- The strip is now clipped by the card padding box and follows the exact rounded border geometry.
- Preserved dedicated notification, activity and schedule gradients through a shared CSS variable.
- Avoided global overflow clipping, so menus and interactive card content remain unaffected.
- No database migration, API contract, permission or persistence change is required.

## v0.16.8 - Bottom navigation and panel accent cleanup (2026-07-26)

- Removed the blurred palette-coloured glow projected above the bottom navigation.
- Replaced it with a one-pixel separator and a minimal inner highlight in light and dark Colorful combinations.
- Restored the top accent gradient in row-based cards whose opaque children covered the layered card background.
- Applied the shared accent-reveal treatment to Settings, league administration and custom availability panels.
- Preserved exact rounded-corner clipping, active navigation gradients, safe-area layout and all navigation behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.16.9 - Transparent league logos (2026-07-26)

- Added automatic alpha detection to the shared crop output.
- Transparent league logos preserve their background through PNG output, with transparent WebP fallback when needed to stay within the existing server size limit.
- Opaque logos keep the previous WebP format, dimensions and quality, so existing visual behavior remains unchanged.
- Audited all league-logo render paths; the shared component already uses a transparent container and `object-contain`.
- No database migration, API contract, permission or remote persistence change is required.

## v0.16.10 - Settings panel accent alignment (2026-07-26)

- Replaced the row-card padding workaround with an explicit internal accent strip rendered by `AppCard`.
- The strip is now clipped by the exact panel border radius and cannot be hidden or displaced by opaque rows.
- Applied the same shared treatment to Settings, league administration and custom day availability.
- Plain mode remains unchanged and does not reserve accent-strip space.
- No database migration, API contract, permission or persistence change is required.



## v0.16.11 · Paletas naturales y búsqueda de ligas

- Seis paletas Coloridas con variantes clara y oscura.
- Migración local de las cuatro paletas retiradas.
- Buscador contextual de ligas en `/leagues`.
- Sin migraciones ni cambios de API.

## v0.17.0 - Advanced statistics foundation (2026-07-26)

- Added season player comparisons with recent form, direct rivalry results and individual progress.
- Added the most frequent opponent to the existing individual season analysis.
- Brought Match scheduling and scoreboard panels into the shared Colorful accent treatment and removed the schedule-header divider.
- Made Home winner and MVP headers inherit the active Colorful palette while preserving Classic styling.
- No database migration, API contract, permission or remote persistence change is required.


## v0.17.1 - Season evolution and records (2026-07-26)

- Added global season records and personal competitive milestones.
- Added best/worst position, personal streaks and opponent records.
- Added compact period records to player profiles.
- Kept all calculations client-side over counted finished matches.
- No database migration, API contract or persistence change is required.


## v0.17.2 - Competitive progress charts (2026-07-26)

- Added comparative position and cumulative-points charts by round.
- Reused the player comparison selectors and existing calculated progress.
- Added palette-aware series and accessible SVG descriptions.
- Added no external chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.3 - Shareable final season summary (2026-07-26)

- Added a final-season card with champion, MVP, podium and competitive highlights.
- Added local PNG generation and native file sharing with download fallback.
- Adapted generated image colors to Classic and Colorful appearance settings.
- Added no external capture or chart dependency.
- No database migration, API contract or persistence change is required.


## v0.17.4 - Advanced statistics hardening (2026-07-26)

- Added tie-aware positions and shared champion handling.
- Excluded empty, tied or otherwise invalid finished results from all statistical calculations.
- Added data-quality visibility for pending, excluded and invalid matches plus roster changes.
- Precomputed progress once per selected season and skipped it in historical summaries.
- Fixed position chart scaling and shared-summary edge cases.
- No database migration, API contract or persistence change is required.

## v0.17.5 - Schedule accent consistency (2026-07-26)

- Removed the scheduling-only warm/accent card gradient.
- Match scheduling now inherits the same shared Colorful accent strip as standard application panels.
- Preserved panel clipping, rounded corners, layout and all scheduling behavior.
- No database migration, API contract, permission or persistence change is required.

## v0.17.6 - Statistics information architecture (2026-07-26)

- Replaced the overloaded statistics landing page with a compact overview.
- Split standings, comparison, individual analysis, records and season summary into dedicated routes.
- Preserved the selected season across statistics navigation through URL state.
- Reused one shared counted-match and statistics workspace across every detail page.
- Kept all v0.17 calculations available without changing formulas, APIs or persisted data.
- No database migration, API contract, permission or persistence change is required.

## v0.17.7 - Statistics callback dependency cleanup (2026-07-26)

- Replaced the type-only dependency on the full statistics object with the shared `MatchData` type.
- Removed the `react-hooks/exhaustive-deps` warning from the statistics workspace callback.
- Preserved all v0.17.6 routes, calculations and behavior.
- No database migration, API contract, permission or persistence change is required.


## v0.17.8 - Individual statistics refinement (2026-07-27)

- Added floating confirmation after creating or editing a match result.
- Added an all-player evolution route with position and accumulated-points views.
- Removed statistical pair rankings and shared-match counters from the v0.17 workspace.
- Ranked the strongest teammate by set differential and then game differential.
- Hid habitual-opponent frequency in balanced calendars.
- Reused the season selected on the statistics landing page across detail routes.
- Strengthened chart distinction through categorical colors, dash patterns and marker shapes.
- No database migration, API contract, permission or persistence change is required.

## v0.17.9 - Head-to-head and compact league evolution (2026-07-27)

- Renamed the two-player comparison route to Cara a cara and removed its duplicated evolution chart.
- Kept player summaries, recent form and direct-rivalry information focused on exactly two selected players.
- Replaced the league-evolution Top 4 shortcut with Top 3.
- Placed chart-mode and visibility selectors on one compact row and removed the repeated internal heading.
- Added one tick for every visible integer position and made seven rounds fit without horizontal scrolling.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax and chart-logic checks pass; full lint, project type-check and build remain pending in the local worktree because this review archive excluded `node_modules` and the package registry returned HTTP 503.

## v0.17.10 - Statistics usability and richer comparisons (2026-07-27)

- Differentiated participant and spectator invitation actions with dedicated user-plus and share icons.
- Removed the provisional podium, progress percentage, technical result counters and redundant navigation badges from the statistics landing page.
- Added sticky, editable player selectors to Head-to-head and Individual analysis.
- Expanded Head-to-head with direct set/game totals and performance against common opponents without double-counting aggregate matches.
- Reworked global and personal season records into plain-language cards with match context.
- Removed the standalone data-quality panel from the season summary, moved incomplete status beside the season label and blocked image export until the summary is complete.
- Rebuilt the shareable summary highlights and added cumulative game differential to league evolution.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.11 - Floating statistics selectors and Classic accents (2026-07-27)

- Replaced the CSS-only sticky selectors with a shared intersection-driven fixed selector in Head-to-head and Individual analysis.
- Preserved the original selector height while floating to prevent content jumps and kept every player field editable.
- Positioned the floating layer below the existing top controls and restored it to normal flow when scrolling upward.
- Added restrained grayscale gradient accent strips to cards in Classic light and Classic dark while leaving Colorful palettes unchanged.
- Added reduced-motion handling for the selector entrance transition.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript transpilation and structural checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes `node_modules`.

## v0.17.12 - League-wide statistics and individual evolution chart (2026-07-27)

- Made the fixed Head-to-head and Individual analysis selectors fully opaque with theme-aware borders and stronger exterior shadows.
- Added a `Toda la liga` statistics scope whenever a league contains more than one season; single-season leagues keep the selector hidden.
- Aggregated valid matches, rankings, comparisons, player details and records across all real seasons while resetting win streaks at season boundaries.
- Replaced the Individual analysis round table with a line chart for position, points and cumulative game differential.
- Preserved teammate, opponents, result and round context for every individual chart point.
- Rebuilt whole-league progress from each real season so metrics restart correctly, season boundaries are visible and lines do not imply continuity between competitions.
- Kept shareable final-summary images season-specific to avoid mixing champions, MVPs and podiums from different seasons.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax, semantic and aggregation smoke checks pass; full lint, project type-check and build remain pending in the local staging worktree because this review archive excludes installed dependencies.

## v0.17.13 - Taller and clearer season summary image (2026-07-27)

- Switched the generated season-summary asset used for both sharing and downloading to a taller vertical format.
- Reworked the image layout so champion, MVP, podium and highlights use the extra height with clearer spacing and hierarchy.
- Enlarged highlight cards and simplified podium rows to improve readability in the exported image.
- No database migration, API contract, permission or persistence change is required.
- Focused TypeScript syntax checks pass locally on the modified renderer; full lint, project type-check and build remain pending in the staging worktree with installed dependencies.


## v0.17.14 - Exported season summary readability fix (2026-07-27)

- Rebuilt the exported season-summary image with a taller single-column layout to avoid text collisions.
- Split champion and MVP into independent hero cards with more vertical space and stronger hierarchy.
- Stacked highlight cards vertically and constrained long copy to controlled wrapped lines with ellipsis.
- Kept sharing and downloading on the same generated asset.
- No database migration, API contract, permission or persistence change is required.
- Full lint, type-check and build remain pending in the local worktree with installed dependencies.


## v0.17.15 - Season summary export polish (2026-07-27)

- Combined champion and MVP into a single panel whenever they refer to the same player set.
- Added key player stats (points, wins, games difference) to hero panels in the page preview and exported image.
- Added games difference to podium rows in both the preview card and the exported image.
- Removed the intermediate badges for highlighted positions/moments and increased spacing between podium and highlights.
- Switched the generated summary image to a primarily light background regardless of the active app theme.
- No database migration, API contract, permission or persistence change is required.


## v0.17.16 - Compact monochrome season summary (2026-07-27)

- Replaced theme-driven export colors with a stable monochrome palette.
- Rendered separate champion and MVP panels side by side instead of vertically.
- Reduced hero, podium and highlight-card heights and tightened typographic hierarchy.
- Rendered highlights as a 2x2 grid in the exported image and two columns in the page preview when space allows.
- Switched the export canvas to a substantially shorter dynamic height.
- No database migration, API contract, permission or persistence change is required.


## v0.17.17 - Taller season summary readability pass (2026-07-27)

- Replaced the 2x2 highlight grid with a single-column list so long highlight text remains readable.
- Restored full-width champion/MVP hero cards to avoid displaced names and unused horizontal space.
- Increased the export canvas height slightly to improve breathing room and visual rhythm.
- Synced the in-page preview card with the same stacked hero/highlight presentation.
- No database migration, API contract, permission or persistence change is required.
## v1.1 stability hardening — checkpoint inicial (2026-08-02)

- Validación final local del árbol exacto: `npm ci` pasó; comprobación de secretos,
  seguridad y URLs pasó; `npm audit --json` informó 0 vulnerabilidades; lint,
  TypeScript y build pasaron; Vitest pasó 15 archivos/57 pruebas; Playwright pasó
  8/8 pruebas móvil/escritorio, incluidas Axe y referencias visuales; `git diff
  --check` pasó.
- `npm run env:check` detectó correctamente que la credencial
  `SUPABASE_SERVICE_ROLE_KEY` no está disponible en el entorno local real. El script
  pasó con un marcador de validación no secreto, demostrando el contrato sin fingir
  una credencial ni habilitar pruebas remotas.
- La revisión completa contra `staging` no encontró migraciones, secretos, dominios
  Vercel funcionales ni cambios de producto ajenos al objetivo.
- La rama permanece local, sin despliegue ni commits remotos. PRE no se ha modificado
  porque faltan credencial dedicada, pruebas OAuth/fixtures y autorización adicional
  para push, merge y despliegue. `main` y PROD permanecen intactos.
- Segundo bloque implementado: rate limiting reutilizable con respuesta 429,
  `Retry-After` y log seguro en invitaciones, espectadores, sugerencias y dispatch;
  baja push y endpoints 404/410 ahora se eliminan en lugar de quedar deshabilitados.
- El service worker usa caché `smash-lob-v1.1.0-rc.1`, elimina cachés anteriores,
  conserva un shell mínimo/offline y solo activa una revisión cuando el usuario lo
  solicita desde el nuevo aviso de actualización.
- Playwright descubrió y permitió corregir CSP de desarrollo, semántica ARIA de los
  skeletons y contraste del pie público. La ejecución móvil/escritorio terminó con
  8/8 pruebas E2E, Axe y visuales superadas.
- La candidata ya declara `1.1.0-rc.1`, incorpora CI, comprobación local de secretos,
  documentación de operación/aceptación y carga diferida del generador Excel.
- Se añadieron pruebas de autorización para anónimo, outsider entre ligas, jugador,
  espectador, admin, creator y superusuario, sin conceder una membresía de creator
  implícita al superusuario.
- No hay migraciones nuevas ni cambios remotos. OAuth real, flujos persistentes con
  fixtures y las ocho pantallas autenticadas siguen como validaciones manuales de PRE.
- Primer bloque implementado: entorno Auth.js explícito, logging estructurado seguro,
  página de error de autenticación con incidencia, retorno exacto de invitaciones,
  límites de host para URLs, páginas de error/offline y cabeceras de seguridad.
- Se corrigió `localhost:300` a `localhost:3000` y se retiró `AUTH_URL` del ejemplo
  porque la versión/configuración actual no demuestra que sea necesario.
- CSV y Excel neutralizan valores de texto que empiezan por `=`, `+`, `-` o `@`.
- Se añadió infraestructura Vitest, Testing Library, Playwright y Axe, con las primeras
  pruebas de Auth, URLs, clasificación/desempates, exportaciones, acceso anónimo,
  errores, accesibilidad y regresión visual.
- Primer control: lint pasó. TypeScript señaló fixtures incompletos que se corrigieron.
  Vitest quedó sin ejecutar por `spawn EPERM` dentro del sandbox y debe repetirse con
  permiso. La comprobación de entorno detectó `SUPABASE_SERVICE_ROLE_KEY` ausente sin
  imprimir valores; las pruebas reales de PRE siguen bloqueadas por esa credencial.
- Se verificó un árbol de trabajo limpio y se ejecutó `git fetch origin --prune`.
- `staging` coincide con `origin/staging` en `3495324` y declara v1.0.0.
- El árbol de archivos de `staging` es idéntico al de `main`; `main` solo añade el
  commit de merge de la versión estable.
- Se creó `feature/v1.1-stability-hardening` desde `staging`; no se reutilizó v0.19.
- `npm ci` reproducible pasó tras repetirlo fuera del sandbox por un `spawn EPERM`
  local. No se ejecutó ningún `npm audit fix`.
- El inventario y las prioridades están registrados en `docs/V1_1_PLAN.md`.
- No se ha modificado `main`, ningún remoto, ninguna base de datos ni ningún despliegue.

## v1.1 stability hardening — merge local en staging (2026-08-02)

- La credencial de servicio dedicada de PRE está presente en `.env.local` y en la
  variable sensible `SUPABASE_SERVICE_ROLE_KEY` de Vercel Preview para `staging`;
  no se registró ningún valor y Production permaneció intacta.
- `npm run env:check` pasó con las siete variables obligatorias presentes y sus
  valores ocultos.
- La reinstalación reproducible con `npm ci` terminó con código 0. Aunque su resumen
  inicial mostró un aviso de auditoría no reproducible, `npm audit --json` y
  `npm audit --audit-level=high` se repitieron después y confirmaron 0
  vulnerabilidades; no se ejecutó ningún comando de corrección automática.
- `npm run validate` pasó completo: entorno, secretos, seguridad, URLs públicas,
  lint, TypeScript, 15 archivos/57 pruebas Vitest y build de producción.
- `npm run test:e2e` pasó 8/8 pruebas en Chromium móvil y escritorio, incluidas Axe
  y referencias visuales; `git diff --check` también pasó.
- `feature/v1.1-stability-hardening` se subió y se verificó directamente en GitHub
  en `0b960bd41e959c97768dfc7bd599fbb999c0c753`.
- `staging` se sincronizó por avance rápido en `3495324` y recibió localmente el
  merge `515c542`; el merge aún no se ha subido ni desplegado.
- `main`, Production, la etiqueta `v1.0.0`, las bases de datos y las migraciones
  permanecen intactas.
- Siguen pendientes el despliegue y smoke tests de PRE, OAuth Google real, fixtures
  persistentes, pruebas autenticadas, aislamiento entre dos ligas y push real.

## v1.1 stability hardening — actualización de seguridad previa a PRE (2026-08-02)

- La repetición final de `npm ci` sobre el merge local descubrió 5 avisos altos
  nuevos de `npm audit`, todos originados por `brace-expansion` 1.1.16 en la cadena
  de herramientas de ESLint. La promoción se detuvo antes de validar, subir
  `staging` o desplegar PRE.
- El aviso `GHSA-mh99-v99m-4gvg` establece 1.1.17 como primera revisión corregida
  de la rama 1.x. Se actualizó únicamente el override 1.x de 1.1.16 a 1.1.17,
  sin salto mayor de ESLint ni corrección automática de npm.
- La línea base interna exige ahora 1.1.17 o superior para las cuatro copias
  limitadas a herramientas de lint; la copia principal de runtime permanece en
  la revisión corregida 5.0.8.
- `npm install --package-lock-only --ignore-scripts`, `npm run security:check`,
  `npm audit --audit-level=high` y `git diff --check` pasaron; la auditoría
  confirmó 0 vulnerabilidades.
- `staging` sigue solo local y `main`, Production, PRE, las bases de datos y las
  migraciones permanecen intactas. Todos los gates completos deben repetirse
  sobre este nuevo árbol antes de cualquier push.
- Tras crear `b5ae653`, la repetición desde cero terminó correctamente: `npm ci`
  informó 0 vulnerabilidades, `npm audit --audit-level=high` confirmó 0,
  `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  15 archivos/57 pruebas y build, y `npm run test:e2e` pasó 8/8 pruebas.
- La candidata corregida queda lista localmente para subir `staging`; el despliegue
  y los smoke tests de PRE siguen pendientes y no se ha tocado `main` ni Production.

## v1.1 stability hardening — deployment y smoke de PRE (2026-08-02)

- `origin/staging` se verificó en
  `e1e9b3efeb17a57b90b243d8ca9371c73a963d7e`; `main` y el commit de la etiqueta
  `v1.0.0` permanecen en `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel creó `dpl_DPYZ5cj88FfrqDKUuiu1q7JhG2QW` para ese SHA. El deployment quedó
  `Ready` y asignado a `pre.smashandlob.com` y al alias estable de `staging`.
- Las sondas autenticadas mediante la protección de Vercel devolvieron `200` para
  raíz, manifiesto, icono, sesión y proveedores; `401` para cron sin secreto y dos
  rutas de liga protegidas sin sesión; y `404` controlado para códigos sintácticamente
  válidos pero inexistentes de jugador y espectador.
- Los metadatos Google de Auth.js usan
  `https://pre.smashandlob.com/api/auth/signin/google` y
  `https://pre.smashandlob.com/api/auth/callback/google`.
- El manifiesto publicado identifica `Smash & Lob PRE` y el service worker contiene
  el marcador `smash-lob-v1.1.0-rc.1`. La consulta posterior de logs del deployment
  devolvió cero entradas de nivel error.
- Quedan como gates manuales el recorrido OAuth real, la versión visible dentro de
  la aplicación autenticada, los fixtures persistentes, aislamiento entre ligas,
  exportaciones, PWA y push en dispositivo real. No se ha tocado Production.

## v1.1 stability hardening — primer acceso OAuth real en PRE (2026-08-02)

- Una cuenta Google dedicada de pruebas completó el retorno OAuth real a
  `https://pre.smashandlob.com/` y cargó correctamente su liga existente
  `PREP LIGA`.
- La interfaz autenticada mostró `PRE · v1.1.0-rc.1` en la cabecera y
  `Smash & Lob · v1.1.0-rc.1` en Ajustes, cerrando la comprobación visible de
  versión.
- La cuenta no expone controles de administración en Ajustes, por lo que este
  recorrido valida el caso de miembro existente. Siguen pendientes una cuenta
  nueva/organizadora, los retornos exactos desde invitaciones y el resto de
  flujos persistentes manuales.
- Una segunda cuenta Google dedicada completó después su primer acceso a PRE y
  mostró el onboarding inicial para crear o unirse a una liga. Con ello quedan
  verificados los recorridos OAuth real de cuenta existente y cuenta nueva.
- La segunda cuenta no tiene habilitado el permiso de creación de ligas, por lo
  que aún no puede utilizarse como organizadora hasta preparar explícitamente
  ese fixture solo en Supabase PRE.

## v1.1 stability hardening — fixtures persistentes y exportaciones de PRE (2026-08-02)

- Una cuenta dedicada de pruebas con rol `creator` abrió tres ligas existentes de
  PRE, inició `Temporada 2` en `Liga prep pruebas última` y generó sus 14 partidos.
- El primer partido se programó para el 2 de agosto de 2026 a las 23:00 en
  Polideportivo de Lasesarre. Se registró el resultado 6-4, 3-6, 6-2, se editó
  después el tercer set a 6-3 y se verificó que la corrección persistía tras
  recargar y navegar.
- El cambio entre esa liga, con 1 de 14 partidos jugados, y `PREP LIGA`, finalizada
  con 14 de 14, mantuvo separadas sus temporadas, calendarios, resultados y
  clasificaciones. La comprobación de autorización directa con una cuenta ajena a
  la primera liga sigue pendiente.
- Desde una sesión autenticada real se ejecutó la acción Compartir del resumen
  final de `PREP LIGA` sin error de aplicación y se descargaron los archivos Excel
  y CSV de `Temporada 3`.
- El Excel descargado contiene las hojas `Clasificación` (8 jugadores) y
  `Resultados` (14 partidos). El CSV contiene 14 filas y las mismas 12 columnas de
  resultados. La importación estructural, la comparación celda a celda entre ambos
  formatos y la revisión visual de todas las hojas no detectaron diferencias ni
  errores de fórmula.
- Antes de consultar una invitación de fixture con la credencial de servicio, una
  guarda local verificó el destino configurado y detuvo la operación: el
  `NEXT_PUBLIC_SUPABASE_URL` de `.env.local` apunta al proyecto Production
  `szycbwdzestcmimziyey`, no al proyecto PRE `miadjotkucgluwbrgeih`. No se llegó a
  ejecutar ninguna consulta de base de datos. Las comprobaciones con service role
  quedan pausadas hasta alinear en `.env.local` la URL, la clave anónima y la clave
  de servicio del mismo proyecto PRE.
- Las tres variables locales se corrigieron después con sus valores de Preview
  `staging`. La URL apunta a `miadjotkucgluwbrgeih`, la clave pública fue aceptada
  por Auth de Supabase y una lectura controlada con service role devolvió las tres
  ligas de PRE.
- La prueba real de caducidad reveló un fallo bloqueante: después de regenerar la
  invitación de `PREP LIGA`, el enlace anterior seguía resolviendo la liga. La
  función SQL conservaba todas las filas históricas con `revoked_at` nulo y el GET
  público, al usar service role, no aplicaba explícitamente el filtro RLS.
- Se añadió una comprobación compartida de vigencia a la resolución y al canje,
  filtros explícitos de `revoked_at` y la migración
  `20260802233000_revoke_previous_league_invites.sql`, que revoca los códigos
  anteriores de cada liga y hace atómica esa revocación en futuras regeneraciones.
- La migración pasó `supabase db push --linked --dry-run` y el enlace se verificó
  contra PRE. Se creó antes una copia local mínima de las 12 filas de `invites`
  con solo `id`, `league_id` y `revoked_at`; no contiene códigos de invitación.
- La corrección local pasó la prueba focalizada (3/3), lint, TypeScript,
  `npm run validate` completo (16 archivos/60 pruebas y build), Playwright 8/8,
  `npm audit --audit-level=high` con 0 vulnerabilidades y `git diff --check`.
  La migración todavía no se ha aplicado y la corrección aún no está desplegada.
- Los commits `df41351` (código, prueba y migración) y `cfc1a68`
  (documentación/evidencia) se subieron a `origin/staging`, verificado exactamente
  en `cfc1a689adb57d194d7f0a3d56cc5ed01a9ce415`. `main` y `v1.0.0` continúan en
  `a4abbf06904cc48c9eb614d4b6c4f16214f52aac`.
- Vercel desplegó ese commit como `dpl_EFz6DA7qLrHg6YgSC2u26LKqEByA`; alcanzó
  `Ready`, quedó asociado a `pre.smashandlob.com` y el log de build confirmó
  rama `staging`, commit `cfc1a68`, 0 vulnerabilidades, TypeScript y build correctos.
- La aplicación de la migración a Supabase PRE queda pendiente de autorización
  remota explícita. El cálculo previo confirma que revocará 9 invitaciones
  históricas todavía activas y conservará las 3 invitaciones actuales, una por
  cada liga PRE.
- Tras la autorización explícita, la migración
  `20260802233000_revoke_previous_league_invites.sql` se aplicó únicamente en
  Supabase PRE y aparece alineada en el historial local/remoto. La verificación
  posterior confirmó 9 invitaciones revocadas, 3 activas y correspondencia exacta
  entre cada invitación activa y el código actual de su liga.
- Una primera sonda externa con `fetch` pareció devolver snapshots antiguos con
  `x-vercel-cache: HIT`, pero la inspección de la URL final demostró que la
  petición había seguido la redirección de Deployment Protection y estaba
  midiendo la página de acceso de Vercel, no la API de PRE. Se corrige aquí esa
  clasificación para no atribuir a la aplicación una respuesta que no emitió.
- Se añadieron cabeceras reutilizables `private, no-store` para las respuestas GET
  de invitaciones de jugador y espectador, más `revalidate = 0` y una prueba
  específica de las tres capas de caché. La corrección pasó `npm run validate`
  (17 archivos/61 pruebas y build), Playwright 8/8 y `git diff --check`.
- El commit `1224684` se subió a `origin/staging` y Vercel lo desplegó como
  `dpl_BqxEmdc1cajdKCg1HPmP6WWVcZQF`, `Ready` y asociado a
  `pre.smashandlob.com`. Las cabeceras `no-store` se mantienen como defensa en
  profundidad aunque no existía el snapshot obsoleto inicialmente diagnosticado.
- Con autorización explícita se ejecutó la purga CDN a nivel de proyecto. La
  operación vació también la caché CDN de Production, sin cambiar su código ni
  sus datos.
- La repetición autenticada contra PRE confirmó que la invitación revocada y una
  invitación inexistente devuelven `snapshot: null`, mientras que la invitación
  vigente resuelve el snapshot de su liga. Las sondas exactas con autenticación
  de Vercel contra el deployment devolvieron `404`, `Age: 0`,
  `X-Vercel-Cache: MISS` y las tres cabeceras `no-store` tanto para la ruta de
  jugador como para la de espectador. Queda cerrado el gate de invitaciones
  inválidas y caducadas en PRE.
- Una cuenta dedicada de miembro, perteneciente únicamente a `PREP LIGA`, mostró
  solo esa liga en el selector. El acceso directo al partido fixture de la liga
  del organizador devolvió «Partido no encontrado» sin exponer sus datos.
- La respuesta autenticada de `/api/access` para esa misma cuenta contenía
  exclusivamente `PREP LIGA` y no incluía ni la segunda liga ni su partido. Junto
  con el cambio de ligas previamente validado desde la cuenta `creator`, queda
  cerrado el gate de aislamiento cruzado con las dos ligas fixture de PRE.
- La cuenta dedicada de miembro se suspendió temporalmente solo en Supabase PRE.
  La aplicación mostró el bloqueo «Cuenta suspendida» y ocultó los datos de liga.
  La cuenta se reactivó inmediatamente, se limpiaron el motivo y la fecha de
  suspensión y se confirmó que recuperaba el acceso normal a `PREP LIGA`.
- El onboarding ya verificado con la segunda cuenta Google dedicada cubre el caso
  de usuario autenticado sin acceso a ninguna liga. Con ambas evidencias queda
  cerrado el gate de usuario suspendido y usuario sin acceso contra PRE.
- La inspección del workflow público de GitHub detectó que las siete ejecuciones
  de `v1.1 quality` habían fallado en el mismo test de URL, aunque el job
  `browser` de la ejecución más reciente había pasado sus 8/8 pruebas. El runner
  configura intencionadamente `NEXT_PUBLIC_APP_URL=http://localhost:3000`, pero
  `tests/unit/appUrl.test.ts` esperaba siempre el origen de Production al probar
  el rechazo de un host reenviado arbitrario.
- El test se aisló del entorno del runner fijando explícitamente la variante y la
  URL de Production solo durante ese caso y restaurando después las variables.
  La reproducción exacta pasó 4/4; `npm run validate` pasó los 17 archivos/61
  pruebas y el build con las variables del job, y `npm run test:e2e` pasó 8/8.
  Los avisos de deprecación de Node 20 emitidos por acciones de GitHub no fueron
  la causa del fallo.
- El commit correctivo `5bebfb2` se verificó en `origin/staging`. La ejecución
  remota `v1.1 quality #8` terminó en `Success`: el job `quality` pasó en 1m21s
  y el job `browser` pasó en 1m40s con 8/8 pruebas Playwright. El gate remoto
  queda restablecido.
- La prueba física en una PWA Android ya instalada confirmó la actualización
  visible a `v1.1.0-rc.1` y el alta/baja real de push. La baja eliminó exactamente
  un endpoint de Supabase PRE y el alta posterior creó exactamente uno nuevo
  habilitado, sin volver a solicitar un permiso Android que ya estaba concedido.
- El arranque posterior en modo avión reveló un fallo bloqueante: Android restauró
  la pantalla de acceso y Auth.js intentó consultar la sesión sin red, en lugar
  de mostrar la experiencia offline. La prueba anterior solo cubría una nueva
  navegación interceptada por el service worker y no la restauración de una PWA
  ya cargada.
- Se añadió `OfflineGate` antes de `AuthGate` y una vista offline compartida, de
  modo que la pérdida de red oculta el login y los datos privados antes de que
  Auth.js intente cargar. Playwright incorpora ahora un proyecto aislado con
  service workers reales que cubre pérdida de conexión sobre una página cargada,
  relanzamiento/navegación offline y recuperación mediante «Reintentar». La nueva
  prueba reproduce el fallo antes del cambio y pasa después de la corrección.

## v1.1 stability hardening — cobertura autenticada automatizada (2026-08-03)

- Playwright usa una sesión y datos demo exclusivamente locales para recorrer ocho
  pantallas autenticadas representativas en Chromium móvil y escritorio: inicio,
  partidos, clasificación, estadísticas, ajustes, invitación, administración de
  temporada y resumen de temporada. No intervienen cuentas personales, PRE ni
  Production.
- Axe descubrió contrastes insuficientes en las cinco áreas principales y en
  administración, además de campos de edición de jugadores sin nombre accesible.
  Se corrigieron todos los impactos críticos o graves detectados.
- La revisión también descubrió enlaces anidados en tarjetas de partidos. Los
  nombres conservan sus enlaces en contextos normales y se renderizan como texto
  cuando toda la tarjeta ya es un enlace.
- El recorrido Axe pasó en móvil y escritorio. Se generaron 16 referencias
  visuales, se inspeccionaron y la repetición sin actualización pasó en ambos
  proyectos.
- La baja automática de endpoints push caducados se extrajo a una operación
  comprobable. Diez pruebas confirman que HTTP 404/410 elimina exactamente la
  suscripción afectada y que un fallo reintentable HTTP 500 no elimina nada.
- La evidencia visual real ya obtenida en PRE, combinada con Axe y regresión
  visual local sobre las mismas ocho rutas, cierra ese gate sin exigir una nueva
  intervención humana. Sigue pendiente únicamente reproducir en un dispositivo
  real la caducidad 404/410 de un endpoint push y repetir el arranque offline
  físico tras la corrección ya desplegada.
- `npm run validate` pasó entorno, secretos, seguridad, URLs, lint, TypeScript,
  17 archivos/64 pruebas y el build de producción. La primera ejecución conjunta
  de Playwright saturó el compilador de desarrollo al lanzar 12 workers y cuatro
  pruebas públicas agotaron su espera sobre la pantalla de compilación; no fue
  un fallo funcional. Se limitó la concurrencia a cuatro workers locales y dos
  en CI, y la repetición completa pasó 13/13, incluida la PWA con service worker.
  `npm audit --audit-level=high` confirmó 0 vulnerabilidades y
  `git diff --check` pasó.
- Las ejecuciones remotas `v1.1 quality #11` a `#14` aislaron una diferencia
  visual de 126 píxeles exclusivamente en el campo de fecha de administración de
  temporada. La instrumentación temporal situó el cambio dentro del texto de
  `input[type="date"]`: Windows lo dibuja según la configuración regional del
  sistema, independientemente del locale configurado en Playwright.
- La referencia visual conserva el campo y su icono, pero oculta únicamente el
  texto nativo de fecha durante la captura. Se retiró la instrumentación temporal
  una vez localizada la causa. La validación posterior pasó TypeScript, 4/4
  pruebas visuales sin regenerar referencias y 13/13 pruebas E2E en modo CI.
  El commit correctivo `7c78928` quedó verificado exactamente en
  `origin/staging`.
- La ejecución remota `v1.1 quality #15` (`30772604704`) terminó en `Success`:
  tanto el job `quality` como el job `browser` pasaron. Queda resuelto el último
  fallo visual específico del runner de Windows.
- La repetición física posterior en Android, con la PWA instalada y el modo avión
  activo, mostró correctamente la vista «Sin conexión» y la acción «Reintentar».
  Sin embargo, la continuación de la prueba demostró que el gate aún no estaba
  cerrado: al recuperar red la aplicación entraba en el formulario de perfil con
  un error de `fetch`, y un relanzamiento en frío sin red volvía a mostrar el
  login. La primera observación solo validaba la pérdida de conexión sobre una
  página ya abierta.
- La causa de la reconexión era que el evento `online` ocultaba el fallback antes
  de que Auth.js renovase la sesión que había fallado sin red. El fallback queda
  ahora fijado hasta pulsar «Reintentar», acción que realiza una navegación
  completa y crea una sesión limpia.
- El service worker redirige los arranques offline nuevos a `/offline` y sirve esa
  ruta desde caché, evitando depender de la hidratación de la ruta privada o del
  valor inicial de `navigator.onLine`. Dos regresiones con service worker real
  cubren una sesión autenticada durante pérdida/recuperación de red y un
  relanzamiento desde una página cerrada.
- La corrección pasó `npm run validate` completo (17 archivos/64 pruebas y build)
  y 14/14 pruebas Playwright en modo CI. Quedan pendientes el despliegue en PRE y
  la repetición física en Android antes de cerrar el gate.
- Vercel desplegó `bd7d156` únicamente en Preview como
  `dpl_FbbAA1B6RShWsradNCgZc23YcxTa`, `Ready` y asociado a
  `pre.smashandlob.com`; el log confirmó rama `staging`, el commit exacto,
  TypeScript, build y 0 vulnerabilidades.
- GitHub Actions `v1.1 quality #18` pasó `quality`, pero la regresión de sesión
  falló en `browser` porque simulaba el evento offline antes de confirmar que la
  aplicación autenticada había terminado de hidratar. Se añadió una espera
  observable sobre la navegación autenticada; las dos regresiones PWA se
  repitieron cinco veces cada una en modo CI y pasaron 10/10. La corrección
  funcional no cambió.
- La ejecución remota posterior `v1.1 quality #19` terminó en `Success` con
  `quality` y `browser` correctos. El deployment final de esa revisión,
  `dpl_7cxM6CiYA36vvCxJTwZAqAREkYvW`, quedó `Ready`, asociado a PRE y sirviendo
  el service worker con la redirección offline esperada.
- Al instalar esa revisión en la PWA Android, el aviso de nueva versión apareció,
  pero «Actualizar ahora» no produjo una respuesta visible y fue necesario
  refrescar manualmente. El mensaje `SKIP_WAITING` queda ahora unido mediante
  `event.waitUntil` al ciclo de vida del service worker; el botón muestra
  «Actualizando…» y programa una recarga de respaldo a los cuatro segundos si
  Android no emite `controllerchange`.
- Tres pruebas unitarias cubren el ciclo de vida solicitado, la recarga de
  respaldo y el caso de worker ya no disponible. La corrección pasó
  `npm run validate` completo (17 archivos/66 pruebas y build) y 14/14 pruebas
  Playwright en modo CI. Quedan pendientes el despliegue y la repetición física.
- El commit `c9ad883` quedó verificado en `origin/staging`; GitHub Actions
  `v1.1 quality #20` terminó en `Success` con `quality` y `browser` correctos.
  Vercel lo desplegó en Preview como `dpl_7qD9985sfzA7PTxcmgoyFpEqmGYi`,
  `Ready` y asociado a `pre.smashandlob.com`; la sonda autenticada confirmó
  `event.waitUntil(self.skipWaiting())` en el service worker servido.
- La repetición física en Android mostró el aviso, «Actualizar ahora» cambió a
  «Actualizando…» y la PWA se recargó automáticamente. Queda validado en
  dispositivo real el flujo de actualización controlada; sigue pendiente repetir
  el arranque offline en frío y la recuperación de sesión con este worker.

## v1.1.0 — aceptación final y autorización de publicación (2026-08-03)

- La prueba física pendiente de arranque offline en frío se completó correctamente
  en Android con el worker final: al abrir sin conexión apareció `/offline`, no se
  mostró Google Login ni onboarding y, al recuperar Internet y pulsar **Reintentar**,
  se restauró la sesión mediante una navegación completa.
- El alta y la baja push normales ya estaban verificadas físicamente en Android y
  Supabase PRE. La reproducción física de un endpoint caducado `404/410` se omite
  por decisión explícita de aceptación porque el comportamiento está cubierto por
  diez pruebas automatizadas. Se acepta como riesgo residual bajo la posible
  permanencia temporal de una suscripción obsoleta; no afecta a datos de ligas ni a
  suscripciones válidas.
- Con esta decisión quedan cerrados los criterios de aceptación de PRE para la rama
  `feature/v1.1-stability-hardening`. Se autoriza promover `v1.1.0-rc.1` a
  `v1.1.0`, aplicar en PROD únicamente la migración
  `20260802233000_revoke_previous_league_invites.sql`, fusionar `staging` en `main`
  y crear la etiqueta anotada `v1.1.0`.
- La publicación debe detenerse si el dry-run de Supabase detecta una migración
  pendiente distinta de la esperada o si falla cualquier gate local. No se autoriza
  `db reset`, `migration repair`, `npm audit fix`, `push --force` ni la reactivación
  de códigos de invitación antiguos.
- Este checkpoint documenta la aceptación y autorización. La evidencia del commit,
  deployment y smoke tests de Producción se registrará tras ejecutar la publicación.

## v1.2.1 - Candidata descartada por error de concepto (2026-08-03)

- La candidata de PRE introdujo `league_memberships.league_avatar_url` y una imagen distinta por liga. El modelo fue rechazado antes de promoverlo a Producción.
- Se conserva como antecedente técnico la migración aplicada `20260803160000_add_league_avatars_and_restore_unlinked_identity.sql`; no se modifica porque las migraciones aplicadas son inmutables.
- La parte válida de la candidata es `players.link_identity_snapshot` y la restauración de nombre e iniciales al desvincular una cuenta.
- La fotografía no forma parte de la identidad histórica recuperable y debe desaparecer al eliminar el vínculo.

## v1.2.2 - Imagen global e identidad histórica corregidas (2026-08-03)

- Retirada de la interfaz, contratos, tipos, carga de acceso, invitaciones, actividad y duplicación de temporadas toda dependencia del avatar específico por liga.
- La edición de imagen de Ajustes actualiza ahora `app_users.avatar_url`, por lo que la imagen es global para la cuenta y se refleja en todas sus ligas.
- La prioridad actual queda como imagen global de la cuenta vinculada y, si no existe, avatar predeterminado con iniciales. Los jugadores sin cuenta vinculada quedan siempre sin fotografía.
- La instantánea `link_identity_snapshot` conserva únicamente `displayName` y `avatarInitials`; al desvincular se restauran esos datos, se limpia `avatar_url` y vuelve el avatar predeterminado.
- Añadida la migración de avance `20260803203000_remove_league_avatars_and_keep_account_identity.sql`, que elimina `league_avatar_url` de PRE, limpia cualquier fotografía almacenada en `players` y redefine el trigger sin fotografías históricas.
- El futuro editor de avatares queda fuera de esta versión y deberá guardar un avatar global del usuario, independiente de sus ligas y de la fotografía subida.
- Versión incrementada a `v1.2.2`; changelog y caché PWA actualizados.
- Validación disponible en este entorno: los 24 archivos TypeScript/TSX modificados transpilan sin errores de sintaxis; los contratos estructurales de imagen global, API de cuenta, ausencia de escritura de imágenes por jugador, migración y versión pasan; también pasan la línea base de seguridad, las URLs públicas y el escaneo de secretos. `npm ci` no puede completarse aquí porque el registro interno devuelve 404 para `web-push@3.6.7`, por lo que lint, TypeScript completo, Vitest y build quedan como gate obligatorio del comando de aplicación antes de publicar PRE.

## v1.2.3 - Editor de imagen accesible en móvil (2026-08-03)

- El editor de recorte se monta mediante un portal en `document.body`, fuera de los contextos de apilamiento de la aplicación, y utiliza `z-[1000]` para quedar por encima de la navegación inferior y los controles flotantes.
- El diálogo se centra también en pantallas pequeñas, respeta las zonas seguras del dispositivo y limita su altura al viewport dinámico.
- El marco de recorte adapta su tamaño al espacio disponible; los cálculos de arrastre, zoom, rotación y exportación utilizan el tamaño real mostrado.
- El contenido central puede desplazarse de forma independiente y la barra con `Cancelar` y `Usar imagen` permanece fija y accesible.
- Añadida una prueba de contrato visual para impedir regresiones del portal, apilamiento, centrado, tamaño responsive y acciones visibles.
- No se requieren migraciones de Supabase ni cambios de persistencia.
- Validación disponible en este entorno: pasan el escaneo de secretos, la línea base de seguridad, las URLs públicas, `git diff --check`, la transpilación sintáctica de los cinco archivos TypeScript/TSX afectados y los contratos de portal, apilamiento, centrado, tamaño responsive, acciones visibles, versión y caché PWA. `npm ci` queda bloqueado aquí por un 404 del registro interno para `zod-validation-error@4.0.2`; el comando de aplicación mantiene `npm run validate` completo como gate obligatorio antes de publicar PRE.

## Avatar Lab DEMO 0.1 - experimento aislado de mundos de avatar (2026-08-03)

- Rama experimental independiente: `feature/avatar-worlds-demo`, creada desde el estado `staging` aprobado en `v1.2.3`. No modifica `main`, no añade migraciones y mantiene la versión global de la aplicación en `1.2.3`.
- Añadida la ruta PRE-only `/experimental/avatar-lab`, ausente de la navegación normal, con `noindex` y una rama propia en `AppRouteBoundary` que conserva autenticación y perfil completo, pero evita cargar proveedores de liga, partidos, temporada, MVP y `AppShell`.
- Implementada una única `AvatarRecipe` neutral y versionada, separada de `AvatarWorldPreference`. El espectador puede usar `pixel_chibi`; `chibi_illustrated` queda declarado, visible como «Próximamente» y sin renderer ni assets provisionales.
- El renderer Pixel Chibi utiliza SVG modular de coordenadas enteras sobre una plantilla lógica `192 × 240`, `shape-rendering="crispEdges"`, `image-rendering: pixelated`, paleta limitada y capas independientes para fondo, cuerpo, cabeza y pala. La referencia canónica queda guardada solo en documentación y no se usa como imagen plana.
- La orientación zurda refleja la geometría alrededor de x=96, pero la letra B de la pala se vuelve a dibujar fuera del grupo reflejado. Manga y muñequera se resuelven mediante lados relativos `dominant`/`non_dominant`.
- La DEMO incluye dos tonos de piel; tres estados de pelo; tres estados de barba; ojos y cejas configurables; gorra/cinta excluyentes; colores primario y secundario de camiseta; dos pantalones; manga, muñequera, calcetines, zapatillas y dos palas; además de aleatorización, restablecimiento, depuración y persistencia local versionada.
- Se añadieron manifest, paletas, esquemas portables, catálogos por categoría, guía de estilo, plantilla maestra, reglas de compatibilidad, arquitectura, alcance y roadmap bajo `public/avatars` y `docs/avatars`.
- Validación ejecutada en este entorno: `npm run avatars:check` pasa con 26 primitivas modulares; 28 archivos TS/TSX transpilan sin errores sintácticos; el typecheck estricto aislado de Avatar Lab pasa; las comprobaciones de ejecución de receta, normalización, aleatorización, persistencia y render diestro/zurdo pasan; todos los JSON cargan correctamente; la vista canónica se rasterizó desde el renderer real y se inspeccionó; `git diff --check` pasa.
- `npm ci` y, por tanto, `npm run validate` completo no pueden ejecutarse en este entorno porque el registro interno devuelve 404 para `zod-validation-error@4.0.2`. El script de entrega mantiene `npm ci`, `npm run avatars:check` y `npm run validate` como gates obligatorios antes del commit, push y publicación exclusiva en PRE.

## v1.2.4 - Laboratorio móvil de avatares limitado a PRE (2026-08-05)

- La rama experimental `feature/avatar-worlds-demo` se reduce a dos opciones viables: DiceBear Big Smile y Notion Avatar.
- Se eliminan Ready Player Me, Pacovqzz/Avatune, el prototipo Pixel Chibi y todos sus endpoints, recursos, modelos, documentación y pruebas huérfanas.
- Ajustes incorpora un acceso para usuarios autenticados; toda la ruta `/experimental/avatar-lab` permanece protegida por el layout PRE-only, `noindex` y el `AppShell` normal.
- Ambos editores adoptan componentes, anchura, tarjetas, navegación, tamaños táctiles y zonas seguras coherentes con la PWA móvil.
- Las recetas se conservan solo en `localStorage`; no existe integración con perfil, jugadores, Supabase ni migraciones.
- Notion Avatar se compone mediante un endpoint local cacheado a partir de los SVG abiertos del proyecto oficial, evitando la dependencia `react-notion-avatar` y su árbol de paquetes obsoleto.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.4`.
- La entrega debe superar el validador específico, Vitest focalizado, lint, TypeScript, suite completa y build antes de cualquier commit o publicación en PRE.

## v1.2.5 - Corrección de la línea base para publicar Avatar Lab en PRE (2026-08-05)

- Se mantiene el alcance funcional de v1.2.4: únicamente DiceBear Big Smile y Notion Avatar, sin escritura de perfil ni Supabase.
- La poda de dependencias reubicó tres copias heredadas de `brace-expansion@1.1.17` bajo plugins concretos de ESLint.
- El validador permite solo esas rutas exactas y exige que el lockfile las marque como dependencias de desarrollo; no se amplía la autorización al runtime.
- La copia principal de `brace-expansion` sigue obligada a `5.0.8` o superior.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.5`.
- Todos los gates se ejecutan antes del commit y de nuevo sobre el merge candidato a `staging`.

## v1.2.6 - Compatibilidad React del laboratorio de avatares (2026-08-05)

- Se eliminan las actualizaciones síncronas de estado ejecutadas directamente desde efectos en Big Smile y Notion Avatar.
- La restauración desde `localStorage` se realiza mediante tareas cancelables y las vistas previas derivan su estado de la URL o receta activa.
- El paginado de Notion se reinicia desde la acción de cambio de categoría.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.6`.
- No hay migraciones de Supabase ni cambios en datos persistidos.


## v1.2.7 - Limpieza de tipos generados y compatibilidad ES2017 (2026-08-05)

- La validación elimina `.next` y `tsconfig.tsbuildinfo` antes del typecheck para evitar referencias generadas a rutas experimentales ya retiradas.
- El renderer de Notion sustituye el flag `s` de expresión regular por un patrón multilínea compatible con el objetivo ES2017 del proyecto.
- Se mantiene el alcance de Avatar Lab: únicamente DiceBear Big Smile y Notion Avatar, limitado a PRE y sin persistencia en perfiles o Supabase.
- La versión visible, el changelog y la caché PWA avanzan a `v1.2.7`.
- No hay migraciones de Supabase ni cambios en datos persistidos.

## v1.9.0 - Resumen de jornada (2026-08-16)

- Nueva rama funcional prevista: `feature/v1.9.0-product-expansion`, basada en `main` v1.8.23 y destinada a agrupar las mejoras de producto posteriores al bloque de CHAT.
- `CALENDARIO` convierte la cabecera completa de cada jornada con partidos en un acceso pulsable a `/round/[id]`; no se añade un chevron ni una ruta duplicada.
- `/round/[id]` se redefine como `Resumen · Jornada X` y muestra estado/progreso, partidos, sets y juegos disputados, resultados compactos enlazados al detalle del partido, MVP y clasificación histórica.
- Con MVP por `voting` se muestran los MVP de cada partido; con `automatic` o `automatic_advanced` se muestra el MVP de jornada; `none` oculta el bloque.
- Mientras la jornada no está completa, la clasificación se etiqueta como provisional y los destacados definitivos permanecen bloqueados. Al completarse se calculan cambio de líder, mayor subida, partido más igualado y/o mejor racha según los datos disponibles.
- La clasificación histórica se calcula ignorando resultados de jornadas posteriores y muestra movimiento respecto a la clasificación anterior.
- El exportable de jornada y `Compartir resumen` quedan fuera de v1.9.0 inicial y son el siguiente desarrollo previsto.
- Se documentan en `docs/V1_9_PRODUCT_EXPANSION.md` los frentes posteriores ya acordados para valoración: nivel global orientado a amistosos, auditoría/expansión de estadísticas globales de parejas, sustituciones, cierre de temporada y panel de salud de administración.
- No hay cambios de API, Supabase ni migraciones en esta iteración.

## v1.9.1 - Pulido del Resumen de jornada (2026-08-16)

- El panel superior de la jornada usa `AppCard accentStrip` sin padding exterior para que la franja de acento quede anclada al borde superior; el titular deja el progreso `X/X partidos` exclusivamente en las métricas.
- `RESULTADOS` reutiliza `MatchDetailPairingPanel`, exactamente el componente del detalle de PARTIDO, con `linkPlayers={false}` para que el panel completo siga enlazando al partido sin enlaces anidados.
- Los destacados que representan un partido incorporan `matchId` y reutilizan el mismo `MatchDetailPairingPanel`; el resto de destacados mantiene su tarjeta textual.
- El contexto bajo `Resumen · Jornada X` vuelve a reflejar el estado real de la temporada y no el estado de la jornada.
- Se elimina la etiqueta aislada `JX` de la cabecera de clasificación.
- Se incorpora al pie el botón `Compartir resumen de jornada` con el mismo tratamiento primario del resumen de temporada. La generación/compartición de la imagen continúa pendiente para el siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.2 - Destacados editoriales en Resumen de jornada (2026-08-16)

- `RESULTADOS` conserva el `MatchDetailPairingPanel` completo como representación canónica de los partidos.
- `LO MÁS DESTACADO` deja de repetir ese panel: los destacados ligados a un partido usan una tarjeta editorial compacta con motivo, explicación, parejas, marcador global, sets y acceso al detalle.
- `Partido más igualado` expresa por qué fue igualado mediante la diferencia total de juegos, en lugar de volver a usar los nombres de las parejas como titular.
- Los destacados no ligados a partidos mantienen la misma jerarquía de etiqueta, titular y detalle para que la sección funcione como lectura editorial de la jornada.
- El exportable de Resumen de Jornada continúa pendiente como siguiente desarrollo.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.3 - Comparaciones directas en destacados de jornada (2026-08-16)

- `LO MÁS DESTACADO` demuestra el motivo de cada tarjeta mediante una comparación directa, en lugar de añadir una segunda descripción genérica.
- `Partido más igualado` mantiene el marcador global de sets y enfrenta los juegos totales de ambas parejas, mostrando además la diferencia que origina el destacado.
- `Nuevo líder` y `Mayor subida` muestran posición anterior frente a posición actual; `En racha` compara la racha previa con la actual.
- Se elimina el texto `Ver partido`; la tarjeta completa continúa enlazando al detalle cuando el destacado corresponde a un encuentro.
- Se converge el contrato legacy de v1.9.1 al `matchId` real usado desde v1.9.2.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.4 - Tie-break decisivo como destacado de jornada (2026-08-16)

- `LO MÁS DESTACADO` detecta partidos finalizados cuyo tercer set termina exactamente `7-6` o `6-7` y crea el momento `Decidido en tie-break`.
- El destacado mantiene el marcador global del encuentro y compara de forma directa el tercer set con `Tie-break` como dato central.
- Los encuentros ya destacados por tie-break se excluyen del cálculo de `Partido más igualado` para evitar duplicar el mismo partido en la sección.
- La selección de destacados reserva espacio suficiente para conservar los tie-breaks decisivos aunque coincidan con movimientos relevantes de clasificación.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.5 - Borrado estable al registrar resultado (2026-08-16)

- `MatchResultForm` mantiene el avance automático al siguiente casillero únicamente cuando se introduce un valor válido.
- Borrar un marcador ya no mueve el foco al casillero anterior, tanto si se elimina un valor existente como si se pulsa Backspace/Delete sobre un campo vacío.
- El test histórico de destacados v1.9.2 deja de reutilizar un partido con tercer set `7-6`, evitando que choque con la clasificación `Decidido en tie-break` incorporada en v1.9.4.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.6 - Resumen conectado y destacados simples compactos (2026-08-16)

- El título `Jornada X` de PARTIDO pasa a ser un enlace directo a `/round/X`, reutilizando la ficha `Resumen · Jornada X`.
- `LO MÁS DESTACADO` compacta en una sola fila los momentos sin partido (`Nuevo líder`, `Mayor subida` y `En racha`) y conserva protagonista + comparación directa.
- Los momentos ligados a un encuentro (`Partido más igualado` y `Decidido en tie-break`) mantienen el formato detallado con parejas, marcador y comparación porque necesitan más contexto.
- No hay cambios de API, Supabase ni migraciones.

## v1.9.7 - Jerarquía visual de destacados simples (2026-08-16)

- `NUEVO LÍDER`, `MAYOR SUBIDA` y `EN RACHA` recuperan su etiqueta como título independiente en la primera línea de cada tarjeta.
- La segunda línea compacta únicamente el contenido: protagonista a la izquierda y comparación directa a la derecha (`2.º → 1.º`, `3 victorias → 4 victorias`, etc.).
- `PARTIDO MÁS IGUALADO` y `DECIDIDO EN TIE-BREAK` mantienen intacto el formato detallado con parejas, marcador y comparación.
- No hay cambios de cálculo, API, Supabase ni migraciones.

## v1.9.8 - Pulido de PWA, CHAT y destacados (2026-08-16)

- El aviso de instalación PWA se limita a HOME, a sesiones autenticadas y a cuentas con una pertenencia a liga ya registrada; invitaciones, acceso inicial y rutas públicas dejan de mostrarlo.
- El resumen fijado de reserva de CHAT usa fecha numérica `DD/MM/YYYY` manteniendo la hora para reducir anchura.
- El `mt-px` entre mensajes consecutivos ya era común; la diferencia visual se corrige dando a los enviados la misma geometría de borde que los recibidos mediante borde transparente con `background-clip`, sin modificar el margen correcto de entrada.
- `EN RACHA` deja de mostrar la racha anterior y conserva únicamente las victorias consecutivas actuales.
- Los destacados asociados a un resultado muestran los dos nombres de cada pareja en líneas separadas y eliminan `/`, manteniendo marcador y comparación.
- `MatchReservationConfirmation` memoriza los arrays de ubicaciones aprobadas/rechazadas y elimina los dos warnings `react-hooks/exhaustive-deps`.
- No hay cambios de API, Supabase ni migraciones.

## Product evolution v1.9.9 (2026-08-16)

- Resumen de Jornada incorpora exportable PNG compartible con resultados, MVP, destacados y clasificación.
- Reutiliza el lenguaje visual de los exportables de temporada y mantiene fallback de descarga cuando Web Share de archivos no está disponible.
- Sin cambios de API, Supabase ni migraciones.


## Product evolution v1.10.0 (2026-08-16)

- Imagen opcional en onboarding de perfil, conservando almacenamiento global y fallback de Google.
- Override competitivo de imagen por jugador, exclusivo de superadmin y separado de identidad de cuenta.
- Fecha/hora programada de inicio de temporada con countdown, activación server-side y bloqueo competitivo preinicio.
- Centro de Difusión para admins con cinco exportables PNG 4:5 basados en datos reales.
- Nueva migración aditiva `20260816173000_add_competitive_player_images_and_scheduled_seasons.sql`.
- Scope excluido a propósito: pulido del PNG de Jornada, nivel global y estadísticas de parejas.

## Product evolution v1.10.2 — Media Kit visual rework (2026-08-17, en curso)

- Creada la rama local `codex/media-kit-visual-rework` desde `feature/v1.9.0-product-expansion`; `main`, Production y la etiqueta `v1.0.0` permanecen intactos.
- Aplicado y conservado `stash@{0}` (`WIP Media Kit v1.10.2 untracked`), que recupera dos recursos visuales de `opening_day_premium_01` y dos tests focalizados.
- El trabajo queda limitado a local: sin push, PRE, merge ni cambios remotos.
- Checkpoint inicial completado: implementación recuperada auditada y plantilla principal rehecha contra la referencia obligatoria.
- Implementada `opening_day_premium_01` como cartel dinámico 1080×1350 sobre la base artística recuperada: fondo carbón, máscara de acento tintable, viñeta, partículas, geometría premium, titular metálico, fecha enmarcada, metadatos y firma inferior.
- `Centro de difusión` incorpora editor completo, logo de liga con override temporal, seis acentos, vista previa del PNG real y acciones separadas para compartir o descargar.
- Reglas, Inscripciones, Próxima jornada, Inicio de temporada y Cuenta atrás derivan ahora de la misma familia Premium 01.
- Primera iteración visual revisada en `http://localhost:3000/admin/media-kit`; corregido el layout estrecho detectado en navegador.
- Validación focalizada: `npx tsc --noEmit` correcto y 11/11 tests de Media Kit correctos.
- Validación final local: `npm run lint`, `npx tsc --noEmit`, `npm run build`, 11/11 tests focalizados y `git diff --check` correctos.
- La app queda arrancada en `http://localhost:3000`; no se ha realizado push, merge, PRE ni ninguna otra operación remota.
- La segunda recarga del navegador quedó bloqueada por el onboarding de la sesión local con `app_user_lookup_failed`; no se rellenó el perfil ni se forzó acceso con datos personales. La inspección visual del PNG se completó antes de ese bloqueo.
- Corrección posterior: la firma inferior deja de ser editable y reutiliza el patrón de los exportables de temporada con el icono de la app, `CREADO CON` y `SMASH & LOB`.
- El titular principal incorpora cuatro tratamientos seleccionables (`Impacto`, `Condensada`, `Editorial` y `Atlética`) con familia, proporción, tamaño, contorno y, cuando corresponde, inclinación propias en el Canvas exportado.
- La elección tipográfica se aplica también a las piezas equivalentes de la familia Premium 01.
- Revisión visual completada en navegador para `Impacto`, `Condensada`, `Editorial` y `Atlética`; las cuatro variantes mantienen jerarquía, encaje y legibilidad, y el nuevo pie fijo aparece integrado sin desbordes ni errores de consola.
- Validación de la corrección: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 13/13 tests focalizados correctos.
- Nueva iteración local: el catálogo de piezas pasa a funcionar como `Presets` y se sitúa antes de la composición; cada preset carga sus textos en una única `Personalización y vista previa`, desde la que se comparte o descarga el resultado.
- La composición identifica el preset activo, permite restablecerlo y renombra los seis campos según su función visual (`Titular`, `Subtítulo`, `Bloque destacado`, `Dato central` y etiquetas laterales) en vez de asumir siempre Jornada de apertura.
- El color de acento conserva la paleta curada y añade una opción `Personalizado` desplegable con selector visual y código hexadecimal validado.
- La observación incompleta del usuario sobre borrar texto queda pendiente de concretar; no se ha inferido ni aplicado ningún comportamiento adicional.
- A petición posterior, `Centro de difusión` abandona la sucesión de tarjetas grandes: los seis presets se compactan en una barra, mientras vista previa, compartir/descargar y personalización conviven en un único espacio de trabajo a dos columnas desde anchura tablet.
- Botones, campos, variantes tipográficas, acentos y control de logo reducen altura y espaciado; con el color personalizado cerrado, el conjunto está diseñado para quedar visible de un solo vistazo en escritorio.
- El preset conserva el nombre corto `Apertura` en la biblioteca, mientras su composición inicial recupera el titular `Jornada de apertura` y genera el subtítulo `Un día, X partido(s), el mejor comienzo` con el número real de encuentros de la primera jornada y concordancia singular/plural.
- La revisión en la anchura real del shell de la app (columna central estrecha) corrige el primer intento que desbordaba: cartel a 155 px, seis presets abreviados en una fila y controles en una columna lateral flexible de 158 px.
- Tipografía pasa a selector compacto, acento y logo comparten bloque, y las acciones quedan bajo el cartel; el estado cerrado completo se ve antes de la navegación inferior en la captura final.
- Interacción real verificada: `Altas` carga todos sus textos en la composición activa y `Color personalizado` acepta `#22AACC`, actualizando tanto selector como borrador hexadecimal.
- Validación final de esta iteración: `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` y 16/16 tests focalizados correctos.
- Ajuste móvil posterior: se descarta la división lateral de preview e inputs; personalización ocupa primero todo el ancho y la vista previa crece a 285 px debajo, con compartir/PNG unidos al cartel.
- La capa `opening-day-premium-01-accent.png` se reconstruye desde el fondo actual: 1080×1350, RGBA real y alfa derivado de la luminosidad del propio fondo, por lo que focos, líneas, pala, pelota y polvo quedan alineados al píxel y el centro oscuro permanece transparente.
- Dos propuestas del generador visual se descartaron por incumplir dimensiones y canal alfa; solo se aprovechó su dirección visual y el recurso final se normalizó de forma determinista contra `opening-day-premium-01-base.webp`.
- Rediseño móvil integral de `Centro de difusión`: los presets pasan a una biblioteca horizontal táctil y el espacio de trabajo separa `Vista previa` y `Personalizar` en dos modos, evitando comprimir simultáneamente cartel y formularios.
- Seleccionar un preset carga sus datos y vuelve automáticamente a la preview; el modo de edición ofrece campos a ancho cómodo, tipografía, acentos y logo agrupados, más un único CTA para regresar al cartel.
- Primera versión de `Premium 02 · Formato`: nuevo preset informativo 4:5 con título medio, introducción, filas numeradas y cierre, conservando fondo carbón, acento configurable, logo y firma fija de Smash & Lob.
- El preset explica clasificación individual, parejas diferentes, repetición mínima de rivales y calendario automático; carga cuatro filas de partida.
- El editor específico de Premium 02 admite entre 3 y 5 filas, edición de titular/descripción, reordenación, eliminación y alta de bloques; el Canvas adapta altura, espaciado y densidad al número de filas.
- Ajuste de la plantilla informativa: el título baja 35 px, desaparece toda etiqueta visible `Premium 02` del PNG y de la biblioteca, y las filas dejan de estar numeradas.
- Cada fila admite ahora un icono de imagen opcional con controles para cargar, cambiar o quitar; sin icono, el diseño utiliza una barra vertical del color de acento como marcador neutro.
- Corrección de jerarquía en Premium 01: los titulares de dos líneas reducen tamaño y separación vertical, mientras el subtítulo baja y gana aire; se elimina el solapamiento visible en presets como Reglas, Inicio y Cuenta atrás.
- El preset `Inscripciones` se redefine como aviso de cuota o fianza: prioriza reserva de plaza, importe por jugador y pago único, reutilizando el importe real configurado para la temporada cuando está disponible.
- Premium 01 y Premium 02 comparten una cabecera de temporada editable, inicializada con la temporada activa pero independiente de los presets para preparar piezas de una temporada futura.
- Primera versión de `Jornada` con diseño Premium 03: genera una pieza 4:5 por enfrentamiento, permite cargar cualquier partido de la jornada con jugadores, fecha, hora y sede reales, y mantiene todos esos campos editables antes de compartir o descargar.
- Pulido de Premium 03: nombres de ambas parejas centrados ópticamente y marcadores verticales desplazados al interior. Las sedes cargadas desde partidos se normalizan en todos los presets como `Municipio · Nombre corto`, evitando mostrar el JSON persistido del selector de ubicación.
- El formato automático de sede queda diferenciado por plantilla: Premium 01 usa `Municipio Nombre corto` sin separador, Premium 03 conserva `Municipio · Nombre corto` y Premium 02 no incorpora ubicación por defecto.
- El preset `Reglas` migra a Premium 02 y carga filas editables con la configuración real: obligatoriedad de tres sets, reparto de puntos por sets, desempate por diferencia de juegos y juegos a favor, y sistema MVP solo cuando está activo.
- Nuevo preset informativo `En pista` sobre Premium 02: coloca primero un calentamiento guiado de 10/15 minutos y explica después la variante STAR Point de la liga y el tie-break mediante cuándo se juega, cómo se gana y cómo rota el saque; se descarta el bloque de cambios de lado y resultado final.
- `Inscripción` fija su composición inicial en `Cuota de inscripción`, `Para gastos derivados de la liga`, `20€`, `Fianza`, `Pago único` y `Por jugador`; los campos se precargan con capitalización normal y el cartel mantiene el tratamiento visual en mayúsculas de Premium 01.
- El control de icono de cada fila informativa abre ahora una galería de 25 SVG precargados y coloreados con el acento activo; la carga de una imagen personalizada permanece disponible como acción independiente dentro del selector.
- Compilación local de esta iteración completada correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase de ajuste visual.
- El fondo compartido por las plantillas Premium se sustituye de forma reversible por una variante 1080×1350 que prolonga la textura de la pista hasta el borde inferior y elimina la franja negra visible; la máscara de acento se regenera con las mismas dimensiones a partir del nuevo fondo.
- La variante de fondo extendida queda integrada y compila correctamente con `npm run build`; los recursos anteriores se conservan sin sobrescribir como respaldo durante la prueba visual.
- Corrección posterior del render: se detecta que los degradados del Canvas volvían a ocultar la pista extendida al eliminar casi toda la luminosidad inferior; el fondo recupera progresivamente su textura solo desde `y=1040` hasta el borde, manteniendo intacto el oscurecimiento del área tipográfica.
- La corrección compila con `npm run build` y el servidor local se deja activo en `http://localhost:3000` para revisar la preview y la descarga contra el bundle actualizado.
- Se elimina la línea horizontal detectada en la recuperación del suelo: la máscara `destination-in` pasa a cubrir todo el lienzo, conservando alfa cero sobre el inicio del degradado en vez de dejar opaca la mitad superior del buffer auxiliar.
- La corrección de continuidad compila con `npm run build` y el servidor local permanece activo en el puerto 3000 para la siguiente revisión visual.
- La inspección de la preview real de `Apertura` confirma que la máscara PNG de acento no contiene una discontinuidad horizontal; el corte procedía del `floorGlow` del Canvas, que terminaba en `y=1260` conservando su intensidad máxima. La capa pasa a recorrer hasta el borde y desvanece de nuevo a alfa cero.
- El nuevo desvanecido de acento compila con `npm run build` y la preview local de `Apertura` se recarga contra el bundle actualizado.
- La apariencia de dispositivos sin preferencias guardadas cambia a `Claro + Colorido + Grafito` tanto en el script previo a hidratación como en `ThemeProvider`; las elecciones existentes en `localStorage` se siguen respetando.
- HOME unifica la línea de temporada simple y el selector para varias temporadas mediante `SeasonContextLine`: comparten contenido, tipografía, color, altura y posición, mientras la variante interactiva conserva semántica de botón y foco accesible sin indicios visuales en reposo.
- La iteración de apariencia predeterminada y cabecera de temporada compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
- Premium 02 y Premium 03 ya reutilizaban el fondo artístico común, pero sus velos negros al 78 % y 72 % lo ocultaban casi por completo; se reducen al 58 % y 54 % para recuperar de forma sutil focos, pista, pala y textura sin comprometer la lectura.
- Los presets informativos cargan iconos SVG de partida editables: Formato usa gráfico, dos jugadores, rayo y calendario; Reglas usa repetición, gráfico, balanza y trofeo cuando hay MVP; En pista usa pala, estrella, objetivo y rotación.
- Revisión local en navegador: Premium 02 y Premium 03 regeneran sus previews sin errores; el editor muestra 4 iconos en Formato, 3 en Reglas para la temporada actual sin MVP y 4 en En pista. La iteración compila correctamente con `npm run build`.
- Todas las imágenes del Media Kit usan ahora el icono oficial de Smash & Lob como logo de cabecera cuando la liga no tiene uno definido; un logo propio u override sigue teniendo prioridad y la firma inferior no cambia.
- El fallback de logo compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales en esta fase visual.
- Premium 02 y Premium 03 separan la cabecera lateral del marco decorativo: sus dos esquinas superiores bajan de `y=72` a `y=148`, justo después del logo, nombre de liga y temporada. Premium 01 conserva el marco original para su cabecera centrada.
- La variante de marco por composición compila correctamente con `npm run build`; no se ejecutan comprobaciones adicionales durante esta fase visual.
### Ajustes Media Kit — tipografías y preset En pista (2026-08-17)

- Premium 01 usa `Editorial` como tipografía inicial y también como fallback del exportador.
- El selector amplía sus opciones con cuatro estilos adicionales: `Monumental`, `Geométrica`, `Didona` y `Técnica`.
- El preset `En pista` cambia su titular precargado a `DURANTE EL PARTIDO`.
- Validación solicitada: `npm run build` completado correctamente (compilación, TypeScript y generación estática).

### Media Kit — cinco presets y Premium 04/05 (2026-08-17)

- Se incorporan los presets `Resultados`, `Clasificación`, `MVP`, `Próxima jornada` y `Final de temporada`, alimentados inicialmente con datos de la temporada activa y editables antes de exportar.
- `Premium 04 · Marcador` introduce una composición de filas densas para marcadores y top 5, con jerarquía específica para posiciones y cifras.
- `Premium 05 · Protagonista` introduce una composición editorial con fotografía central para MVP y campeón, nombre destacado y hasta tres datos o puestos de apoyo.
- `Próxima jornada` reutiliza Premium 01 para priorizar fecha, hora, sede y número de jornada.
- La biblioteca, los editores y los exportadores aceptan las cinco nuevas clases de pieza; Premium 05 permite sustituir o quitar temporalmente la fotografía protagonista.
- Validación solicitada: `npm run build` completado correctamente con TypeScript y generación estática.

### Media Kit — Premium 06 para Resultados (2026-08-18)

- `Resultados` deja de compartir Premium 04 con `Clasificación`; Premium 04 queda reservado al ranking y su top 5.
- Se crea `Premium 06 · Resultados`, inspirado en la lectura de la pantalla PARTIDO: nombres apilados de cada pareja a la izquierda, juegos de cada set en columnas y sets ganados en un bloque de mayor peso visual.
- El preset carga los partidos terminados de la última jornada disponible, usa un mínimo de 2 tarjetas y admite hasta 4 para temporadas de 16 jugadores.
- El personalizador permite editar los cuatro nombres, los juegos de cada set, añadir o quitar partidos entre 2 y 4, y recalcula automáticamente los sets ganados.
- Validación solicitada: `npm run build` completado correctamente con la nueva plantilla, editor y tipos de datos de resultados.
- RESULTADOS incorpora un selector de jornada completa; se inicializa con la última jornada cerrada y, al cambiarla, recarga parejas, juegos y sets antes de permitir el retoque manual.
- Personalización incorpora un selector común de `Temporada origen`: al cambiarlo, el preset activo vuelve a cargar los datos reales de esa temporada, mientras la cabecera superior permanece editable e independiente.
- Validación solicitada: `npm run build` completado correctamente con ambos selectores y la recarga de presets por temporada.
- Preparación de publicación: el Media Kit adopta los tokens tipográficos semánticos globales y elimina la descripción genérica de cabecera detectada por `typography:check`.
- El presupuesto global de fuente se actualiza de 102.300 a 104.000 líneas para registrar las nuevas plantillas y editores, manteniendo sin cambios los límites de clientes, páginas cliente, rutas API y archivos críticos; el árbol actual ocupa 103.599 líneas.

### Preparación de publicación Media Kit (2026-08-18)

- Playwright usa un servidor dedicado en `127.0.0.1:3100` y un `distDir` independiente (`.next-playwright`), por lo que ya no puede reutilizar accidentalmente una sesión local del puerto 3000 ni interferir con ella.
- Las pruebas visuales fijan el reloj en una fecha conocida y actualizan las versiones vigentes de los tutoriales de HOME, Ajustes y Administración de temporada; las capturas dejan de depender del día de ejecución o de overlays caducados.
- El grafito claro oscurece sus tonos secundarios para conservar la nueva apariencia predeterminada y cumplir contraste WCAG AA también en las pantallas públicas.
- Referencias visuales revisadas y actualizadas para HOME, Calendario, Administración de temporada y las pantallas públicas afectadas por el nuevo grafito predeterminado.
- Puerta local completa superada con `npm run release:check`: 146 archivos / 480 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; el siguiente paso autorizado es publicar el mismo estado en `staging`/PRE y, tras verificarlo, promocionarlo a `main`/Producción.

### Corrección del aislamiento de Avatar Lab en Producción (2026-08-18)

- El primer smoke de Producción detectó que el layout ejecutaba `notFound()` pero Next.js conservaba un estado HTTP 200 al resolver el 404 dentro de una respuesta en streaming; la API experimental sí devolvía 404 correctamente.
- `src/proxy.ts` intercepta ahora exclusivamente `/experimental/avatar-lab/:path*` antes del render: continúa en PRE y local, y devuelve un 404 HTTP real con `no-store` en cualquier otro host, incluido Producción.
- El layout y las APIs conservan sus comprobaciones propias como defensa adicional; el contrato de assets y 13 tests focalizados de acceso, aislamiento y proxy pasan, junto con TypeScript.
- La republicación queda preparada para desplegar primero en `staging`/PRE y verificar después `main`/Producción.
- El preset `Apertura` precarga ahora su fecha únicamente como día y mes; el año se omite solo en esta pieza y el formato completo de `Jornada` y los demás presets no cambia.
- Puerta local final superada con `npm run release:check`: 147 archivos / 482 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto y auditoría runtime con 0 vulnerabilidades.
- Publicación de aplicación verificada en PRE: `staging` `f3dce430b093bdbac043b88e4864d1f0bacf80e7`, despliegue Vercel `dpl_8YdcQKSyCYVhNqKwzEbFxjnpYmmz` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `395f863bfdb295d7cbad404c111952102253a591`, despliegue Vercel `dpl_6q7GdrxqWQfCtKzZgE59HYtnebQb` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Media Kit — acentos de logo y preset Inicio (2026-08-18)

- La paleta curada incorpora `#53B401` como color de acento frecuente.
- Cuando existe un logo de liga o se carga uno temporal, el editor lo analiza automáticamente en el navegador y ofrece hasta cuatro colores útiles: tonos dominantes del propio logo y variantes armónicas; logos sin color aprovechable o bloqueados por CORS mantienen intacta la paleta manual.
- `Inicio` precarga `Volvemos con más ganas`, el número real de jugadores como etiqueta izquierda, `1 campeón` como dato central y el número real de jornadas como etiqueta derecha; el resto de su composición no cambia.
- Validación local: 11/11 tests focalizados, ESLint, TypeScript, build de producción y presupuesto de fuente correctos (103.756/104.000 líneas).
- Ajuste visual posterior: las etiquetas `PRESET`, `INFORMATIVO` y `SIN FECHA` de la biblioteca usan un rol tipográfico micro, menor tracking y una sola línea para permanecer dentro de cada burbuja sin alterar el nombre del preset.
- La biblioteca ordena sus presets según el recorrido de la temporada: Formato, Reglas, En pista, Cuota, Inicio, Cuenta atrás, Apertura, Agenda, Próxima, Jornada, Resultados, Clasificación, MVP y Final.
- Puerta local final superada con `npm run release:check`: 148 archivos / 487 tests unitarios e integración, 56 tests Playwright, build de producción dentro de presupuesto (828.623 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No hay migraciones nuevas ni cambios sobre migraciones ya aplicadas; este mismo estado queda autorizado para promoción secuencial a `staging`/PRE y, tras su verificación, a `main`/Producción.
- Publicación de aplicación verificada en PRE: `staging` `224d764430eccb6a9f6c76ad052a020d7f7ddf49`, despliegue Vercel `dpl_5sk895g3DVBgVFpjwsViMsdiWJ8k` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, página experimental disponible y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `1316a8fddf5d916285d06027406e8f53f128836d`, despliegue Vercel `dpl_9Z4ZDi9aXCgfTqc1R4jBsfLkMNGo` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado con 404 tanto en página como en API.

### Recuperación de invitaciones al instalar la PWA (2026-08-18)

- El flujo existente se conserva: los enlaces de jugador y espectador siguen volviendo a su ruta exacta después de Google, y el aviso propio de instalación continúa limitado a HOME tras confirmar una liga.
- El límite de petición registra durante tres días la última invitación visitada en una cookie `HttpOnly`, `SameSite=Lax`, de ruta raíz y segura bajo HTTPS; solo acepta destinos internos `/invite/:code` y `/spectate/:code`, sin redirecciones externas.
- El manifiesto declara un identificador estable `/` y arranca la PWA mediante `/launch`; esa ruta recupera una incorporación incompleta o entra en HOME cuando no existe ninguna.
- Las APIs de alta de jugador y espectador eliminan la intención en la misma respuesta de éxito. Los flujos cliente repiten la limpieza como respaldo y HOME ofrece continuar o descartar una invitación abandonada.
- El acceso anónimo adapta título, explicación y CTA al enlace recibido sin modificar el callback de OAuth ni el proceso actual de reglas, selección de jugador, perfil o espectador.
- Validación focalizada: 20/20 tests de intención, redirección OAuth, proxy de Avatar Lab y PWA, más 2/2 recorridos Playwright móvil/escritorio; TypeScript, ESLint, `git diff --check` y revisión real de `/launch` en navegador correctos, sin errores de consola.
- El endpoint público solo permite consultar o borrar la cookie propia, no acepta cuerpos ni modifica datos de aplicación, y queda registrado explícitamente en el inventario de seguridad: 81 rutas y 117 métodos.
- El presupuesto de fuente registra la nueva ruta de arranque, API y aviso recuperable: 104.142 líneas y 153 clientes, sin cambiar límites de páginas cliente, rutas API ni archivos críticos.
- Puerta completa superada con `npm run release:check`: 149 archivos / 495 tests unitarios e integración, 58 tests Playwright —incluida la recuperación de invitación en móvil y escritorio—, build de producción dentro de presupuesto (829.664 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- No se añaden migraciones ni se modifican datos persistentes.
- Publicación de aplicación verificada en PRE: `staging` `43086ce404a744d012925ca07a53004afb42ee5c`, despliegue Vercel `dpl_BiKce4SGhUPkxRbTePeJXkWTJe1x` READY y alias `pre.smashandlob.com`; el smoke autenticado confirma health v1.10.8/pre, manifiesto con `id` estable y arranque `/launch`, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax`, recuperación sin intención hacia HOME y API protegida con 401. El smoke público conserva el 302 previsto por la protección SSO de Vercel.
- Publicación de aplicación verificada en Producción: `main` `02e943137f119e4e079cc7f42ac0e487da6fc4be`, despliegue Vercel `dpl_LS5hQaRiBX79M2UfrRV836seTyfh` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.10.8/prod, portada disponible y Avatar Lab bloqueado. La comprobación específica confirma manifiesto con `id` estable y arranque `/launch`, endpoint de intención operativo, cookie de invitación `Secure`/`HttpOnly`/`SameSite=Lax` y redirección sin intención hacia HOME.

### Registro de cambios público agrupado (2026-08-18)

- La vista pública agrupa versiones consecutivas de la misma serie cuando comparten categoría y texto general; muestra un único rango de versiones y fechas en lugar de repetir el mismo panel.
- Las entradas con categoría `Novedad` conservan su título y resumen funcional reales para explicar qué capacidad se incorporó, sin exponer el detalle técnico reservado.
- Creadores, administradores de liga y superusuarios reciben el historial detallado únicamente cuando `Vista admin` está activa; al desactivarla ven exactamente el mismo resumen público que un jugador normal.
- El detalle completo solo se entrega desde servidor a cuentas autorizadas. Los usuarios normales no reciben ese contenido oculto en el cliente.
- El presupuesto registra 104.263 líneas, 154 clientes y 47 páginas cliente; el límite puntual de `src/lib/changelog.ts` sube a 2.410 líneas para sus tres campos opcionales de rango.
- Pulido previo a publicación: las series con una única entrega muestran `1 versión`, y la novedad v1.10.0 sustituye `overrides competitivos` y referencias internas por una explicación pública sobre perfiles, temporadas programadas y Centro de Difusión.
- Validación local final: 12/12 tests focalizados, ESLint, TypeScript, build de producción, presupuesto de fuente y `git diff --check` correctos. La revisión real en navegador confirma el detalle por versión con `Vista admin`, el resumen agrupado al desactivarla y los rangos de fecha sin concatenaciones. Cambio aislado en `codex/public-changelog-groups`, todavía no publicado.
- Puerta completa superada antes de publicación con `npm run release:check`: 150 archivos / 502 tests unitarios e integración, 58 tests Playwright, build de 830.472 bytes gzip en 85 chunks y auditoría runtime con 0 vulnerabilidades. No hay migraciones ni cambios de datos persistentes.
- La primera inspección autenticada de PRE confirmó health v1.10.8/pre y `/changelog` con 200, y detectó metadatos de fecha vacíos serializados en entradas antiguas sin fecha. Se omiten ahora esas propiedades cuando no existen; 8/8 tests focalizados, ESLint, TypeScript y build de producción vuelven a quedar correctos antes de la promoción.
- Publicación de aplicación verificada en PRE: `staging` `55823fdd47750da4e13321e1a3cb696a18b188ac`, despliegue Vercel `dpl_6HYXajo2Mn8JMEywbAbBPC89tqwe` READY y alias `pre.smashandlob.com`; health confirma v1.10.8/pre y `/changelog` responde 200 con la copia pública curada, sin `overrides competitivos` ni propiedades de fecha vacías.
- Publicación de aplicación verificada en Producción: `main` `fb2c1b9fef69a398972c9c01e0d0f912d8ff0f77`, despliegue Vercel `dpl_7SG5LJZzQ9Za3suGY8C31Jkxv27q` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma v1.10.8/prod, portada disponible y Avatar Lab bloqueado. La inspección específica de `/changelog` confirma la copia pública curada y cero propiedades de fecha vacías.

### Mis partidos: hora, jugadores y detalle de amistosos (2026-08-18)

- `Mis partidos > Crear encuentro` usa ahora la hora local del dispositivo y la redondea siempre a la siguiente hora en punto: por ejemplo, 13:17 precarga 14:00; el cambio de 23:42 a 00:00 del día siguiente también queda cubierto.
- El selector declara pasos de una hora y reutiliza la misma función de redondeo que la programación de partidos de liga, sin modificar la conversión posterior a UTC al guardar.
- Validación local: 12/12 tests focalizados, ESLint, TypeScript, build de producción, presupuesto de fuente (104.287 líneas) y `git diff --check` correctos. No hay migraciones ni cambios de datos persistentes.
- La lista para registrar un amistoso absorbe jugadores históricos sin cuenta vinculada cuando su nombre identifica de forma inequívoca a una única cuenta; acumula todas sus ligas en una sola opción y conserva separadas las coincidencias ambiguas entre dos cuentas reales.
- Los selectores de pareja y rivales limitan su ancho, permiten encoger el bloque de texto y recortan etiquetas secundarias largas para no salir del panel contenedor.
- El detalle de un amistoso carga `preferred_side` y `dominant_hand` de las cuentas participantes y muestra etiquetas como `REVÉS DIESTRO` en el mismo panel de parejas; no dibuja la línea de posición de liga y omite la etiqueta para perfiles externos o incompletos.
- `Próximo partido` incorpora `Todos · Liga · Amistoso`, con `Todos` por defecto y selección cronológica del encuentro más cercano entre ambos tipos.
- Validación local ampliada: 21/21 tests focalizados, ESLint sin avisos, TypeScript, build de producción, presupuesto de fuente (104.427 líneas) y revisión real en navegador correctos. Se confirmó 14:00 como hora local redondeada, cero desbordamiento de selectores abiertos y metadatos de juego sin posición de liga.
- Estado de publicación: el primer ajuste horario alcanzó `staging` en `f7ab176`, antes de que se solicitara la pausa; la deduplicación, el arreglo visual, los metadatos de jugadores y el filtro `Todos` permanecen únicamente en el workspace local. No se ha promovido esta tanda a Producción.

### Mis partidos: programación, ubicaciones y pagos (2026-08-18)

- La programación del detalle personal reutiliza el mismo formato largo que PARTIDO de Liga, con día, fecha y hora separados mediante puntos medios.
- El alta y la edición de amistosos comparten un selector de ubicaciones en popup flotante, con fondo difuminado, búsqueda, selección del catálogo global y alta manual.
- El detalle incorpora `Pagos y reservas`: informa pagadores de pista y bolas, calcula las transferencias entre los cuatro participantes y permite actualizar su estado con permisos equivalentes al flujo de Liga.
- Se añade la migración aditiva `20260818133000_add_personal_match_bookings.sql`; crea una tabla separada protegida por RLS y accesible únicamente mediante `service_role`, sin modificar migraciones ya aplicadas ni las filas existentes de partidos personales.
- Las APIs nuevas requieren autenticación, pertenencia al amistoso, límites de petición y validación server-side de participantes e importes. Los recordatorios de pago no se exponen en amistosos porque la mensajería actual depende del contexto de liga.
- El presupuesto de fuente registra 105.034 líneas, 156 clientes y 47 páginas cliente; el inventario de seguridad incorpora las tres operaciones protegidas de reserva y transferencias personales.
- Puerta local completa superada con `npm run release:check`: 151 archivos / 508 tests unitarios e integración, 58 tests Playwright, build de producción dentro de presupuesto (836.723 bytes gzip en 85 chunks) y auditoría runtime con 0 vulnerabilidades.
- Revisión real local completada: fecha con puntos medios, popup de ubicación con fondo difuminado y bloque funcional de pagos visibles en el detalle del amistoso.
- Pendiente antes de publicación: aplicar y verificar la migración primero en PRE, desplegar `staging`, y solo después repetir migración y promoción en Producción.

### Reserva desde CHAT y Economía por persona - v1.10.9 (2026-08-18)

- La confirmación definitiva de reserva desde CHAT deja de aceptar una pista reservada sin datos económicos: antes de programar exige seleccionar uno o varios pagadores de pista e indicar el importe abonado por cada uno.
- La API de confirmación valida que todos los pagadores pertenezcan al partido y guarda `booking_reservations`, `booking_transfers` y `booking_updated_at` en la misma operación que fecha, ubicación y pista; las transferencias se calculan con `buildCourtBooking`, igual que en PARTIDO.
- Si falla la creación del mensaje de sistema del chat, el rollback restaura también reservas y transferencias anteriores, además de la programación.
- Economía de temporada calcula `availablePerPlayer` a partir del saldo realmente disponible dividido entre los jugadores únicos de la temporada. El panel Disponible muestra `X € POR PERSONA` en lugar de `Ingresado − gastado`.
- No requiere migraciones de Supabase. La entrega local incluye pruebas focalizadas para el flujo de reserva desde CHAT y el reparto del saldo por jugador; la puerta final de lint, tipos, build y revisión visual se ejecuta tras aplicar el ZIP en el proyecto real.


### Duración flexible y ampliación de temporadas - v1.12.3 (2026-08-26)

- La duración deja de estar acoplada al número de jugadores: creación con equilibrio completo o número personalizado de jornadas.
- Temporada larga escalable por vueltas completas hasta el máximo determinista soportado para cada plantilla de 8 a 24 jugadores.
- Los múltiplos exactos de la vuelta base generan vueltas completas equilibradas; los tramos parciales usan optimización determinista y la auditoría distingue equilibrio completo de resultado optimizado.
- Gestión puede ampliar una temporada existente a doble vuelta o temporada larga mientras no haya resultados, usando la misma barrera de seguridad que REROLL.
- La migración `20260826002000_resize_balanced_season_calendar.sql` realiza el redimensionado de forma atómica y limpia el estado operativo ligado a los emparejamientos sustituidos.
- La entrega se valida localmente con las puertas habituales y requiere aplicar la migración antes de publicar el código.

### Welcome Pack: refinamiento de impresión (2026-09-15)

- La faja conserva su composición: se amplían visualmente el logotipo y nombre de liga con origen inferior, los nombres de jugadores ganan aproximadamente un punto y se retiran únicamente las guías discontinuas de las zonas de pegado.
- Los dos precintos incluidos en el PDF pasan de 50 × 15 mm a 60 × 15 mm (64 × 19 mm con sangrado); su contenido permanece centrado y el logotipo gira 90 grados en el sentido de montaje vertical.
- El fajín de overgrip amplía el espacio útil del logotipo de 72 × 42 px a 80 × 46 px y reduce su separación con el nombre de liga.
- Validación final correcta: presupuesto de fuente de 125.531 líneas, ESLint, TypeScript, build de producción y presupuesto de build; 726 pruebas unitarias e integración y 62 pruebas Playwright superadas; auditoría runtime sin vulnerabilidades altas.
- Publicación verificada en PRE: `staging` `9bc7f8746c97aca60a4cfb0151af5c3f7a26a537`, despliegue Vercel `dpl_GCaS2e7LdVVRxjFnoDSHyzBnaSgo` READY y alias `pre.smashandlob.com`; health autenticado confirma v1.13.8/pre, portada 200 y Avatar Lab disponible con API protegida 401. El acceso público conserva el 302 esperado por SSO de Vercel.
- Publicación verificada en Producción: `main` `9bc7f8746c97aca60a4cfb0151af5c3f7a26a537`, despliegue Vercel `dpl_9sXCBm995bopH3JgCHFEAASaorzh` READY y alias `smashandlob.com`; `npm run smoke:prod` confirma health v1.13.8/prod, portada disponible y Avatar Lab oculto con 404.
- v1.14.1 publicado en PRE y Producción: `staging` y `main` en `9d96c30e46dc9df95e5efb2f7211a5cfa8a1c5cf`; PRE `dpl_81hb4LFKm4bM3CUpPfbAcqsX25tF` y Producción `dpl_DWkN7TYe8w1dupjgAzYcKmJnM5J9` READY, con alias `pre.smashandlob.com` y `smashandlob.com`. Validación focalizada: version:check, TypeScript, lint y 8 pruebas unitarias de los generadores. Smoke omitido por la indicación del proyecto.

- Ajuste pendiente de prueba en PRE v1.14.2: el contenido completo del precinto de bolsa se amplía para mejorar la legibilidad en impresión.
- Ajuste pendiente de prueba en rama v1.14.3: nombre de liga autoajustable y logos de prueba de 50 mm en huecos de la última hoja.
- Ajuste pendiente de prueba en rama v1.14.4: nueva plancha de pegatinas de logo con ancho configurable, orientación A4 automática y relleno de huecos a 50 mm.

### Optimización del snapshot de acceso (2026-09-16)

- La consulta de `season_settings` usada para ocultar datos de pretemporada se incorpora al `Promise.all` principal de `/api/access`.
- Se elimina una espera de red secuencial sin cambiar el payload, la autorización ni la generación fiable de calendarios.
- La rama queda en v1.14.6; se validan tests focalizados, TypeScript, ESLint y build de producción.
- La puerta de código ajusta el límite total al estado medido del repositorio tras incorporar las traducciones obligatorias, sin relajar los límites de build ni de rutas API.

- Publicación v1.14.7 verificada: `staging` y `main` quedaron en `536841d` y Vercel generó PRE `dpl_Dc7VaJjhhrzkcmQxeXp74C7gXTG3` READY (`pre.smashandlob.com`) y Producción `dpl_EkVRSraBSFY9mh5PaanGDGUmJWxM` READY (`smashandlob.com`). Health de Producción devuelve `1.14.7`; PRE mantiene la protección SSO pública esperada.

### HOME: acceso directo a Mis ligas (2026-09-16)

- El control superior izquierdo deja de refrescar HOME y enlaza directamente a `/leagues` con el texto `Mis ligas`.
- Se mantienen separados el cambio de competición y el área personal de `Mis partidos`.
- La validación de tipografía se actualiza para exigir el enlace directo a `Mis ligas` y eliminar el contrato anterior de refresco manual.
- HOME y el componente compartido `BackButton` incorporan la flecha izquierda visible para distinguir los accesos de vuelta.
- Mis ligas sustituye el botón de vuelta por `Refrescar` y mantiene la selección de competición como acción principal.

### Optimización de arranque percibido (2026-09-16)

- Se crea la rama `codex/performance-optimization` desde `58443f2` para medir y mejorar la carga sin tocar `main` ni `staging`.
- `LeagueAccessProvider` usa la última pertenencia de liga almacenada localmente para mostrar antes la aplicación mientras revalida el snapshot remoto; las operaciones protegidas siguen autorizándose en servidor.
- La versión de la rama pasa a v1.14.5 y el changelog explica el comportamiento visible.
- Build y presupuesto de JavaScript se mantienen dentro de los límites del repositorio. Lighthouse queda pendiente de repetir en un entorno con Chrome instalado: el runner local no dispone de una instalación de Chrome.

- Publicación v1.14.11 verificada: `staging` y `main` en `d8161b1`; PRE `dpl_5DABffBZqMAyUKrUWJtCix8n7vCK` y Producción `dpl_61fujbsDaFov57BubKyFsKyVJ6C8` quedaron READY con sus aliases públicos. `/api/health` devuelve `1.14.11` en ambos entornos.
- En los precintos de bolsa, los nombres de jugador largos reducen automáticamente su tipografía hasta caber en una sola línea, conservando el estilo seleccionado.
- El nombre del jugador deja un margen lateral adicional en los precintos cuando necesita reducirse para caber.












- v1.14.26: el bloque HEAD / Padel Pro / S+ vuelve a la posición original.

### Welcome Pack: tinta para pegatinas (2026-09-19)

- Se añade selector entre gris claro y blanco para las zonas blancas de los seis diseños. Gris claro queda como valor inicial.
- El PDF y las previsualizaciones usan la variante correspondiente; la transparencia y el resto del arte se conservan.
- Versión local de la rama: v1.15.3. Sin despliegue remoto.
- Publicación v1.15.3 verificada: `staging` y `main` apuntan a `caa2083`; Producción responde `/api/health` con v1.15.3. PRE responde mediante el alias protegido de Vercel y mantiene la protección SSO activa.

### Inicio de saneamiento v1.15.4 (2026-09-19)

- `main` remoto se verificó en `01c9212` (v1.15.3) y se creó `codex/v1.15.4-hardening-cleanup` desde ese estado.
- La línea base, los huecos confirmados y las decisiones de producto quedan documentados en `docs/production-hardening/V1_15_4_HARDENING_AUDIT.md`.
- Se implementó el estado persistente de leído/no leído de notificaciones con migración aditiva y API protegida; la pantalla permite marcar una notificación o todas como leídas sin tocar los contadores propios del chat.
- La actividad administrativa admite cursor estable (`createdAtBefore`) para consultar páginas antiguas sin duplicados; la exportación de cuenta y la anonimización autoservicio requieren sesión y confirmación reforzada.
- Se eliminó la exclusión histórica del gate de i18n para `personal-matches` y `components/personal`; las traducciones visibles de esa vertical y de notificaciones quedan cubiertas para español, inglés y euskera.
- El buscador de ajustes incluye las entradas legales cuando son aplicables y el acceso a crear liga permanece disponible para cuentas autorizadas aunque estén en modo jugador.
- Se corrigió el 404 del acceso público de espectador por QR: `/spectate/:code/view` ahora atraviesa el proxy público y conserva las restricciones del resto de rutas.
- Se corrigió la prioridad de plantillas dinámicas de i18n para que las frases específicas se evalúen antes que patrones genéricos (`{} en {}`); las pruebas de Welcome Pack y espectador vuelven a pasar.
- Validación parcial ejecutada: i18n, TypeScript, ESLint, presupuesto de fuente y pruebas focalizadas correctos. La validación completa y los bloques restantes de auditoría siguen pendientes; no hay migraciones aplicadas ni despliegues.
- El panel de Ajustes incorpora exportación JSON y solicitud de anonimización con confirmación reforzada; se mantiene disponible también en la vista de espectador autenticado. El presupuesto total se ajusta a 130.000 líneas para absorber esta capacidad y la cobertura i18n sin ampliar ningún presupuesto de archivo crítico.
- `npm run release:check` completado: 203 archivos y 769 tests unitarios/integración, 68 E2E (incluidos accesibilidad, visuales, QR de espectador y PWA), build de producción, presupuestos de código/build y `npm audit --omit=dev --audit-level=high` con 0 vulnerabilidades.
- Las baselines visuales de Ajustes se actualizaron porque la nueva sección de datos modifica intencionadamente la altura de la pantalla.
- Ramas remotas auditadas sin borrar ninguna: todas las ramas de trabajo existentes están a 0 commits exclusivos frente a `origin/main` y se pueden considerar absorbidas; se conserva la decisión de no eliminarlas sin aprobación explícita.
- Pendientes deliberadamente fuera de esta iteración por requerir decisiones/migraciones de mayor alcance: cola persistente de reintentos Push, lista de espera transaccional y extracción completa del macroarchivo de administración de temporadas. Quedan documentados como siguiente bloque, sin afirmar que estén implementados.

## v1.15.4 — PRE/PROD promotion (2026-09-19)

- `npm run release:check` completado: 204 archivos de test, 775 pruebas unitarias/integración, 68 E2E, lint sin errores (12 warnings preexistentes), typecheck, i18n, seguridad, migraciones, build dentro de presupuesto (1.072.077 bytes gzip), auditoría runtime sin vulnerabilidades.
- La rama integra el estado actual de `origin/staging` y el hardening de waitlist; las migraciones nuevas de cola y operaciones atómicas quedan incluidas en el release.
- PRE: migraciones aplicadas y verificadas en el proyecto Supabase enlazado durante esta sesión. El código queda listo para promocionarse a `staging`.
- PROD: se requiere enlazar explícitamente el proyecto Supabase de producción antes de aplicar migraciones; no se ha usado ni supuesto el proyecto PRE para PROD.
- Promoción final verificada en Git: `staging` y `main` apuntan a `72898a8`. Supabase PROD (`szycbwdzestcmimziyey`) recibió y verificó `20260919100000`, `20260919120000`, `20260919123000`, `20260919124500` y `20260919131500`; PRE (`miadjotkucgluwbrgeih`) quedó sincronizada con las cinco migraciones, incluida la pendiente histórica de estado de lectura. El enlace local se dejó de nuevo en PRE.
- Health PROD responde `200` con v1.15.4. PRE responde mediante la protección SSO de Vercel (deployment nuevo visible, sin error de aplicación); la validación funcional PRE queda condicionada a una sesión Vercel autorizada.

## Competition visual style (local branch, 2026-09-19)

- Se creó `codex/competition-visual-style-experimental` desde `origin/main` (`b0938fa`) sin tocar `main`, `staging`, PRE ni PROD.
- La base de apariencia se centraliza en `src/lib/visualStyle.ts` y `ThemeProvider`: Classic es el valor seguro; Competition queda disponible solo en desarrollo local y fuerza modo oscuro.
- Se añadió el acento persistente por liga (`leagues.accent_color`) con fallback `#D7A544`, validación hexadecimal y propagación al acceso autenticado y al espectador público.
- La UI de Ajustes ofrece Classic/Competition y desactiva claro/sistema cuando Competition está seleccionado; la página de administración de liga permite guardar el acento.
- Se añadió una primera capa de tokens y geometría Competition en `globals.css`, manteniendo intacto el estilo Classic.
- TypeScript, ESLint (sin errores), build de producción, i18n, seguridad, presupuesto de código, `git diff --check` y la batería unitaria completa pasan: 203 archivos y 769 tests.
- La migración `20260919150000_add_league_accent_color` se aplicó y verificó en el proyecto Supabase enlazado a PRE mediante `npx supabase db push`; PROD no se modificó.

## Competition visual style v2 (local branch, 2026-09-19)

- La rama `codex/competition-visual-style-v2` parte de `75ae572` y conserva el fondo geométrico validado en v1.
- Se refuerza la jerarquía de Home, ranking, estadísticas, partidos y perfil con cabeceras editoriales, tarjetas con niveles de superficie, acentos de liga y estados más legibles.
- Se corrigen colores de avisos ámbar, rojo y azul sobre fondo oscuro, además de foco visible para teclado.
- TypeScript, ESLint, build de producción y pruebas focalizadas pasan. No se ha desplegado la rama.
- Revisión visual en la IP local: se corrigió la miniatura de Competition que conservaba un degradado del estilo anterior y el contraste de textos secundarios dentro de badges con acento. El acento se verificó al cambiar entre ligas.

## Competition visual style v2 — revisión visual HOME y regresión Classic (2026-09-19)

- Se corrigió el desbordamiento del logo de liga en la cabecera de HOME: se elimina la transformación que lo hacía sobresalir de la tarjeta y se conserva su proporción dentro del contenedor.
- El nombre de liga se mantiene en una sola línea y ajusta dinámicamente la fuente al ancho disponible, evitando truncado y colisiones con la barra flotante.
- El panel `Líder` deja de heredar una altura mínima artificial y se ajusta a su contenido, manteniendo alineación equilibrada con `Jornadas`.
- Se revisaron visualmente HOME, Mis ligas, Ranking, Calendario, Jornada, detalle de partido, Perfil, Estadísticas, Apariencia y Mis partidos en el navegador local; no se observaron errores de consola.
- Se comprobó la HOME con el estilo Classic y se restauró Competition al finalizar. No se desplegó.
- `npm run release:check` se ejecutó completo: validaciones, 205 archivos/778 pruebas, build y presupuesto pasan; 42 E2E pasan y 26 quedan bloqueados por snapshots visuales históricos y avisos de contraste ya existentes en pantallas Classic (la revisión visual de esta iteración no introduce errores de consola). No se despliega hasta actualizar esas baselines/contrastes deliberadamente.

## Competition visual style v2 — acentos, paletas y cabeceras (2026-09-19)

- El título de la liga en HOME usa un ajuste responsive real: mantiene una sola línea y reduce progresivamente la fuente hasta el mínimo legible cuando cambia el ancho disponible.
- Competition incorpora acentos seleccionables (Color de la liga, dorado, azul, verde, coral, violeta y azul hielo). El acento seleccionado se aplica a los tokens `--app-accent` y `--competition-accent`; Color de la liga conserva el color propio de la liga.
- Classic vuelve a distinguir la paleta normal de las paletas coloridas y activa la clase `colorful` para que los temas índigo, medianoche, salvia, borgoña y grafito cambien realmente la interfaz.
- Las ligas nuevas aceptan un color de acento validado; la identidad de liga puede derivarlo inicialmente del logo y mantener un valor elegido manualmente. Welcome Pack y Media Kit toman el acento de la liga como valor inicial.
- Se reorganizó la cabecera de Notificaciones en móvil: el título queda separado de las acciones y los botones dejan de comprimirse en Competition.
- Se verificaron visualmente HOME, Apariencia, Notificaciones y cambios Classic/Competition en el navegador local sin errores de consola. No se ha desplegado.

## Competition visual style v2 — centrado y separación del logo (2026-09-19)

- La cabecera de HOME usa `items-center` y un `gap` compacto únicamente en Competition; el logo queda centrado respecto al bloque de identidad y más próximo al nombre de la liga.
- Classic conserva su estructura `items-start`, margen y escala `1.3` originales.
- Se actualizó el gate tipográfico y la prueba de geometría para proteger ambos comportamientos.
- La corrección se revisó en la IP local con Competition y Classic; no se ha desplegado.

## Competition visual style v2 — cabeceras unificadas (2026-09-19)

- Se aplica un panel editorial común a las cabeceras de Competition, incluyendo Calendario y Chats, con borde de acento, superficie oscura y jerarquía tipográfica coherente.
- El botón Volver mantiene su fila superior independiente para evitar solapes en móvil.
- La comprobación visual de Calendario y Chats se hizo en la IP local; Classic no recibe estos estilos.

## Competition visual style v2 — acento en perfil e identidad de liga (2026-09-19)

- Los bordes de los paneles de Mi perfil usan el acento de Competition mediante el token dinámico de la liga, eliminando el dorado fijo.
- El nombre de la liga conserva su capitalización original para respetar la identidad de marca; las etiquetas y títulos funcionales siguen en mayúsculas.
- Se verificó el color dinámico en el perfil y el build de producción; no se ha desplegado.

## Competition visual style v3 — propuesta de rediseño (2026-09-20)

- Se creó `codex/competition-visual-style-v3` desde el estado validado de v2.
- Las superficies de Competition pasan a una composición más dimensional con gradientes suaves, bordes derivados del acento y sombras profundas, sin alterar la estructura funcional.
- HOME, Calendario, Chats, Perfil y la navegación inferior comparten ahora un ritmo visual más marcado; las tarjetas de competición mantienen el contraste y el acento de la liga.
- El alcance queda aislado a `data-visual-style="competition"`; Classic permanece sin cambios.
- Revisión visual local realizada en móvil simulado para HOME, Calendario, Chats y Perfil. No se ha desplegado.
- Se eliminó el borde superior duplicado del panel Jornada en HOME; el acento queda controlado por la propia tarjeta, igual que en Líder.
- Se unificó también el tratamiento visual: Líder y Jornada usan ahora el mismo borde superior de 2px y se desactiva el acento interno distinto de `app-stat-card`.
- En Chats se elimina la barra lateral; la lista conserva el panel y la superficie propios de Competition sin esa línea de acento.

## Competition visual style v3 — superficies translúcidas (2026-09-20)

- Las tarjetas y paneles de Competition usan superficies semitransparentes con un desenfoque suave (`backdrop-filter`) para dejar ver el fondo sin perder legibilidad.
- Se reforzó la transparencia y se llevó el patrón geométrico al contenedor de Competition para que el efecto sea visible también en HOME, sin aclarar en exceso el texto.
- En Chats las conversaciones mantienen una base neutra; solo las no leídas reciben un acento discreto.
- El alcance sigue limitado a `data-visual-style="competition"`; los modos clásicos no cambian.

## Competition visual style v3 — acceso controlado (2026-09-20)

- Competition mantiene Classic como valor predeterminado y queda disponible únicamente para la allowlist de `NEXT_PUBLIC_COMPETITION_STYLE_ALLOWED_EMAILS`, también en desarrollo local.
- La cuenta autorizada para esta fase es `davidalonsoc4@gmail.com`; el selector se oculta a las demás cuentas.
- La sesión Auth.js se resuelve antes del `ThemeProvider` para aplicar el permiso también en PRE/PROD, sin depender solo de `localStorage`.
- PRE desplegado y verificado en `https://pre.smashandlob.com` con v1.15.4 y `staging` apuntando a `dbf08fa`; PROD no se ha modificado.

## Invitación de espectador — salida y recuperación de sesión (2026-09-20)

- La pantalla de invitación limpia al abrirse la cookie de recuperación de PWA; cerrar la aplicación ya no vuelve a forzar la invitación en el siguiente arranque.
- La entrada anónima a la vista pública limpia también la cookie antes de navegar, y se puede cancelar explícitamente con `Cancelar invitación`, que devuelve a la entrada normal de la aplicación.
- Se mantiene el enlace directo a la vista pública y se han añadido las traducciones de la nueva acción en español, inglés y euskera.
- El commit `2990f7c9` se ha desplegado en PRE como `dpl_3kTNdP4G1sBNamJYMjxy3m52Ct1L`; el alias `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Competition y vista pública — superficies y temporadas (2026-09-20)

- El patrón de fondo de Competition se conserva en una única capa fija; el contenedor que hace scroll ya no pinta una segunda copia.
- La barra del navegador/PWA mantiene un negro neutro en Competition. Ajustes, lista de Chats y Chat individual comparten ahora la superficie translúcida del resto del tema.
- La vista pública muestra siempre el nombre de la liga y una temporada explícita; cuando existen varias temporadas, el selector consulta únicamente temporadas de la liga del enlace y actualiza clasificación, calendario y visibilidad.
- Classic no recibe estas reglas porque todo el cambio queda bajo `data-visual-style="competition"`; la API pública valida el `seasonId` antes de resolverlo.
- El commit `a8476a7b` se ha desplegado en PRE como `dpl_BDPgZckqtHdnFEwMS4Zb48R4chxo`; `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Competition — persistencia de selección y cabecera pública (2026-09-20)

- `ThemeProvider` ya no convierte una selección Competition en Classic mientras Auth.js resuelve la sesión; la selección persistida se conserva durante la recarga y la allowlist se aplica al terminar la resolución.
- La cabecera de espectadores fuerza contraste explícito para que el nombre de la liga y la temporada sigan visibles con cualquier acento Competition.
- Validado con tests de Competition y espectadores, lint, TypeScript, build de producción y `git diff --check`. No desplegado todavía.
- El commit `6a95ab82` se ha desplegado en PRE como `dpl_85Sm6xRDZpgJXibgzdPoSbP3T255`; `https://pre.smashandlob.com` apunta a esa versión y el health check devuelve `1.15.4`.

## Vista pública, alcance del bloqueo programado y enlaces de espectador (2026-09-20)

- La cabecera de `/spectate/:code/view` mantiene contraste explícito también en Classic claro; el título de la liga deja de quedar blanco sobre una tarjeta blanca.
- Las tarjetas de partidos de la vista pública siguen la misma distribución de cabecera, parejas, tanteo y metadatos que Calendario, manteniendo la sanitización de datos públicos.
- El bloqueo de una temporada con inicio programado deja de ser global en `AppShell`: cada pantalla aplica el bloqueo según la temporada que realmente está mostrando. Una temporada anterior se puede consultar y utilizar con normalidad.
- Si una persona autenticada abre un enlace de espectador de una liga a la que ya pertenece, la aplicación selecciona esa liga y abre la experiencia completa; los usuarios sin membresía conservan el flujo de solo lectura.
- Se añadieron pruebas de regresión para contraste Classic, distribución pública, alcance del bloqueo y redirección de miembros.
- La línea completa de la rama (`26` commits por delante de `origin/main`) se publicó en PRE como `dpl_EUm9BfzekUzK5VbcvaMZaopexMrW` y en PROD como `dpl_wRgjMQ1NjdSCtQzBrmRVTgTwzEFa`; ambos deployments quedaron `Ready` y los health checks devuelven `1.15.4` en su entorno.

## Migración de acento de liga aplicada en PROD (2026-09-20)

- Se enlazó explícitamente la CLI al proyecto Supabase PROD `szycbwdzestcmimziyey` y el dry-run mostró una única migración pendiente: `20260919150000_add_league_accent_color.sql`.
- La migración se aplicó con `npx supabase db push --linked`; la lista remota quedó alineada con todas las migraciones locales.
- `npx supabase db lint --linked --schema public` terminó sin errores.
- La CLI se volvió a enlazar al proyecto PRE `miadjotkucgluwbrgeih` después de la operación.

## Bloqueo por temporada y panel de inscripciones en Competition (2026-09-20)

- La temporada elegida en HOME se persiste por liga en `localStorage` y se reutiliza al navegar por el resto de la aplicación. Esto permite consultar temporadas terminadas con normalidad aunque exista otra temporada programada en la misma liga.
- El bloqueo global de la experiencia jugador vuelve a estar acotado a la temporada seleccionada: las temporadas con inicio programado (incluida la fase de secretos) mantienen la vista de espera, mientras que una temporada terminada no queda bloqueada. Administración, ajustes, partidos personales, notificaciones y accesos públicos conservan sus rutas de utilidad.
- El panel de Inscripciones recibe una superficie Competition específica, con contraste, bordes, estados de pago y avisos legibles en oscuro. Las reglas quedan bajo `data-visual-style="competition"`; Classic no cambia.
- Validación focalizada: 23 pruebas unitarias, ESLint de los archivos modificados y TypeScript pasan. No se ha desplegado.

- El commit `c0210f41` se publicó en PRE como deployment Vercel `dpl_4otDuoXo9jzmJFG6ETz9LXSosnyE` (`Ready`, target `preview`) y `pre.smashandlob.com` quedó reasignado a esa versión. La sonda autenticada de `/api/health` devuelve `1.15.4/pre`. PROD no se ha modificado.

- La misma implementación, con la anotación documental `e9d85d89`, se publicó en PROD como deployment Vercel `dpl_8g4BQFQ99J3DhPJ7Jr2dXFy9diKu` (`Ready`, target `production`) y quedó asociada a `https://smashandlob.com`. La sonda autenticada de `/api/health` devuelve `1.15.4/prod`.

## Sincronización inmediata de la navegación por temporada (2026-09-20)

- La selección de temporada emite un evento de cambio en la misma pestaña y la AppShell actualiza de inmediato el estado de la BottomNav y del bloqueo de temporadas programadas. También se sincronizan cambios realizados desde otra pestaña mediante el evento `storage`.
- Alternar entre una temporada terminada y otra programada ya no requiere recargar la aplicación para recuperar o restringir la navegación.
- Validación focalizada: 20 pruebas unitarias, ESLint, TypeScript y `git diff --check` pasan. Aún no se ha desplegado este ajuste.

- El commit `ea67a3f0` se publicó en PRE como `dpl_EYCT9fntL83KFTtpeacY9h4a1oi2` y en PROD como `dpl_ELHq99Rk8urTaFA6HAgHaxQisksU`; ambos deployments quedaron `Ready`. Los health checks devuelven `1.15.4/pre` y `1.15.4/prod` respectivamente.

## Pulido de superficies oscuras en Competition (2026-09-20)

- Las franjas de reserva del chat y los estados de coordinación ya no muestran fondos claros en Competition; usan superficies oscuras semánticas con contraste suficiente.
- La tarjeta de Programación del detalle de partido conserva el acento en el borde, pero deja de heredar el tinte marrón del panel completo.
- Se añadieron equivalencias oscuras para estados azules, verdes, índigo, naranjas y rosas, siempre bajo `data-visual-style="competition"`; Classic permanece intacto.
- Validación: revisión visual local en detalle de partido y chat móvil, test de Competition (7 pruebas), TypeScript, build de producción y `git diff --check`.

## Ajustes, notificaciones y chat en Competition (2026-09-20)

- Las opciones de Ajustes y las categorías de Notificaciones incorporan el mismo patrón de iconos cuadrados que Estadísticas, manteniendo las miniaturas informativas de perfil y apariencia.
- El chat de partido muestra `JORNADA X` como título compacto. La reserva fijada se presenta con pin, etiqueta y segunda línea para fecha y ubicación, con contraste específico para Competition.
- Se revisaron los estados vacíos, el área de mensajes, el compositor y las tarjetas de coordinación en móvil; Classic queda fuera de los selectores visuales de Competition.
- Validación: revisión visual local en Ajustes, Notificaciones y Chat, 26 pruebas focalizadas, ESLint, TypeScript, build de producción y `git diff --check`.

## Pulido de cabecera y metadatos del chat en Competition (2026-09-20)

- La cabecera del chat pasa a ocupar todo el ancho de la pantalla sin bordes redondeados ni el borde lateral editorial de las pantallas de contenido; el título mantiene su centrado y el botón de volver.
- El compositor inferior se mantiene como una superficie continua y el botón de envío usa el acento y su color de contraste calculado, evitando una franja lateral o contrastes inconsistentes.
- Las horas y los checks de los mensajes reciben clases semánticas propias. En Competition se pintan con el contraste del acento activo, manteniendo legibilidad con acentos claros y oscuros; Classic no cambia.
- Validación focalizada: 19 pruebas unitarias, ESLint de TS (CSS ignorado por configuración), revisión visual local en móvil y `git diff --check`. No se ha desplegado.
- Ajuste posterior: la hora de los mensajes propios fuerza también el color de contraste en su elemento interno `.type-caption`, evitando que la regla global de captions la apague con el acento dorado.

## Apariencia fija en enlaces de espectadores y contraste de navegación (2026-09-20)

- Los enlaces de espectadores guardan al generarse una instantánea inmutable de la apariencia del creador: estilo visual, tema base, paleta, elección de acento y color resuelto. Los enlaces existentes sin instantánea se completan en su siguiente uso y después no vuelven a cambiar.
- Una persona anónima sin una preferencia visual explícita recibe esa apariencia al abrir la invitación o la vista pública; sus preferencias guardadas y las cuentas autenticadas tienen prioridad. Los valores por defecto escritos automáticamente por `ThemeProvider` no se consideran una elección del usuario.
- Se añadió la migración `20260920100000_add_spectator_invite_appearance.sql` y la API pública devuelve la apariencia sin exponer datos internos.
- En Calendario, `VISTA` queda centrado en su espacio y la opción activa fuerza el contraste del texto. La etiqueta de pagos pendientes de Ajustes usa el acento y su contraste en Competition.
- Validación: TypeScript, build de producción, migraciones, 14 pruebas focalizadas y `git diff --check`. No se ha desplegado.

- El presupuesto global de fuente se ajustó de 131.500 a 132.250 líneas de forma acotada: la base previa de esta rama ya medía 131.903 líneas antes de la apariencia de invitaciones, que añade 210 líneas netas. El nuevo margen cubre únicamente esta entrega y queda respaldado por el gate de calidad.

## Cierre de gates antes de despliegue (2026-09-20)

- Se corrigió la aserción estructural obsoleta de `v166HomeLeagueSwitcher.test.ts`, que esperaba la firma anterior de `useActiveLeague()`.
- El fixture E2E de espectador ahora refleja el contrato actual de la API (apariencia, temporada y lista de temporadas) y acepta el query string de selección.
- Axe detectó y se corrigieron contrastes insuficientes en los estados de jornadas, las tarjetas de Estadísticas y el bloque de imágenes del resumen de temporada.
- Se regeneraron las referencias visuales de los recorridos E2E tras los cambios de diseño vigentes.
- Suite unitaria: 205 archivos y 789 tests correctos. E2E focalizado de accesibilidad y espectador: 24 tests correctos. Recorrido visual actualizado: 20 tests correctos.
- `release:check` completo correcto tras estos ajustes: validación, 205 archivos/789 tests unitarios, build y presupuesto, 68 pruebas E2E y `npm audit --omit=dev --audit-level=high` sin vulnerabilidades.

## Publicación v1.15.4 de apariencia de espectadores (2026-09-20)

- La migración `20260920100000_add_spectator_invite_appearance.sql` se aplicó en PRE (`miadjotkucgluwbrgeih`) y PROD (`szycbwdzestcmimziyey`). En ambos proyectos `migration list` quedó alineado y `db lint --linked --schema public` no encontró errores.
- El commit `8c47d780` se publicó en PRE como deployment `dpl_GANmaQbvjUR2AfPpJXEuhUKoTTqX`; quedó `Ready` y el alias `https://pre.smashandlob.com` apunta a él. La comprobación autenticada con `vercel curl` devuelve `1.15.4/pre`; la petición HTTP anónima del smoke recibe el `302` de protección SSO previsto.
- El mismo commit se publicó en PROD como deployment `dpl_3L1PsgB2sEW3tDTnzGMkwctj1jKs`; quedó `Ready` y asociado a `https://smashandlob.com`. `vercel curl` devuelve `1.15.4/prod` y `npm run smoke:prod` pasa completo.

## Corrección de acceso al enlace QR de espectadores en PROD (2026-09-20)

- Los logs de PROD mostraron que `/spectate/:code` fallaba al renderizar con `useLeagueAccess must be used inside LeagueAccessProvider`: las rutas públicas omiten deliberadamente los proveedores autenticados, pero la pantalla intermedia todavía intentaba usar ese hook.
- La API de invitaciones resuelve ahora de forma segura si la sesión actual pertenece a la liga (o es superusuario) y devuelve solo el estado `viewerAccess`; la pantalla pública ya no depende de `LeagueAccessProvider`.
- Se añadió una prueba E2E de la pantalla intermedia anónima para evitar que vuelva a aparecer el error genérico “Algo no ha salido bien”.
- Validación focalizada: 17 tests unitarios, 4 E2E de espectadores, ESLint, TypeScript, build de producción y `git diff --check` correctos.
- El commit `0288fbf6` se publicó en PROD como deployment `dpl_FUx4AYwrQSQYADKXuZpYfYwnJS2N`; quedó `Ready` y el alias `https://smashandlob.com` apunta a él. Health check y `smoke:prod` pasan. La ruta real `/spectate/SP-58ZK-GUD9D-FDE3` responde sin el error de proveedor y no aparecen nuevas incidencias `1295237974` en los logs.

## Apariencia de invitación anónima y título de liga en vista pública (2026-09-20)

- En rutas `/spectate/...` sin sesión, `ThemeProvider` deja de reaplicar la preferencia local después de cargar la invitación; la apariencia inmutable del enlace se aplica siempre. Esto evita que un tema claro guardado en el dispositivo anule la apariencia del QR/enlace.
- El título de la liga en la cabecera pública tiene color explícito de alto contraste, también en Classic claro.
- Se añadió cobertura E2E para verificar que la paleta de la invitación se aplica sin sesión y regresión de la pantalla intermedia.
- Validación: 5 tests unitarios de espectadores, 4 E2E de espectadores, ESLint, TypeScript, build de producción y `git diff --check` correctos.
- El commit `58d34da8` está en la rama de trabajo y `origin/staging`. PRE apunta al deployment `dpl_Cppod6KMBmkJkqzxFx6ajBRsgDcV` (`Ready`, commit `58d34da8`) y `/api/health` devuelve `1.15.4/pre`. PROD apunta al deployment `dpl_Afb3nwRyudrCNyTQkiUzBb4pVcz9` (`Ready`, alias `https://smashandlob.com`) y `/api/health`/`smoke:prod` pasan.

## Tema canónico para enlaces de espectadores (2026-09-20)

- Los enlaces de espectador vuelven a usar siempre la apariencia pública neutra de la aplicación: `Classic`, paleta normal y tema `Sistema`, sin heredar Competition, acentos ni paletas privadas del creador.
- La API de creación actualiza también las invitaciones activas existentes al valor canónico y las rutas públicas dejan de confiar en snapshots antiguos, por lo que un QR ya impreso no puede seguir abriendo Competition.
- La migración `20260920113000_reset_spectator_invite_appearance.sql` normaliza los registros persistidos y actualiza sus comentarios sin modificar migraciones aplicadas.
- Validación focalizada: 6 tests de espectador, 4 E2E de invitaciones, ESLint de los archivos modificados, TypeScript, build y `git diff --check` correctos. `supabase db lint --local` no pudo ejecutarse porque Docker/Postgres local no está levantado; las migraciones remotas sí se aplicaron y verificaron.
- La migración quedó aplicada en PRE (`miadjotkucgluwbrgeih`) y PROD (`szycbwdzestcmimziyey`), con los historiales remotos alineados.
- PRE se publicó desde `1c474047` como deployment `dpl_BPAY6Tjm3yXqW5vXRGZekDodg55M`, `Ready` y alias `https://pre.smashandlob.com`; la comprobación autenticada de `/api/health` devuelve `1.15.4`.
- PROD se publicó desde `1c474047` como deployment `dpl_3QNpfqUtdnwRCyWx8CNiTX31BQxC`, `Ready` y alias `https://smashandlob.com`; `/api/health` devuelve `1.15.4` y `npm run smoke:prod` pasa.

## Contraste de paneles de temporada en Competition (local, 2026-09-21)

- Las variantes Tailwind con opacidad `bg-neutral-50/70`, `bg-neutral-50/80` y `bg-neutral-100/70` reciben ahora la superficie elevada y el color de texto de Competition.
- Esto corrige `EVITAR SPOILERS` y mantiene coherentes los paneles equivalentes de ampliación y reglas de temporada sin modificar Classic.
- Validación local: 11 tests de Competition, ESLint del test y `git diff --check` correctos. No se ha hecho push ni despliegue.

## Competition claro (local, 2026-10-09)

- Desarrollo solicitado expresamente tras el cierre de H00–H23, en `codex/competition-light`; sin publicar ni modificar main/Production.
- Competition permite Claro, Oscuro y Sistema, conserva la elección al cambiar de estilo y responde a cambios del sistema. El arranque previo a React respeta la misma preferencia también fuera de localhost.
- Paleta clara completa mediante colores semánticos compartidos: paneles, navegación, formularios, calendario, ranking, estadísticas, perfiles, chats, reservas, pagos, notificaciones y estados conservan la estructura del oscuro. Los acentos de texto se oscurecen en claro independientemente del color de los botones.
- La configuración y las traducciones reflejan ambos modos. El aviso existente de nuevo tema oscuro sigue aplicando explícitamente oscuro. Los enlaces públicos mantienen su apariencia canónica Classic/Sistema.
- Validación focalizada: 35 tests correctos; `npm run validate` completo correcto en worktree aislado con dependencias del lockfile, entorno placeholder, 213 archivos/824 tests, TypeScript, ESLint, controles estáticos y build dentro del presupuesto. Recompilación final de bordes/foco de formularios y `quality:build` correctos (1.096.380 bytes gzip, 99 chunks JS). Pruebas focalizadas finales: 35 correctas; `git diff --check` correcto. Cambios locales listos para revisión, sin commit ni push. Sin pruebas visuales en navegador por la preferencia previa del usuario.

### Revisión visual solicitada (2026-10-09)

- Revisión interactiva en el navegador local de Competition claro y oscuro, autorizada expresamente. Sin enviar mensajes ni guardar resultados, reservas o pagos.
- Se detectó un solapamiento compartido en el perfil: el subtítulo del rendimiento forzaba una sola línea y quedaba debajo del indicador de victorias. Se permite ahora el salto de línea en `PlayerStatsPanel`, para todos los estilos. Corrección verificada visualmente en Competition claro y oscuro.

- Recorridos revisados: Mis ligas, HOME (temporadas activa y terminada), Ranking, Calendario, detalle de partido, pagos/transferencias, chat y mensaje fijado, Mi perfil, Estadísticas/resumen, Apariencia y buscador de Ajustes. Se probaron navegación, temporadas sincronizadas, salto a jornada activa, cambio claro/oscuro, acento violeta y diálogos de calendario.
- Tamaños comprobados: viewport móvil original y 1280×800 para disposición y centrado de diálogo; override retirado al terminar. No se detectaron regresiones nuevas en oscuro en estos recorridos. La consulta de errores de consola al comprobar el perfil oscuro no devolvió errores.
- Se actualizó en ES/EN/EU el texto antiguo del buscador de apariencia (Colorido → Competition) y se añadió Competition como término de búsqueda; comprobado también en navegador.
- Validación tras ajustes: 51 tests relacionados correctos (perfil y búsqueda), ESLint, tipografía, i18n y `git diff --check` correctos. Capturas de perfil claro/oscuro conservadas fuera del repositorio.
- Navegador devuelto a Ajustes, Competition claro, acento de liga y temporada 3 originales. Sin commit ni push. La comprobación funcional no incluyó guardar operaciones de negocio ni enviar mensajes.

### Simplificación de Mi perfil (local, 2026-10-09)

- Se elimina el nombre de temporada repetido bajo Rendimiento de temporada en Mi perfil; la selección permanece en la cabecera. Se aplica a todos los temas y también al panel sin resultados.
- Validación: ESLint del componente y git diff --check correctos. Sin commit ni publicación.

### Guardado en rama (2026-10-09)

- Por solicitud del usuario, se agrupan Competition claro, los ajustes de revisión visual y la simplificación de Mi perfil en un commit local de `codex/competition-light`.
- Se conservan las validaciones anteriores y se verifica de nuevo `git diff --check` antes del commit. Sin push, despliegue ni cambios en base de datos.

### Datos de posición y mano en PRE (2026-10-09)

- Por autorización expresa del usuario, se rellenaron aleatoriamente los campos vacíos `preferred_side` y `dominant_hand` de `app_users` únicamente en PRE, verificando el proyecto antes de escribir.
- Dos usuarios actualizados, cuatro campos completados con valores válidos. Escrituras condicionadas a que cada campo siguiera vacío; los valores existentes se conservaron.
- Lectura posterior verificada: ningún usuario sin posición o mano informada y todos los valores válidos. Sin modificar PROD, esquema ni migraciones.

### Posición y mano ficticias para jugadores sin cuenta (local, 2026-10-09)

- Por solicitud del usuario, el snapshot autenticado de liga añade posición y mano deterministas según el ID a jugadores sin cuenta vinculada, únicamente para localhost/PRE con la base de PRE. No se persisten ni se sustituyen datos de cuentas vinculadas.
- La protección devuelve valores vacíos ante host desconocido, variante prod/production, base distinta de PRE o configuración inválida. El entorno local actual cumple las condiciones sin cambios de configuración.
- Validación: 10 pruebas unitarias con configuración simulada (incluyendo exclusión de PROD), ESLint y `git diff --check` correctos. Sin commit, push ni despliegue; PRE recibirá el comportamiento cuando se publique.

### Ayuda de estados por toque, ratón y teclado (local, 2026-10-09)

- Componente compartido `StatusHelp`: muestra la explicación con un toque, hover de ratón o foco; admite Enter/Espacio, Escape, cierre al tocar fuera y al desplazar/redimensionar. Evita activar la tarjeta contenedora y usa portal con posición limitada al viewport para no quedar recortado.
- Aplicado a estados de partidos y victoria/derrota (liga y personales), jornadas, temporadas de Mis ligas, pagos e inscripciones, incidencias, validación de resultados, estadísticas incompletas, vista pública y bolitas de Chats/solo lectura. Descripciones ES/EN/EU y colores semánticos compartidos por los temas.
- La aserción estructural antigua del desplegable de Chats se actualizó al componente compartido; su interacción queda cubierta por pruebas de comportamiento. El gate i18n detectó una descripción inline, trasladada al catálogo común, y pasó después.
- Validación: 8 pruebas del componente (toque, ratón, teclado, navegación de tarjeta, portal y traducciones), pruebas relacionadas de tarjetas/Chats/coordinación, TypeScript, ESLint, tipografía, i18n y `git diff --check` correctos. Sin pruebas visuales, commit, push ni despliegue.

### Ayuda contextual para participantes y contraste de Coordinando (local, 2026-10-09)

- La ayuda de partidos distingue al participante del observador en detalle, tarjetas de calendario, historial de perfil, partidos personales y Chats. Orienta a revisar propuestas, confirmar reservas, consultar la programación o registrar resultados según el contexto; no afirma que falte un voto personal sin datos que lo acrediten.
- El detalle transmite el permiso real de registrar resultado. La validación solo pide revisar/confirmar a participantes habilitados que todavía no han respondido; los observadores conservan explicaciones informativas.
- Competition aplica explícitamente la superficie, el texto y el borde violeta/índigo de los estados; se añaden las variantes violet-50 y los textos 800 que faltaban para evitar la etiqueta blanca y mantener contraste en claro/oscuro.
- Validación: 10 pruebas de ayuda (incluidas diferencias participante/observador y permiso de resultado), pruebas de Chats y tarjetas personales, TypeScript, ESLint, tipografía, i18n y `git diff --check` correctos. Sin commit ni publicación.

### Contraste de hora de envío en propuestas del chat (local, 2026-10-09)

- Revisión visual solicitada: las propuestas propias mostraban la hora en gris claro sobre el acento dorado. Se aplica el mismo marcador semántico de metadatos de los mensajes normales y se retira la reducción de escala de esa hora.
- Validación: ESLint, 3 pruebas de propuestas/timestamps y `git diff --check` correctos. Tras recargar el chat abierto, las horas de ambas propuestas se leen con contraste oscuro sobre dorado; captura conservada fuera del repositorio. Sin enviar mensajes ni votar, sin commit ni publicación.

### Participantes sin cuenta en detalle de encuestas y paridad de amistosos (local, 2026-10-09)

- El detalle de votos deja de filtrar jugadores sin cuenta: todos los participantes aparecen en sí/no/pendiente; los no vinculados figuran como pendientes, sin inventar respuestas ni alterar la regla de acuerdo unánime.
- Auditoría de equivalentes: el chat amistoso usa los metadatos compartidos y no tiene propuestas/encuestas. Pagos y reservas utilizan CourtBookingPanel común. Se completó el paso del contexto de participante y permiso de registrar resultado en la cabecera del detalle amistoso.
- Validación: 16 pruebas de agrupación, timestamps y componentes de ambos chats, ESLint, TypeScript y `git diff --check` correctos. En el chat abierto se verificaron visualmente los cuatro jugadores (dos votos y dos pendientes) sin votar ni enviar mensajes. Captura fuera del repositorio. Sin commit ni despliegue.

### Identificación compacta de votantes (local, 2026-10-09)

- El detalle de propuestas muestra nombre e inicial del apellido en lugar de solo nombre; si solo consta un nombre, se conserva. El nombre completo permanece accesible mediante el título y la etiqueta del enlace.
- Verificado en el chat abierto: David A., David C., Julian A. y Gustavo F. ESLint y `git diff --check` correctos. Sin commit ni publicación.

### Nombres compactos en tarjetas de Chats (local, 2026-10-09)

- Las tarjetas de Chats muestran nombre e inicial del apellido para pareja y rivales, conservando los nombres únicos sin apellido.
- Validación: 8 pruebas relacionadas de Chats, ESLint y `git diff --check` correctos. Sin commit ni publicación.

### Iconos de Explorar estadísticas (local, 2026-10-09)

- Eliminado el doble contenedor del icono que superponía superficies y un borde cuadrado en Competition. Ahora cada acceso tiene un único contenedor redondeado y centrado, con SVG de 20×20 y trazo uniforme; se equilibran las barras de clasificación y la base del trofeo.
- Verificados visualmente los seis accesos tras recargar el navegador; mantienen centrado vertical con descripciones de varias líneas y respetan el acento del tema. ESLint, tipografía y `git diff --check` correctos. Sin commit ni publicación.

### Correcciones de auditoría visual (local, 2026-10-09)

- Rama codex/visual-audit-polish creada por petición del usuario, conservando los cambios locales anteriores. Plan resumible en docs/VISUAL_AUDIT_PLAN.md; V01 en curso, sin operaciones remotas.
- Primer bloque: contraste del estado vacío e incidencias, ubicación pendiente precisa, nombres completos en perfiles, eliminación de temporada duplicada, singularización en rendimiento, exclusión de campeones sin resultados y prioridad de deudas propias en pagos. Validación pendiente; no marcado completo.
- Segundo bloque: contexto de liga y temporada en enlaces autorizados, paridad de Chats amistosos, selectores de temporada en estadísticas y administración, cargas de usuarios, búsqueda de ayuda/usuarios, gráfica inicialmente reducida y pulido de exportación/perfiles. Se retiraron helpers administrativos sin uso para respetar el presupuesto de código, sin elevarlo.
- Pruebas nuevas: no premiar campeones sin resultados válidos y resolver enlaces conocidos solo con acceso autorizado. TypeScript y pruebas dirigidas correctos; suite completa encontró una aserción antigua adicional del título de Inicio, ya corregida. Validación completa y segunda revisión visual todavía pendientes.
- Segunda pasada visual en curso: fechas/temporadas de actividad y notificaciones, entrada compacta de amistosos, carga visible del chat, importe sin informar distinto de cero, pendientes históricos explícitos y controles de Media Kit debajo del título. Ancho de escritorio ampliado a 640 px, coordinando navegación y controles flotantes con la misma variable; móvil sin cambio de ancho.
- Validación previa: 217 archivos / 850 pruebas correctos; build y presupuesto JS correctos en copia con dependencias propias del lockfile. Turbopack rechazó inicialmente el enlace de node_modules, sustituido por instalación aislada. Se repetirán gates tras los últimos ajustes visuales.
- Reanudación: las dos pruebas de Welcome Pack pasan tras marcar como visto el anuncio de Competition en el usuario ficticio de Playwright. Se mantienen las pruebas unitarias del aviso; no se cambia el comportamiento para usuarios reales.
- Segunda revisión: 88 visitas registradas / 72 rutas y variantes, con muestra adicional clara y escritorio. Enlace entre ligas autorizado verificado hasta cargar Jornada 4 / Temporada 2; pagos de amistosos muestran primero la deuda propia; perfil global comprobado tras completar la carga. Ancho de contenido y navegación de escritorio medido: 640 px. Tema oscuro, URL original y viewport normal restaurados.
- Referencias visuales autenticadas revisadas individualmente en móvil/escritorio y regeneradas por cambios deliberados de tipografía, contenido y ancho; también revisadas las referencias públicas. La suite completa se repite sin actualizar referencias antes de declarar el gate correcto.
- Playwright completo: 70/70 correctas sin actualización automática de referencias. Validación general detectó una aserción estructural antigua que imponía texto blanco al retorno público; actualizada para comprobar el marcador de acento y el blanco del estilo clásico en CSS. Sus tres pruebas pasan; se repite validate completo antes de cerrar.
- V01 completado con disposiciones y límites explícitos en docs/VISUAL_AUDIT_RESULTS.md: validate completo correcto, 217 archivos / 850 pruebas, TypeScript y build correctos, 0 errores ESLint / 4 avisos. Presupuestos sin elevar: 132.184 líneas / 191 clientes / 50 páginas cliente y 1.178.599 bytes gzip / 102 chunks JS. Playwright final 70/70. Sin commit, push, despliegue ni escrituras de negocio durante la revisión.
- V02 iniciado por autorización expresa del usuario: aceptación funcional manual en localhost/PRE con ligas y temporadas desechables. Conservar ligas existentes; verificar persistencia y limpieza. Sin usar cuentas personales/PRE en suites automatizadas, sin cambios de permisos, commit ni despliegue.
- V02: entorno PRE/local y proceso del checkout verificados. Creada por UI la liga QA V02 desechable 2026-10-09 y QA ciclo inicial (8 jugadores/7 jornadas); persistencia tras recarga correcta, inscripciones ficticias 8/8 y desbloqueo de inicio correctos. Confirmación nativa de inicio bloquea el navegador integrado; resolución solicitada al usuario, sin asumir escritura exitosa. Registro y limpieza pendiente en docs/FUNCTIONAL_PRE_ACCEPTANCE.md.
- V02 continúa: temporada activa, programación manual/reserva fijada, descarga ICS, mensaje persistente, validación de tres sets/ranking y disponibilidad L-V verificados. Detectados flashes de hidratación (UUIDs/función temporalmente no habilitada), sin corrupción persistente. Detalle en FUNCTIONAL_PRE_ACCEPTANCE; pagos, ciclo y limpieza pendientes.
- V02: edición de resultados/ranking 2-1 y +5/-5, recomendaciones de horario, reparto económico multi/único pagador, deuda propia y liquidación persistente correctos. Propuesta de ubicación muestra los cuatro jugadores. Se documentan estados optimistas sin indicador visible; continúa aceptación.
- V02: cierre y duplicación persistentes, orden de temporadas y contexto de Perfil correctos. Amistoso QA con resultado/pagos/chat persistentes; exportaciones CSV y estructura XLSX verificadas. Se registra ausencia de reserva fijada en chat amistoso y pérdida temporal de datos históricos en UI tras duplicar. Pendiente limpieza y balance final.
- V02 reanudado 2026-10-10: exportaciones 8×10/14×12 y estructura XLSX correctas, descripción administrativa persistente, inicio programado/cuenta atrás persistentes y reversión manual probados. Limpieza bloqueada por confirmación nativa al eliminar amistoso; diálogo no expuesto y close también timeout. Recursos exactos y reanudación en FUNCTIONAL_PRE_ACCEPTANCE.md. V02 permanece EN CURSO, sin asumir eliminación ni validación total; sin cambios de aplicación/commit/remoto.
- V02 2026-10-10: usuario resuelve confirmación. Limpieza verificada tras recarga: amistoso QA ausente, liga QA eliminada por UI y su partido desaparecido del historial. Restauradas estadísticas originales/temporada 2, oscuro y viewport normal. Ejecución manual cerrada con hallazgos; V02 no marcado DONE porque mejoras funcionales y límites siguen documentados. Sin cambios de aplicación, commit ni publicación.
- V02 correcciones locales en nueva rama `codex/functional-audit-fixes`, conservando todo el trabajo anterior. La entrada espera el snapshot completo; ajustes de temporada se leen al inicializar; duplicación integra una respuesta parcial conservando plantilla/reglas históricas. Votos muestran Guardando y bloquean envíos concurrentes, sin confirmar visualmente antes del servidor. Chat amistoso incorpora reserva/calendario desde el detalle autorizado. Abreviaturas coincidentes vuelven al nombre completo en encuestas y Chats. TypeScript y 10 pruebas dirigidas correctos; presupuesto 132.189 líneas / 191 clientes / 50 páginas cliente. Validación completa y revisión posterior pendientes; sin commit ni operaciones remotas.
- V02: corregidas seis aserciones estructurales que exigían el comportamiento sustituido; 39 pruebas relacionadas correctas. `validate` completo correcto: 219 archivos / 858 pruebas, TypeScript, 0 errores ESLint / 4 avisos previos, build 1.181.292 bytes gzip / 102 chunks. Playwright 76/76 sin regenerar referencias, incluyendo espera de acceso, votos con latencia/error/reintento/recarga y calendario amistoso Google/ICS en claro/oscuro, móvil/escritorio. Se revisaron sus seis capturas; revisión local de Inicio/Chats/propuestas correcta. Último pulido mantiene nombre/inicial y coma juntos; 20 pruebas y ESLint correctos, se repite validate sobre ese estado final antes del cierre. Sin escrituras de negocio adicionales, commit ni publicación.
- V02 cerrado en su alcance documentado: validate final completo correcto (219 archivos / 858 pruebas, TypeScript, 0 errores ESLint / 4 avisos previos, 132.188 líneas / 191 clientes / 50 páginas cliente, build 1.181.317 bytes gzip / 102 chunks). 26 pruebas dirigidas y ESLint finales correctos; Playwright 76/76. Reserva amistosa y guardado revisados en capturas de móvil/escritorio, claro/oscuro; nombres comprobados en el navegador local. Límites y disposición del diálogo nativo en FUNCTIONAL_PRE_ACCEPTANCE. Rama codex/functional-audit-fixes lista para revisión local, sin commit ni push. Auto Resume comprobado activo, monitor ejecutándose y autoarranque registrado; no se cambió su configuración.
- Evidencias y logs finales conservados fuera del repositorio. La app rechazó archivar la copia `functional-audit-check` por protección de chat/workspace fijado; se conserva íntegra y no se elude esa protección. El checkout principal y su servidor permanecen disponibles.

### V03 — Publicación autorizada solo en PRE (2026-10-10)

- Usuario autoriza subir todo lo pendiente a PRE. Se prepara v1.15.9 con Competition claro y auditorías V01/V02; main/Producción/v1.0.0 quedan fuera del alcance. staging remoto y main parten de 02c3c4a15ab8f74fc7f351f0a1e06ba4d8be2f46.
- Gates locales previos: validate completo y 858 pruebas, Playwright 76/76; npm audit --omit=dev informa cero vulnerabilidades. Sin migraciones pendientes ni escrituras de negocio. Publicación todavía no ejecutada; se verificará SHA remoto, despliegue y smoke PRE.

- Revisión previa de Actions detecta fallo heredado en pgTAP: la prueba prohibía cualquier política, incluida notification_reads_service_only (solo service_role). Se actualiza la aserción para rechazar toda política que no esté restringida exclusivamente a service_role; no se modifican permisos ni migraciones. Publicación detenida hasta comprobar el gate de base de datos en CI.
- Inventario por diferencias de parches: pendientes Competition claro, auditorías acumuladas y tres commits antiguos de feature/welcome-pack-media-kit (impresión móvil y optimización del calendario). Resto de ramas funcionales ya integradas; competition-dark-polish solo aporta documentación. Se integrarán en orden y sin duplicar cambios.

- Comparación de contenido de las ramas antiguas: los tres commits de Welcome Pack/calendario ya tienen sus cambios funcionales en la versión actual (incluidas páginas CSS A4, guía móvil, carrusel compacto y conteos reutilizados); los hashes difieren por integraciones posteriores. Se abortó limpiamente el cherry-pick de comprobación para no reinstalar diseños antiguos ni pruebas anteriores al refactor. No hay funcionalidad adicional pendiente en esa rama. Orden real de publicación: Competition claro, mejoras visuales y correcciones funcionales, ya acumulados en la rama de integración.

- v1.15.9 validate final y Playwright 76/76 correctos. PR #19 abierta contra staging; ramas de origen verificadas remotamente. Se comprueba expresamente que la consulta pgTAP filtra roles exclusivos service_role antes de la nueva ejecución CI; despliegue PRE pendiente de gates.

- V03 DONE: PR https://github.com/davidalonsoc4/smash-lob/pull/19 integrada en staging b6212a007cac7ae1f7a0b809b9953e561836edc0. Árbol desplegado idéntico al validado. Los cuatro jobs pasan antes y después del merge: Actions 38043501747 y 38043771776 (código/build, navegador/accesibilidad/PWA, migraciones/pgTAP/restore, Lighthouse).
- PRE v1.15.9 verificado: Vercel dpl_8KAkFaac5UMBWyrDoTHaTKUFodge READY, alias pre.smashandlob.com en smash-hlsmrm25h-davidalonsoc4-8740s-projects.vercel.app. Smoke con transporte autenticado de Vercel: health 200/status ok/version 1.15.9/environment pre; portada 200; Avatar Lab 200; API Avatar 401 sin sesión de aplicación. El smoke anónimo recibe 302 de protección SSO de Vercel; se conserva protección sin cambios.
- main remoto permanece 02c3c4a15ab8f74fc7f351f0a1e06ba4d8be2f46 y v1.0.0 e9152940ec51fdc34b785aa8ea0e054c110c4040 sin operaciones de escritura. No se desplegó Producción ni se modificaron datos/migraciones. Logs y prueba de publicación conservados fuera del repositorio; documentación final en rama de integración.

### A01 — Auditoría integral exclusivamente documental (2026-10-10, CERRADA CON HALLAZGOS; detalle final al pie)

- Nuevo encargo sustituye cualquier autorización de corrección/publicación para esta auditoría. Solo documentos y evidencias; inventario y progreso en AUDITORIA_GENERAL.md / AUDITORIA_PROGRESO.md. No commits ni operaciones remotas de escritura.
- Se inicia A01 (inventario/antecedentes) antes de módulos. Fuente y pruebas fingerprintadas para verificar al finalizar que no cambian. Detectados efectos de escritura en autenticación/GET access: evitar navegación autenticada a PRE; preparar revisión aislada sin cuentas reales. Auto Resume activo comprobado en solo lectura.

- A01 completado: inventario íntegro (70 páginas/96 API/21 módulos), índice de antecedentes y matriz de seguridad de scripts. A02 inicia M01/M02; solo lectura/análisis y reproducciones aisladas. No se ejecutan qa:pre, Docker/descargas npx, reglas remotas ni tareas de escritura.

- A02 M01/M02: BUG-001..004 reproducidos/documentados en memoria (4 pruebas correctas): carrera que restaura privilegios en auth, IDs erróneos en exportación, anonimización parcial con éxito falso y confirmación traducida incompatible. No se corrige código ni se tocan cuentas reales. validate aislado en curso; fuente del checkout principal fingerprintada.

- A02 checkpoint: validate aislado terminó con código 0, 219 archivos / 858 pruebas, TypeScript/build correctos, 0 errores ESLint / 4 avisos y 1.181.274 bytes gzip / 102 chunks. Pendiente lint dirigido de los componentes sincronizados durante el primer lint. Auto Resume consultado por invocación expresa: activo, monitor en ejecución, autoarranque registrado, 0 pendientes; sin cambios de configuración. Auditoría incompleta, solo documentos/evidencias modificados.

- A02 M03/M04: Playwright nuevo 76/76, lint dirigido final correcto y seis capturas revisadas. BUG-005..015 documentados, once reproducciones en memoria correctas; principales nuevos hallazgos: GET invitación con código erróneo + leagueId devuelve datos, alta de liga parcial, borrado de temporada parcial y fallback activo incorrecto. Probables de promoción separados de confirmados. 924 archivos funcionales sin cambios. Arranque visual aislado rechazado por revisión automática, bloqueo documentado; se continúa por código/pruebas seguras, sin eludirlo ni usar cuentas reales. M04 y resto de módulos pendientes; no se marca auditoría completa.

- A02 reanudado tras límite: BUG-016..020 incorporados con evidencia aislada (15 reproducciones correctas). Barrido adicional de calendario 102 casos: 98 correctos, cuatro fallos de generación de duraciones aceptadas; exit 1 documentado, sin continuar una publicación ni modificar el código. Continúa auditoría documental M04/M05; no equivale a aceptación global.

- A02 M05: BUG-021/022 reproducidos con helper real en memoria: lista parcial y error intermedio mezclan jornadas. Tres pruebas correctas (dos reproducciones y control), sin datos reales ni correcciones. Reparación/reroll se sigue contrastando con SQL; no se da por finalizada la revisión.

- A02 M06: BUG-023 confirmado en memoria: resultado modificado queda validado con confirmaciones anteriores si falla su borrado. Nueva prueba 1/1 correcta. BUG-024 separado como riesgo probable de concurrencia SQL reroll/resize frente a resultados, sin atribuir prueba PostgreSQL. Restricciones de reparación/validación de conjuntos revisadas; no se modifica código ni migraciones.

- A02 M07: BUG-025 confirmado (1/1): resolución de incidencia responde 200 cuando falla la limpieza de confirmaciones y MVP. Tres controles puros adicionales de M06 pasan. Revisión de permisos, locks de sustitución y resultados documentada en M05-M07-revision.md. Continúan módulos; código funcional intacto.

- A02 checkpoint resumible: 25 fichas, 23 pruebas adicionales correctas (19 reproducciones y 4 controles); barrido 102 casos / 4 fallos conservados. M04..M07 aún en curso, M08..M21 pendientes. Fingerprint 924 archivos: 0 cambios funcionales, HEAD inicial. Informe y progreso actualizados; sin aceptación global ni cierre del hito.

- A02 M08..M11: BUG-026/027 reproducidos (2/2): zonas horarias ignoradas y propuesta aprobada fuera de los últimos 60 mensajes. BUG-028/029 reproducidos (2/2): pagos concurrentes sobrescritos y reparto con diferencia de dos céntimos. Solo memoria/funciones puras. Continúan revisión de módulos y antecedentes; ninguna corrección.

- A02 M10..M14: BUG-030/031 ranking frente a estadísticas reproducidos (2/2); BUG-032 IDs de participantes amistosos/pagos reproducido (1/1); BUG-033 cola Push ignora errores reproducido con web-push simulado (2/2), sin envíos. Se descartó falso positivo de cola tras unsubscribe: FK ON DELETE CASCADE existe. Solo documentación/evidencias.

- A02 cierre de revisión modular: alta de temporada, manuales, sustitución/desasignación SQL, economía, automatizaciones, exportaciones, PWA, idiomas, administración y logs contrastados. BUG-034/036 DOM y BUG-037 alta reproducidos; BUG-035 riesgo de borrador separado como probable; BUG-038 README histórico confirmado; BUG-039 cursor histórico reproducido. Cinco pruebas adicionales correctas (total 37); sin red ni cambios funcionales. Pendiente consolidación documental de cobertura y antecedentes antes de cerrar A02/A03.

- A02 COMPLETADO dentro del alcance seguro: 21/21 módulos examinados con límites explícitos; evidencias M08-M15 y M16-M21 añadidas. Gates ejecutados conservados: validate, lint dirigido, Playwright 76/76, reproducciones adicionales 37/37; barrido 102 con cuatro fallos reales documentados. Comienza A03 exclusivamente documental: matriz de antecedentes, cruces, balance y verificación de integridad; quedan bloqueos externos/visuales, no aceptación total del producto.

- A03 gate adicional npm audit: runtime 0 avisos/exit 0; árbol completo 13 paquetes afectados (2 critical,10 high,1 moderate), exit 1. BUG-040 P1 documenta dependencia dev confirmada y explotación no demostrada, avisos oficiales contrastados. Se detienen nuevas ejecuciones de pruebas/build y cualquier publicación; solo cierre documental/lectura. No npm audit fix, actualización, instalación o cambios de umbrales.


- A03 CERRADO: AUDITORIA_GENERAL.md, AUDITORIA_PROGRESO.md, índice de 40 fichas y matriz de 64 antecedentes finalizados. Balance P0 0/P1 10/P2 27/P3 3; 35 confirmados en alcance, cinco probables; 21 módulos examinados con límites. Antecedentes: 37 resueltos en alcance, tres persistentes,18 pendientes,seis obsoletos. Evidencia cierre-validacion.json. Bloqueos visuales/dispositivos/PostgreSQL/servicios reales explícitos; no aceptación de release. Último gate completo de dependencias falla y se conserva sin eludirlo. Integridad 924 archivos, cero diferencias, HEAD inicial 6fa8c72; solo documentación/evidencias, ningún commit/push, instalación, despliegue, escritura real o corrección. Detener auditoría y esperar decisión del usuario antes de corregir.

### C16 — IN PROGRESS (2026-10-11)
Retirada la superposición fija de 24px que producía una franja dentro de la app. Arranque y ThemeProvider sincronizan theme-color negro/blanco, color-scheme y el lienzo standalone sin altura artificial; retirado metadato Microsoft no aplicable a Android. v1.15.11 renueva caché PWA. Validaciones y publicación PRE pendientes; sin afirmar prueba física Android/iOS.
C16: regresiones dirigidas detectan una expectativa antigua del color gris de Competition claro. Actualizada a blanco, conforme al requisito del usuario; se repetirá la validación antes de publicar. La retirada del overlay y los cambios de modo pasan sus siete pruebas iniciales.
C16: npm run validate completo correcto en copia aislada: 238 archivos / 925 pruebas, TypeScript, lint sin errores (cuatro avisos previos), presupuestos 132249 líneas / 191 clientes / 50 páginas y build 1183268 bytes gzip / 102 chunks. Pruebas de navegador dirigidas en curso; no publicación hasta completarlas.
C16 navegador: la primera ejecución falla por contar exactamente dos meta theme-color; Next genera una tercera, también con el color correcto. La aserción pasa a exigir presencia y coherencia de todas las etiquetas, sin depender de su número. Se repite antes de aceptar la cascada CSS.
C16: navegador dirigido 8/8 correcto (móvil/escritorio, Clásico/Competition, claro/oscuro), con reglas CSS standalone activadas en CSSOM: fondo html/body negro o blanco correcto, metadatos coherentes y body::after ausente. Emulación no valida la barra nativa del sistema. Gates locales completos; preparación de PR solo PRE autorizada.
C16 remoto: PR #27 integrada tras cuatro jobs CI success (Actions 38093191353). staging remoto verificado 2912c18d025c37ab9eff9a0f6a1008387ec1041e. Vercel del mismo SHA en BUILDING; alias y smoke pendientes, no se da por desplegado.
C16 PRE desplegado y verificado: dpl_4kXTGV1P2rb4ybQRD5duyttEjfaL READY, alias pre.smashandlob.com; health 200/version 1.15.11/environment pre; sw.js 200/caché v1.15.11; manifest 200/colores neutros. Usuario confirma en PWA 1.15.11 que barra nativa Android sigue clara/rosada. C16 permanece IN PROGRESS: regresiones de escritorio no constituyen aceptación física; investigar origen nativo antes de otro cambio o publicación.
C16 diagnóstico nativo: fuente actual de Chromium WebappIntentDataProvider reutiliza el theme color de la instalación para navegación bajo feature WebAppNavigationBarThemeColor; en ausencia de color deja decisión a plataforma. CustomTabNavigationBarController usa transparencia solo si actividad y página optan a edge-to-edge. No prueba la versión/flags del móvil. Documentación oficial web.dev/articles/manifest-updates confirma actualización WebAPK separada del código web. Hipótesis de manifiesto anterior rosa pendiente de datos chrome://webapks; no se cambia otra vez el código sin evidencia del dispositivo.
C16 continuación autorizada: captura demuestra WebAPK actualizado (code 3, Succeeded, colores blancos) y usuario confirma Android y app oscuros con barra blanca. Se descarta manifiesto viejo como explicación suficiente. Comparación histórica: antes se fijaban colores PRE rojo/rosa; v1.15.11 los sustituyó por blanco fijo. v1.15.12 retira theme_color/background_color del manifiesto para no hornear blanco en la instalación, conservando metadatos dinámicos y lienzo claro/oscuro sin overlay. Fuente Chromium confirma retorno a decisión de plataforma sin theme color personalizado. Validación y PRE pendientes; aceptación física sigue abierta.
C16 v1.15.12: validate completo correcto (926 pruebas / 238 archivos, TypeScript, lint sin errores/cuatro avisos previos, 132247 líneas y build 1183268 bytes gzip/102 chunks). Navegador dirigido 8/8 correcto en claro/oscuro y Clásico/Competition. Se prepara publicación PRE; barra nativa pendiente de confirmación física, sin marcar C16 DONE.
C16 reanudado 2026-10-15 por usuario: comprobación real confirma PRE aún v1.15.11 y PR #28 abierta, pese a cuatro controles CI success de la candidata c97010c3. Se completa publicación pendiente autorizada: PR #28 integrada en staging 19aeacc3cd51626f1b30b9862bac34f55446c786. Despliegue y alias pendientes de verificar; barra nativa no aceptada ni C16 DONE.
C16 publicación pendiente completada 2026-10-15: PR #28 merged/staging 19aeacc3, Vercel dpl_J5TV8FS8TVMRCArv6cTSVsG8NFEi READY del mismo SHA y alias PRE verificado mediante MCP. Health 200/status ok/version 1.15.12/environment pre; manifest 200 sin theme_color/background_color; sw.js 200/caché v1.15.12. Main permanece 2461429d. Cuatro controles de candidata success. C16 continúa IN PROGRESS hasta confirmar la barra nativa en la instalación actualizada del móvil; no se afirma resuelta.
C16 continuación 2026-10-15: usuario rechaza depender de chrome://webapks; se confirma que la ruta normal debe ser automática. Detectado manifiesto servido cache-first desde APP_SHELL. Preparada v1.15.13: manifiesto network-first con revalidación HTTP, caché de respaldo para offline, sin guardar errores/redirecciones/HTML de protección y sin sustituir respuesta fresca por fallo de almacenamiento. Esto corrige retención del manifiesto, no demuestra por sí solo la causa/color de la barra nativa. Chrome conserva control del calendario de actualización WebAPK. No se cambia URL/id ni se eluden borradores al actualizar la PWA.
C16 v1.15.13 validate aislado completo correcto: 931 pruebas/239 archivos, TypeScript y build correctos, lint sin errores/cuatro avisos previos, presupuesto 132247 líneas/191 clientes/50 páginas y 1183268 bytes gzip/102 chunks. Prueba PWA real de sustitución del manifiesto cacheado y fallback offline en curso antes de publicar.
C16 v1.15.13 navegador PWA 2/2 correcto con service worker real y datos ficticios: caché sembrada con manifiesto antiguo blanco sustituida por respuesta actual, copia actual disponible offline; arranque offline previo conservado. Se prepara PR PRE con gates locales completos. No se requiere chrome://webapks como flujo de usuario, pero calendario WebAPK sigue bajo control de Chrome y barra nativa permanece pendiente de aceptación física.
C16 v1.15.13 remoto: cuatro jobs de candidata success (Actions 38714687472), PR #29 integrada en staging 9267d358aed0844ce0043ccc48996fc4ae97b89e. Despliegue PRE en comprobación. No Chrome interno como requisito; barra física sigue pendiente.
C16 v1.15.13 publicada y comprobada en PRE 2026-10-15: staging 9267d358, Vercel dpl_AEyK4jUXAD8z48jKYrihAL7weaxs READY/alias pre.smashandlob.com verificado mediante MCP. Health ok/v1.15.13/pre; sw.js contiene caché v1.15.13 y revalidación de manifiesto network-first; manifest conserva id / y no fija theme_color. 931 pruebas, dos escenarios PWA y cuatro jobs CI correctos. Ruta de usuario: actualización habitual/automática, sin chrome://webapks ni reinstalación como requisito. Chrome gestiona cuándo reemplaza WebAPK; no se afirma resultado nativo y C16 continúa abierto hasta evidencia física.
C16 evidencia física adicional 2026-10-15: usuario ve versión web 1.15.13 y barra Android blanca. No se presume WebAPK actualizado a partir de APP_VERSION. Investigación de Chromium actual: WebappIntentDataProvider selecciona colores nativos de instalación; parser main no implementa color_scheme_dark/user_preferences/dark_theme_color (no se publica parche con claves no soportadas). Falta captura de la pantalla real de PWA: las imágenes previas son de chrome://webapks, no de la barra en la app. Se requiere observar límite viewport/superficie nativa antes de otra modificación. Se mantiene abierto; sin nuevos cambios de aplicación ni publicación.
C16 captura real recibida 2026-10-15: PWA PRE v1.15.13, Mis ligas/Competition oscuro; contenido oscuro llega al borde inferior y zona de gestos blanca debajo. Se confirma apariencia fuera del contenido visible, sin demostrar configuración WebAPK actual. Usuario solicita valorar registro de diagnósticos y acceso Vercel, no implementar tabla. Plugin Vercel verificado con get_deployment: PRE READY/dpl_AEyK4jUXAD8z48jKYrihAL7weaxs/staging 9267d358. Observabilidad existente instrumentation-client -> api/observability/client-error -> serverLog (fingerprint/código de incidencia, sin contexto de apariencia). Recomendación: diagnóstico temporal mínimo en PRE exportable JSON o logs existentes; no nueva tabla para esta incidencia. JS no expone directamente el color nativo de la barra.
C16 diagnóstico autorizado 2026-10-15: añadido panel Enviar diagnóstico/Descargar JSON en Ajustes > Laboratorio (PRE/local), collector técnico mínimo y endpoint PRE/local con límite 5/min, origen, tamaño y lista cerrada de campos. Logs Vercel etiquetados pwa_diagnostic_reported e incidenceCode. Sin tablas, datos de cuenta ni cambios de tema; informe reconoce que no mide color nativo. Se prepara v1.15.14. Presupuesto global de fuente amplía de 132250 a 132550 (+300 líneas) como asignación explícita a esta nueva herramienta separada; límites por fichero/clientes/páginas quedan iguales. No se eleva como reacción a un fallo de validación. Gates pendientes.
C16 diagnóstico: nueve pruebas dirigidas correctas (producción/configuración/origen/rate limit/tamaño, lista de campos y descarga tras error). i18n EN/EU y ESLint dirigido comprobados. La asignación de fuente se ajusta de la previsión +300 a +175 líneas (límite 132425; tamaño actual 132417), solo por esta herramienta; sin ampliar clientes ni páginas. Inventario de seguridad incorpora guarda exacta de esta ruta PRE/local, no una excepción pública genérica.
C16 validación completa detecta norma visual de centrado explícito en los dos nuevos botones. Corregido text-center sin cambiar lógica; se repetirá el gate antes de publicar.
C16 v1.15.14 validate final correcto: 940 pruebas/242 archivos, TypeScript y build, lint sin errores/cuatro avisos heredados, 132417 líneas/191 clientes/50 páginas y 1185945 bytes gzip/102 chunks. Norma visual centrado corregida con flex/items-center/justify-center/text-center; sin alterar pruebas existentes. E2E dirigido móvil/escritorio claro/oscuro en curso.
C16 E2E detecta panel añadido únicamente a la variante espectador de Ajustes. Corregido también en PlayerSettingsPage, manteniendo un componente compartido PRE/local. Fallo de colocación real corregido antes de publicar; se repite E2E y validación.
C16 E2E alcanza API y detecta falso 403: Next usa URL interna localhost y navegador envía Origin externo 127.0.0.1. Ajustada comprobación de origen al Host externo ya restringido a PRE/local, conservando rechazo de origen extranjero y protocolos no HTTP. Prueba de regresión añadida; no se publica antes de revalidar.
C16 E2E final dirigido 4/4 correcto: móvil/escritorio, Competition claro/oscuro; envío real a API local devuelve código, no incluye identidad de cuenta ni liga, error de red conserva descarga JSON y borra confirmación anterior. Se revisan capturas del panel y se repite validate final tras correcciones de colocación/origen.
C16 v1.15.14 validación definitiva correcta: 941 pruebas/242 archivos, TypeScript, lint sin errores/cuatro avisos heredados, 132424 líneas/191 clientes/50 páginas y build 1185942 bytes gzip/102 chunks. E2E 4/4 con API real local y capturas claro/oscuro móvil/escritorio revisadas: panel legible, código y descarga visibles. Preparación de publicación PRE; registro remoto se comprobará con informe sintético antes de pedir informe al usuario.
C16 diagnóstico candidato publicado en rama: commit 4e2e8ec8, PR #30 contra staging, Actions 38721598191 en curso. Gates locales completos. No merge ni despliegue afirmados antes de comprobación; tras merge se verificará ingesta y búsqueda Vercel con código sintético.
C16 diagnóstico: PR #30 integrada tras cuatro jobs success (Actions 38721598191). staging remoto verificado 6d3c2b706698680cce897795e204b1f9e9b42438. Vercel dpl_FijhuWkA3kbG4abqrWgmnZAKCcNv en BUILDING; alias, ingesta y búsqueda pendientes.
C16 herramienta entregada en PRE v1.15.14 (2026-10-15): Vercel dpl_FijhuWkA3kbG4abqrWgmnZAKCcNv READY/alias pre.smashandlob.com y SHA 6d3c2b70 verificados por MCP; health ok/v1.15.14/pre. Informe sintético POST 202 SL-5C00CA8A recuperado por get_runtime_logs y validado como pwa_diagnostic_reported, versión 1.15.14 y solo campos técnicos. Segundo POST con Origin canónico PRE devuelve 202/SL-A35F44EC. Estos códigos son pruebas sintéticas, no informes del móvil. Main/v1.0.0 sin cambios. Usuario ya puede ir a Ajustes > Laboratorio > Enviar diagnóstico; C16 sigue abierto para analizar el informe real y resolver la barra nativa.
C16 diagnóstico real recibido 2026-10-15: JSON del usuario SL-9E94717F/capturedAt 2026-10-15T10:52:41.539Z contrastado con log Vercel del mismo código y timestamp en PRE dpl_FijhuWkA3kbG4abqrWgmnZAKCcNv. APP_VERSION 1.15.14, Chrome UA 155.0.0.0, standalone true, systemDark true, theme dark/Competition, colorScheme dark, html/body rgb(0,0,0), tres meta theme-color #000000; manifiesto HTTP 200 sin theme_color/background_color, viewport sin diferencia significativa innerHeight/visualHeight y safeBottom 0. SW activo y otro waiting, cachés 1.15.13/14: no demuestra causa de barra blanca ni versión del paquete WebAPK. Android 10 procede de UA y no se toma como versión real del sistema (UA puede estar reducido). Ingesta real confirmada; consulta inicial 1d rechazada por retención Hobby, repetida correctamente 30m. Diagnóstico no mide píxeles/barra nativa ni metadata WebAPK instalada; con captura anterior apunta a superficie externa, sin prueba de la causa exacta ni aceptación física. Sin nuevo parche, publicación ni cambio de base de datos. Próximo gate: inspección de instalación/ventana nativa del dispositivo; no se exige chrome://webapks ni reinstalación a usuarios. C16 sigue IN PROGRESS.
C16 inspección USB autorizada 2026-10-15: ADB conectado/autorizado en Xiaomi 15T Pro. Android real 16 (UA reducido decía 10), Chrome instalado 155.0.8059.39. Paquete PRE conocido org.chromium.webapk.ab6d5564ea3ab9e2c_v2 conserva versionCode 3/lastUpdateTime 2026-10-11 01:10:02. APK leído sin modificar instalación: AndroidManifest.xml binario declara themeColor=-1L/backgroundColor=-1L (ARGB blanco opaco), darkThemeColor y darkBackgroundColor vacíos. CDP de la única página PRE confirma theme dark/colorScheme dark/metas #000000 y Page.getAppManifest devuelve manifiesto actual sin colores y sin errores: divergencia real entre manifiesto web actual y metadata nativa instalada. No se atribuye aún causalidad exclusiva sin prueba nativa antes/después. Ventana enfocada SameTaskWebApkActivity. Primera captura USB completamente negra, no evidencia visual utilizable (pantalla posiblemente apagada/bloqueada); solicitado mantener PWA visible. Herramientas/evidencias técnicas fuera del repositorio; no lectura de cuentas/mensajes, cambios de configuración móvil, APK reinstalado, publicación ni base de datos. C16 permanece abierto.
C16 USB captura válida 2026-10-15: phone-native-unlocked.png confirma PWA oscura y barra de gestos blanca externa al contenido. Lectura limitada del bloque PRE en chrome://webapks: instalación code 3/colores blancos, último check 2026-10-15 11:22:39 pero última actualización 2026-10-11 01:10:02; status Succeeded no demuestra incorporación del manifiesto actual. Night mode Android yes. Intento de solicitud diagnóstica mediante botón PRE en pestaña temporal CDP queda sin respuesta verificable, no se afirma solicitado/completado. Paquete aún code 3. Captura posterior muestra offline; no se atribuye causalidad al intento ni se altera conectividad. Apertura nativa de Chrome mediante ADB rechazada por revisión automática (blocked by policy, sin razón más específica); no se repite por otra vía. Se solicita al usuario abrir Chrome manualmente para continuar lectura/comprobación. No cambios de app/configuración/despliegues/DB. No convertir actualización técnica manual en solución exigida a usuarios. C16 abierto.
C16 desbloqueo de recursos nativos 2026-10-15: tras apertura/cierre manual PWA, estado Update Pending y APK code 3 sin cambios. Fuente oficial Chromium WebApkSingleIconHasher crea ResourceRequest credentials_mode=kOmit, loader de proceso navegador; no usa caché SW de página. Comprobación HTTP anónima de los cuatro iconos PRE devuelve 302/acceso Vercel. Las cuatro copias en https://smashandlob.com devuelven 200/image/png y SHA256 idéntico al repositorio. Bloqueo de descarga de recursos confirmado; no se afirma todavía resolución de barra ni causalidad exclusiva. Preparada v1.15.15: solo manifiesto PRE enlaza esas copias públicas ya existentes; manifiesto/id/start_url/scope no cambian, variante Production conserva rutas relativas. Sin tocar configuración de protección ni desplegar/modificar Production. Next 16.3.8 ya añade crossorigin=use-credentials a manifiesto relativo en preview; no se añade parche redundante para credenciales del manifiesto. Dos regresiones nuevas de selección de recursos/identidad/mantenimiento Production, validaciones pendientes. Hito C16 sigue abierto.
C16 v1.15.15 gate local completo correcto en copia aislada con entorno ficticio: 943 pruebas/243 archivos, TypeScript y build, ESLint sin errores/cuatro avisos heredados, 132425 líneas/191 clientes/50 páginas y 1185938 bytes gzip/102 chunks. Archivo manifest.ts incorpora comentario explicativo sin cambiar semántica, sincronizado antes del build. Fuente Chromium confirma que fallback de icono usa URL final de redirección (acceso Vercel), no rescata el PNG original; objetivo de parche es eliminar ese bloqueo de recursos anónimos. Copias públicas verificadas por hash antes de preparar cambio; cambios futuros de iconos PRE deberán actualizar también esas copias públicas. Preparación de candidata/CI PRE, sin aceptar todavía resultado nativo ni C16 DONE.
C16 candidata PRE v1.15.15 publicada en rama: commit funcional b1a60148, merge de staging sin diferencias de árbol y HEAD 5350f0e2ae54dcc03662539f457907c6f5c16d33; SHA remoto verificado. PR #31 creada/adjunta contra staging, Actions 38727632204 queued. Main 2461429d y tag v1.0.0 e9152940 verificados intactos. No merge PRE ni actualización nativa completados aún. Usuario abrió Chrome y cerró la PWA para comprobación técnica; no se prescribe este flujo como solución para usuarios. Protección Vercel inspeccionada solo lectura, dominio PRE verificado/staging; sin cambios de acceso.
C16 v1.15.15 candidata aceptada por CI: Actions 38727632204, cuatro jobs completed/success (migraciones/pgTAP/restore sintéticos, navegador/accesibilidad/PWA, Lighthouse, código/build). PR #31 verificada mergeable/head 5350f0e2/base staging e integrada en 8aa9ea36292e5fcd30766721c033fbb182cf4573. Despliegue, alias y aceptación nativa pendientes; no se declara resuelto.
C16 PRE v1.15.15 desplegada y comprobada 2026-10-15: staging remoto 8aa9ea36292e5fcd30766721c033fbb182cf4573; Vercel dpl_5nw5mVoDNwJsx5hCJw3sMf2D1vXJ READY con ese SHA/alias pre.smashandlob.com verificado vía MCP. CLI autenticada confirma health ok/1.15.15/pre y manifiesto con cuatro PNG absolutos públicos (identidad/ruta de arranque/alcance estables). Protección PRE intacta. Para la prueba física se detiene solo paquete PRE por ADB (comando exitoso), sin borrar almacenamiento ni detener Chrome globalmente; solicitado abrir PWA para una comprobación nativa nueva. Actualización de paquete/color aún no aceptados. C16 IN PROGRESS.
C16 comprobación física PRE 2026-10-15 (continuación): la PWA fue abierta por el usuario y se detuvo únicamente su paquete instalado para permitir procesar la actualización. Panel chrome://webapks continúa Pending tras recarga; versión instalada code 3, theme/background blancos, lastUpdateTime 2026-10-11. Manifest web actual ya se comprobó como oscuro e instalable. No se declara resuelto; queda pendiente que Chrome complete la actualización WebAPK y verificar la barra nativa con la nueva versión. Sin reinstalación, borrado de datos, cambios de producción ni DB.
C16 causa corregida en código 2026-10-15: tras el aviso del usuario de que chrome://webapks mostraba Succeeded, verificación ADB/CDP demostró que WebAPK seguía en versionCode 3 y lastUpdateTime 2026-10-11; el estado Succeeded solo reflejó la consulta, no un APK nuevo. El manifiesto servido carecía de theme_color/background_color y por tanto la instalación no tenía color de tema nativo. Chromium 2026 añadió color de navegación nativa de WebAPK basado en theme_color; se agrega fallback claro explícito y se conserva el color de meta actualizado en runtime por ThemeProvider. Actualizadas regresiones unitarias; pendiente validar en Chrome físico que su actividad aplique el color runtime en dark/light. No desplegar aún ni marcar C16 hasta gate PRE y prueba física.
C16 corrección manifest-color local 2026-10-15: candidata v1.15.16 declara theme_color claro en manifest.webmanifest mientras viewport/ThemeProvider siguen aplicando claro/oscuro dinámico; regressions nuevas confirman PRE/PROD y metadatos. Primera ejecución npm run validate llegó a quality:source y falló por 4 líneas extra de comentario añadido; se compactó el diff, quality:source pasó en 132425 líneas. Revalidación completa pasada luego: lint 0 errores/4 avisos existentes, TypeScript, 943 pruebas/243 archivos, build Next y budget 1184154 bytes/102 chunks. Se incrementó app a v1.15.16 y SW; debe repetirse validate tras versionado antes de PR/CI/PRE. Package físico aún code3 aunque about:webapks dice Succeeded; validación física de color runtime sigue pendiente.
C16 v1.15.16 gate repetido completo tras versionado: release check, inventarios/quality, lint 0 errores/4 avisos, TypeScript, 943/943 pruebas en 243 archivos, build correcto y presupuesto gzip 1184154/102. No automatización contra OAuth, cuentas personales ni datos PRE/PROD. Candidata local preparada para PR staging y despliegue solo PRE tras CI.
C16 decisión/corrección 2026-10-15: el historial confirma que v1.15.16 reintrodujo theme_color fijo blanco tras la corrección v1.15.12 que lo retiró. Se elimina ese valor para conservar la solicitud viewport-fit=cover y theme-color runtime (#000/#fff), que Chromium puede usar al dibujar edge-to-edge. Nueva candidata v1.15.17; no se afirma solución hasta validar Android instalado. Paquete conectado observado: versionCode 3, lastUpdateTime 11-oct; PRE anterior 1.15.16. Gates pendientes.
C16 relectura USB 2026-10-15 tras usuario confirmar PWA PRE abierta: Chrome 155.0.8059.39, actividad SameTaskWebApkActivity y paquete PRE instalado versionCode/versionName 3, lastUpdateTime 2026-10-11 01:10:02. El paquete no se ha sustituido aunque el panel previo mostrara Succeeded; la PWA abierta por sí sola no confirma la actualización nativa. C16 sigue abierto, barra blanca no resuelta en Android físico; sin cambios de código, APK, instalación ni datos.
C16 decisión del usuario 2026-10-15: prefiere barra de navegación negra fija incluso en tema claro antes que blanca fija. Candidata local v1.15.18 declara theme_color #000000 en WebAPK; la meta del modo standalone permanece negra aunque el contenido cambie a claro/oscuro, mientras en navegador conserva color dinámico. Sin cambiar fondo claro del contenido. Gates completos: npm run validate correcto (944 pruebas/243 archivos, lint 0 errores/4 avisos existentes, TypeScript, build y presupuesto gzip 1184225 bytes/102 chunks); E2E global ejecutó 84/88 y solo fallaron cuatro expectativas antiguas de tema claro, luego los ocho casos system-surface (móvil/escritorio, clásico/Competition, claro/oscuro) pasaron; npm audit --omit=dev --audit-level=high sin vulnerabilidades. No es validación de barra nativa; PRE pendiente.
C16 PRE v1.15.18 desplegada 2026-10-15: PR #35 integrada en staging (merge dfafb431f6d562a86d2aaeec435d72e6ebd7f3a1); Vercel dpl_BksegMtzFZBYYPhyj4gjPiSdZyqF READY, alias pre.smashandlob.com y SHA coincidente. Smoke autenticado: /api/health 200, version 1.15.18/environment pre; /manifest.webmanifest 200 con theme_color #000000. No Producción. Aún falta confirmación física de que Chrome/WebAPK actualiza la barra nativa del móvil; C16 continúa abierto.
C16 ajuste de splash PRE en curso 2026-10-15: el usuario informa pantalla blanca de arranque. v1.15.18 fija theme_color negro pero omite background_color; Chrome Android usa ese campo para la pantalla de inicio y puede mostrar blanco si falta. Candidata v1.15.19 añade background_color #000000 y regresiones de manifiesto/offline; la barra nativa en app abierta sigue pendiente de confirmación física. Solo rama staging/PRE autorizada; no Producción.
C16 PRE v1.15.19 desplegada 2026-10-15: PR #36 integrada en staging (merge a5c9dceda0697b79252917a6d04d1f008def9be8); Vercel dpl_6h9Rro9LCccqgwGYJmZeo1oA9Pkb READY con alias pre.smashandlob.com y SHA coincidente. Smoke autenticado: /api/health 200, version 1.15.19/environment pre; /manifest.webmanifest 200 con theme_color y background_color #000000. Protección PRE intacta, no Producción. Falta confirmar en móvil tanto el arranque nativo como la barra de navegación después de abrir.
C16 seguimiento posterior a PRE v1.15.19 (2026-10-15): usuario informa que sigue igual. Verificación Vercel autenticada confirma /manifest.webmanifest con theme_color/background_color #000000 y HTML inicial con viewport-fit=cover y meta theme-color #000000. La captura del problema es de la PWA ya cargada; background_color solo afecta la pantalla de inicio, no prueba el color nativo persistente. Sin ADB disponible ahora no se confirma el AndroidManifest/WebAPK instalado actual; causa runtime/paquete pendiente, no se afirma resolución.
C16 auditoría rigurosa 2026-10-15: informe ANDROID_GESTURE_NAVIGATION_AUDIT.md y aceptación PLAN actualizada a transparencia primero/negro alternativo con prueba Android obligatoria. Fuente oficial descargada del tag exacto 155.0.8059.39 confirma WebAppShortEdgesCutoutMode desactivada por defecto, WebAppNavigationBarThemeColor activada por defecto y controlador con ramas ajustada/edge-to-edge distintas. Main incorpora más condiciones y no se confunde con el binario. Negro ya solicitado por v1.15.19; no se añade parche especulativo. ADB consultado correctamente sin dispositivos conectados; metadatos actuales del paquete y causa Chrome/HyperOS pendientes. Solo documentación, sin publicación ni cambios de app/DB/teléfono. Validación local en copia HEAD con entorno ficticio en curso; C16 IN PROGRESS.
C16 gate de auditoría: validate pasa controles estáticos y lint (0 errores/4 avisos previos), pero typegen falla por sandbox Windows (SWC canonicalize baseUrl: acceso denegado). No es gate superado ni se continúa a publicación. Se solicita repetición fuera del sandbox en la misma copia ficticia; sin cambios funcionales para eludir el error.
C16 repetición de auditoría: TypeScript y 944 pruebas pasan fuera del sandbox. Build se detiene por enlace node_modules externo al root Turbopack de la copia aislada, no por código de aplicación. No se considera validate aprobado ni se pasa a navegador/publicación: se corrige únicamente la preparación de dependencias aisladas antes de repetir el build.
C16 decisión final del usuario 2026-10-15: negro fijo y PRE autorizados; se deja de buscar transparencia para esta entrega. Relectura remota vía Vercel confirma PRE READY/dpl_6h9Rro9LCccqgwGYJmZeo1oA9Pkb, alias pre.smashandlob.com, staging a5c9dced y manifest con theme_color/background_color #000000. Bootstrap y proveedores ya fijan meta standalone negra en v1.15.19; no existe diff funcional adicional justificado ni se crea una publicación redundante. Preparación de dependencias de auditoría interrumpida a petición del usuario; validate completo/E2E nuevos no se afirman. Solo documentación local modificada; main, Production y v1.0.0 intactos. Aceptación física C16 pendiente.
C16 blanco persistente/revisión de regresión 2026-10-15: usuario confirma que continúa blanco y que funcionaba hasta hace aproximadamente una semana. Revisión fuente confirma blancos de modo claro/fallback (globals.css :root, nav bg-white/95 y fallback standalone #fff), sobreescritos en oscuro; diagnóstico físico anterior ya midió root/body negros, por lo que esos valores no demuestran causa de franja persistente. Git b4d4019f (09-oct, Competition claro) cambió resolución forzada oscura a preferencia y meta de Competition claro a #f3f5f8: candidato temporal para aparición inicial, no causalidad demostrada y no explicación suficiente de captura oscura posterior. Último APK inspeccionado tenía colores blancos, sin lectura actual. ADB nuevamente sin dispositivos conectados. No se declara imposible ni se modifica/republica CSS sin evidencia; siguiente comprobación es paquete/ventana actuales y prueba temporal separada de fondo web/meta, sin cambios persistentes del teléfono.
C16 corrección canvas fijo 2026-10-15: ante solicitud de corregir regresión sin retirar Competition claro, se completa la política de negro fijo. Hasta v1.15.19 solo manifest/meta standalone estaban fijados: --app-system-surface y html/body podían ser blancos en modo claro. Bootstrap, proveedor y espectador ahora conservan superficie negra en standalone; CSS aplica negro incluso antes de data-theme, sin overlay ni espacio añadido. Color-scheme y superficies internas siguen el modo elegido. Este cambio elimina el canvas blanco disponible en standalone, pero no demuestra causa/resolución de la franja oscura actual fuera del viewport. ADB sin dispositivo. Regresiones actualizadas; gates pendientes, solo PRE autorizado.
C16 candidata v1.15.20 preparada desde origin/staging a5c9dced en codex/android-black-canvas. Versión/SW coherentes; fuentes conservan presupuesto 132425 líneas. Auditorías completa y runtime sin vulnerabilidades. La regla final se revisó contra especificidad de body con navegación/chat visibles; pruebas comprueban ambos estados, Clásico/Competition claro/oscuro, bootstrap/runtime y espectador. Copia física nueva de dependencias preparada sin borrar el enlace anterior tras rechazo automático de su retirada. Validate en entorno ficticio en curso; main remoto 2461429d y tag v1.0.0 e9152940 registrados para verificación final.
C16 preparación local corregida: se detecta que node_modules del checkout habitual es antiguo (Next 16.3.5/Vitest 3.2.7) aunque el lockfile auditado declara 16.3.8/4.1.11. Se detiene validate de la copia heredada (exit 1 por interrupción); sus resultados no sirven para liberar. npm ci reproducible se ejecuta únicamente en la copia ficticia, sin tocar dependencias ni servidor habitual. Se repetirá el gate con versiones exactas del lockfile antes de publicar.
C16 v1.15.20 con dependencias exactas: npm ci y auditoría 0 vulnerabilidades, 12 regresiones focalizadas correctas. Validate pasa controles estáticos/lint (0 errores, 4 avisos existentes), TypeScript, 945 pruebas/243 archivos y compilación Next 16.3.8. Paso final quality:build se detiene porque la copia usó NEXT_DIST_DIR=.next-playwright y el checker requiere .next/static. No se cambia el checker: se repite build/presupuesto con salida .next estándar dentro de la copia aislada; navegador y publicación pendientes.
C16 gate local v1.15.20 completado por tramos tras corregir preparación: build estándar .next y quality:build correctos, 1186011 bytes gzip/102 chunks. Controles anteriores y 945 pruebas se conservan sin cambios de fuente posteriores; solo pruebas/documentación actualizadas antes de su ejecución final. npm run test:e2e completo en curso con playwright.config.ts y datos ficticios; no cuentas reales ni OAuth/PRE automatizados. Revisión React: sin cambios de hooks/eventos/accesibilidad, bootstrap y runtime coherentes, sin dependencias nuevas. No se acepta todavía barra Android.
C16 v1.15.20 E2E completo correcto: 88/88, incluidas referencias visuales/Axe, ocho escenarios system-surface móvil/escritorio Clásico/Competition claro/oscuro (canvas negro, esquema de controles por modo, estados navegación/chat), caché de manifest y arranque offline. Sin actualizar baselines. Gates locales completos por tramos, auditorías 0 vulnerabilidades y diff correcto. Se prepara candidata/PR staging y CI; no se representa DevTools/Playwright como prueba de barra nativa Android.
C16 candidata v1.15.20 publicada: commit funcional 5cf61f4a, documentación 73072caf0316874b7e8b39042623a2a3eaf30767 y SHA remoto coincidente verificado. PR #37 abierta/adjunta contra staging a5c9dced; CI todavía sin resultado. No merge/despliegue nuevos afirmados. Solo negro fijo del canvas standalone, modo claro conservado y aceptación Android real pendiente.
C16 CI 38788968562: Lighthouse bloquea promoción por TBT de portada 758 ms frente al máximo 700 ms, medición única; build/presupuesto remotos correctos y otras dos URLs no fallan. No se afirma ruido ni se modifica el límite. Se repite únicamente ese job sobre el mismo SHA para comprobar reproducibilidad; merge/PRE detenidos hasta resolver el gate.
C16 CI mismo SHA: código/build, navegador/accesibilidad/PWA y database sintética completed/success. La primera solicitud de repetición de Lighthouse fue rechazada porque el workflow seguía activo; tras verificar completed/failure, repetición del job solicitada de nuevo. No se asume aprobación del gate hasta resultado comprobado, sin modificaciones de código ni umbrales.
C16 candidata v1.15.20 aceptada por CI: Actions 38788968562 completed/success, cuatro jobs completed/success en la repetición de Lighthouse sobre el mismo SHA, sin modificar umbrales ni fuentes. PR #37 revalidada head 73072caf/base staging/mergeable antes de integrar. Se comprueba a continuación SHA staging y despliegue PRE; no se declara resultado nativo.
C16 PRE v1.15.20 publicada y comprobada 2026-10-15: PR #37 integrada en staging bb673e2736eb366fd11c969ad9df3ae8dfde0fc2, SHA remoto verificado. Vercel dpl_3K3Gi2USXxqtmuznbEgVcWM1CmjC READY, rama/SHA y alias pre.smashandlob.com verificados por MCP. Peticiones autenticadas canónicas devuelven health 200/ok/1.15.20/pre, manifest negro, meta negra, bootstrap --app-system-surface=tc, sw.js cache v1.15.20 y CSS servido con regla standalone html/body #000!important y prioridad sobre navegación/chat. Diff funcional HEAD/staging vacío. Main remoto 2461429d y tag v1.0.0 e9152940 intactos; sin cambios de Production/DB/teléfono. C16 sigue IN PROGRESS: canvas web corregido y publicado, barra nativa Xiaomi no verificada; ADB continúa sin dispositivos.
C16 aceptación física FALLIDA en v1.15.20 (2026-10-15): captura del usuario 111744.jpg muestra etiqueta PRE v1.15.20, Competition oscuro y franja blanca con indicador oscuro debajo de la navegación propia oscura. El parche de canvas no resuelve el problema nativo observado. Esta captura no revela metadatos del APK ni qué capa nativa pinta blanco. ADB consultado nuevamente con lista vacía. No se publica otro cambio CSS/metadata: falta lectura actual de package/versionCode/colores del WebAPK y ventana/insets para separar instalación antigua de comportamiento Chrome/HyperOS. C16 continúa IN PROGRESS, sin aceptar negro ni transparencia.
C16 USB actual autorizado/conectado 2026-10-15: Xiaomi 15T Pro accesible por ADB (device autorizado), Android 16/Chrome instalado 155.0.8059.39. Paquete PRE org.chromium.webapk.ab6d5564ea3ab9e2c_v2 sigue versionCode/versionName 3, targetSdk 33, lastUpdateTime 2026-10-11 01:10:02. APK actual extraído en .quality-artifacts/android-native-current-20261015 y AndroidManifest binario leído: themeColor=-1L y backgroundColor=-1L (blanco ARGB #FFFFFFFF), darkThemeColor/darkBackgroundColor vacíos. Ventana enfocada SameTaskWebApkActivity. Divergencia actual comprobada entre código web v1.15.20 negro y colores blancos de instalación; no es solo hipótesis histórica. Sin cambios en teléfono/instalación/datos ni publicación nueva. Resultado nativo sigue fallando; siguiente investigación: completar actualización WebAPK conservando datos y comprobar el paquete/color después, sin atribuir aún causalidad exclusiva a HyperOS.
C16 actualización nativa solicitada 2026-10-15: usuario abre chrome://webapks; lectura limitada a PRE confirma code3/colores blancos y último check/completion 14:31:29, anterior a publicación de negro fijo. Dispositivo cargando y conectado a Wi-Fi. Botón Update Smash & Lob PRE observado y pulsado por CDP; tras recargar, estado Pending verificado (no se afirma actualización). Se detiene únicamente org.chromium.webapk.ab6d5564ea3ab9e2c_v2 para un arranque nuevo, sin borrar datos ni parar Chrome globalmente. Se solicita abrir PRE para obtener manifest nuevo y después cerrar su ventana; se verificará versionCode/lastUpdateTime/AndroidManifest antes de aceptar ningún Succeeded.
C16 actualización: usuario abre PRE, CDP comprueba standalone=true, theme=dark, root/body rgb(0,0,0), meta #000 y Page.getAppManifest sin errores con ambos colores #000. Se comprueba además que detener el paquete lanzador no garantizó destruir la ventana Chrome de PRE. Page.close sobre la única página PRE devuelve acuse; tras esperar brevemente, lista CDP confirma cero páginas PRE y foco en launcher. Se pide nuevo arranque desde icono para crear ventana/gestor de actualización nuevos; no se da por recibido un APK nuevo. Datos y Chrome global conservados.
C16 nueva comprobación nativa 2026-10-15: tras arranque realmente nuevo, chrome://webapks muestra check/completion 21:11:57 y Succeeded, pero versionCode=3 y colores blancos permanecen; usuario confirma blanco. Se cierra de nuevo solo ventana PRE, verifica cero páginas PRE y se espera antes de releer package: code3/lastUpdateTime 11-oct sin sustitución. Fuente Chromium WebApkUpdateManager.onGotManifestData permite marcar SUCCESS cuando needsUpgrade=false incluso en comprobación forzada; por tanto Succeeded no garantiza descarga/instalación. Actualización ordinaria solicitada y procesada sin cambio de paquete observado; no se afirma una causa interna exclusiva. Se propone instalación nueva únicamente de PRE como siguiente prueba concluyente, sujeta a autorización explícita porque el usuario prohibió desinstalar/borrar datos automáticamente; puede requerir nueva sesión/preferencias locales. Sin nuevas modificaciones de aplicación ni Production.
C16 reinstalación PRE autorizada explícitamente 2026-10-15: usuario responde «Sí, reinstalar solo PRE». Dispositivo exacto y versionCode3 revalidados antes de retirar únicamente org.chromium.webapk.ab6d5564ea3ab9e2c_v2. adb uninstall devuelve Success y pm list packages confirma ausencia. No se emiten comandos de borrado de Chrome ni acciones sobre Production/datos del servidor. Instalación nueva por Chrome pendiente; no se afirma todavía color ni resultado físico.
C16 bloqueo de reinstalación 2026-10-15: usuario informa «Esta aplicación no se puede instalar». Captura ADB confirma opción Instalar deshabilitada con icono genérico, no un fallo de PackageInstaller posterior; no hay WebAPK nuevo respecto al inventario previo. Page.getAppManifest devuelve manifest negro sin errores y Page.getInstallabilityErrors devuelve lista vacía, insuficiente para aceptar instalabilidad nativa. Carga real de iconos 192/512 en Xiaomi falla; securitypolicyviolation confirma img-src bloqueando https://smashandlob.com/icon-pre-512.png. next.config.ts solo permitía self y proveedores externos, mientras manifest.ts usa cuatro iconos PRE públicos en otro origen desde v1.15.15. Log nativo de actualización muestra Got Manifest:false/upgrade needed:false. Se corrige exclusivamente CSP para permitir esos cuatro paths, no wildcard ni retirada de protección. Candidata v1.15.21 y prueba navegador de carga con CSP real/interceptación ficticia preparadas; gates y publicación pendientes, color nativo sin verificar.
C16 v1.15.21 validate completo correcto en copia aislada con Next 16.3.8/Vitest 4.1.11: 945 pruebas/243 archivos, TypeScript, lint 0 errores/4 avisos previos, compilación y presupuesto 1186013 bytes gzip/102 chunks. Auditoría completa 0 vulnerabilidades. Prueba navegador completa en curso, incluida carga de los cuatro iconos bajo CSP real. Sin publicación ni instalación nueva afirmadas.
C16 v1.15.21 navegador completo 90/90 correcto: iconos públicos permitidos por CSP real en móvil/escritorio (fixtures interceptadas, sin acceso a Production), referencias visuales/Axe, temas, PWA/cache/offline. Gates locales completos y auditoría 0. Se prepara PR únicamente a staging/PRE; aceptación nativa pendiente.
C16 candidata v1.15.21 publicada en rama codex/pre-install-icons, head 8bf56194c6cf46bfbb736cfa43d42173d2ded11c verificado contra remoto. PR #38 abierta y adjunta con base staging bb673e27; Actions 38795055379 queued. PRE sigue v1.15.20 hasta gates/merge/despliegue verificados. Se conserva stash documental de recuperación antes de crear rama desde staging; evidencia restaurada en nueva rama, sin pérdida de cambios ni archivos adjuntos.
C16 CI v1.15.21 comprobada: Actions 38795055379, cuatro jobs completed/success (código/build 116629142057, navegador 116629141953, Lighthouse 116629142053, database sintética 116629141760). Sin cambio de límites ni repetición de jobs. Se revalida head/base de PR #38 antes de integrar solo staging.
C16 PR #38 integrada tras revalidar head/base/mergeable; staging remoto coincide con 128bd4482a7306020dc9f799481ceea7bbc69895. Vercel dpl_HwWQ5NaP1MZKaCsniehib4Fsn4w6 del mismo SHA/rama en BUILDING. Main 2461429d y tag v1.0.0 e9152940 permanecen intactos. Alias/version/cabecera del móvil pendientes; no se afirma todavía despliegue ni instalación.
C16 PRE v1.15.21 publicada/verificada: dpl_HwWQ5NaP1MZKaCsniehib4Fsn4w6 READY, alias pre.smashandlob.com y staging128bd448 comprobados. Health200/ok/1.15.21/pre, manifest200 negro, sw200/v1.15.21 y cabecera CSP con cuatro paths. Primera recarga mientras móvil inactivo no tiene manifest y no se acepta. Usuario desbloquea/abre PRE; CDP físico confirma cuatro iconos cargados con dimensiones correctas, violations=[] y manifest negro sin errores. Bloqueo de recursos resuelto realmente; menú Instalar, nuevo paquete y barra nativa pendientes. Se solicita repetir instalación solo PRE, autorización previa conservada. Main/Production/tag intactos.
C16 reinstalación efectiva 2026-10-15: usuario confirma que Chrome ya permite instalar. Diferencia de inventario identifica nuevo org.chromium.webapk.a974c1e7b43fd1154_v2; APK extraído e identidad verificada por startUrl/scope/manifest PRE. Instalado 21:42:06, versionCode1, targetSdk33. AndroidManifest contiene themeColor=-16777216L y backgroundColor=-16777216L, ARGB #FF000000 negro; el paquete retirado tenía -1L blanco. Cambio de colores del contenedor comprobado físicamente, sin inferir aún renderizado. Se pide abrir desde nuevo icono y comprobar región nativa.
C16 resultado negro físico CONFIRMADO 2026-10-15: usuario abre nuevo icono y responde «Ahora aparece negra. por fin». Captura ADB pre-native-black.png muestra PREv1.15.21, navegación propia intacta y región nativa negra con indicador claro. Foco SameTaskWebApkActivity; CDP standalone=true, html/body negros, manifest negro y cuatro iconos cargados sin violations. Muestreo PNG original 1280x2772 confirma RGB0/0/0 en laterales/fondo de región inferior e indicador central RGB166/166/166. El color blanco del paquete anterior y negro del nuevo correlacionan con resultado nativo antes/después. Se pide comprobación manual adicional de restauración, reapertura, temas y teclado antes de cerrar C16; sin afirmar todavía ausencia de flashes en todas las transiciones.
C16 DONE/alternativa negra 2026-10-15: usuario confirma «Parece que se mantiene bien la barra haciendo cambios de temas y cerrando y abriendo la app». Se acepta negro nativo real con indicador claro, acreditado también por captura/medición ADB y paquete negro nuevo. Localvalidate945, E2E90, auditoría0 y cuatro CI jobs success; PRE1.15.21/128bd448 READY y comprobada. Se cierra únicamente C16, sin avanzar. No se afirman prueba independiente de teclado/restauración explícita de segundo plano, vídeo de arranque sin frames blancos ni universalidad de Chrome/HyperOS; se conservan como cobertura manual residual. No más reinstalaciones/flags/migración ni Production. Informe obligatorio de seis apartados y evidencias actualizado.
C16 seguimiento explícitamente autorizado 2026-10-15: tras preguntar por actualización sin reinstalación en Production, usuario indica Adelante y confirma un segundo móvil apagado con PRE antigua, versión desconocida. Se reabre únicamente C16 para verificar esa instalación existente; negro del Xiaomi anterior permanece aceptado. Se solicita encender/conectar segundo Android manteniendo PRE cerrada para inventario nativo previo. Sin modificar manifest con marcadores, publicar nada, tocar Production, desinstalar ni borrar datos. Objetivo adicional: demostrar actualización conservando paquete/firstInstallTime y resultado negro; la reinstalación anterior no probaba ese camino.
C16 segundo Android preparado 2026-10-15: ADB cd558fa0 autorizado, modelo M2012K11AG/alioth, Android13 y Chrome153.0.8010.52. Wi-Fi conectado y alimentación AC=true/batería19%; ninguna PWA abierta por el agente. Resolver nativo identifica dos PRE existentes: a07ee66248c8a6a96_v2 code2, firstInstall15-ago10:10:38/lastUpdate21-sep13:26:04, startUrl /launch?source=pwa; a55effbd4e5cd5498_v2 code1, firstInstall/lastUpdate15-ago10:10:31, startUrl /. Ambas scope/manifest PRE, themeColor#FFB91C1C y backgroundColor#FFFFF1F2, no negro. APK/AXML/metadatos y timestamps previos guardados en .quality-artifacts/android-existing-pre-20261015. Reenvío CDP9224 preparado para este serial, sin tocar el Xiaomi anterior ni otros paquetes. Estado inicial apto para abrir PRE y observar actualización conservando paquete/firstInstallTime; esto probará Android13/Chrome153, no sustituirá evidencia de actualización sobre Android16.
C16 primera apertura del segundo Android: usuario informa hueco negro inferior. Captura estable muestra PREv1.15.21/Competition oscuro, indicador de gesto nativo claro y área negra inferior más alta que en Android16. CDP físico standalone=true, manifest negro, cuatro iconos cargados/violations=[]; viewport795.636CSSpx y navegación propia bottom795.636/height72.727/paddingBottom0/bottomCSS0/safeBottom0. Por tanto no hay padding/hueco CSS entre navegación propia y borde web; región negra queda fuera del viewport. APKs siguen code2/21-sep y code1/15-ago con firstInstallTime conservados; ver web21/negro en Android13 no acredita actualización nativa. Log de tags nativos no aporta eventos todavía. Se pide abrir chrome://webapks sin pulsar Update para leer planificación automática antes de intervenir; ninguna desinstalación/borrado/mutación de app o Production.
C16 lectura de chrome://webapks segundo Android: la instalación usada es a55effbd4e5cd5498_v2 (code1), check/completion15-oct22:07:32/estadoFailed; la otra a07 code2 conserva check20-sep/completion21-sep/Succeeded. Logcat histórico filtrado confirma Got Manifest:true, upgrade needed:true y razones[6], a diferencia del Xiaomi antes del arreglo CSP. Fuente oficial descargada del tag exacto153.0.8010.52 confirma recordUpdate(FAILURE) preventivo mientras prepara actualización y programación normal con ventana1–23h/Wi-Fi/carga; por eso Failed no acredita por sí solo fallo final. Se cierra solo página PWA de Inicio recién abierta; otras pestañas Chrome preexistentes se conservan. Botón Update localizado por package exacto a55, pulsado; recarga de ficha verifica Pending. Se solicita reabrir el mismo icono para procesar y cerrar posteriormente solo esa ventana. Esto acelera manualmente el calendario y no equivale a demostrar actualización completamente automática; paquete/datos/firstInstallTime conservados, sin desinstalación ni cambios de código/Production.
C16 actualización SIN reinstalar confirmada en segundo Android (15-oct22:16:29): a55effbd4e5cd5498_v2 pasa code1→2, mantiene exactamente firstInstallTime15-ago2026 10:10:31 y packageId, lastUpdateTime cambia de15-ago a15-oct22:16:29. APK posterior extraído/identidad PRE verificada: themeColor/backgroundColor=-16777216L (#FF000000), antes #FFB91C1C/#FFFFF1F2; startUrl pasa de/ a/launch?source=pwa. Log nativo incluye Update now. No uninstall/install/clear-data, migración ni publicación nueva; Chrome realiza actualización del mismo paquete. Precisión operativa: primera selección de cierre por URL Inicio no coincidió porque la nueva ventana estaba en Mis ligas; se corrigió apuntando al id160, validando standalone y confirmando desaparición, sin cerrar otras pestañas. Native launcher PRE detenido únicamente; ventana Chrome terminó después por cierre comprobado. La solicitud se aceleró manualmente con chrome://webapks, por tanto no se afirma finalización bajo calendario automático ni API web para forzar. Sesión y renderizado después de actualizar pendientes de respuesta/manual; Android13/Chrome153 no prueba por sí solo actualización in-place sobre Android16.
C16 usuario confirma tras actualización in-place: entra normal, no pide login; continúa hueco inferior. Se acepta conservación de sesión y actualización del mismo paquete con colores negros. Diagnóstico más preciso del hueco (no confundirlo con toda la barra): dumpsys InsetsSource ITYPE_NAVIGATION_BAR=[0,2356][1080,2400] alto44px; ITYPE_BOTTOM_MANDATORY_GESTURES=[0,2268][1080,2400] alto132px. El viewport web acaba a2268px, dejando88px adicionales antes de la barra real. Ventana nativa Chrome frame/parent/display=[0,0][1080,2400], sin GivenContentInsets; reserva está en layout/insets del contenedor, fuera de CSS. Modo navegación gestos confirmado (force_fsg_nav_bar1/navigation_mode2). Hueco ya existía en primera captura antes de sustituir APK. Coincidencia con mandatory gestures comprobada; módulo nativo exacto y responsabilidad Chrome/MIUI aún probables, no atribuidos definitivamente. No se modifica app ni se simula relleno. Se pide comprobar disponibilidad de actualización Chrome153 en PlayStore como siguiente diagnóstico manual, sin desinstalar PRE. Seguimiento C16 abierto por hueco Android13; objetivo actualización sin reinstalación ya comprobado, sin inferir calendario automático o Android16 in-place.
C16 PlayStore del segundo móvil ofrece actualizar Chrome, confirmado por usuario. Se solicita realizar esa actualización manual del navegador y mantener PRE cerrada hasta comprobar nueva versión. PRE ya se actualizó y conservó sesión; no se reinstala ni modifica de nuevo. Hipótesis de altura dependiente del host se validará por comparación antes/después, sin prometer que la actualización la corrija.
C16 Chrome actualizado manualmente por usuario: versión instalada155.0.8059.39/lastUpdate15-oct22:23:53, verificada vía ADB. PRE a55 conserva code2/lastUpdate22:16:29/firstInstall15-ago10:10:31; no reinstalación colateral. ReenvíoCDP9224 revalidado. Se pide abrir el mismo icono para comparar geometría nativa y web con Chrome155; resultado de altura todavía pendiente.
C16 comparación Chrome153→155 final: usuario abre misma PRE ya actualizada; medición con Chrome155.0.8059.39 mantiene viewport795.636CSSpx/dpr2.75, standalone=true/safeBottom0. Insets nativos idénticos: status80px, navegación44px desde2356 y mandatory gestures132px desde2268. Captura inicial aún en skeleton no se toma por cargada; captura posterior estable chrome155-stable.png muestra Mis ligas/etiquetaPRE1.15.21 y mismo espacio. Actualizar Chrome no corrige altura. Se mantiene C16 abierto solo por hueco adicional de Android13; negro en XiaomiAndroid16 y actualización sin reinstalación/sesión enAndroid13 están probados. No hay cambio CSS justificado para alcanzar fuera del viewport ni prueba de que una reinstalación cambie ese inset. No se prescribe reinstalar a usuarios. El experimento de actualización utilizó aceleración manual chrome://webapks, no fuerza desde web ni calendario automático completo. Solo documentación/evidencias locales; ninguna publicación nueva ni acción sobre Production.
C16 usuario confirma hueco también en Production y autoriza comparación mediante apertura manual, sin datos escritos. CDP físico en PWA Production: standalone=true, viewport795.636CSSpx/dpr2.75, navegación propia bottom795.636/paddingBottom0, meta width=device-width initial-scale1 viewport-fit=cover, canvas blanco. Insets nativos idénticos a PRE (44px barra/132px mandatory/88px extra). Captura production-gap-readonly.png. Production/main/tag no modificados: geometría persiste en código anterior a cambios PRE y con distinto canvas, reforzando límite de layout nativo compartido, no una regresión de negro fijo. Fuente oficial Chromium Android architecture distingue edge-to-edge nonimmersive standalone bajo WebAppShortEdgesCutoutMode y parámetros por defecto off; no se activa flag. InsetObserver155 descargado, distinción mandatory/bar documentada en fuente pero no atribución concluyente de función exacta que reserva132 en MIUI. No corrección CSS/manifest soportada identificada; solución de control nativo se documenta como opción, sin migración automática ni prometer que TWA reutilizandoChrome elimine inset.
C16 decisión técnica documentada en ANDROID_NATIVE_INSETS_OPTIONS.md: comparación Production/PRE y Chrome153/155 confirma88px fuera del viewport, sin mecanismo web estable identificado para ampliar standalone. Negro nativo y actualización in-place siguen aceptados por evidencia; altura no resuelta. Se documenta conservar PWA con incidencia preparada/no enviada o evaluar Activity/WebView propia (p.ej.Capacitor) con insets controlados y prototipo ficticio en ambos dispositivos antes de cualquier migración. TWA usaChrome y no se promete como arreglo; fullscreen que oculte indicador no aceptado. Se revisan dependencias de autenticación/Push/SSR y server.url de desarrollo, sin proponer migración trivial. No se implementa wrapper, parche CSS, cambio de sistema ni publicación Production; sigue abierto C16.
C16 cierre visual aceptado y publicación Production autorizada explícitamente 2026-10-15: usuario revisa capturas antiguas, confirma franja preexistente y decide dejar aspecto actual, incluida línea dorada. Pide revisar código y subir todo PRE pendiente a prod. Esta instrucción posterior autoriza main/Production para esta entrega, por encima del freeze anterior de AGENTS; tagv1.0.0 y DB permanecen fuera. Revisión origin/main2461429d→staging128bd448 identifica solo33 archivos PWA/diagnóstico/documentación/tests, sin migraciones/dependencias nuevas. PRE/Prod Vercel READY de esos SHAs, comprobados. Candidata1.15.22 desde staging: retirados panel/API/colector temporales, traducciones/tests propios y excepción API de diagnóstico; retirada --app-system-surface sin consumidores CSS, conservando meta/canvas/scheme efectivos. No cambio navbar/colores visuales aceptados, altura, gestos ni funcionalidades de usuario. Historial/docs se preservan, adjuntos/evidencias ignorados no se añaden. Gates/CI y publicación pendientes.
C16 candidata1.15.22 validate aislado completo correcto con lock exacto:935 pruebas/240 archivos, TypeScript, lint0errores/4avisos existentes, build1183313bytes gzip/102chunks, fuentes132246 dentro del límite original132250 y audit0. Se retira también referencia documental a guarda de diagnóstico del generador API; inventario y script quedan idénticos a main. Cambio final de texto se sincroniza a copia y repite api-security+lint específico antes de E2E completo. Solo10 tests unitarios y4 E2E de la herramienta retirada desaparecen, no se reduce cobertura de funcionalidades. Dependabot#22/#23 fuera de PRE no se mezclan. E2E/publicación pendientes.
C16 gates locales finales1.15.22: E2E86/86 correctos con datos ficticios, incluidas visuales/Axe, temas/claro/oscuro, manifest/iconos/CSP y arranque/caché offline; baselines sin cambios. Revisión React (guía vercel:react-best-practices) sin nuevos hooks, dependencias o rutas de datos, bootstrap y runtime conservan contrato; limpieza elimina trabajo/código sin consumidor. APIsecurity96rutas/139métodos y lint específico finales correctos. Se prepara la misma candidata para PR staging y PR main; promoción Production condicionada a CI y PRE verificada, dentro de autorización expresa del usuario.
C16 registro Git: primer intento de add/commit bloqueado por index.lock vacío y antiguo; no produjo commits. Push inicial solo creó rama remota en128bd448, no publicó candidata. Sin procesos Git activos y antigüedad superior a2min se retiró únicamente ese lock; se repite registro verificando cada salida y SHA remoto antes de crear PR.
C16 candidata registrada/push verificado de69b2aa (limpieza78ec0e23 + docs); PR39 staging y PR40 main creadas/adjuntas. CI368/38807938784 completed success, cuatro jobs; PR39 mergeable/head comprobado e integrada en cb86dc76db6c28a4fe103cb01b43b1fa46c81dcc. ls-remote confirma staging; main2461429d y tagv1.0.0e9152940 aún intactos. CI369 para main y despliegue PRE pendientes; no se interpreta preview de rama READY como publicación del alias PRE.
C16 PRE1.15.22 verificada READY dpl_6fiDVFPEcnW5vjWYG2Bu6L9KrBnK/stagingcb86dc76/aliaspre.smashandlob.com. GET autenticados health200/version1.15.22/pre, manifest200 negro e iconos públicos, SWcache1.15.22, HTMLmeta negro, diagnóstico404. CI369/38807942251 también completed success; PR40 mergeable/base main/headde69b2aa comprobado y merge autorizado ejecutado. Producción pendiente de READY y comprobaciones públicas; ninguna migración ni dato real automatizado.
C16 DONE 2026-10-15: publicación autorizada y comprobada. PR40→main9578fe006063108cfcab93956fe23e1eb402f37c, VercelProductiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz READY con SHA/rama/alias smashandlob.com correctos. npm run smoke:prod correcto versión1.15.22/prod, portada y AvatarLab bloqueado. GET públicos manifest200/nombre e iconos Production/negro theme+background, SW200/cache1.15.22, HTML200/meta negro/viewport-fit=cover, diagnóstico404. Árboles origin/main y origin/staging idénticos, tagv1.0.0e9152940 intacto. Limpieza revisada elimina herramientas temporales/código muerto; no cambios DB/dependencias ni diseño adicional. Altura antigua aceptada por usuario, no corregida; evidencia física previa PRE se mantiene, no se afirma nueva prueba física Production ni actualización nativa instantánea/automática. Final docs en rama de entrega, adjuntos privados sin añadir.

## Fase 0 — Auditoría de navegación Mis Competiciones (2026-10-15)

Auditoría estática documentada en `docs/torneos-auditoria-navegacion.md`, sobre HEAD `f5c79b75`. Recomendación: evolucionar `/leagues` como hub conservando rutas, selección y Navbars actuales; torneos futuros con rutas propias y reutilización del render de navegación, contemplando también LeagueEntryGate y bloqueos del shell. Dependencias del acento de liga y alternativa global documentadas, sin cambiar tema. Entrega documental independiente: no reabre C16 ni implementa hitos posteriores. Sin código funcional, DB, migraciones, dependencias, commits ni operaciones remotas. Validación documental: referencias contrastadas con código, rutas citadas comprobadas y `git diff --check`; no se afirma ejecución de pruebas funcionales.

## MC01 — Mis Competiciones: hub existente (2026-10-15, en curso)

Rama local `codex/mis-competiciones` creada desde `f5c79b75`, descendiente de `origin/staging` actualizado por fetch (`cb86dc76`), con código funcional idéntico a staging antes de esta tarea. Auditoría pendiente conservada. `/leagues` se presenta como Mis Competiciones: listado/selección de ligas y acceso transversal Mis Partidos conservados, sección Torneos con aviso sin destino y sección Amistosos con rutas existentes. Rótulos de Inicio, Ajustes, barra personal, mensajes de acceso, búsqueda ES/EN/EU y ayuda/onboarding actualizados; barra personal traduce rótulos y permite envolver el texto largo. Proveedores, reglas de contexto, Navbar de liga, tema, PWA y DB intactos. Prueba existente adaptada al nuevo rótulo. Validaciones pendientes; no se cierra MC01 ni se avanza a las tareas 2/3. Sin commits, push, publicación ni instalación de dependencias.

MC01 checkpoint 2026-10-16: `i18n:check` correcto. Intento inicial de pruebas bloqueado por sandbox (EPERM); reejecución local correcta: 33 pruebas de navegación/contexto/estilo en 8 archivos. `quality:source` FALLA: 132269 líneas frente al límite 132250 (exceso 19); `git diff --check` correcto. Se detiene el avance ante este gate crítico; MC01 sigue incompleto, sin validate/E2E completos ni aceptación visual. No se ha arrancado un servidor nuevo, instalado dependencias, hecho commits ni publicado. Próximo paso: resolver el presupuesto dentro del alcance del hub y repetir validaciones, sin aumentar límites para ocultar el fallo.

MC01 nueva versión solicitada 2026-10-16: presupuesto recuperado al sustituir estadísticas extensas del hub por filas compactas (132202 antes de ampliar). Vistas superiores Resumen/Ligas/Torneos/Amistosos sin nueva Navbar inferior; Resumen limita ligas activas/próximas a dos, Ligas conserva acceso a todas con finalizadas plegadas. Tarjeta personal reutiliza PersonalMatchCard y API existente de historial/amistosos, combinada con encuentros propios del snapshot de ligas, excluyendo espectadores, temporadas upcoming y jornadas no reveladas. Prioridad en curso → próximo fechado → último finalizado; estados de carga/error/vacío y refresco explícito. Torneos sin dominio persistente ni rutas nuevas. Tema/contextos actuales intactos. Se añaden pruebas de selección; validación y revisión visual pendientes, MC01 sigue abierto. No se avanza a torneos ni a otro hito.

MC01 validación reanudada 2026-10-16: copia aislada `.quality-artifacts/mis-competiciones-20261016/app`, sin .env reales, lock idéntico y dependencias exactas existentes (sin instalaciones). Secretos comprobados también en checkout real. Gates estáticos, idiomas, presupuesto (132146 líneas), lint (0 errores/4 avisos previos), TypeScript y 943 pruebas en 242 archivos correctos. Se actualizaron rótulos esperados en verificadores/tests, conservando sus comprobaciones de permisos y destinos. La interrupción alcanzó el build; no consta resultado final, se reanuda ese paso y luego navegador. No se declara validate completo ni MC01 terminado todavía; sin operaciones DB/remotas ni commits.

MC01 build reanudado correcto y presupuesto JS correcto: 1186179 bytes gzip/101 chunks; completa los pasos de validate pendientes tras la interrupción. E2E completo iniciado (90 casos, incluye nuevo hub claro/oscuro en móvil/escritorio), resultado/capturas pendientes. Servidor de desarrollo del checkout levantado en proceso oculto; Next Ready y GET local `/leagues` 200 comprobados. Solo preview manual en puerto3000; automatización usa copia aislada/puerto3100 con fixtures. Dependencias del checkout local siguen en su versión previamente instalada (Next16.3.5), mientras gates usan lock exacto Next16.3.8; no se han instalado paquetes. Sin DB, publicaciones ni commits.

MC01 navegador: primera ejecución 82/90; cuatro diferencias esperadas por rótulo en Inicio/Ajustes y cuatro casos nuevos sin sesión ficticia. Revisadas visualmente las cuatro diferencias (solo texto); baselines actualizados de forma individual. Preparación de sesión/perfil ficticios añadida al nuevo spec. Reejecución completa 90/90 correcta (incluidos Axe y PWA). Revisión manual de capturas detecta contraste insuficiente/transitorio en pestaña activa oscura: se reutiliza `app-accent-surface`, sin tocar CSS global, y se exige color calculado de texto en el spec. Lint focalizado correcto; build y cuatro recorridos finales del hub en marcha antes de cerrar MC01.

MC01 DONE 2026-10-16 — primera versión local lista para revisión del usuario. Gates de validate completados (943 pruebas/242 archivos, tipos, lint y verificadores), build dentro de presupuesto; E2E completo 90/90. Tras el ajuste final de contraste: lint focalizado, nuevo build de Playwright, cuatro recorridos del hub y presupuesto JS correctos (1186179 bytes gzip/101 chunks). Capturas finales revisadas en móvil/escritorio Competition claro/oscuro; texto activo legible, cuatro vistas operativas, sin doble Navbar y retorno desde Mis Partidos correcto. Las cuatro referencias visuales de Inicio/Ajustes actualizadas solo tras revisar las diferencias de rótulo; resto intacto. `git diff --check` correcto. Revisión React: botones nativos, grupo de navegación con aria-pressed, acordeón details, cancelación de fetch/timer, sin proveedores/dependencias nuevos. Evidencias en `.quality-artifacts/mis-competiciones-20261016/` (validate.log, build.log, e2e-final.log, e2e-hub-final.log y capturas en app/test-results). Preview en `http://localhost:3000/leagues`; gates aislados con fixtures, no OAuth real ni datos PRE/Production. La tarjeta usa encuentros de liga visibles y el historial personal cargado (10 recientes), no una consulta exhaustiva nueva; torneos siguen informativos. No se implementan dominio de torneos, tema global ni otros hitos. Sin DB, migraciones, instalaciones, commits, push ni despliegues; main/Production/tag intactos.
## MC14 — en curso (2026-10-19)

La administración principal de la liga va a incorporar un selector de temporada y un acceso directo a la creación de torneos con esa temporada como origen. El buscador de Ajustes tendrá una entrada localizada, visible solo con permisos de administración. Cambios limitados a interfaz y navegación; sin migraciones ni operaciones remotas.

La prueba focalizada del buscador pasó (4/4). `npm run validate` se detuvo en el gate de presupuesto de fuente antes de lint, TypeScript, pruebas generales y build: 134532 líneas frente al máximo de 134500. Siguiendo las instrucciones del hito, no se continuó con los gates posteriores ni se marca como completo; requiere liberar margen de fuente antes de validar el conjunto.

## MC14 — completado (2026-10-19)

Administración de liga > Competición muestra Organizar torneo inmediatamente bajo Administrar temporada y Administrar MVP. Se elige la temporada de origen y el acceso abre el formulario ya existente con liga y temporada preseleccionadas. El buscador de Ajustes incluye entrada traducida y la muestra solo a administradores. Prueba focalizada 4/4; `npm run validate` completo: 1006 pruebas/251 archivos, lint sin errores (4 avisos existentes), TypeScript y build dentro del presupuesto. No se tocaron datos remotos.


MC15 checkpoint (2026-10-19): formulario y API parametrizados para 8–16 jugadores, 1–4 pistas, reservas 60/90/120 y preparación limitada por margen; calendario por duración, comprobaciones de participación/rachas/variedad, cuenta de resultados y campeón dinámicas. La plantilla original de 12 jugadores y 2 pistas se conserva. Nueva migración aditiva supabase/migrations/20261019133236_rapid_tournament_flexible_americana.sql creada con Supabase CLI; no aplicada a ninguna base. Pruebas unitarias de 36 combinaciones y rutas base pasan; falta revisar permisos/validación SQL, actualizar detalles de las pantallas, validar el flujo de creación desde liga y ejecutar todos los gates. quality:source pasa en 134491/134500. Hito sigue IN_PROGRESS; sin PRE/Production, commits ni despliegue.
MC15 checkpoint (2026-10-19): formulario actualizado con valores editables 8–16 jugadores, 1–4 pistas, reservas 60/90/120 y preparación limitada para preservar al menos 2 minutos de margen; origen desde liga completa plazas manuales y sugiere el nombre de la liga, que permanece editable. Añadida nota cuando el número de jugadores limita pistas simultáneas, horarios y validación dinámicos, tabla por participante y cobertura E2E ajustada al comportamiento actual. Migración flexible sigue sin aplicar. Pruebas objetivo y E2E desktop (flujo completo) pasan; npm run validate en curso.
MC15 final (2026-10-19): local implementation and validation complete. npm run validate passed (252 files, 1,011 tests; lint 0 errors/5 existing warnings; typecheck, production build and quality:build passed). Tournament E2E passed 6/6 across mobile/desktop and light/dark, including independent creation and linked-season roster import. Flexible migration is versioned but deliberately not applied remotely; PRE database validation remains pending authorization. No commit or deployment.
## MC28 — servidor local (2026-10-23)

COMPLETADA. Reiniciado exclusivamente next dev de esta carpeta, ahora Next 16.4.3 y escucha en 0.0.0.0:3000. /api/health, /leagues y /match/season-2-round-5-match-1 responden HTTP 200; logs nuevos sin los errores de instrumentation. Sin limpiar datos, modificar código funcional, instalar dependencias ni operaciones remotas. Causa confirmada por recuperación inmediata con el reinicio tras actualizar Next durante MC26; faltó reiniciar el proceso previo antes de entregar las pruebas locales.

Reproducidos HTTP 500 en /leagues y /api/health. Proceso next dev previo a la actualización seguía escuchando en 3000; log muestra routeModule.ensureInstrumentation y ensureInstrumentationRegisteredWithDeferredSpans inexistentes. Se reinicia únicamente el servidor de esta carpeta para cargar Next 16.4.3; validación HTTP pendiente. Sin cambios remotos ni de datos.
### MC52 — presupuesto de componentes cliente

- Ajustado el límite de componentes cliente de 195 a 196 para cubrir el nuevo `DirectionsPicker`, un componente reutilizable compartido por las acciones de navegación.
## MC53 — publicación en PRE y rama de desarrollo de torneos

- Status: PRE READY (2026-10-24)
- PR #55 fusionado en `staging` como `b67df81af4aa63c249feeb53dd845f06fa7acd4e`.
- Vercel deployment `smash-d0mnws415-davidalonsoc4` listo con alias `pre.smashandlob.com`; `/api/health` verificado con `vercel curl` y versión `1.15.34` en entorno `pre`.
- Smoke público directo bloqueado por la protección de Vercel (302); la comprobación autenticada de Vercel fue correcta.
- Rama de trabajo creada desde `origin/staging`: `codex/tournament-development`.

## Torneos integrales — T01 (24/10/2026)

Inventario y plan persistentes en docs/tournaments. T01 completado: corregida validación de nombres canónicos que exigía 12 jugadores al seleccionar cuentas; ahora respeta el tamaño válido elegido. Sesenta pruebas de motores/API/invitaciones/timing/audio, typecheck, lint focalizado y diff correctos. Auto-Resume activo, watcher ejecutando la recuperación exacta; compatibilidad estructural, sin prometer continuación de objetivos. Primer hito incompleto T02. Sin datos remotos, migraciones ni despliegue.

## Torneos integrales — T02 checkpoint (24/10/2026)

Contratos de configuración y puntuación compartidos integrados en rutas/rankings legacy; adaptador de configuración en UI y comprobación de integridad simultánea de pistas/jugadores. 114 pruebas focalizadas, tipos/lint/i18n correctos. Validate completo y E2E en curso; T02 sigue abierto. Presupuesto fuente +150 líneas para nuevos módulos puros, sin nuevos clientes. Sin cambios de DB ni operaciones remotas.

## Torneos integrales — T02 cerrado (24/10/2026)

Validate completo PASS: 267 archivos/1156 pruebas, typecheck/build/presupuesto correctos; lint 0 errores y 5 avisos previos. E2E torneos 8/8 móvil/escritorio claro/oscuro con Axe. Nuevo primer hito incompleto T03. Contratos integrados sin activar opciones aún incompatibles con SQL; no hay migraciones nuevas ni despliegue.

## Torneos integrales — T03 checkpoint (24/10/2026)

Duplicación independiente sobre el formulario actual y POST existente, protegida por creador; participantes y cuentas conservados sin copiar resultados/progreso. 22 tests pasan; tipos, lint e i18n correctos, E2E móvil claro/oscuro en curso. Sin migración ni operaciones remotas. Hito T03 sigue abierto.

## Torneos integrales — T03 duplicación validada (24/10/2026)

23 pruebas unitarias/API y dos E2E móviles claro/oscuro PASS, tipos/lint/i18n correctos. Copia independiente mediante formulario existente con original intacto. Limitación SQL detectada: cuentas vinculadas solo por invitación necesitan extensión futura, no se amplían permisos ficticiamente en TS. T03 permanece abierto; siguiente paso persistencia/configuración ampliada y pruebas de DB aisladas.

## Torneos integrales — T03 SQL/configuración (24/10/2026)

PostgreSQL portátil 17.11 con checksum verificado, clúster local aislado. Migración nueva creada por CLI (no remota) para 4–24 jugadores, tiempos/rondas, identidad y creación/sorteo atómicos. Once migraciones de torneos y tests reales de transacciones/roles/copias/sorteo pasan con fixtures mínimos. Formulario ampliado y algoritmos compatibles en desarrollo; 53 tests pasan, i18n correcto. Fallo de tipos de allPassed detectado y corregido, repetición pendiente; no se cierra T03 ni se publica. Ver docs/tournaments/STATUS para reanudar.

### T03 — origen integrado

TypeScript PASS confirmado. Importación automática hasta 24 y selector de temporada autorizado integrados; consultas cancelables. DB aislada PASS para procedencia/snapshot y permisos, 53 tests/i18n correctos. Inventario de API actualizado tras detectar desfase, check PASS (111 rutas/156 métodos). E2E de configuración ampliada en curso; T03 abierto, sin operaciones remotas.

T03: E2E ampliado 10/10 PASS y SQL repetido PASS, incluidos resultados/correcciones y aislamiento. Avisos de voz ajustados a tiempos configurados tras encontrar textos fijos. 22 tests de timing/audio y 54 de API/configuración PASS. E2E final añade logo/crop/acento y validate completo sigue en curso; no se cierra todavía el hito.

### T03 cerrado localmente

Validate PASS (270 archivos/1192 tests; tipos/build/presupuestos, lint 0 errores y cinco warnings previos), E2E 10/10 más repetición móvil del happy path y logo/crop/acento correctos. SQL dedicado PASS con 11 migraciones, seis tablas con RLS y roles reales aislados. Captura de resumen móvil revisada. Sin operaciones remotas; migración nueva pendiente fuera del clúster de prueba. Primer hito incompleto T04, parejas fijas con creación/engine/ranking integrados antes de desbloquear controles. Objetivo integral sigue activo.

### T04 — motor fijo inicial

Motor puro de Americana/Mexicano por parejas fijas y ranking de equipo sobre cálculos compartidos; 41 tests con regresiones PASS. Corregido desbordamiento de conversión de porcentajes en torneos largos sin alterar comparación exacta. Aún sin UI/SQL, controles bloqueados, T04 abierto. Tipos/lint/pruebas complementarias en curso. Sin operaciones remotas.

Checkpoint T04 confirmado: typecheck/lint PASS y 90 tests complementarios PASS. Contrato conserva campos opcionales de partidos legacy tras detectar y resolver incompatibilidad de tipos. Próxima acción: persistencia e integración fija; no cerrar T04 todavía.

### T04 — parejas fijas conectadas, verificación en curso

Nueva migración aditiva pairing/pair_number y RPC protegida sobre validación común; doce migraciones y pruebas PostgreSQL locales PASS (pares, cruces, bloqueo, idempotencia y permisos). Formulario/API/copia/ranking conectados; 57 tests focalizados, i18n y lint PASS. Faltan E2E fijo y gates completos, T04 abierto, sin cambios remotos. Ver docs/tournaments/STATUS para continuar tras interrupción.

T04 integración: 69 tests focalizados, SQL de doce migraciones y E2E móvil 9/9 PASS. Validate completo PASS (271 archivos/1223 tests, tipos/lint/build/presupuestos; cinco warnings previos). Transición cero sin avisos duplicados y marcador vacío rechazado. Repetición final fija móvil/escritorio en curso. T04 sigue abierto para terminar verificación y descansos configurables, sin retirar alcance ni operaciones remotas.

Repetición final T04 fija 8/8 PASS en móvil/escritorio y claro/oscuro, con los seis resultados, clasificación por equipos, campeón y copia. Guardar checkpoint y continuar T04 por descansos configurables; no pasar aún a tradicionales ni declarar terminado el módulo.

### T04 — descanso general adicional

Duración/frecuencia editables conectadas a planificación, reserva, horarios, copia, API y seguimiento/audio. Nueva migración aditiva, 13 migraciones SQL aisladas PASS, 55 tests de planificación/timing y 58 de API/copia PASS, i18n/fuente/tipos correctos. E2E de pausa real y validate completo en curso; T04 abierto, sin cambios remotos. Ver terminales/logs en docs/tournaments/STATUS.

Descansos T04: validate PASS 272 archivos/1235 tests, móvil mixto 9/9 y matriz fija con pausas móvil/escritorio 8/8 PASS; trece migraciones SQL verificadas. Resumen ahora cambia de ronda en los límites horarios, con pausa de tareas al ocultarse. Última comprobación de resumen/preview y tipos en curso antes de cerrar hito. Sin PRE/PROD ni datos personales.

### T04 cerrado localmente

Última comprobación de resumen/pausa 4/4 móvil PASS, tipos/lint y 24 tests focalizados correctos; se precisó el selector de Seguimiento al existir acceso de tarjeta y navbar. Validate de descansos 1235 tests, SQL de trece migraciones y E2E 9/9 más 8/8 correctos. Americana/Mexicano × parejas fijas/rotativas integrados con configuración y pausas, sin datos remotos. Primer hito incompleto T05; el objetivo integral continúa por tradicionales, sin declarar terminadas las reglas/roles/economía/integración global pendientes.

### T05 — motores tradicionales, primer checkpoint

Cuadros, grupos y mixto puros hasta 24 jugadores por parejas fijas, semillas/byes/manual, tercer puesto/consolación y calendarios manuales/automáticos. Protege resultados ya disputados y empates ambiguos de clasificación. 122 tests focalizados, tipos/lint/fuente PASS; matriz mixta ampliada en curso. Presupuesto fuente +450 para dos módulos nuevos, sin clientes/dependencias. Sin migración/API/UI todavía; opciones siguen bloqueadas, T05 permanece abierto. Próximo paso y decisiones en docs/tournaments/STATUS.md. Sin PRE/PROD.

T05 persistencia parcial: 194 pruebas de motores/regresiones PASS; PostgreSQL aislado 14 migraciones PASS con tres tradicionales completos, byes, grupo de 24 jugadores, revisión concurrente y permisos/rollback/correcciones protegidos. Nueva migración aditiva solo local; identidad, roster, fuentes e invitaciones compartidas. Sin API/UI integrada todavía, no cerrar T05 ni anunciar disponible. Estado y siguiente acción detallados en docs/tournaments/STATUS.md.

T05 API parcial: creación/lectura común y PATCH tradicional con revisión, motor canónico, autoría y validación de resultados/calendario/empates; 211 tests/5 archivos, tipos/lint focalizado e inventario/fuente PASS. Validate completo en curso (terminal/log en docs/tournaments/STATUS). Sin formulario/vistas tradicionales visibles ni E2E aún, hito abierto. Sin operaciones remotas.

Backend T05 validate confirmado: 1398 tests/276 archivos PASS, tipos/lint/build/presupuestos correctos; tres tests adicionales de lectura/privacidad PASS. E2E rápidos móvil en curso, detalles en STATUS de torneos. Se conserva el presupuesto fuente anterior (136439/136450); no nuevas dependencias/clientes. T05 no cerrado y sin PRE/PROD.

E2E backend T05: regresiones rápidas móvil 9/9 PASS y último typecheck PASS. Auto-Resume sigue habilitado con watcher y cero pendientes. Guardar checkpoint y continuar T05 por formulario/presentación/E2E tradicionales; todavía no disponible en UI ni completo. Sin cambios remotos.

T05 presentación, parcial: extraída tarjeta/editor de resultados a componente compartido con endpoint legacy intacto y callback tradicional. 15 pruebas focalizadas (seis nuevas de interacción), lint/i18n/fuente PASS; tipos y regresión E2E móvil en curso, terminales en STATUS de torneos. Sin activar tradicionales todavía ni tocar otras pantallas. Presupuesto +50 por interfaz de presentación compartida, no nuevos clientes/dependencias.

Editor T05 confirmado: tipos PASS y E2E fijo móvil 4/4 PASS tras extracción, Americana/Mexicano claro/oscuro hasta campeón/copia. Guardar commit de presentación reutilizable y continuar formulario/vistas tradicionales; T05 abierto, sin pendientes de validación en este checkpoint ni operaciones remotas.

T05 interfaz integrada en desarrollo: formulario común habilita eliminación/grupos/mixto con opciones reales y preview; cinco rutas muestran cuadros/grupos/partidos y resultados con componentes existentes. Copia y ajustes adaptados; sin navbar/tema global nuevos. Lint/i18n/fuente PASS tras reparar dependencia mutable y añadir traducciones; tipos y pruebas del recorrido pendientes. No declarar terminado ni publicar antes de E2E/SQL/gates completos. Detalle y siguiente paso en docs/tournaments/STATUS.md.

T05 checkpoint final: E2E rápidos/tradicionales móvil/escritorio **44/44 PASS**, incluyendo los tres recorridos completos, permisos de participante, empates/correcciones, manual/calendario y Axe. PostgreSQL aislado de 14 migraciones PASS con roundtrip de motores reales. Validate completo secuencial en curso (13524); después regresiones de ligas/amistosos/hub. No cerrar antes de confirmar ni publicar en remoto. Estado reanudable en docs/tournaments/STATUS.md.

T05 validate final confirmado PASS: **279 archivos / 1411 tests**, TypeScript/build/i18n/fuente correctos, lint sin errores/cinco avisos previos, 1242275 bytes gzip/103 chunks. Regresiones focalizadas de ligas/amistosos/hub en curso (97540); después guardar commits y cierre del hito si pasan. Sin operaciones remotas.

**T05 completo localmente:** regresiones ligas/amistosos/hub **9/9 PASS**, salida 0; matriz rápidos/tradicionales **44/44 PASS**, validate **1411 tests PASS**, SQL aislado de catorce migraciones PASS y capturas móviles revisadas. Guardar interfaz/checkpoint local, sin PRE/PROD ni datos reales modificados. Primer hito incompleto T06; el objetivo integral sigue pendiente por gestión/reglas, integración, economía y validación final. La última petición deja este hito listo para pruebas; migraciones y publicación de PRE requieren la autorización explícita prevista en GOAL/AGENTS.

### T05 — autorización de base PRE y prueba local

El usuario autoriza Supabase PRE y excluye expresamente publicar código en PRE. Proyecto `smash-lob-staging` / `miadjotkucgluwbrgeih` verificado frente a enlace CLI y configuración local. Cuatro migraciones versionadas aplicadas con CLI existente, dry-run antes/después e historial SQL correctos; cero pendientes. Checksums de datos existentes idénticos (5 torneos/56 participantes/30 rondas/60 partidos), RLS/grants/RPC protegidos y advisor sin WARN/ERROR. Probe REST de nuevas columnas/tablas con limit=0 HTTP 200, acceso anónimo tradicional 401, health local 200. Sin código desplegado, sin push de rama ni cambios en Producción. Guía y evidencia en docs/tournaments/STATUS y VALIDATION. Primer hito incompleto T06, no iniciado en esta operación.

Nuevo hito primero T05b por petición expresa: ampliar ligas y modalidades de torneo hasta32 jugadores totales/16 parejas, antes de T06. Auditados límites y starters; motores/slots/plantillas se validan antes de habilitar UI o aplicar migración aditiva en PRE. Código exclusivamente local, Producción excluida. Estado reanudable en docs/tournaments/STATUS.

T05b integración en curso: ligas25–32 con starters y techos de vueltas verificados, torneos32/16 parejas, slots/copia/origen y nueva migración local aditiva para grupos8/grafo120. 430 pruebas iniciales y 257 posteriores PASS tras ajustar límites/rendimiento Mexicano; tipos/lint/i18n/fuente PASS. SQL15 migraciones y grupo120 resultados PASS; repetición ampliada SQL y E2E64 casos en curso, logs/terminales en STATUS de torneos. No publicar ni aplicar PRE antes de confirmar gates. No hay cambios remotos de este hito todavía.

T05b SQL final **15 migraciones PASS**, tipos correctos y dos tests de paginación de1488 partidos PASS. E2E64 inicial60PASS/4 fallos de fixtures/aserciones corregidos (espera de siguiente ronda y minutos variables10–20); repetición30 casos en curso (93799), ya selector32/resumen móvil correctos. Añadida paginación autorizada de snapshot para no truncar temporadas largas, sin permisos nuevos. Pendiente validate completo y cierre local antes de migración PRE. Estado/evidencia en STATUS de torneos; ningún cambio remoto de este hito aún.

T05b navegador final: 28/30 en repetición, incluidos resumen32/selector32/regresiones, más repetición Mexicano32 **4/4 PASS** tras diagnosticar el clic de escritorio contra el borde de navbar y centrar/verificar geométricamente el control en el test. Todos los casos iniciales y repeticiones resueltos; SQL15 migraciones PASS. Validate completo secuencial en curso51947 (`capacity-32-validate.log`), no aplicar migración PRE hasta confirmar. Sin cambios remotos T05b ni publicación de código.

**T05b completo:** validate **281 archivos/1570 tests PASS**, tipos/lint/build/presupuestos correctos; SQL15 migraciones y E2E con repeticiones resueltas, sin fallos pendientes. Migración32 aplicada en SupabasePRE autorizado, historial/constraints/RPC/dry-run posterior verificados. Checksums de5 torneos/56 participantes/30 rondas/60 partidos idénticos, advisor sin WARN/ERROR, RESTlimit0 200/anónimo401 y healthlocal200. Código exclusivamente local; ningún push/despliegue ni cambio enProducción. Guardar commits por dominio; primer hito incompletoT06, siguiente desarrollo pendiente de retomar tras esta entrega para pruebas. Ver docs/tournaments/VALIDATION y STATUS.


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

## MC54 — Mis ligas sin selección destacada (25/10/2026)

Petición visual acotada antes de T06. Retirados Actual y el reborde de selección de la tarjeta del listado completo; todas las ligas tienen el mismo tratamiento. Estado de temporada conservado, usando En curso en vez de Activa. Sin cambios en selección al entrar, permisos, navegación ni resumen de Competiciones. Rediseño pendiente de propuesta al usuario, no aplicado. Validación confirmada: diez pruebas existentes de competiciones/navegación PASS, ESLint focalizado PASS, TypeScript PASS e i18n PASS. Sin operaciones remotas. El primer hito incompleto general vuelve a T06; no iniciado durante esta petición visual.

## MC55 — Identidad visual de Mis ligas (25/10/2026)

Nueva petición acotada anterior a T06. Tarjetas con degradado lateral estrecho del acento propio, nombre/logo destacados, temporada y modalidad, descripción conservada, estadísticas sin subpaneles y progreso por resultados registrados. Roles discretos y estados sin borde ni mayúsculas mediante el estilo suave compartido con partidos; próxima temporada mantiene cuenta atrás. Retirado título duplicado, navegación y permisos preservados. Resumen compacto conserva su diseño. Validación pendiente: pruebas existentes, tipos/lint/i18n/presupuesto y navegador 320/393px, claro/oscuro, Clásico/Competition y Axe. Sin operaciones remotas.

MC55 checkpoint: 23 pruebas existentes de competiciones/navegación/estados/previews PASS, tipos y lint focalizado PASS, i18n PASS, fuente137486/137550 PASS. Estilo suave extraído a constante compartida y regla documentada en docs/ui-style-guide.md. Matriz E2E ocho recorridos móvil/escritorio × claro/oscuro × Clásico/Competition en curso, con comprobación de tema real, anchos320/393 y Axe; log .quality-artifacts/mc55-league-cards-e2e.log. No cerrar antes de verificar salida y capturas.

MC55 COMPLETO LOCAL: E2E8/8 PASS y salida0, móvil/escritorio × claro/oscuro × Clásico/Competition, con tema real verificado, anchos320/393 sin desbordamiento, etiquetas sin borde/mayúsculas, un solo título, Axe sin incidencias graves y navegación completa hasta perfiles/liga. Build de Playwright PASS. Capturas móviles claro Clásico y oscuro Competition revisadas visualmente; degradado estrecho antes del logo, jerarquía/estadísticas/progreso legibles. 23 pruebas focalizadas, TypeScript, ESLint e i18n PASS; presupuesto fuente137486/137550 PASS. Evidencia .quality-artifacts/mc55-league-cards-e2e.log y test-results/competitions-hub-*/league-list-*.png. Sin migraciones, operaciones remotas ni despliegues. Primer hito general pendiente T06; no iniciado.

## MC56 — Degradado solo en Competiciones (25/10/2026)

Retirada la clase que genera el degradado lateral únicamente en el listado completo Mis ligas. El resumen de Competiciones conserva el degradado aprobado; progreso, estadísticas, estados y navegación intactos. Validación: diez pruebas existentes PASS y ESLint focalizado PASS. Guía de estilos actualizada. Sin operaciones remotas; primer hito general pendiente T06.

## MC57 — Prueba de marco de color del logo (25/10/2026)

Prueba visual solicitada: Mis ligas muestra un contorno de2px del acento propio separado3px del logo, suavizado en oscuro y sin cambiar dimensiones. Reutiliza className de LeagueLogo; resumen de Competiciones intacto. Validación confirmada: diez pruebas existentes PASS, ESLint focalizado PASS y navegador móvil claro/oscuro2/2 PASS, con build,320/393px y Axe. Capturas revisadas: marco separado, sin degradado en Mis ligas y dimensiones conservadas. Log .quality-artifacts/mc57-logo-border-e2e.log. Sin operaciones remotas; diseño pendiente de valoración del usuario. Primer hito general pendiente T06.

## MC58 — Centrado vertical de cabeceras Competition (25/10/2026)

Hallazgo: padding-top global .5rem!important gana a los paddings de Competition (.75rem debajo, .85rem en Home), desplazando el contenido unos2px hacia arriba. Regla compartida simétrica .625rem arriba/abajo mantiene la altura compacta habitual. Alcance: Competiciones, Mis ligas/torneos, partidos/calendario/ranking/estadísticas/perfiles/ajustes/notificaciones/ayuda y creación de torneos. Clásico intacto; chats inmersivos excluidos para conservar safe area. Validación de geometría y regresiones en curso. Sin operaciones remotas.

MC58 checkpoint:29 pruebas focalizadas PASS, tipografía y ESLint PASS. Primer E2E4/4 PASS:17 rutas por tema y chats con inset24px simulado; capturas de Competiciones revisadas y título centrado. Detectado que la prueba de320/393px mantenía ancho móvil en las rutas posteriores del proyecto escritorio: restaurado viewport tras captura. Repetir matriz con ancho de escritorio real y regresiones Clásico antes de cerrar. Sin fallos funcionales ni operaciones remotas.

MC58 COMPLETO LOCAL: repetición final8/8 PASS, salida0 y buildPASS, con17 pantallas en claro/oscuro y móvil/escritorio real; Clásico conserva sus recorridos previos. Competiciones/Mis ligas medidos a320/393px: centro de título a menos de0.5px del centro del panel y sin desbordamiento. Home/Calendario/Ranking/Estadísticas/perfiles/Mis partidos/chats globales/Ajustes/Temas/Notificaciones/Ayuda/torneos-listado-y-creación con paddings simétricos. Chat de partido conserva inset seguro simulado24px y padding-top mínimo32px, sin modificar su geometría. Capturas móviles de Competiciones/Mis ligas revisadas. 29 pruebas focalizadas, tipografía y lint PASS. Logs .quality-artifacts/mc58-header-alignment-verified.log; guía de estilos actualizada. Sin cambios remotos. Primer hito general pendiente T06, no iniciado durante esta corrección.

## MC59 — Borde superior de color (25/10/2026)

Prueba solicitada: eliminado el marco del logo y sustituido por borde superior2px del acento propio, adaptado a claro/oscuro, manteniendo el resto del borde neutro. No cambia el resumen compacto ni datos/navegación/estados/progreso. Se elimina CSS del marco anterior. Validación confirmada: diez pruebas existentes PASS, ESLint focalizado PASS, build y navegador móvil claro/oscuro2/2 PASS,320/393px y Axe. Capturas revisadas: borde superior fino, laterales neutros y logo sin marco; resumen conservado. Log .quality-artifacts/mc59-league-top-border-e2e.log. Sin operaciones remotas; diseño pendiente de valoración del usuario. Primer hito general pendiente T06.

MC59 diseño aprobado expresamente por el usuario: conservar borde superior2px del color de liga, laterales neutros y logo sin marco. Registrado como referencia en docs/ui-style-guide.md. Sin cambios funcionales adicionales, nuevas pruebas necesarias ni operaciones remotas.

## MC60 — Creación global y calendario (25/10/2026)

Hallazgos: AppShell no incluía /league/new entre rutas globales permitidas por la cuenta atrás, y Mis ligas/buscador supeditaban crear liga a permisos sobre la última seleccionada. Ruta de creación excluida del bloqueo de temporada y acceso dependiente solo de canCreateLeagues (permiso global ya validado por API). No se elimina el contexto necesario al entrar en una liga ni la privacidad de temporadas programadas. Calendario: icono de jornada activa centrado con flex sobre título+selector de temporada, manteniendo scroll y condiciones de visibilidad. Regresiones y validación en curso; sin cambios remotos.

MC60 checkpoint:40 pruebas de navegación, calendario, temporadas, ayuda y API de ligas PASS; TypeScript, ESLint focalizado, tipografía, i18n y presupuesto fuente137488/137550 PASS. Regresión añadida: creator global sin permisos administrativos sobre la última liga conserva acceso; sin creator no aparece creación. E2E con cuenta atrás, ruta directa/recarga/creación y geometría/scroll en ambos estilos en curso. Sin operaciones remotas.

MC60 COMPLETO LOCAL:12/12 E2E PASS, salida0 y buildPASS. Creator global que es solo jugador en la liga programada puede entrar desde Mis ligas, recargar /league/new, crear otra liga y pasar a su configuración; el ranking de la liga original sigue bloqueado. Cuenta sin creator no ve crear y la ruta directa conserva denegación explícita. Calendario claro/oscuro × Clásico/Competition en ambos proyectos: icono/centro de su bloque y SVG a menos de0.5px,320/393px sin desbordamiento y scroll a jornada activa correcto. Captura móvil Competition oscuro revisada. 40 pruebas focalizadas, TypeScript, lint, tipografía, i18n y presupuesto137488/137550 PASS. Evidencia .quality-artifacts/mc60-creation-calendar-e2e.log. No cambios de API/RLS/base de datos ni operaciones remotas. Primer hito general pendiente T06.

## MC61 — Plantillas por parejas e inscripción (25/10/2026)

Petición anterior a T06. Auditoría acotada: editor de parejas separado al final de NewSeasonForm; self_registration bloqueado en UI y API; trigger exige pair_number aun en borrador y lo hace inmutable. Reutilizar pair_number sin tabla nueva: pendiente=null solo para autoinscripción upcoming; quien se inscribe elige compañero disponible o aún no registrado. Asignación atómica: elegir a un pendiente forma pareja para ambos; parejas completas no aparecen disponibles, conflicto concurrente revierte inscripción. Organización puede revisar/corregir antes de comenzar mediante endpoint admin y RPC con bloqueo/versión de plantilla, invalidando solo calendario sin resultados. Sin parejas completas no se prepara ni inicia calendario. Reutilizar editor de parejas en creación y sala de espera; inscripción individual conserva su RPC/flujo. Cancelar creación se mueve de Ubicaciones al pie, conservando confirmación. Necesaria migración aditiva de funciones/triggers, sin tocar migraciones aplicadas. Lectura de skill Supabase, changelog y RLS actual completada (web markdown no compatible, fetch directo HTTP200). Estado en curso, ningún cambio funcional ni remoto todavía.

MC61 checkpoint: interfaz/servidor integrados; editor reutilizado en creación y revisión, elección de compañero compartida con invitación y sala de espera. Tipos y lint sin errores (cuatro avisos previos). Primera validación detectó expectativa antigua que prohibía autoinscripción y columna ausente en fixture SQL de inicio; corregidos ambos, regresiones focalizadas repetidas. Fuente137724 supera el techo anterior137550 por nuevo flujo y dos componentes compartidos pequeños; presupuesto ampliado250 líneas a137800, manteniendo196 clientes y sin dependencias. No cerrar hasta SQL/E2E/validate. Ningún cambio remoto.

MC61 validación:17 pruebas nuevas de API/componentes y33 regresiones de parejas PASS. PostgreSQL aislado repetido PASS:4/6/8/10/32, retirada y nueva vinculación, conflicto concurrente con rollback completo, edición obsoleta, protección de calendario disputado, inicio y permisos service-only/RLS. Home conserva sala de espera con cupo lleno si faltan parejas. E2E integrado añadido con identidades ficticias, pendiente de completar; se corrigieron campos obligatorios ausentes en su fixture durante compilación. Suite completa en curso. Sin cambios remotos.

MC61 checkpoint verificado:TypeScript y1.622 pruebas unitarias/integración PASS.8/8 E2E nuevos PASS móvil/escritorio × claro/oscuro,320/393px sin overflow y Axe sin incidencias graves/críticas. Nombres agrupados, inscripción por invitación, pendientes visibles con cupo lleno, vinculación posterior, revisión, recálculo y comienzo comprobados. Capturas revisadas. Validate completo y18 regresiones anteriores por vueltas/manual en curso. Conexión local/proyecto vinculado confirmados PRE miadjotkucgluwbrgeih; migración nueva aún sin aplicar.

MC61 regresiones:18/18 E2E anteriores PASS móvil/escritorio × claro/oscuro, vueltas simple/doble, personalizado/manual, resultados y clasificación persistida.8/8 del flujo nuevo PASS;26 recorridos totales. npm run validate ha pasado controles estáticos, seguridad, i18n, presupuesto, lint sin errores y tipos; suite completa/build en curso. Dry-run PRE confirma exclusivamente20261025092147_fixed_pair_self_registration.sql pendiente. Sin cambios remotos todavía.

MC61 COMPLETO LOCAL + DB PRE: npm run validate salida0 (1.622 pruebas/286 archivos, tipos, lint sin errores y5 avisos previos, seguridad/i18n/fuente y build1.255.355 bytes gzip/103 chunks).26/26 E2E PASS, Axe y móvil320/393px correctos. PostgreSQL aislado PASS. Migración20261025092147_fixed_pair_self_registration.sql aplicada exclusivamente en miadjotkucgluwbrgeih, historial/funciones/ACL verificados: SECURITY INVOKER, search_path fijado, anon/authenticated sin EXECUTE, service_role autorizado. Dry-run posterior sin pendientes. Conteos y checksums de ligas, temporadas, plantilla, partidos y torneos idénticos antes/después (.quality-artifacts/mc61-pre-integrity.json); ningún dato reescrito. Asesores sin WARN/ERROR nuevos;45 INFO previos RLS sin policies corresponden al acceso exclusivamente servidor ya existente. Ninguna subida de código, commit ni operación en Production/main/v1.0.0. OAuth real y prueba humana quedan para comprobación local del usuario, no realizados con cuentas personales en automatización. Primer hito general pendiente T06, sin ampliar esta petición.

## MC62 — Calendario, Partido, actividad y chats (25/10/2026)

Ocho peticiones nuevas previas a T06; alcance y gates al inicio de PLAN. Auto-Resume skill leída y get_status confirma enabled/watch_running, sin pendientes. Recupera límites de uso y fallos temporales; checkpoints para contexto. Hallazgos iniciales: etiqueta upcoming se oculta solo con ventana fechada; emparejamiento gap6/8 y sin borde; recomendaciones solo ranking; Actividad excluye scheduling y temporadas upcoming; chats globales consideran activos todos los no fechados aunque de jornadas lejanas; Competition remapea bg-white a raised gris. Corregir reutilizando datos/permisos/tokens existentes, no ampliar a estadísticas incompatibles ni modificar datos. Estado en curso.

MC62 checkpoint: sin Próxima/Completada en cabeceras de jornadas con o sin fechas; parejas con borde y gap12px; recomendaciones comparan historial de ligas disponible por identidad registrada (victorias/juegos, ranking solo desempate; sin historial no desplaza). Reutiliza calculateSeasonRanking y confirmaciones. Actividad admite scheduling y ventanas de jornada sin inventar reservas, oculta parejas de próximas/progresivas incluso para admin y muestra aviso de fechas públicas. Chats globales búsqueda/competición/mensajes/sin leer, proximidad máximo jornada actual+2, ligas por color suave. Hero usa alto restante y explica bloqueo. Estilos compartidos de acciones y paneles blancos claros en curso de validación. TypeScript e i18n PASS; pruebas/regresiones y móvil pendientes; sin operaciones remotas.

MC62 validación inicial:47 pruebas focalizadas PASS, TypeScript/i18n/lint focalizado PASS. Presupuesto fuente137872 supera137800 en72 líneas por nuevas reglas puras de actividad/chats; techo ampliado200 a138000 (sin dependencias ni clientes nuevos), con gates completos y E2E pendientes. Auto-Resume ha reanudado la interrupción por límite de uso; continuar desde este punto, no repetir MC61.

MC62 móvil: Calendario/Partido4/4 PASS en320/393px, ambos estilos/temas, Axe y geometría. Actividad/privacidad/chats pasan recorrido; Clásico sin scroll sobrante. Detectado min-height antiguo Competition!important con mayor especificidad que la regla nueva: sobraban10px reales en hero del jugador. Corregida especificidad conservando scroll natural si hay contenido, repetir Competition y cierre completo. Fixture ahora distingue admin con contenido de jugador bloqueado; color de prueba normalizado por mayúsculas. Sin operaciones remotas.

MC62 verificación: npm run validate PASS (1.631 pruebas/288 archivos, tipos, lint0errores/5avisos previos, i18n/seguridad/presupuestos y build).26/26 E2E finales PASS: móvil/escritorio, Clásico/Competition × claro/oscuro,320/393px, Axe, programación/pagos/resultados, ayuda, estados, actividad privada, búsquedas y filtros. Capturas de Partido/Chats/cuenta atrás revisadas. Refuerzo final: un partido fechado ya vencido no vuelve a ser próximo por tener ventana; placeholder oculto no promete jugar en una posible jornada de descanso.49 pruebas focalizadas finales PASS y última compilación en curso tras estos ajustes y conservación de superficies explícitas de texto blanco. Sin operaciones remotas.

MC62 CERRADO LOCAL: última compilación y presupuesto PASS; lint focalizado sin errores,49 pruebas finales y26 E2E correctos, validate completo previamente PASS. Conservados datos, rutas/permisos, ligas individuales/parejas, amistosos, temas y navegación. Recomendaciones usan historial de ligas disponible y cuentas vinculadas por userId; no infieren identidad por nombre ni mezclan puntuaciones incompatibles de torneos. Creación y cambios MC61 conservados, sin commits ni despliegues ni modificaciones remotas. T06 continúa como primer hito general pendiente; no iniciado en esta petición.

## MC63 — Preparación de PRE v1.15.35 (25/10/2026)
Usuario autoriza publicar todos los cambios pendientes. Rama codex/tournament-development parte de origin/staging b67df81a (25 commits de avance, sin divergencia). Proyecto Vercel smash-lob/prj_KKbbsbzdVsZQNvNfU1ZNvAbqwPvM, team_9FDFsuGEGKGlPlHG4Aa2xRwz y alias PRE confirmados: deployment dpl_DhJcYbRHix68odXUuubdZrRjwh4Z READY/preview en staging. Main9578fe00 y tagv1.0.0e9152940 conservados. Versión/cache/changelog actualizados a1.15.35; ejecución de release:check antes de integrar staging.

MC63 checkpoint: candidata f4065847 subida y SHA remoto verificado; PR56 draft hacia staging creada/adjunta. CI412/40202862776 supera código/build, Lighthouse y migraciones/pgTAP/restore. Validate local PASS1632 pruebas/288archivos; navegador completo en curso. Dos referencias visuales móviles muestran cambios solicitados de estados/espaciado de calendario y botones negros en claro; revisadas antes de actualizarlas. Prueba antigua de último encuentro adapta el desplazamiento a la nueva tarjeta de jornada sin reserva. No integrar staging hasta cerrar navegador. Catálogo PRE confirma las siete migraciones nuevas hasta20261025092147, sin cambios de datos en esta publicación.

MC63 referencias: revisadas también las diferencias de escritorio; se actualizan únicamente las cuatro capturas de Calendario/Administrar temporada afectadas por los cambios solicitados. Se conserva el resto de referencias y tolerancias. Ajuste de la prueba de último encuentro espera el historial y cambia de tarjeta cuando existe una jornada pendiente; no modifica código funcional. Nueva CI requerida antes del merge.

MC63 gates locales: validate PASS1632/288, build/presupuestos, TypeScript y lint0errores/5avisos previos; primera E2E235PASS/1skip y seis fallos de referencias/expectativa antigua. Revisión de cuatro capturas y prueba contextual completada; repetición focalizada6/6PASS en móvil/escritorio. npm audit --omit=dev --audit-level=high:0vulnerabilidades. Candidata425170781826dab4a1f282405db9af2a45a30837 y push verificados; CI413/40203846108 con código/build, Lighthouse y migraciones/pgTAP/restore PASS, navegador completo en curso. No merge hasta resultado completo.

MC63 integración: CI413/40203846108 completa SUCCESS en los cuatro jobs,1632 pruebas unitarias/integración y241 E2E PASS/1skip previsto, sin flaky. PR56 ready e integrada con expected_head_sha42517078; stagingd41f0eafcc638a7c0b496e957e7edbf2ef256c0c verificado remoto y árbol idéntico a la candidata. Main9578fe00/tagv1.0.0e9152940 intactos. Pendiente verificar Vercel READY, aliasPRE, health/PWA y rutas.

MC63 COMPLETO PRE: versión1.15.35 en stagingd41f0eafcc638a7c0b496e957e7edbf2ef256c0c, deploymentdpl_FC2eWiexo5QiqXtJPQQjkJ1em8Y7 READY/preview y aliaspre.smashandlob.com confirmados sobre esa SHA. Verificación remota autenticada de Vercel completa exit0: health200/version1.15.35/environmentpre, SWcache1.15.35, manifiestoPRE y portada/Competiciones/Mis ligas/Torneos/creación/Mis partidos/Chats/AvatarLab200. API torneos y API AvatarLab401 sin sesión. Sin desactivar protección ni usar cuentas personales o datos PRE en automatización. Migraciones ya verificadas, sin operaciones de datos esta entrega. Main9578fe00/tagv1.0.0e9152940 y Productiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz idénticos al inicio. Evidencia .quality-artifacts/mc63-*: release-check inicial, browser-focused6PASS, audit0vulnerabilidades, remote/verification.json. CI413/40203846108 confirma todos los gates finales; las seis expectativas iniciales obsoletas están corregidas, sin fallos pendientes. Revisión física de PWA y Google OAuth quedan manuales. Primer hito general pendienteT06; no iniciado. Cierre documental en rama sin republicar staging.

## MC64 — Inicio del flujo guiado (25/10/2026)
Árbol limpio en codex/tournament-development tras publicación MC63. Reutilizar NewSeasonForm y servicios, mantener estado al cambiar pantallas. Auto-Resume0.6.13 habilitado/watcher activo, sin pendientes. Identidad usará ImageCropDialog y updateLeagueLogo existentes. Hallazgo: modalidad es inmutable por trigger aplicado; no cambiar esquema ni permitir una edición ficticia tras crear la liga. Durante edición de identidad explicar restricción y conservar borrador de temporada. Gates pendientes; sin operaciones remotas.

MC64 checkpoint: LeagueCreationForm reutilizable con ImageCropDialog, logo/color/recomendaciones opcionales y explicación de modalidades. Guardado secuencial con referencia al ID creado evita duplicar ligas si falla el logo. NewSeasonForm conserva un único estado para básica/avanzada/resumen/edición de identidad; grupos avanzados desplegables, CTA único y resumen contextual con Editar. Contador incluye nombres/cuentas, búsqueda bajo demanda, inscripción no vacía nombres al alternar; campo de inicio ya no se rellena al enfocarlo. Sin nuevas consultas de datos ni cambios de esquema. Tres tests de UI nuevos y57 regresiones PASS; tipos/i18n/lint focalizado PASS. Validate global y18E2E en curso; no marcar completo ni publicar. Modalidad fijada por DB al crear liga y explicada al volver a identidad; nombre/logo/acento sí editables sin perder temporada.

MC64 comprobación inicial:1633 pruebas PASS y dos tests intensivos de calendario exceden sus5s al ejecutar Vitest y navegador simultáneamente (sin fallo de invariantes).18E2E:10PASS y8 esperan el texto Atrás mientras el botón heredaba Volver. Corregido texto a Atrás en el flujo, sin aumentar tiempos/tolerancias; añadida protección de todos los controles durante guardado, conservación de modo manual al alternar inscripción y resumen con logo/fechas legibles. Repetir validate completo y después navegador en serie, pendiente; no continuar hacia publicación ni marcar completo hasta cerrar ambos. Mantener intactos los motores.

MC64 gates: validate completo PASS1635/289, tipos/lint0errores/5avisos previos, i18n/seguridad y build1268583bytes/103chunks; motores sin modificar.40E2E PASS en móvil/escritorio, claro/oscuro: logo real y recorte, identidad sin duplicado, inscripción preservada, revisión, parámetros básicos, manual/ida-vuelta/custom, parejas/resultados/ranking, invitaciones y creación global con cuenta atrás. Ajustadas dos expectativas de prueba (summary de details y clave separada de settings). Capturas mostraban administración antigua sobre el nuevo recorrido; flujo trasladado a contenedor propio manteniendo instancia para salir/reabrir sin perder borrador, cabecera reservando fila de acciones y hash único.60 tests focalizados posteriores PASS; últimos ajustes de scroll/ubicación legible/título y comprobación final de capturas en curso. No publicar; MC64 aún no cerrado.

MC64 revisión final de navegador:12/12PASS sobre el cierre visual, Clásico/Competition conservados y Administración activa con sus capturas originales sin actualizar referencias. Ambos formatos/temas,320/393px sin overflow; Axe sin graves/críticos. Basic y Review capturadas y revisadas: flujo limpio sin paneles antiguos, fila superior reservada a acciones, resumen con logo/color/fechas y ubicación legible. Salir a Administración y reabrir conserva nombre/participantes/configuración; volver a identidad no duplica liga y mantiene jugadores.52 ejecuciones E2E correctas entre40 de regresión y12 de cierre. Última compilación/tipos/lint en curso tras limpiar constantes de anclas e incluir color; fuente137891/138000,i18nPASS. Localhost3000/league/newHTTP200. No operaciones remotas, migraciones ni dependencias. Pendiente solo cerrar gate final y registrar commit local.

MC64 CERRADO LOCAL: última comprobación de tipos/lint PASS (sin errores, cuatro avisos previos en el fichero administrativo); i18n, presupuesto fuente137891/138000 y diff-check PASS. Último build producción1268925bytes gzip/103chunks PASS. Validate global1635/289 PASS y60 pruebas focalizadas posteriores PASS;40 E2E de regresión y12 comprobaciones finales PASS (42 casos distintos,52 ejecuciones), móvil/escritorio, claro/oscuro,320/393px,Axe, retorno a identidad y reapertura del borrador. Capturas revisadas; Administración activa coincide con referencias originales, sin regenerarlas. Logo con recorte y reintento sin duplicado, estados y resumen completos con ubicación legible, etapas separadas sin duplicar formularios ni servicios. No nuevas dependencias, migraciones, datos remotos, push ni publicación. Modalidad permanece inmutable tras guardar liga según trigger existente; el formulario lo explica antes de confirmar el primer paso. Estado conservado al navegar dentro del flujo o salir/reabrir el formulario montado; no se añade autosalvado tras recarga. Localhost3000/league/new200. Listo para pruebas locales; T06 sigue pendiente, no iniciado. Se registra checkpoint local por dominio.

## MC65 — Correcciones del asistente (25/10/2026)
Inicio: MC64 guardaba liga en paso1; se reemplaza por borrador local hasta confirmar resumen, sin seleccionar liga anticipadamente. Reutilizar servicios actuales y conservar ID al reintentar tras un fallo de guardado final, evitando duplicados. Editar abrirá el bloque; color automático usa extractLogoAccentPalette existente. Auto-Resume activo/vigilante verificado. No operaciones remotas ni migraciones previstas.

MC65 checkpoint: asistente en /league/new mantiene identidad/temporada en borrador; no activa liga ni llama a crear hasta confirmar. Salida directa a Competiciones y Atrás internos preservados. Perfil propio precargado sin sobreescribir alias editados, avanzada destacada, títulos/progreso compactos, Editar abre y enfoca el bloque, color propuesto tras recorte y acción automática explícita. Directorio previo valida creator global; ligas existentes conservan comprobación admin. Tipos PASS y10 pruebas iniciales PASS. Se añade un único contenedor cliente (+1,197/197) para conservar ambos formularios montados sin duplicarlos; sin dependencias ni migraciones. Pendiente navegador/gates completos.

MC65 móvil: detectado desbordamiento horizontal real por regla compartida de títulos!important que vencía al ajuste compacto; provocaba reescalado del viewport móvil y toques erróneos sobre el pie sticky. Corregida especificidad scoped y títulos acortados. Pie separado del fieldset manteniendo sus bloqueos explícitos. Se repiten recorridos antes de cerrar; no se ha relajado ninguna aserción ni usado force click. Pruebas de directorio autorizaciones5/5 y borrador/color4/4 PASS.

MC65 reanudado automáticamente (26/10): validación completa se detuvo correctamente en lint por lectura de ref durante render del bloqueo de modalidad tras guardado final. Sustituida por estado explícito actualizado solo al guardar; repetir gates completos. Dos recorridos móviles posteriores a la corrección de cabecera PASS, incluida creación final una sola vez con logo y recarga. Sin operaciones remotas.

MC65 validación global PASS (26/10): npm run validate salida0,1.641 pruebas/290 archivos, TypeScript, lint sin errores y5 avisos previos, i18n/seguridad/presupuestos PASS. Build1.281.036bytes gzip/105chunks. Fuente137992/138000 y197/197 clientes,48 páginas. Revisión de navegador final en curso: creación diferida, salir sin crear, perfil precargado/alias, logo/color automático, Editar desplegado,32 jugadores y regresiones individuales/parejas/autoinscripción. Ninguna operación remota.

MC65 regresiones: recorridos móviles de ambos formatos, logo/color, alias, creación final y todos los Editar probados PASS; temporadas por parejas simple/doble/custom/manual y autoinscripción PASS. Detectado nombre accesible del botón Competiciones incluía flecha decorativa; marcado aria-hidden para coherencia con BackButton y repetir salida desde liga bloqueada. No se relajan aserciones. Validación general anterior completa PASS.

MC65 CERRADO LOCAL (26/10): validate completo PASS,1.641 pruebas/290 archivos; cierre posterior de tipos, ESLint focalizado,9 pruebas de borrador/directorio, i18n, fuente137992/138000, build1.281.054bytes gzip/105chunks y diff-check PASS. Navegador42 casos distintos verificados:40 correctos en lote general y6/6 en repetición final de creación/navegación (46 ejecuciones correctas,4 solapadas); fallos previos de nombre accesible corregidos sin relajar pruebas. Confirmado: cero creaciones antes de confirmar, libre salida a Competiciones aunque última liga bloqueada, modalidad editable en borrador, nombre propio precargado y alias conservado, logo con color automático/restaurable, Editar abre personalización y cada uno de los cuatro bloques avanzados, creación final una sola vez y recarga. Regresiones de32 jugadores, individuales/parejas, vueltas/custom/manual, resultados/ranking, autoinscripción y snapshots administrativos originales PASS;320/393px sin overflow y Axe sin graves/críticos en vistas evaluadas. Cabecera compacta revisada en captura móvil. Se omite opción de crear liga sin temporadas para mantener un único recorrido. Borrador solo durante navegación interna, no persiste tras recarga/salida; servicios finales existentes conservan ID de liga para reintentar errores de logo. No migraciones, dependencias, cambios de datos, push ni despliegues. Localhost3000/league/newHTTP200 verificado. Main/Production/tag no modificados por esta ejecución; T06 general no iniciado. Se registra checkpoint local por dominio.

## MC66 — Creación más clara (26/10/2026)
Auditoría acotada: MatchScheduleForm combina /api/locations con recomendaciones de liga; estas no restringen programar partidos. Apertura sí usa exclusivamente ubicaciones de liga y API de creación/ajustes valida esa lista. Sustituir selector de apertura por PersonalMatchLocationPicker reutilizado con catálogo global y sin alta manual, mantener soporte servidor a ubicaciones antiguas y canonicalizar selección. Duración tendrá dos selectores con relación explícita; resumen con identidad, cifras y bloques visuales sin perder campos/Editar. No modificar catálogo/datos, migraciones ni publicar.

MC66 implementación: selectores de duración anidados con etiquetas1/2; recomendaciones de ubicación retiradas solo del asistente (se conservan datos antiguos), apertura reutiliza buscador global sin alta manual. Validación servidor de creación/ajustes resuelve catálogo o ubicación antigua y usa metadatos canónicos, rechazando desconocidas; editor posterior conserva apertura ya guardada aunque no figure en recomendaciones. Resumen con identidad/logo/color, iconos existentes, cifras y campos en dos columnas, plantilla desplegable y Editar intacto. Sin dependencias ni migraciones. Gates en curso.

MC66 validación inicial:49 pruebas de integración/componentes/regresión PASS, tipos/lint/i18n PASS. Navegador detecta etiquetas de campos del resumen con contraste4.34 en Clásico claro sobre nuevo fondo suave; corregidas a neutral600, sin relajar Axe. Búsqueda global funcionaba, prueba esperaba separador · y el componente compartido usa -; ajustada expectativa al formato real, sin cambiar ubicaciones de otras pantallas. Repetir14 recorridos.

MC66 recorrido de apertura4/4 PASS: búsqueda por Bilbao en catálogo sin recomendaciones, selección, resumen, Editar conservando ubicación y creación persistida; móvil/escritorio, claro/oscuro,320/393px y Axe. Capturas revisadas en ambos temas: cifras de calendario agrupadas ahora en una fila para evitar huecos visuales.19 pruebas de rutas PASS incluyen edición posterior y preservación exacta de apertura bloqueada tras cambiar metadatos del catálogo. Repetición de navegador y validate completo antes de cerrar.

MC66 gate locations:check todavía exigía LeagueLocationsEditor en primera temporada; actualizado al nuevo contrato expresamente solicitado: ausencia de recomendaciones, buscador compartido con catálogo global, validación servidor global/legacy y cancelación conservada. No se elimina el control ni se relajan permisos. Continuar validate.

MC66 suite completa encontró una segunda expectativa histórica (v1412PolishIntegration) que exigía editor y escritura de recomendaciones en creación. Adaptada al nuevo contrato sin eliminar la prueba: exige catálogo/buscador, ausencia de escritura de recomendaciones y cancelación, conservando los checks de programación de partidos. Repetir validate; no continuar con cierre hasta resolverlo.

MC66 validate completo PASS: salida0,1.650 pruebas/290 archivos; tipos, lint sin errores (5 avisos previos), ubicaciones con contrato actualizado, seguridad/i18n/fuente137875/138000 y build1.279.003bytes gzip/104chunks PASS. Se conserva presupuesto197 clientes/48 páginas y se reduce fuente sin ampliar límites.19 pruebas de API cubren creación/edición global, ubicación antigua, metadatos canónicos, desconocidas, fallo de catálogo, permisos y apertura bloqueada. Última regresión46 recorridos en curso sobre la presentación final de cifras agrupadas. Sin operaciones remotas.

MC66 CERRADO LOCAL: npm run validate salida0 (1.650 pruebas/290 archivos, tipos, lint sin errores/5 avisos previos, seguridad/i18n/presupuestos y build1.279.003bytes gzip/104chunks).46/46 E2E finales PASS en un único lote, móvil/escritorio, Clásico/Competition en los recorridos pertinentes, claro/oscuro y320/393px sin overflow, Axe sin incidencias graves/críticas. Probados nueva liga, volver/editar, ambos formatos, vueltas simple/doble/custom/manual, autoinscripción, resultados y ranking, cuenta atrás y permisos creator, apertura global sin recomendaciones, configuración persistida y capturas administrativas originales sin cambios. Capturas de duración/resumen claro/oscuro revisadas; cifras de calendario alineadas en fila y plantilla desplegable.19 pruebas de API verifican datos canónicos, compatibilidad antigua, catálogo inaccesible/desconocidas y acceso admin, además de conservar apertura bloqueada. Recomendaciones retiradas únicamente del asistente, datos guardados y editor administrativo existente conservados. No nuevas dependencias, migraciones, datos remotos, push ni despliegue. HTTP200 local /league/new y diff-check PASS. Primer hito general pendiente T06, no iniciado. Checkpoint local por dominio.


MC67 INICIO LOCAL: árbol limpio; numeración 1–9 de las tarjetas avanzadas y rangos 1–2/3/4–7/8–9 en sus cabeceras, visibles también al contraer. Duración usará subcampos sin otra secuencia numérica. Mantener las claves de navegación de Editar, los controles y el guardado actuales. Gates focalizados pendientes; sin operaciones remotas.

MC67 checkpoint: nueve tarjetas numeradas con estilo compartido y cuatro rangos visibles al cerrar los desplegables; subcampos de duración sin secuencia paralela. ESLint focalizado, i18n, fuente137875/138000 y4 pruebas de creación PASS. Ampliada la regresión guiada existente para comprobar números, contraer/editar,320/393px y accesibilidad en ambos temas y modalidades. TypeScript y navegador con build en curso; no publicar ni cerrar hasta resultado.

MC67 validación ampliada detecta contraste insuficiente previo en descripciones de MVP/confirmación seleccionadas en Competition claro; corregido únicamente en el asistente sobre botón negro, sin relajar Axe.4 E2E oscuros PASS y4 claros fallaron por ese motivo; repetir antes de cerrar. Petición posterior incorporada: resumen con inscripción/jugadores reordenados, textos abreviados, cuota explícita y plantilla de dos columnas también en móvil. «SON CONFIRMACION» interpretado como errata de «Sin confirmación». Sin cambios funcionales.

MC67 segundo recorrido12/12 PASS tras corregir contraste, incluidos resumen y apertura global. Nuevas instrucciones antes del cierre: bloque5 con cabecera/explicación separadas del checkbox; MVP automático avanzado por defecto en creación (y como referencia de configuración básica), sin alterar temporadas existentes. Cabecera compacta específica del asistente: quitar reserva vacía de44px, separar botón global Atrás del flujo del título y centrar bloque de texto con insets iguales. Repetir gates sobre este estado final; pendientes.

MC67 nuevo estado:9 pruebas de creación/MVP avanzado y ESLint/i18n/fuente PASS. La primera repetición con el nuevo valor predeterminado encontró un selector ambiguo en la prueba (coincidía con el texto visible básico y la opción avanzada oculta); acotado al párrafo de resumen básico, sin relajar validaciones. Cabeceras con insets simétricos también en Clásico. Pendientes repetición completa y tipos finales.

MC67 revisión final:14/14 E2E PASS con nuevo predeterminado MVP, resultado persistido, panel5 y cabeceras menores de80px. Revisión de captura detecta desplazamiento automático sin reserva para barra flotante; añadido scroll-margin-top del asistente (formulario, cabecera y bloques editables), sin aumentar altura de cabecera ni modificar otras pantallas. Nueva aserción geométrica exige cabecera por debajo de la barra flotante. Repetición final pendiente sobre este ajuste CSS.

MC67 CERRADO LOCAL (26/10/2026): numeración1–9 compartida con rangos1–2/3/4–7/8–9 al contraer; panel5 con título, explicación y checkbox separados. Resumen: inscripción/jugadores reordenados, Equilibrado/Jornadas totales/Manual/Sin confirmación y cuota explícita; plantilla en dos columnas móvil conservando parejas. Nuevo valor de creación MVP automático avanzado en básica/avanzada y guardado, sin cambiar temporadas existentes. Cabeceras de62px aproximadamente, insets simétricos y scroll-margin-top respeta acciones flotantes al abrir/volver/editar. Revisión React sin nuevos hooks/efectos/consultas ni duplicación de lógica. Gates finales: TypeScript PASS; ESLint focalizado sin errores; i18n y fuente137883/138000 PASS;9 pruebas de creación/MVP PASS; build mediante Playwright y14/14 E2E sobre estado final PASS (móvil/escritorio, claro/oscuro, individual/parejas,320/393px, Axe sin graves/críticas, geometría bajo barra, rangos/números, Editar/Atrás, dos columnas, duración y apertura global, persistencia de MVP). Evidencia .quality-artifacts/mc67-browser-closed.log y mc67-typecheck-final.log, capturas finales revisadas en móvil. Contraste previo corregido en el asistente; primera expectativa ambigua de prueba corregida sin relajar checks. Sin dependencias, migraciones, datos remotos, push ni publicación. Primer hito general pendienteT06 no iniciado.

MC68 INICIO: rama limpia tras MC67. Revisados buscadores, acciones, ayuda, selectores y previsualización/recorte. Reutilizar diálogo nativo para foco/inert/Escape y devolver foco; estilos por tres variantes. Chats global conserva agrupación/proximidad/colores y datos, solo cambia ubicación de controles y añade filtro de estado. Sin datos reales ni operaciones remotas.

MC68 checkpoint: FloatingDialog nativo compartido (portal/foco/inert/scroll/Escape/fondo/ocupado), cierre44px, chevron y lupa comunes. Migrados Ajustes, búsqueda de ligas, selectores de personas/ubicaciones, ubicación de programación, ayuda, calendario/navegación, QR/previews, recorte y lightbox. Recorte confirma descarte; fallo de copia/exportación conserva selector. Chats mueve controles y añade estado, conserva filtros al cerrar y muestra indicador/limpieza/contador.19 pruebas focalizadas PASS; i18n/onboarding/fuente PASS; primer gate estático de popup personal adaptado al nuevo componente nativo sin eliminar contrato. Validate global en curso; navegador pendiente. Sin operaciones remotas.

MC68 regresión inicial:1644 pruebas PASS y11 fallos en cuatro suites. Resueltos: contenido de diálogos cerrados se desmonta (evita duplicar ubicaciones y búsquedas), shim de showModal/close solo en jsdom (navegador probará implementación real), expectativa antigua de safe area trasladada a lupa compartida.32 pruebas de invitación, detalle, reservas, safe area y diálogo PASS. Fixtures nuevos cubren filtros por estado, retención/limpieza, foco/Tab/Escape/fondo, cuatro estilos y descarte de recorte. Ajustadas verificaciones estáticas al contrato nativo, conservando portal, privacidad y backdrop. Validate completo repitiéndose en serie; sin operaciones remotas.

MC68 validate completo PASS salida0:1655 pruebas/291 archivos, TypeScript, lint0errores/5avisos previos, i18n/seguridad/onboarding/presupuestos correctos; fuente137576/138000,197 clientes/48 páginas; build1.277.227bytes gzip/104chunks. Pruebas reales de navegador en curso sobre estado final: filtros globales y ventanas en Clásico/Competition claro/oscuro, foco/inert/scroll, borradores, QR/calendario/ubicaciones y creación. No cerrar hito hasta resolver cualquier fallo.

MC68 navegador inicial22/34 PASS; doce fallos identificados: Escape de input search consumido por el navegador (ocho casos de Chats), include ARIA antiguo sin role explícito del diálogo nativo (dos QR), y contraste previo de ayudas en Clásico claro (dos). Corregidos con Escape compartido que conserva consulta, role explícito y colores secundarios/selección legibles en el diálogo. Nueva prueba de Escape con consulta6/6 PASS y lint focalizado PASS. Repetir18 recorridos afectados antes de cerrar; sin relajar Axe, tiempos ni tolerancias.

MC68 revisión visual:18/18 recorridos afectados PASS tras correcciones, sin relajar Axe ni esperas. Capturas móviles claro/oscuro de Chats y recorte revisadas: panel compacto, lupa sin solapamiento con navbar y acciones de recorte visibles. Último pulido: singular del contador, descripción accesible de filtros activos, Cancelar del recorte con estilo compartido y áreas táctiles44px; guía docs/ui-style-guide.md actualizada. Validate completo final en curso antes de repetir regresión de navegador y guardar checkpoint. Sin publicación.

MC68 gates finales PASS: validate completo salida0,1656 pruebas/291archivos, TypeScript, lint0errores/5avisos previos, i18n/seguridad/presupuestos, build1.277.330bytes/104chunks. Última repetición combinada34 recorridos sobre el mismo estado final en curso. Se conserva main/Production y no se ha ejecutado push ni despliegue. Cierre pendiente solo de navegador.

MC68 lote final32/34 PASS: dos casos de Clásico oscuro encontraron la guía automática de Ajustes detrás del diálogo durante Axe; el fixture solo había completado guías de Inicio/Partidos/Chats. Ajustado el fixture sintético para completar también Ajustes, sin excluir nodos de Axe ni cambiar código de tutoriales; el recorrido específico Repetir guía sigue incluido. Repetir34 casos en conjunto. Código final ya pasó validate1656/291 y build1.277.330bytes; no nuevos cambios funcionales después del gate.

MC68 CERRADO LOCAL (26/10/2026): FloatingDialog, DialogCloseButton, DialogChevron/OptionIcon y FloatingSearchButton compartidos; diálogos nativos con foco/inert/scroll/restauración, Escape consistente desde búsqueda, descarte de encuadre y bloqueo durante guardado. Unificados Ajustes/búsqueda de ligas, selectores de personas y ubicaciones (incluido Partido), ayuda, calendario/navegación, QR/previews, recorte y visor. Acciones fallidas conservan ventana y mensaje; copia confirma con aviso compartido. Chats global limpia controles del listado y los lleva a lupa sobre navbar: búsqueda/competición/conversaciones/estado, selección conservada al cerrar, indicador accesible, contador y limpiar filtros con estado vacío. Agrupación/proximidad/colores/rutas y consultas existentes conservadas. Guía actualizada en docs/ui-style-guide.md.
Validación final: npm run validate salida0,1656 pruebas/291archivos, TypeScript, lint0errores/5avisos previos, seguridad/i18n/onboarding, fuente137580/138000 y197clientes/48páginas, build1.277.330bytes gzip/104chunks PASS. Navegador final34/34 PASS en un único lote, móvil/escritorio, Clásico/Competition claro/oscuro,320/393px, Axe sin graves/críticas, foco/Tab/Escape/fondo, filtros/retención/limpieza/estado/proximidad, errores, descarte, QR real/descarga/compartir, acciones, ubicaciones y creación. Evidencia .quality-artifacts/mc68-validate-complete.log y mc68-browser-final.log; capturas móviles de Chats/recorte revisadas. Fixture completa guía de Ajustes para evitar autooverlay ajeno; comprobación Repetir guía conservada. No dependencias, cambios de DB/datos, migraciones, push ni publicación. main/Production/v1.0.0 no operados. Primer hito general pendienteT06, no iniciado. Checkpoint local por dominio.

MC69 INICIO (26/10/2026): rama limpia codex/tournament-development sobre staging d41f0eaf, HEAD993be7c6. Publicación PRE autorizada, PROD solo lectura. PRE v1.15.35; Production v1.15.22/main9578fe00, tagv1.0.0 e9152940ec51fdc34b785aa8ea0e054c110c4040. PRE80 migraciones, PROD62:18 pendientes de aplicación antes de promover. Candidata1.15.36 preparada sin cambios funcionales ni dependencias. Pendientes gates completos y despliegue verificado.

MC69 gates estáticos/unitarios/build PASS:1656 pruebas/291archivos, TypeScript, lint0errores/6avisos, seguridad/i18n y build1.277.330bytes/104chunks. E2E completo268casos en curso; detectada referencia visual de Ajustes desactualizada por el icono de búsqueda compartido: diff190px revisado, actualización precisa pendiente sin cambiar tolerancias. No publicar mientras haya gate pendiente. Advisors Supabase soloINFO, sin WARN/ERROR. Backups programados recientes y QAautenticado omitidos, heartbeat correcto; diagnóstico PROD documentado en docs/preproduction/V1.15.36_RELEASE.md. main/tag verificados sin cambios.

MC69 visual: revisadas las diferencias móvil190px/escritorio193px, exclusivamente icono de búsqueda de Ajustes, cambio esperado MC68. Actualizadas solo esas dos referencias con capturas inspeccionadas; sin tolerancias nuevas ni omisión de tests. Batería268 continúa, después repetir ambos casos corregidos y auditoría npm antes de push.

MC69 gates locales cerrados: validate1656/291 PASS; batería completa265PASS/1skipprevisto/2referencias esperadas, repetición2/2PASS tras revisar/corregir solo icono. Total267casos habilitados verificados. npm audit producción0vulnerabilidades. Sin cambios funcionales posteriores. Preparar commit candidato1.15.36 y PR a staging; no integrar hasta los4jobsCI verdes. Evidencias .quality-artifacts/mc69-release-check.log, mc69-visual-recheck.log y mc69-audit.log. DiagnósticoPROD con18migraciones, backup/aceptaciónpendientes yT06–T09documentado.

MC69 candidata4262256ea70c9e7f855748fe0e22d9b9c1533c81 publicada y SHA remoto confirmado. PR57 a staging creada y adjunta: https://github.com/davidalonsoc4/smash-lob/pull/57. CI415/40359657304 en cola, pendiente4jobs antes de merge. main/Production no operados. Reanudar comprobando CI de este SHA exacto; después merge con expected_head_sha, verificar Vercel staging/aliasPRE y smoke1.15.36, diagnósticoPROD y cierre.

MC69 remotoCI415: código/build PASS, Lighthouse PASS y migraciones/pgTAP/restauración aislada PASS. Pendiente únicamente job navegador/PWA sobre candidata4262256e. Preview rama dpl_GvTWDKnjVW1d62hU3waiTE7ACS3X READY, health1.15.36 confirmado; aún no es el aliasPRE. HealthPROD leído sin sesión devuelve1.15.22/prod y capacidades distribuidas/webhook desactivadas; limitación en memoria y logs existentes documentados, no se modifican variables. Esperar cuarto job antes de merge; reporte final local actualizado sin mover headremoto.

MC69 CI415 CERRADO:4/4jobsPASS, navegador267PASS/1skipprevisto en lote único final10,5min; código/build, Lighthouse, SQL81checks/restauraciónPASS. PR57fusionada con expected_head_sha4262256e, mergeca4f4ebc6581516bfd77fdfd3d110a3b26e793e3. Fetch y árbolstaging idéntico a candidata comprobados; main9578fe00 ytagv1.0.0e9152940 sin cambios. Pendiente VercelstagingREADY/aliasPRE y smoke1.15.36 antes de declarar publicacióncompleta.

MC69 CERRADO PRE (26/10/2026 17:45CET): v1.15.36 en https://pre.smashandlob.com, stagingca4f4ebc6581516bfd77fdfd3d110a3b26e793e3, Verceldpl_DW9wHJE8LXaQJfM5KpWZoE6s7ZivREADY yaliasPRE confirmados. Smoke13/13PASS16:45:48UTC: healthversión/entorno, cachésw/manifiesto, rutas200 yAPIs401sinsesión; sin cuentas personales ni datosremotos. CI415PR57cuatrojobsPASS:1656unitarias/integración,267E2E/1skipprevisto,SQL81checks/restauración,Lighthouse,lint/TS/build y0vulnerabilidadesnpm. Árbolstagingidénticoacandidata comprobado. Referencias Ajustes190/193px actualizadas tras inspección exclusivamente iconolupa; E2Efinal267PASS en loteúnicoCI. main9578fe006063108cfcab93956fe23e1eb402f37c,tagv1.0.0e9152940ec51fdc34b785aa8ea0e054c110c4040 yProductiondpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz/version1.15.22 intactosconfirmados. NoDBescrita/nuevasmigracionesPRE/dependencias. VeredictoPROD: no promoverdirectamente;18migracionespendientes, backupreciente/recuperaciónporacreditar, aceptaciónmanualcandidataPWA/OAuth/invitaciones/flujos, capacidadesdistribuidas/webhookausentes yalcanceT06–T09pendiente. Informecon evidencia ylistamigraciones en docs/preproduction/V1.15.36_RELEASE.md. Primerhito generalpendienteT06 no iniciado por esta publicación. Cierre documental sin cambiosfuncionales.

MC70 INICIO: el usuario autoriza preparar respaldo de PROD y recuperación; la publicación/migraciones siguen excluidas hasta nueva orden. Rama limpia59b3edf1. ProyectoPRODszycbwdzestcmimziyeyACTIVE_HEALTHY identificado, v1.15.22/main9578fe00. DocumentaciónSupabase yVercel revisada, changelog leído. D:/BACKUPS ya no existe; no asumir validez de referencias antiguas. BinariosPostgreSQL17 disponibles en .quality-artifacts/postgres-tools. No DBpassword/PAT/passphrase presentes en variables locales; comprobar CLI/credenciales existentes sin imprimirlas antes de bloquear. Copia con datos reales solo para respaldo privado, nuncafixtures/tests.

MC70 checkpoint: códigoPROD9578fe00 en bundleGit verificado ytar fuera delrepo, carpeta privada C:/Users/USER/SmashLobBackups/prod-20261026-180334. CLIautenticadaenalmacénWindows, proyectoPRODenworkdirprivado separado; enlace delreposiguePRE. Inventario19.049.619bytesDB,39tablaspublic,62migraciones,Storage0buckets/0objetos. ResueltalaadopciónderolporalSupavisor: PGOPTIONS no aplicaba rol; SETROLE explícito validado por metadatos, sin modificarpermisos. Dumpcompleto1723358bytes yroles5783bytes cifradosAES256GCMdirectamente,clavealeatoriaenfolderprivadoseparado. Hashdescifrado/coherenciacifradaPASS; pg_restoreextraccióncompleta2299171bytesPASSsinsalidaapantalla/sinrestauraciónDB/sindatosPRODenfixtures. Pendiente lectorindependienteconclaveguardada, limpieza/cifradometadatosCLI,instrucciones yverificaciónfinaldePROD. No declararpublicaciónlista ni ejecutar migraciones.

MC70 CERRADO LOCAL (26/10/2026): carpeta FINAL C:/Users/USER/SmashLobBackups/prod-20261026-180334-verified,6payloadsAES256GCM/10archivos/86,4MB; códigoGitbundle+tar,DBcompleta,roles sinpasswords,inventarioStoragevacío yestadoCLI cifrados. Clave32bytesprivada fuera delpaquete en C:/Users/USER/.smashlob-backup-keys/prod-20261026-180334.key (valor nunca impreso). ACLambascarpetascurrentuseronly1reglaPASS. IntegridadGCM/hash/copiaPASS, recoverindependienteclaveguardada6/6PASS, SHA256SUMS9/9PASS, pg_restoreextracciónSQLcompletaPASSsinrestaurarDB. HashBACKUP.json1ec99bd64b5ec6bef60c10fcda89010a7991fe6988d257806d06e1f1b0f79c6e. Snapshot18:09:35–18:10:13CET. Limpieza automática temporal rechazada porpolíticadelentorno; alternativa no destructiva: carpeta finalnueva solo cifrados/documentación, originales conservados bajoACLprivada yfuera delpaquete. NoProddataenpruebasautomatizadas, nosecretosGit/logs, secrets:checkPASS ydiffcheckPASS. HealthPROD200v1.15.22, maingit9578fe00,tagv1.0.0e9152940 ydeploymentdpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz intactos comprobadosfinal. LinkrepoSupabasePREmiadjotkucgluwbrgeih conservado. Sinmigraciones/despliegues/cambiosfuncionales: solo copia. READMErecuperaciónjuntoalpaquete ydocs/preproduction/PROD_BACKUP_2026-10-26.md. Limitacionesreales: local, sinrestauraciónreal,nosecretoscloud/contraseñasroles,actualizarantesmigrar sihaycambios. SubidaPROD18migraciones/aceptaciónPRE requierennuevaorden, noincluidasaquí. T06siguependiente.

MC71 INICIO: usuarioautorizaexpresamente subirPROD, incluyemain/migracionesnecesarias; revocaexclusiónanteriorparaestehito, mantienev1.0.0intacta. Rama3a59f01dlimpia,stagingca4f4ebc ymain9578fe00 confirmadosconfetch. Diferenciallocalrespectostaging solo4docs. SupabasePROD62/PRE80migraciones,18pendientes. Revisarmerge-tree/revisiónSQLyCI antesdeaplicar; refrescarbackupjustoantesdeDB. Riesgosconocidosdeaceptaciónmanual/ratelimitingwebhook/T06–T09documentados, no seafirmacompletitudni pruebasOAuthpersonales. PublicarversiónexistenteprobadaenPRE, sinampliarfunciones.

MC71 revisión: merge-treemain+staging7abd2e4917a0fb9cf1d37aac173d2b0dd6995eeb coincideconárbolstaging. PR58main←staging creada/adjunta; CI417/40368771664 en curso. CI416staging40361769744PASS previo. CLIPROD enworkdirprivado independiente, rootreposiguePRE. Dry-runPASS18nombresversionadosexactos, sinroles/semillas; scriptsidénticosastagingprobado. RevisiónDDL: nuevosdominiostorneos, modalidadleagueindividualpordefecto/pair_numbernullable, triggersretornanparaligasindividuales, RPClegacyconservadas. NoaplicarhastaCIverdeybackupfresco. v1.15.36tagnoexistente, v1.0.0intacta.

MC71 precompatibilidadPASS: capturacatálogoPROD62migracionesycomparaciónconPRE80, sinregistrosdeusuario:376columnas/31contratosRPC/39permisostablasconservados,7tablasnuevasRLSsinpermisosclientes y39funcionesnuevassoloservidor. Revisión18SQLSHAcoincidestaging, mutaciónDDLlegacysolo2columnasaditivas; únicaUPDATEtop-levelsobre rondastorneosnuevassinexistenciaenPROD. CI417tresjobsPASS,navegadorpendiente. PreparadocomprobadorcatálogodespuésymokesPROD, sinOAuthpersonales.

MC71 checkpoint18:42CET: CI4173/4PASS,navegador/PWAaúnenmarcha; ningúncambiofuncionalposterioraPRE. BackupfrescoWORKDIRpreparado C:/Users/USER/SmashLobBackups/prod-20261026-183838-before-v1.15.36, aúnnoexportado. Puntero.mc70-backup-pathahoraapuntaaeseWORKDIR; anteriorfinalconservadoenmc71-previous-backup-path yreportMC70. Tras4/4CI: ejecutarmc70-backup.mjs→copiarrecover.mjs→mc70-finalize.mjs→mc70-copy-final.mjs→recover--verify yregistrarhash. Despuésrepetirdryrunexacto18ydbpushPRODdesdepathmc71-ops-path;comprobarmc71-schema-checkafter/advisors/80versiones/smokeold1.15.22,soloentoncesmergePR58expectedheadca4f4ebc. Preparadomc71-verify-prod18rutasGETsinidentidades. VerificarVerceltargetProductionmainSHA/aliasantesdecerrar. NoautomáticoSQLrollback ni pruebasconusuariosreales. Recuperaciónoldcodepuederechazarligasporparejascreadasdespués;preferirfixhaciaadelantesifueseelcaso.

MC71 CI4174/4PASS, navegador265PASS+2flakyrecuperadosenreintento+1skipprevisto. AntesdeDB se repiten2casos×2enmóvilconfixtures (invitaciónvisual yChatsdarkclassic), sinsnapshots/toleranciascambiados, fuenteidéntica aPRE. Backupfrescohecho: C:/Users/USER/SmashLobBackups/prod-20261026-183838-before-v1.15.36-verified,6payloadscifrados,lectorindependiente6/6PASS,keyprivadaapartenoimpresa,hashBACKUP00419ffb7f258b4aa7c1353d44a7e51494cf388e8057174d14d19b0f4ff37ed5. Roles sincontraseñas,Storage0/0estable, archivopg_restorecompletoextraíble. Sin migracionesaúnhastarepeticiónfocalizadaverde.

MC71 reanudado 21:01 CET: repetición focalizada terminada 4/4 PASS, sin cambios de código ni tolerancias. CI417 confirmado 4/4 jobs success. PR58 sigue abierta y mergeable, head ca4f4ebc/base9578fe00; PROD conserva62 migraciones y main/tag intactos. Se renueva otra vez el backup antes de escribir por el tiempo de interrupción; las copias anteriores se conservan. Repetir dry-run exacto y preflight antes de aplicar.

MC71 backup renovado 21:02 CET: C:/Users/USER/SmashLobBackups/prod-20261026-210105-before-v1.15.36-verified;6 payloads cifrados/10 archivos, clave separada, verificación independiente6/6PASS, BACKUP.json SHA256 de85e144e251e589b3371b8bdba953b63af4f0c83fd373586a41273618f404f6. Dry-run exacto18/preflight PASS, copia idéntica a staging y enlaces PROD privado/PRE repo confirmados. Iniciando aplicación autorizada de las18 migraciones, sin seeds/roles/repair.

MC71 esquema PROD aplicado y verificado 21:04 CET:18/18 migraciones salida0; historial80/80 idéntico a PRE y dry-run sin pendientes. Catálogo conserva376columnas/31contratosRPC/permisos39tablas;7tablasnuevas privadas conRLS y39RPCnuevas privadas. Advisors0WARN/ERROR,1INFO de RLS sinpolíticas intencional servidor. Smoke versión anterior1.15.22 PASS sobre esquema ampliado. CLI avisó que no puede cachear catálogo local por falta deDocker; operación remota e historial comprobados, sin fallo de migración. Pendiente merge PR58 y verificar despliegue/alias/smokes.

MC71 PR58 fusionada con expected_head_sha: main1bc3f70eb100cdc56bc58775d5a1ee281ea56fa6, fetch remoto confirmado y árbol7abd2e4917a0fb9cf1d37aac173d2b0dd6995eeb idéntico a staging probado. Esquema80 verificado antes del merge. Esperando Vercel Production del SHA exacto; aún no declarar finalizado.

MC71 Vercel Production READY y alias smashandlob.com confirmado para main1bc3f70e. Smoke oficial1.15.36/prod PASS. Comprobación adicional detectó ruta incorrecta en helper no versionado (/leagues/new); código y enlaces reales usan /league/new, se corrigió solo el helper y se repitió, sin modificar aplicación ni expectativas de seguridad. Pendiente registrar resultado final18 rutas y cierre documental.

MC71 CERRADO PROD (26/10/2026 21:05 CET): https://smashandlob.com v1.15.36/prod, main1bc3f70eb100cdc56bc58775d5a1ee281ea56fa6, árbol7abd2e4917a0fb9cf1d37aac173d2b0dd6995eeb idéntico a PRE probado. PR58 fusionada; Verceldpl_8pZMykEoZ9y42W1sXBFJoWmruA8K READY targetProduction y aliasdominio confirmados. CI4174jobsPASS (1656 pruebas,265E2EPASS+2flakyrecuperadas/1skipprevisto), recheckfocalizado4/4PASS; SQL81checks/restauraciónaislada/Lighthouse/TS/lint/buildPASS.18migracionesoriginalesaplicadasPROD, historial80/80idénticoPRE/dryrunsinpendientes/catálogoypermisoscompatibles/advisors0WARNERROR. Smokeoficial y18rutasPRODPASS,13rutasPREPASS; sin cuentas personales ni datos PROD en tests. Backupcifradofresco210105verified/claveapartada,lector6/6 ychecksums9/9PASS,despliegueanteriorconservado;restauraciónrealnoensayada. Tagv1.15.36creado/push/verificadoalmismoSHA,tagv1.0.0intactoe9152940. PREstagingca4f4ebcconservado. Secretsscan ydiffcheckPASS. Informe docs/preproduction/PRODUCTION_V1.15.36_RELEASE.md;OAuthGoogle/PWAfísica/flujosconsesiónsiguenmanuales;limitadordistribuido/webhooksinconfiguraryT06–T09pendientesnoafirmadoscompletos. Sin nuevoscambiosfuncionales/dependencias/migracioneseditadas. Cierre documental local por dominio.

MC72 INICIO LOCAL: rama codex/competition-visual-identity creada desde6eb5c53a, árbol limpio inicial y código de la versión publicada. Revisados CompetitionsOverview, PersonalMatchCard, LeagueLogo, estilos globales/tema, MatchSlides y pruebas con fixtures. Problemas: jerarquía de superficies uniforme y datos de liga demasiado fragmentados. Decisión: actividad protagonista con marco de acento y fondo interior legible; ligas compactas con identidad propia, torneos diferenciados por icono; Mis ligas con logo más destacado y datos agrupados, sin degradados amplios ni información nueva. Mantener cálculos/consultas/navbars/rutas. Validación únicamente local; no publicar ni tocar Supabase.

MC72 primera pasada: cambios limitados a CompetitionsOverview.tsx y su CSS module.32pruebas existentes de navegación/selección/permisos PASS, lint ypresupuestofuentePASS. Navegador21PASS/1skipgestosdesktop/2fallosAxe contrastedelpie de métricas Clásico claro: gris737373 sobre nuevofondoF8F8F8 da4,46:1. Corregido el texto secundario de esa franja por mezcla contextual de foreground/surface; sin relajar pruebas. Capturas móvil revisadas: hero legible, nombres/resultados sin fondo decorativo, ligas de tamaño contenido; ajustado acento oscuro para evitar negro poco visible y respetar paletas. Repetir gates tras esta corrección.

MC72 CERRADO LOCAL: actividad protagonista con marco/acento contextual y superficie interior opaca, conservando carrusel/etiquetas/calendario; ligas compactas con degradadoestrecho existente ytorneoscon copa/tinte deltema. Mis ligas: logo con soporte suave decolorpropio, bordesuperior yacento lateral de temporadas en curso, pie de métricas/progreso agrupados yarchivo contraído. Sin textos/estadísticas nuevas, sin datos/consultas/cálculos/permisos/navbars/rutas modificados. CSSscoped en módulo existente; guía visual actualizada. Descartados grandesdegradados de liga, más fondo decorativo/colorespor modalidad y panelesinformativos adicionales para conservar legibilidad/compactación. Validación:32unitarias/regresiónPASS; E2Efinal23PASS/1skip previsto de gesto en escritorio (móvil320/393 ydesktop, Clásico/Competition claro/oscuro, Axe sin graves/críticas, navegación/carrusel/cabeceras/permisos). Ampliada pruebaexistente con ligasactivas/próximas/finalizadas, torneos ypaletas no predeterminadas; logos fixture iniciales bloqueados por CSP se cambiaron a recurso local permitido, sin alterarCSP/aplicación. Recheck8/8PASS con naturalWidth comprobado ycapturas inspeccionadas (.quality-artifacts/mc72-images). TypeScript/lint0errores6avisosprevios/i18n/presupuestofuente137580líneas/build/qualitybuild1277462bytes104chunksPASS. Evidencias mc72-browser-final.log,mc72-logo-recheck.log ylogsindividuales de gates. Local3000health200/version1.15.36/environmentlocal. No push/PRE/PROD/DB/dependencias; rama aparte para valoración del usuario. Primer hito general pendienteT06 no iniciado.

MC73 INICIO LOCAL: nombres en PersonalMatchCard usaban truncate sin reducción de fuente; se reutiliza FitText noWrap con mínimo10px en las cuatro variantes de nombres, sin cambiar cálculo/datos ni fondos. Base14px, margen4px para nombres largos antes de elipsis. Conserva alineación de ambas parejas. Fondo sólido solo consultado por usuario: no se modifica.

MC73 CERRADO LOCAL: FitText existente aplicado a nombres de las dos parejas en previews programadas y finalizadas; base14px, mínimo10px, una línea y elipsis solo si ni así cabe. Anchura completa del nombre mantiene alineación.17pruebas existentesPASS, lint yTypeScriptPASS; build de servidorPlaywrightPASS y5E2EmóvilesPASS (320/393px, Clásico/Competition claro/oscuro, carrusel/Axe/contexto conservados). NombreAndoniFernández completo en393px comprobado por rango de texto sin recorte; capturaactivity-393 inspeccionada. Guía visual actualizada. Fondo degradado sin cambios: segunda petición solo consulta de diseño. Evidenciasmc73-browser.log/mc73-types.log. Sinpush/DB/despliegues; mismo contexto local yprimerhitogeneralT06pendiente.

MC74 INICIO LOCAL: usuario autoriza probar fondo sólido suave. Sustituido degradado del hero por mezcla sólida8% acento/92% superficie. Borde e interior de partido conservados. Subtítulo cambia de neutral500 a600 para mantener contraste sobre el fondo teñido en claro. Sin nuevas funciones ni cambios de datos.

MC74 CERRADO LOCAL: fondo exterior sólido con8% del acento, borde/sombra/interior de partido conservados ysubtítulo concontraste reforzado.4/4E2EmóvilesPASS enClásico/Competitionclaro/oscuro,320/393px, Axe sinviolacionesgraves/críticas, navegacióndatos/carruselconservados; buildPlaywrightPASS. CapturadarkCompetitionrevisada, diffcheckPASS. Evidenciamc74-browser.log. Pruebavisualpendientedevaloracióndelusuario; sin publicación niDB.

MC75 INICIO LOCAL: usuario propone mover el acento al panel del partido. Retirada envoltura exterior de Actividad personal (padding/fondo/borde/sombra) y aplicado borde deacento con fondo7% a PersonalMatchCard solo dentro de esta sección; parejas/resultados mantienen superficies existentes. Texto secundario reforzado para contraste sobre el tinte. Sin lógica ni componentes compartidos modificados.

MC75 CERRADO LOCAL: acento trasladado a la tarjeta del partido (borde del acento/fondo7%), cabecera y paginación sin envoltura exterior, más anchura útil para los nombres.5/5E2EmóvilesPASS en320/393px Clásico/Competitionclaro/oscuro; Axe/navegación/carrusel/nombres conservados, buildPlaywrightPASS ycapturadarkCompetitioninspeccionada. DiffcheckPASS. Evidenciamc75-browser.log. Sin cambios funcionales/DB/despliegue; ensayo visual pendiente de valoración.

MC76 INICIO LOCAL: prueba pedida sin bordes. Tarjeta de actividad con fondo sólido24% del acento, sinborder/shadow; recuadros internos de parejas/resultados usan7% (el fondo anterior). Texto secundario reforzado para contraste, con scope solo Actividad personal. Sin lógica ni otros componentes modificados.

MC76 CERRADO LOCAL: tarjeta plana sinborde/sombra, fondo24% del acento; mini paneles de parejas/resultados con7% (tonoapagadoanterior). Texto secundario contrastado.5E2EmóvilesPASS (320/393px, Clásico/Competitionclaro/oscuro,Axe,carrusel,nombres) y1E2EdeúltimoencuentroPASS; capturas próximo oscuro y resultado claro inspeccionadas. BuildPlaywrightPASS, diffcheckPASS. Evidenciasmc76-browser.log ymc76-result-preview.log. Sin lógica/DB/despliegues; ensayo visual pendiente de valoración.

MC76 revisión de captura resultado claro: detectada regla global de panel blanco que tenía más especificidad y ocultaba el color de la tarjeta en modo claro pese a gates funcionales/Axe correctos. Corregida únicamente la especificidad del selector local con overview/atributos de tema; no se altera globals ni otras tarjetas. Reabrir verificación visual y repetir4temas +resultado antes de dar por terminada esta prueba.

MC76 cierre final tras corrección de prioridad:5/5 E2EPASS (4temas +últimoencuentro), buildPASS; capturas claroCompetition/próximo yclásicoclaro/resultado confirman fondo24% aplicado sin blanco impuesto; oscuro previamente revisado. Selector específico solo esta home, globals intacto. Evidenciamc76-surface-final.log. Sin otros cambios ni publicación.

MC77 INICIO LOCAL: aclaración usuario: acento normal al100%, no mezcla24%. Fondo cambiado a var(--app-accent) puro, sin modificar elección de acento ni interiores apagados. Fecha/ubicación/icono calendario usan --competition-accent-contrast calculado por tema, separador suave; origen con superficie opaca teñida para mantener legibilidad.

MC77 CERRADO LOCAL: fondo100% var(--app-accent), sin mezcla ni suavizado; recuadros internos conservan tonoapagado. Texto/íconos de metadatos usan contraste de tema existente y origen conserva superficie legible.4/4E2EmóvilesPASS enClásico/Competitionclaro/oscuro,320/393px,Axe/navegaciónconservados; buildPASS ycapturaCompetitionoscuro confirma fondoexacto del acento del navbar. DiffcheckPASS. Evidenciamc77-browser.log. Sin cambios de datos ni publicación.

MC78 INICIO LOCAL: usuario pide acento suavizado en los recuadros de nombres. Cambiado7% del acento contextual por35% del acento puro mezclado con superficie del tema, más visible; fondo exterior sigue100%. Texto/nombres mantienen contraste contextual y reducción de fuente. Sin otros cambios.

MC78 CERRADO LOCAL: mini paneles con35% del acento ysuperficie contextual, tarjeta exterior100% intacta.4/4E2EmóvilesPASS (Clásico/Competitionclaro/oscuro,320/393px,Axe/navegación); buildPASS ycapturaoscurorevisada. Evidenciamc78-browser.log, diffcheckPASS. Sin lógica ni publicación.

MC79 INICIO LOCAL: usuario aprueba conservar cajas de nombres invisibles. Fondo transparente/sinborder/sombra en recuadros de parejas de Actividad personal, layout/padding intactos; nombres con --competition-accent-contrast. Tarjeta sigueacento100%, VS y marcadores conservados. Solo CSSmódulo, sin lógica.

MC79 CERRADO LOCAL: cajas transparentes sinborde/sombra conservan geometría; nombres contrastan conacento puro.5/5E2EmóvilesPASS en320/393px Clásico/Competitionclaro/oscuro incluyendo últimoencuentro,Axe/navegación; buildPASS ycapturaoscurorevisada. Evidenciamc79-browser.log, diffcheckPASS. Sin cambios funcionales ni publicación.

MC80 INICIO LOCAL: petición de borde inicialmente negro corregida antes de modificar código: usar color de las cajas inferiores. Borde1px var(--hub-surface), mismo fondo de tarjetas ligas/torneos, dinámico por tema; cajas transparentes. Sin negro fijo ni lógica modificada.

MC80 CERRADO LOCAL: borde1px del color de superficie de tarjetas inferiores; fondos transparentes yacento principal100% conservados.5/5E2EmóvilesPASS,320/393px,Clásico/Competitionclaro/oscuro,Axe/carrusel/nombres; buildPASS ycapturaoscurorevisada. Evidenciamc80-browser.log,diffcheckPASS. Sin lógica/DB/publicación.
