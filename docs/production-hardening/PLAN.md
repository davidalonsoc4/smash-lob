## MC78 — Acento suavizado en nombres
- Estado: COMPLETO LOCAL (26/10/2026),4/4 E2E móviles con Axe PASS, build y captura revisados. Sin publicación.
- Alcance: recuadros de parejas/resultados con tinte del acento más visible, manteniendo tarjeta100% y texto contextual legible. Solo CSS local.
- Gates: navegador móvil Clásico/Competition claro/oscuro con Axe y captura revisada; sin publicación.

## MC77 — Acento puro en Actividad personal
- Estado: COMPLETO LOCAL (26/10/2026),4/4 E2E móviles con Axe PASS, build y captura revisados. Sin publicación.
- Alcance: fondo de tarjeta con el acento configurado al100%, sin mezclarlo; conservar interiores apagados y adaptar metadatos al color de contraste existente del tema.
- Gates: móvil Clásico/Competition claro/oscuro, Axe y captura visual; sin publicación.

## MC76 — Superficies de acento sin bordes
- Estado: COMPLETO LOCAL (26/10/2026), selector de fondo corregido y5/5 gates finales con Axe PASS; capturas claro/oscuro/resultados revisadas. Pendiente valoración visual; sin publicación.
- Alcance: tarjeta de actividad sin borde/sombra, fondo sólido de acento más intenso y recuadros de parejas/resultados con el tinte apagado anterior. Solo estilos locales de la home.
- Gates: móvil320/393px, Clásico/Competition claro/oscuro, Axe/contraste/carrusel/nombres y captura revisada. Sin publicación.

## MC75 — Acento en la propia tarjeta de actividad
- Estado: COMPLETO LOCAL (26/10/2026),5/5 E2E móviles PASS con Axe/carrusel/nombres, build PASS y captura revisada. Pendiente valoración visual del usuario; sin publicación.
- Alcance: retirar la envoltura visual exterior de Actividad personal y trasladar borde de acento/fondo suave a la tarjeta del partido, manteniendo parejas/resultados legibles y sin cambiar otras previews.
- Gates: navegador móvil320/393px Clásico/Competition claro/oscuro, Axe/carrusel/nombres y captura visual. Sin publicación.

## MC74 — Prueba de fondo sólido suave
- Estado: COMPLETO LOCAL (26/10/2026),4/4 E2E móviles PASS con Axe, build del navegador PASS y captura revisada. Pendiente valoración visual del usuario; sin publicación.
- Alcance: sustituir únicamente el degradado exterior de Actividad personal por un sólido con8% del acento; conservar borde, interiores y navegación. Ajustar contraste del subtítulo si es necesario.
- Gates: navegador móvil Clásico/Competition claro/oscuro con Axe y comprobación visual; diff limpio. Sin publicación.

## MC73 — Nombres adaptables en previews personales
- Estado: COMPLETO LOCAL (26/10/2026),17 pruebas existentes y5 E2E móviles PASS; TypeScript/lint/build del navegador PASS. Misma rama visual, sin publicación.
- Alcance: reutilizar FitText para reducir nombres hasta10px antes de truncarlos, manteniendo una línea y alineación en tarjetas personales de próximo/último encuentro. Fondo de actividad sin cambios, pendiente de valoración del usuario.
- Gates: pruebas existentes de FitText/tarjeta/competiciones, lint/TypeScript y navegador móvil320/393px con nombre largo y carrusel.

## MC72 — Identidad visual de Competiciones y Mis ligas
- Estado: COMPLETO LOCAL (26/10/2026), rama codex/competition-visual-identity;32 pruebas existentes PASS,23 E2E/1 omisión prevista y8 comprobaciones finales de paletas/logos PASS. TypeScript/lint/i18n/fuente/build PASS; sin publicación ni cambios de datos.
- Alcance: jerarquía del bloque de actividad, superficies compactas de ligas/torneos y tarjetas completas de Mis ligas. Solo presentación, conservando datos, permisos, selección, navegación, carrusel y temas. Sin despliegues ni base de datos.
- Gates: pruebas existentes de competiciones y navegación, TypeScript/lint/i18n/fuente/build; navegador con fixtures en móvil320/393px y escritorio, Clásico/Competition claro/oscuro, contraste/Axe, desplazamiento y acceso a listados/ligas. Inspección de capturas locales antes de cerrar.

## MC71 — Publicación autorizada de v1.15.36 en PROD
- Estado: COMPLETO PROD (26/10/2026 21:05 CET), v1.15.36 publicada y verificada en smashandlob.com;18 migraciones aplicadas, CI417 cuatro jobs PASS,18 comprobaciones PROD y13 PRE PASS. v1.0.0 permanece intacta. OAuth real y aceptación PWA física siguen manuales.
- Alcance: promover el código probado en PRE, revisar/aplicar las18 migraciones versionadas pendientes en PROD, verificar despliegue/alias/versión/PWA/autorización y conservar recuperación. No activar funcionalidades pendientes ni añadir servicios/configuraciones ajenas.
- Gates: árbol main+staging idéntico al probado, CI de PR cuatro jobs PASS, respaldo fresco/descifrado/hash, dry-run exacto/revisión de compatibilidad, lista de migraciones y advisors posteriores, smoke PROD y estado PRE confirmado. OAuth real/PWA física no se automatizan ni se dan por comprobados.

## MC70 — Respaldo previo a PROD y recuperación
- Estado: COMPLETO LOCAL (26/10/2026); copia cifrada con clave separada, seis payloads y hashes verificados, archivo PostgreSQL leído íntegramente y recuperación documentada. Sin restauración real ni autorización de publicar PROD.
- Alcance: preservar código/despliegue actual de PROD y exportar copia cifrada/verificable de su base y archivos necesarios; documentar recuperación. No migraciones, publicación, restauración sobre datos reales ni cambios de configuración de PROD.
- Gates: identificar proyecto/commit/deployment; exportación completa comprobada, cifrado y hash, clave protegida separada, cobertura de Storage y límites documentados; comprobar main/tag/Production intactos. No usar datos PROD en tests automatizados.

## MC69 — Publicación PRE y preparación de PROD
- Estado: COMPLETO PRE (26/10/2026); v1.15.36 publicada y verificada, CI415 cuatro jobs PASS y13 comprobaciones remotas PASS. PROD no promovida; diagnóstico y condiciones pendientes documentados.
- Alcance: publicar MC64–68 como v1.15.36 en staging/PRE y emitir diagnóstico documentado de PROD; ninguna modificación de main/Production/v1.0.0 ni datos reales.
- Gates: release:check completo local, cuatro jobs CI, SHA/árbol staging, Vercel READY/alias PRE, smoke de versión/entorno/PWA/rutas; comparar migraciones y aceptación manual pendiente antes de recomendar PROD.

## MC68 — Ventanas coherentes y filtros flotantes de Chats global
- Estado: COMPLETO LOCAL (26/10/2026); validate1656 pruebas y34/34 E2E finales PASS. Sin publicación.
- Alcance: estructura/estilos y cierre accesible compartidos en búsqueda, acciones, ayuda, ubicaciones y QR/imagen; proteger borradores al cancelar; búsqueda/filtros de Chats en lupa flotante con estado, indicador y limpieza. Mantener lógica de datos y navegación. Sin publicación ni migraciones.
- Gates: pruebas de filtros, foco/cierre/errores/borradores, TypeScript/lint/i18n/fuente/build y navegador móvil/escritorio Clásico/Competition claro/oscuro; regresiones de búsqueda, imágenes y acciones.

## MC67 — Numeración y claridad del resumen
- Estado: COMPLETO LOCAL (26/10/2026);9 pruebas y14/14 E2E finales PASS, sin publicación.
- Alcance: numerar los nueve bloques avanzados y mostrar sus rangos en los desplegables cerrados; evitar numeración secundaria ambigua en Duración; incorporar los ajustes posteriores de textos/orden y plantilla en dos columnas del resumen; panel5 coherente, MVP automático avanzado predeterminado y cabeceras compactas sin solapamiento de acciones. Sin cambios de temporadas existentes ni publicación.
- Gates: TypeScript, lint, i18n/presupuesto de fuente, pruebas de creación y recorrido guiado móvil/escritorio claro/oscuro con creación y edición conservadas.

## MC66 — Duración, catálogo global y resumen visual
- Estado: COMPLETO LOCAL (26/10/2026); validate1650 pruebas y46/46 E2E PASS, sin publicación.
- Alcance: jerarquía clara tipo de duración/vueltas; retirar recomendaciones de ubicación del asistente; apertura busca en catálogo global con validación compatible con ubicaciones antiguas; resumen visual completo y editable.
- Gates: integración de ubicación/permisos, componentes, regresión de duración/parejas y apertura en navegador móvil claro/oscuro, TypeScript/lint/i18n/build. Sin migraciones ni publicación.

## MC65 — Borrador completo de creación y correcciones de uso
- Estado: COMPLETO LOCAL (26/10/2026); validate1641 pruebas,42 casos E2E verificados y cierre de tipos/lint/build PASS. Sin publicación.
- Alcance: identidad sin persistir hasta confirmar temporada; salida libre a Competiciones, nombre propio precargado, cabeceras compactas, avanzada visible, Editar abre su bloque y color automático del logo reutilizado. Sin despliegues.
- Gates: pruebas de borrador/guardado/reintento, directorio/permisos, i18n/tipos/lint/build y navegador móvil claro/oscuro; regresiones individuales/parejas.


## MC64 — Creación guiada de ligas y temporadas
- Estado: COMPLETO LOCAL (25/10/2026); validate1635 pruebas,60 focalizadas,40 E2E y12 revisiones finales PASS. Sin publicación.
- Entrega: identidad con logo y modalidad explicada; configuración básica compartida, avanzada opcional y resumen; Atrás sin pérdida, participantes compactos, validación clara y estándares acordados. Reutilizar servicios/componentes; sin despliegue ni migraciones.
- Gates: unidad/integración de creación, tipos/lint/i18n/build y E2E móvil claro/oscuro, ambos formatos y registros, navegación Atrás, logo y estándares.

## MC63 — Publicación de cambios pendientes en PRE
- Estado: COMPLETO PRE (25/10/2026), v1.15.35 publicada y verificada; CI413 cuatro jobs PASS,1632 pruebas y241 E2E/1skip previsto.
- Alcance: publicar la rama de desarrollo y cambios locales aceptados como v1.15.35 en staging/PRE; conservar main, Production y v1.0.0. Migraciones PRE ya aplicadas.
- Gates: release:check local, CI de PR, integración verificada, Vercel READY/alias/commit, health/versión/PWA y rutas sin sesión. OAuth y uso físico de PWA siguen manuales.

## MC62 — Coherencia de calendario, partido, actividad y chats
- Estado: COMPLETO LOCAL (25/10/2026), validate completo y26 E2E PASS; petición explícita anterior a T06.
- Bloques: 1) estados de jornada uniformes con/sin fechas;2) parejas protagonistas y espaciado;3) prioridad de posición por estadísticas personales verificables;4) actividad propia por programación/jornada, sin spoilers;5) cuenta atrás sin scroll vacío y aviso de bloqueo;6) filtros y proximidad de chats globales con color de liga;7) botones legibles compartidos;8) paneles blancos en claro.
- Gates: pruebas unitarias/integración contextual, TypeScript/lint/i18n/build, navegador móvil claro/oscuro × Clásico/Competition, privacidad, permisos y regresiones. Solo local, sin cambios de datos ni despliegues.
- Reanudación: docs/production-hardening/STATUS.md registra cada bloque; Auto-Resume0.6.13 activo/vigilante funcionando, confirmado por herramienta.

## MC61 — Plantillas por parejas e inscripción con compañero
- Estado: COMPLETO LOCAL + DB PRE (25/10/2026); validate completo,1.622 pruebas,26 E2E y PostgreSQL aislado PASS.
- Alcance: parejas visibles dentro de la plantilla al crear temporada, autoinscripción por invitación con elección de compañero ya inscrito o todavía pendiente, revisión de parejas por la organización antes de comenzar y cancelar creación al pie del formulario. Anterior a T06.
- Persistencia: reutilizar pair_number; permitir pendientes solo en autoinscripción antes de empezar, asignaciones atómicas y validaciones de inicio/calendario. Migración nueva, ninguna aplicada se modifica. PRE de base autorizado previamente; código solo local.
- Gates: pruebas de API/UI/cálculos, PostgreSQL aislado con roles/concurrencia, TypeScript/lint/i18n/build y recorridos móviles de ambos modos de inscripción y regresiones individuales.

## MC60 — Creación global y acceso a jornada activa
- Estado: COMPLETO LOCAL (25/10/2026);40 pruebas, TypeScript/lint/tipografía/i18n/presupuesto y12 recorridos de navegador PASS.
- Alcance: crear liga independiente de la última liga/temporada seleccionada, sin saltarse el permiso creator de la cuenta ni desbloquear competiciones programadas; centrar icono de jornada respecto a título y temporada. Petición anterior a T06.
- Gates: pruebas de navegación/temporadas/permisos/calendario, TypeScript/lint, tipografía y E2E móvil/escritorio con fixtures, creación desde cuenta atrás y geometría/scroll del calendario. Sin operaciones remotas.

## MC59 — Borde superior de liga aprobado
- Estado: COMPLETO LOCAL (25/10/2026); diez pruebas, lint y dos recorridos móviles claro/oscuro PASS. Diseño aceptado expresamente por el usuario.
- Alcance: sustituir el marco del logo por borde superior de2px del color propio en Mis ligas. Mantener laterales neutros, progreso y resumen compacto. Prueba solicitada anterior a T06.
- Gates: pruebas existentes de competiciones/navegación, ESLint y comprobación móvil claro/oscuro con fixtures. Sin operaciones remotas.

## MC58 — Centrado vertical de cabeceras Competition
- Estado: COMPLETO LOCAL (25/10/2026);29 pruebas, tipografía/lint y ocho recorridos finales de navegador PASS.
- Alcance: petición expresa anterior a T06. Corregir el padding vertical asimétrico compartido de Competition; auditar pantallas afectadas, preservar Clásico y cabecera inmersiva de chats con safe area.
- Gates: tipografía, pruebas de cabecera/Competition/competiciones, lint y navegador móvil/escritorio claro/oscuro, con medidas de centrado y regresión de chats. Sin operaciones remotas.

## MC57 — Prueba de marco de color en el logo
- Estado: COMPLETO LOCAL (25/10/2026); diez pruebas, lint y dos recorridos móviles claro/oscuro PASS. Diseño de prueba pendiente de valoración.
- Alcance: prueba visual solicitada anterior a T06. En Mis ligas, contorno de 2px del acento propio separado 3px del logo, suavizado en oscuro, sin cambiar el tamaño de las tarjetas ni Competiciones. Pendiente de valoración del usuario.
- Gates: pruebas existentes de competiciones/navegación, ESLint y navegador móvil claro/oscuro con fixtures. Sin operaciones remotas.

## MC56 — Degradado solo en el resumen de Competiciones
- Estado: COMPLETO LOCAL (25/10/2026); diez pruebas existentes y ESLint focalizado PASS.
- Alcance: retirar únicamente el degradado lateral de Mis ligas por indicación del usuario; conservarlo en las tarjetas compactas de Competiciones, mantener progreso y resto del diseño. Anterior a T06.
- Gates: pruebas existentes de competiciones/navegación y ESLint focalizado. Sin operaciones remotas.

## MC55 — Identidad visual de Mis ligas
- Estado: COMPLETO LOCAL (25/10/2026); 23 pruebas focalizadas y ocho recorridos de navegador correctos, tipos/lint/i18n/presupuesto PASS.
- Alcance: petición expresa anterior a T06. Color propio con degradado lateral, temporada/modalidad, estadísticas integradas y progreso; estados suaves compartidos con partidos. Conservar resumen, navegación, datos y permisos.
- Gates: pruebas de competiciones/navegación, tipos, lint, i18n, presupuesto y navegador móvil claro/oscuro con fixtures y accesibilidad. Sin operaciones remotas.

## MC54 — Mis ligas sin selección destacada
- Estado: COMPLETO LOCAL (25/10/2026); diez pruebas existentes, ESLint focalizado, TypeScript e i18n correctos.
- Alcance: petición expresa anterior a T06; retirar la etiqueta Actual y el reborde de liga seleccionada. Estado real de temporada conservado, con «En curso» para evitar ambigüedad. Proponer mejoras visuales sin aplicar todavía el rediseño.
- Gates: pruebas existentes de competiciones/navegación, ESLint focalizado, TypeScript e i18n. Sin operaciones remotas.

## T05c — Ligas por parejas fijas
- Estado: COMPLETO LOCAL + DB PRE (25/10/2026), commit47320b27 y cierre en docs/tournaments/STATUS.md.
- Alcance: petición posterior del usuario, antes de T06 de docs/tournaments/PLAN.md. Modalidad al crear liga; 2–16 parejas, calendario por vueltas/personalizado/manual y clasificación conjunta. Preservar ligas individuales.
- Gates: npm run validate, pruebas focalizadas de API/motor/invitaciones/espectadores, PostgreSQL aislado y E2E móvil/escritorio/Axe; ver docs/tournaments/VALIDATION.md.
- Remoto: exclusivamente migración nueva en Supabase PRE autorizado y verificación de historial/datos; código solo local. Main, Production y v1.0.0 intactos.

## MC40 — Ayuda al pulsar la posición cambiada
- Status: DONE locally (2026-10-23; ocho pruebas de interacción, tipos, lint y cuatro casos de navegador correctos)
- Objective: texto rojo y símbolo de cambio abren la misma ayuda que el icono de Jornada, con teclado y sin navegar al perfil. Centrar el símbolo equivalente mediante SVG, por nueva indicación del usuario.
- Validation: pruebas de interacción, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

## MC39 — Ayuda en el extremo inferior de Jornada
- Status: DONE locally (2026-10-23; ocho pruebas, tipos, lint y cuatro casos de navegador correctos)
- Objective: estado arriba a la derecha y ayuda debajo, alineada al borde inferior del contenido de la cabecera.
- Validation: pruebas existentes, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

## MC38 — Ayuda de posiciones junto al estado
- Status: DONE locally (2026-10-23; ocho pruebas, tipos, lint y cuatro casos de navegador correctos)
- Objective: mover el icono desde el VS a la cabecera de Jornada, manteniendo ayuda y visibilidad contextual.
- Validation: pruebas de ayuda/posiciones, tipos, lint y navegador móvil claro/oscuro. Sin operaciones remotas.

## MC37 — Prueba de enfrentamiento sin tarjeta exterior
- Status: DONE locally (2026-10-23; veinte pruebas, tipos, lint y ocho casos de navegador correctos; diseño de prueba pendiente de valoración)
- Objective: parejas y VS directamente sobre la pantalla, nombres algo mayores y ayuda discreta; preservar recomendaciones y marcador final.
- Validation: pruebas existentes, tipos, lint y capturas móviles claro/oscuro. Sin operaciones remotas; prueba reversible.

## MC36 — Cabecera y separación de Emparejamiento/Programación
- Status: DONE locally (2026-10-23; veinte pruebas, tipos, lint, tipografía y cuatro casos de navegador correctos)
- Objective: reutilizar SectionHeader en Emparejamiento y eliminar espacio adicional de Programación, con separación común de Pagos.
- Validation: pruebas existentes, TypeScript, lint, tipografía y comprobación móvil claro/oscuro. Sin operaciones remotas.

## MC35 — Ubicación uniforme en previews
- Status: DONE locally (2026-10-23; 26 pruebas, TypeScript, lint y controles de ubicaciones/Mis partidos correctos)
- Objective: Población · Ubicación · Pista mediante el formateador compartido; conservar resolución de catálogo, datos y campos ausentes.
- Validation: pruebas de ubicaciones y tarjetas, TypeScript, lint y controles de ubicaciones. Sin operaciones remotas.

## MC34 — Emparejamiento sin etiquetas redundantes
- Status: DONE locally (2026-10-23; nueve pruebas, TypeScript y ESLint focalizado correctos)
- Objective: retirar Pareja A/B y su fila del panel de emparejamiento; mantener nombres, posiciones, VS y resultados.
- Validation: pruebas existentes del panel, tipos y lint focalizado. Sin operaciones remotas.

## MC33 — Alineación y jerarquía de paneles de Partido
- Status: DONE locally (2026-10-23; doce pruebas de formulario, tipos, lint, i18n y cuatro casos de navegador correctos)
- Objective: Por cobrar en cabecera antes del chevron, Resultado destacado y botones de programación iguales. Incluir Población · Ubicación y pista, también en estados finalizado y aplazado.
- Validation: formularios, tipos, lint, i18n y navegador móvil claro/oscuro; sin operaciones remotas.

## MC32 — Claridad visual de Programación, Pagos y Resultado
- Status: DONE locally (2026-10-23; validate completo: 1092 pruebas, tipos, lint y build; cuatro casos de navegador correctos)
- Objective: corregir pulsación clara, destacar ubicación, compactar acciones y alinear parejas con inputs. Sin cambios de permisos ni operaciones remotas.
- Validation: formularios, tipos, lint, build y navegador móvil claro/oscuro con fixtures.

## MC31 - Pulido contextual de la pantalla Partido
- Status: DONE locally (2026-10-23; validate completo: 1092 pruebas, tipos, lint y build; cuatro casos de navegador y repetición final móvil correctos)
- Objective: Aplicar solo propuestas 1, 2, 4, 8, 12, 13, 14 y 15: prioridad por estado, cabeceras comunes, acciones jerarquizadas, pagos claros, parejas y validación de marcador, gestión de resultado agrupada.
- Validation: formularios, permisos, errores, estados previo/pendiente/finalizado y pruebas de navegador con fixtures; tipos, lint, i18n y build.
- Remote changes allowed: ninguno. Sin migraciones ni cambios en reglas deportivas.

## MC30 - Orden visual de jugadores por lado de pista
- Status: DONE locally (2026-10-23; 25 tests focalizados, cuatro casos de navegador, tipos y lint correctos)
- Objective: En el detalle con posiciones recomendadas, Pareja A Revés/Drive y Pareja B Drive/Revés; conservar orden si faltan recomendaciones y no alterar jugadores, equipos ni el símbolo de cambio.
- Validation: orden con equipos invertidos, clasificación cambiante, empates y partidos finalizados; tipos, lint y pruebas focalizadas.
- Remote changes allowed: ninguno.

## MC29 - Unificar etiquetas de resultado
- Status: DONE locally (2026-10-23; 25 pruebas, seis casos de navegador, tipos y lint correctos)
- Objective: Usar en todas las etiquetas Victoria/Derrota el estilo compacto de Actividad personal, con componente común y guía de estilos.
- Validation: tarjetas de liga/personales, ayuda accesible, tipos, lint y comprobaciones visuales con fixtures móviles/escritorio; reutiliza colores de tema existentes.
- Remote changes allowed: ninguno.

## MC26 - Publicar cambios pendientes en PRE
- Status: DONE (2026-10-23; PR #54, PRE 1.15.34 verificado)
- Objective: Publicar el estado visual y funcional aprobado, incluidas las migraciones aditivas de MC21/22, exclusivamente en PRE.
- Validation: npm run validate, Playwright con fixtures, CI y smoke PRE con versión nueva.
- Remote changes allowed: commit/push de la rama, PR/merge a staging, aplicar solo migraciones pendientes verificadas en smash-lob-staging y comprobar deployment PRE, autorizados por el usuario el 2026-10-23. No main, Production ni v1.0.0.
- Stop condition: fallo crítico de gates, destino no identificado o migraciones inesperadas.

## MC27 - Recomendaciones de posición en partidos de liga
- Status: DONE locally (2026-10-23; validate completo y cuatro pruebas de navegador correctas, sin publicar)
- Objective: Recomendar Drive/Revés según preferencias y clasificación actual, respetando preferencias compatibles, sin imponer lados ni modificar datos; ayuda clara en el icono preparado.
- Validation: pruebas de combinaciones, empates, datos ausentes y visibilidad solo en partidos pendientes; tipos/lint y gates pertinentes.
- Remote changes allowed: ninguno; implementación local posterior a la publicación PRE solicitada.

## MC25 - Identidad visual de la Home de Competiciones
- Status: DONE locally (2026-10-23; estados sutiles en previews, 23 pruebas, tipos y lint correctos)
- Objective: Destacar actividad, dar identidad a las tarjetas compactas y compartir el indicador sutil de estado en previews sin cambiar rutas ni datos.
- Validation: pruebas del hub, tarjetas y ayuda de estados; TypeScript y ESLint focalizado.
- Remote changes allowed: ninguno.

## MC24 - Estados y navegación de competiciones
- Status: DONE locally (2026-10-21; 19 pruebas, tipos, lint y build correctos)
- Objective: Mostrar Próximamente en Mis ligas, ocultar invitación de jugador sin plazas libres y unificar etiquetas/flechas de torneo.
- Validation: pruebas focalizadas de invitaciones y navegación, i18n, lint, TypeScript y build.
- Remote changes allowed: ninguno. Sin DB ni publicación.

## MC23 - Creación contextual y entrada a competiciones
- Status: DONE locally (2026-10-21; 15 pruebas focalizadas, tipos, lint, controles y build correctos)
- Objective: Ofrecer Crear liga/torneo solo desde Ajustes abiertos en Competiciones para creadores y reconocer invitaciones de torneo desde Unirme.
- Tasks: ajustar accesos contextuales; reconocer enlaces/códigos conservando mayúsculas de tokens de torneo; validar ligas y torneos con pruebas y gates locales.
- Remote changes allowed: ninguno. Sin DB, commits ni despliegue.
- Stop condition: no cerrar con regresiones en invitaciones de liga o rutas de acceso.

## MC22 - Invitación común y cierre visual de torneos
- Status: DONE locally (2026-10-21; interfaz e invitaciones verificadas, migración pendiente de PRE)
- Objective: Quitar la navbar de Ajustes de torneo, declarar final la clasificación cuando estén todos los resultados, y sustituir invitaciones manuales individuales por un enlace privado común que permita reclamar un perfil libre.
- Tasks: (1) corregir navegación y presentación de clasificación; (2) añadir invitación compartida protegida, selección de perfil y vínculo atómico; (3) validar rutas, migración y regresiones focalizadas.
- Remote changes allowed: ninguno. Preparar migración aditiva para PRE sin aplicarla, sin desplegar, commits ni cambios en Production.
- Stop condition: no completar si un participante puede reclamar más de un perfil, un perfil ya vinculado puede ser reclamado, se expone información por una ruta sin token, o falla una validación crítica.
# Production Hardening Plan
## MC21 - Ajustes contextuales de Competiciones y Torneos
- Status: DONE locally (2026-10-21; cierre explícito sin resultados, migración aditiva preparada para PRE, controles de API, pruebas y build correctos)
- Objective: Evitar que los accesos de administración de liga aparezcan desde Competiciones o un torneo, y proporcionar una gestión mínima propia del torneo con borrado seguro para su creador.
- Tasks: (1) auditar y separar los enlaces de Ajustes globales, de competición y de liga; (2) dirigir el control de Ajustes de un torneo a su pantalla contextual y conservar allí la navegación del torneo; (3) reutilizar la eliminación existente con confirmación, permiso de creador y restricción a torneos finalizados, y validar rutas y regresiones.
- Remote changes allowed: ninguno. Sin migraciones, cambios de datos, despliegue, commits ni cambios en Production.
- Stop condition: no completar si un usuario sin permiso puede ver o ejecutar gestión de torneo, si se muestran acciones de liga dentro de un torneo/Competiciones, o si fallan validaciones críticas.

## MC20 - Etiqueta compacta de vuelta a Competiciones
- Status: DONE locally (2026-10-20; i18n, lint específico, TypeScript y recorrido E2E focalizado correctos)
- Objective: Unificar los controles superiores de vuelta desde los flujos de torneos con la etiqueta compacta «Competiciones», sin cambiar sus destinos ni la navegación.
- Tasks: (1) localizar únicamente los enlaces superiores de retorno; (2) reutilizar la traducción corta ya existente; (3) actualizar las comprobaciones focalizadas y validar tipos, formato de traducciones y pruebas de torneos.
- Remote changes allowed: ninguno. Sin base de datos, despliegue, commits ni cambios en Production.
- Stop condition: no cerrar si cambia una ruta de retorno, se altera un encabezado de contenido o falla una validación crítica.

## MC19 - Mexicano Dinámico Equilibrado
- Status: DONE in PRE (2026-10-21; PR #52 merged in `staging`, migration applied and PRE deployment verified)
- Objective: Incorporar el formato Mexicano Dinámico a los torneos rápidos existentes, generando una sola ronda cada vez según resultados, con participación, descansos, parejas y rivales equilibrados.
- Tasks: (1) añadir el motor determinista puro y sus simulaciones para configuraciones variables; (2) persistir formato, semilla y generación idempotente/transaccional con permisos actuales, además de bloquear resultados históricos que ya tengan rondas posteriores; (3) integrar selector, calendario, clasificación y acción de siguiente ronda, y ejecutar los gates completos sin alterar la Americana.
- Remote changes allowed: únicamente PRE, bajo la solicitud explícita del usuario del 2026-10-21. Aplicar exclusivamente `20261020164339_add_dynamic_mexicano_tournaments.sql` tras un `dry-run` que confirme que es la única pendiente; integrar en `staging`, desplegar y verificar. No tocar Production, `main` ni la etiqueta `v1.0.0`.
- Stop condition: no continuar tras un fallo crítico de equidad, concurrencia, autorización o regresión de Americana; no cerrar sin las simulaciones solicitadas y los gates del repositorio.

## MC18 - Clarificar parámetros y resumen de creación de torneos
- Status: DONE locally (2026-10-19; `npm run validate` correct; rapid-tournament E2E 6/6)
- Objective: Aclarar unidades, ocultar el aviso de plazas manuales cuando no hagan falta, sustituir flechas nativas de selects, simplificar etiquetas de puntuación y condensar el resumen sin totales redundantes.
- Tasks: (1) ajustar etiquetas, selectores, textos condicionales y transiciones; (2) consolidar el resumen con todos los datos útiles no repetidos; (3) actualizar E2E, validar los flujos independientes y vinculados y ejecutar los gates locales.
- Remote changes allowed: ninguno. Sin despliegue, cambios de base de datos, dependencias ni commits.
- Stop condition: no cerrar el hito si falla una validación crítica o se pierde un dato de configuración/logística necesario.

## MC17 - Recuperar el detalle visual de las tarjetas de Mis ligas
- Status: DONE (2026-10-19; PR #51, PRE v1.15.33 READY and smoke verified)
- Objective: Alinear las tarjetas de la lista Mis ligas con la referencia de producción, retirando las etiquetas Próximamente y Toca para entrar.
- Tasks: (1) recuperar logo, descripción y métricas de jugadores/partidos/líder; (2) conservar selección de liga y hacer explícito el estado actual; (3) validar accesibilidad y recorridos móvil/escritorio y publicar solo en PRE.
- Remote changes allowed: rama de trabajo, integración en `staging` y despliegue PRE bajo solicitud explícita del usuario. No tocar Production, `main`, migraciones ni tag `v1.0.0`.
- Stop condition: no publicar si falla un gate crítico o no se verifica el deployment PRE.

## MC16 - Simplificar selectores y aclarar el resumen de torneos
- Status: DONE (2026-10-19; PR #50, CI #400 success, PRE v1.15.32 READY and smoke verified)
- Objective: Usar controles numéricos compactos con flechas, separar pistas/reserva de la logística calculada y mostrar la participación por jugador frente a los totales del torneo, actualizados al cambiar la configuración.
- Tasks: (1) reemplazar los selectores numéricos por stepper accesibles y agrupar la configuración de pistas/reserva antes de participantes; (2) aclarar la logística derivada y el resumen en términos por jugador/total, con cálculos fiables para cualquier combinación permitida; (3) actualizar E2E, ejecutar gates locales y publicar solo en PRE tras verificar migración y deployment.
- Remote changes allowed: únicamente PRE, incluidas las migraciones `20261019145647_rapid_tournament_flexible_americana.sql` y `20261019154207_fix_rapid_tournament_flexible_function_lint.sql` aplicadas a `smash-lob-staging`, bajo la solicitud explícita del usuario del 2026-10-19. No tocar Production, `main` ni tag `v1.0.0`.
- Stop condition: no publicar si falla un gate crítico, la identidad PRE o el estado del deployment no se puede verificar.

## MC14 - Acceso visible para organizar torneos desde la administración de liga
- Status: DONE (2026-10-19; validate passed)
- Objective: Hacer visible Organizar torneo bajo las acciones de competición, permitiendo elegir la temporada de origen y localizar el acceso desde el buscador de Ajustes.
- Tasks: (1) selector de temporada y navegación al formulario existente desde Administración de liga; (2) entrada localizada y restringida por permisos en el buscador de Ajustes; (3) pruebas focalizadas y validación del hito. Completed.
- Validation: prueba focalizada del buscador 4/4; `npm run validate` correcto: 1006 pruebas/251 archivos, TypeScript, ESLint sin errores (4 avisos existentes), build dentro de presupuesto (1202401 bytes gzip/103 chunks).
- Remote changes allowed: ninguno. Sin cambios de base de datos ni despliegue en esta tarea.
- Stop condition: no alterar el flujo actual de creación independiente ni la importación de jugadores existente.

## MC15 - Parámetros flexibles para Americana rápida
- Status: DONE locally (2026-10-19; `npm run validate` and 6/6 rapid tournament E2E passed; migration prepared, not applied)
- Objective: Permitir 8–16 jugadores, 1–4 pistas, reservas de 60/90/120 minutos y preparación ajustable respetando 2 minutos de margen mínimo; el nombre debe proponerse según modalidad y liga sin perder edición manual.
- Tasks: (1) parametrizar configuración y calendario para tamaños/canchas soportados con validaciones de equilibrio; (2) actualizar formulario, previsualización y resumen, incluyendo valor de nombre contextual; (3) probar combinaciones, flujos independiente/vinculado y validar la aplicación. Completed locally.
- Remote changes allowed: ninguno. No tocar migraciones aplicadas, base de datos, Production ni publicar.
- Stop condition: no crear torneos incompatibles con la planificación ni perder compatibilidad de torneos guardados existentes.

## MC13 - Verificación y acceso a participantes de torneos
- Status: DONE (2026-10-19; PRE migrations verified)
- Objective: Mostrar al organizador validaciones reales del calendario fijo, preparar opciones futuras de cuenta atrás/datos ocultos, permitir seleccionar cuentas conocidas y habilitar acceso de participantes mediante invitación segura; cambios solo en desarrollo local hasta validación.
- Tasks: (1) pruebas y panel visual de invariantes/rachas del sorteo; (2) opciones informativas de visibilidad/temporizador marcadas como próximamente; (3) asociación de cuentas conocidas y flujo privado de invitación con migración nueva y pruebas de permisos.
- Validation: `npm run validate` (1005 pruebas, typecheck, lint sin errores y build dentro de presupuesto), E2E de torneos 6/6, rutas/invitaciones 14/14; migraciones aplicadas y verificadas solo en PRE, con RLS y privilegios revisados.
- Remote changes allowed: aplicar únicamente en PRE (`smash-lob-staging`, `miadjotkucgluwbrgeih`) las migraciones versionadas necesarias para cuentas participantes y vínculo torneo-liga-temporada, bajo solicitud explícita del usuario. Sin despliegue, cambios en main/Production/tag v1.0.0 ni uso de cuentas personales.
- Stop condition: si la invitación no puede preservarse de forma segura durante login o el aislamiento del torneo no queda demostrado, mantener el acceso por invitación bloqueado y no declarar MC13 completo.

## MC12PRE - Pulir los círculos de RACHA y publicar en PRE
- Status: DONE (2026-10-18; PR #49, CI 4/4, PRE v1.15.31 READY y smoke verificado)
- Objective: Renombrar FORMA a RACHA y dar más presencia a las V/D blancas con mayor tamaño y sombra de texto, manteniendo círculos verdes/rojos, borde blanco y sombra; publicar solo en PRE cuando pasen todos los gates.
- Remote changes allowed: rama de trabajo, PR/merge a staging y PRE por solicitud explícita del usuario. No Production, main, base de datos ni tag v1.0.0.
- Validation: `npm run validate` (999 pruebas/250 archivos; repetición aislada limpia tras timeout de workers al ejecutar en paralelo con E2E), build 1195395 bytes gzip/103 chunks, E2E 107/107 y un skip previsto, auditoría runtime 0 vulnerabilidades; CI #395 4/4 success. PR #49 integrado en `staging` `a27422963f64695b0d52adb30807a0117051cd8d`; deployment Vercel `dpl_CMgAqTznm19ni2NsotQQq8ABj45q` READY con alias PRE; health 200/version 1.15.31/environment pre y SW v1.15.31. Sin cambios DB/dependencias; `main` y `v1.0.0` intactos.

## MC11PRE - Corregir los colores del grafismo FORMA y publicar en PRE
- Status: DONE (2026-10-18; PR #48, CI 4/4, PRE v1.15.30 READY y smoke verificado)
- Objective: Mostrar V en círculos verdes y D en círculos rojos y garantizar legibilidad del título FORMA en perfiles global y de liga; publicar solo en PRE después de los gates locales y remotos.
- Validation: `npm run validate` (999 pruebas/250 archivos; TypeScript y build); E2E 107/107 (1 omisión prevista); auditoría runtime 0 vulnerabilidades; CI #392 4/4 success. PR #48 integrado en `staging` `6ae40381b13c977acd84907b800a516f7a1b8323`; deployment Vercel `dpl_CPMMW5qQ56hA8USd3rGzdbEBo1aV` READY con alias PRE; health 200/version 1.15.30/environment pre y SW v1.15.30.
- Remote changes allowed: rama de trabajo, PR/merge a staging y PRE por solicitud del usuario. No Production, main, base de datos ni tag v1.0.0.
- Stop condition: no fusionar ni publicar si falla un gate crítico.

## MC10PRE - Publicar ajustes de perfil y chats globales
- Status: DONE (2026-10-18; PR #47, CI 4/4, PRE v1.15.29 READY y smoke verificado)
- Objective: Publicar v1.15.29 en staging/PRE con FORMA usando el acento actual, cabeceras de perfil sin tarjeta anidada y bandeja global de chats de liga/amistosos agrupada por estado.
- Validation: npm run validate (998 pruebas), E2E 107/107 (1 skip previsto), audit de producción 0 vulnerabilidades; CI #390 4/4 success. PR #47 integrado en staging `1a24aef06f0b8b0883868a351686b0f37aac8e28`; deployment Vercel `dpl_S9c6eRhp3prJpWkrggQpLzkhKmty` READY, alias PRE verificado, health 200/version 1.15.29/environment pre, manifest y SW v1.15.29 y rutas de Competiciones, Chats y perfil 200.
- Remote changes allowed: push de codex/mis-competiciones, PR/merge a staging y publicación exclusivamente PRE autorizados explícitamente por el usuario. Sin DB, main, Production ni tag v1.0.0.
- Stop condition: cualquier gate crítico fallido bloquea merge/publicación.

## MC10 - Ajustes visuales de perfil y bandeja global de Chats
- Status: DONE (2026-10-18; integración en PRE v1.15.29)
- Objective: Utilizar el acento activo en FORMA conservando V verde/D rojo y contraste; quitar la tarjeta interior de ambas cabeceras; mostrar chats de amistosos y de todas las ligas accesibles agrupados en Activos, Próximos y Finalizados.
- Tasks: (1) identidad visual compartida de perfiles; (2) agregar chats de liga al listado global conservando permisos y calendario progresivo, con secciones ordenadas por estado; (3) validar perfiles/chats y preparar v1.15.29 para PRE.
- Validation: 45 pruebas unitarias focalizadas; npm run validate y E2E completos con fixtures; smoke PRE de salud/PWA/rutas con acceso Vercel autenticado. No se usaron cuentas personales ni datos de Production.
- Remote changes allowed: none for local implementation; PRE publication only under MC10PRE.

## MC09PRE - Publicar perfiles unificados en PRE
- Status: DONE (2026-10-18; PR #46, CI 4/4, PRE v1.15.28 READY y smoke verificado)
- Objective: Publicar v1.15.28 desde staging para probar en la PWA la navegación y los perfiles global/de liga unificados.
- Validation: npm run validate, E2E 107/107 (1 skip previsto), npm audit sin vulnerabilidades; CI cuatro jobs correctos. PR #46 integrado en staging b342d196; deployment Vercel READY, alias PRE, health v1.15.28/pre, rutas 200, service worker v1.15.28 y API protegida 401.
- Remote changes allowed: push de codex/mis-competiciones, PR/merge a staging y publicación exclusivamente PRE por solicitud explícita del usuario. Sin DB, main, Production ni tag v1.0.0.
- Stop condition: cualquier gate crítico fallido bloquea merge/publicación.

## MC09 - Perfiles unificados y disponibilidad contextual
- Status: DONE (2026-10-18; validate completo, 998 pruebas y E2E móviles focalizados correctos)
- Objective: Corregir navegación global, mostrar solo accesos con datos o permiso creator, mantener una Action Bar consistente y unificar la presentación de perfil global y de liga.
- Tasks: (1) navegación, secciones y barra superior; (2) cabecera, pestañas y rendimiento compartidos conservando las métricas de liga; (3) filtros globales y FORMA cronológica con validación móvil.
- Validation: npm run validate (controles, lint, TypeScript, 998 pruebas, build y presupuesto) y E2E móviles de Competiciones, perfil, volver desde Mis partidos, QR y acceso espectador. 28 flujos pasaron antes de la corrección final y los cuatro flujos afectados volvieron a pasar después.
- Limitation: los participantes de torneos rápidos son nombres manuales sin identidad de cuenta; no atribuirlos a perfiles hasta que exista vínculo fiable. No se muestran filtros ni pestaña de torneos en perfiles.
- Remote changes allowed: none. Sin commits, publicación ni DB.

## MC08 - Invitaciones según contexto y acceso a Competiciones
- Status: DONE (2026-10-18;35 pruebas focalizadas,9 E2E móviles,tipos/lint/build y controles correctos)
- Objective: Textos naturales, ocultar opciones sin permiso/contexto, QR directo con una opción y acceso Competiciones adaptable en Home.
- Validation: Permisos, selección y reapertura; TypeScript, ESLint, i18n, tipografía, controles Mis partidos y presupuesto133852/133900. Nueve E2E móviles con fixtures pasan, incluido Axe y geometría a320/393px. Capturas revisadas en .quality-artifacts/mc08-20261018.
- Future ideas: invitaciones de torneo como jugador/espectador al ampliar participantes y sistema de amigos solicitado por el usuario.
- Remote changes allowed: none. Sin commits, publicación ni DB.

## MC07 - Elegir invitación con botones
- Status: DONE (2026-10-18;4 pruebas,recorrido móvil320px,lint/tipos/build/i18n/presupuesto correctos)
- Objective: Tres botones iniciales; al elegir mostrar solo QR y acciones. Cerrar/reabrir devuelve a la selección.
- Validation: pruebas de selección, reapertura y respuestas tardías; lint/tipos/i18n/presupuesto y recorrido móvil con fixtures.
- Remote changes allowed: none. Sin commits, publicación ni DB.

## MC06 - Selector de invitaciones y color de etiquetas
- Status: DONE (2026-10-18;50 pruebas,9 E2E móviles,lint/tipos/build/controles y Axe correctos)
- Objective: Compartir liga como espectador/jugador o la app con el QR existente; etiquetas con el color de su liga adaptado al tema.
- Validation: pruebas de selección/permisos/carreras y colores, lint/tipos/i18n/presupuesto y E2E móvil con fixtures.
- Remote changes allowed: none. Sin commits, publicación, migraciones ni operaciones remotas de DB.

## MC05 - Icono, navbar uniforme y detalle de ligas
- Status: DONE (2026-10-18;35 pruebas,6 E2E móviles,lint/tipos/build y controles correctos)
- Objective: Flechas SVG sin burbuja, cuatro destinos iguales, bordes uniformes y tarjetas ampliadas en Mis ligas.
- Validation: lint/tipos, controles i18n/Mis partidos y pruebas focalizadas; E2E móvil con fixtures, geometría y accesibilidad.
- Remote changes allowed: none. Sin commits, publicación ni DB.

## DEVORIGIN01 - Permitir el origen local de desarrollo
- Status: CANCELLED (2026-10-18; usuario resolvió la configuración y pidió detener esta intervención)
- Objective: Permitir 192.168.3.34 en allowedDevOrigins sin ampliar el acceso con comodines.
- Validation: ESLint de next.config.ts y comprobación HTTP del recurso de desarrollo con ese Origin.
- Remote changes allowed: none. Sin commits, publicación ni DB.

## MC04 - Compactar controles y unificar geometría de navegación
- Status: DONE (2026-10-18;18 pruebas,8 recorridos móviles,geometría/contraste y lint/tipos/build E2E correctos)
- Objective: Selector de actividad con icono compacto, espacio entre tarjetas, badges ajustados al texto y navbars global/torneos con estilos existentes de Ligas, sin modificar la barra de Ligas.
- Validation: pruebas de paso del carrusel, geometría móvil 320/393 px, badges cortos/largos y navbars; lint/tipos/i18n/presupuestos y build E2E con fixtures.
- Remote changes allowed: none. Sin commits, despliegue, DB ni dependencias.

## MC03PRE - Publicar tarjetas y cabecera de actividad
- Status: DONE (2026-10-18; CI386 cuatro jobs success, PRE1.15.27 READY/alias/rutas/PWA y autenticación verificados)
- Objective: Publicar v1.15.27 en staging/PRE para probar navbar centrada, swipe y selector compacto desde la PWA.
- Validation: validate, E2E completos, auditoría runtime y CI; verificar staging/READY/alias, versión/SW/manifiesto y rutas principales.
- Remote changes allowed: commits/push, PR/merge a staging y publicación exclusivamente PRE, autorizados por el usuario. Sin DB, main, Production ni v1.0.0.
- Stop condition: fallo crítico impide la publicación.

## MC03H - Compactar selector de actividad personal
- Status: DONE (2026-10-18; 8 pruebas y recorrido táctil 320/393 px, geometría, lint/tipos y build E2E correctos)
- Objective: Título del encuentro y botón Próximo/Último en una fila, con acción a la derecha y swipe conservado.
- Validation: ESLint, TypeScript, i18n/presupuesto y recorrido móvil 320/393 px con controles y gestos.
- Remote changes allowed: none. Sin commits, despliegue, DB ni dependencias.

## MC03 - Etiquetas y tarjetas deslizables en móvil
- Status: DONE (2026-10-18; pruebas, seis recorridos móviles, tipos/lint/build y capturas 320/393 px correctos)
- Objective: Centrar navbar global sin palabras cortadas, ajustar etiquetas largas y deslizar próximos partidos Liga/Mío y actividad Próximo/Último con parada completa.
- Validation: pruebas de selección/gestos, regresiones de permisos, TypeScript, lint, i18n, presupuestos y build; E2E móvil 320/393 px y revisión visual.
- Remote changes allowed: none. Trabajo local sin commits, publicación, DB ni dependencias.
- Stop condition: fallo crítico bloquea el cierre.

## MC02PRE - Publicar navegación global de Competiciones
- Status: DONE (2026-10-18; 987 pruebas, 100 E2E, CI y PRE1.15.26 READY/alias/rutas/PWA verificados)
- Objective: Publicar v1.15.26 en staging/PRE para validar la nueva navegación desde la PWA.
- Validation: validate, E2E completos, auditoría runtime y CI; READY/commit/alias, health/versión/SW y las rutas resumen/listados.
- Remote changes allowed: commits/push de rama, PR/merge a staging y publicación exclusivamente PRE autorizados por usuario. Sin DB, main, Production ni v1.0.0.
- Stop condition: fallo crítico bloquea publicación.

## MC02 - Navbar global y resumen de Competiciones
- Status: DONE (2026-10-18; 987 pruebas cubiertas, 12 recorridos E2E, controles y build correctos)
- Objective: Reutilizar PersonalMatchesNav en resumen/listados de Competiciones, retirar pestañas y sección Amistosos del hub, mantener barras de liga/torneo y navegación Atrás.
- Validation: selección exclusiva de Navbar, rutas/listados con y sin liga/temporada, resumen y amistosos; TypeScript, lint, i18n, presupuesto/build y recorridos móviles con fixtures.
- Remote changes allowed: none. Sin commits, publicación, DB ni dependencias.
- Stop condition: fallo crítico bloquea el cierre.

## T02PRE - Publicar ajustes de avisos y gestión de finalizados
- Status: DONE (2026-10-17; CI/local correctos, PRE1.15.25 READY/alias/versión/PWA/API verificados)
- Objective: Publicar v1.15.25 en staging/PRE para probar sonidos, Ajustes y reinicio/borrado desde PWA.
- Validation: validate, E2E completos, auditoría runtime y CI; verificar commit remoto, Vercel READY/alias, health/PWA, ruta Ajustes y API autenticada.
- Remote changes allowed: commits/push de rama, PR y merge a staging y PRE, autorizados explícitamente por el usuario. Migración ya aplicada: solo verificar registro. Sin cambios de main, Production ni v1.0.0.
- Stop condition: fallo crítico bloquea publicación.

## T02 - Ajustes de avisos y gestión de torneos finalizados
- Status: DONE (2026-10-17; 971 pruebas, cinco recorridos móviles, build y migración PRE verificados)
- Objective: Panel móvil compartido Seguimiento/Ajustes, prueba de sonido, ocho tonos y voz automática; reinicio temporal local/PRE hasta 25 octubre y borrado de finalizados con confirmación y autorización del creador.
- Validation: audio/API/SQL, búsqueda de ajustes y happy path móvil claro/oscuro; TypeScript, ESLint, i18n, presupuestos y build. Fixtures ficticios, sin datos personales.
- Remote changes allowed: aplicar/verificar solo la nueva migración aditiva en PRE miadjotkucgluwbrgeih, según autorización de validación PRE del módulo; verificación SQL con fixtures sintéticos y rollback. Sin commits, publicación, datos reales ni PROD.
- Stop condition: fallo crítico de validación impide cerrar o publicar.

## T01APRE - Publicar avisos configurables en PRE
- Status: DONE (2026-10-17; gates locales/CI y PRE1.15.24 READY/alias/SW/seis WAV verificados)
- Objective: Publicar v1.15.24 con preferencias de sonido/voz y cuenta atrás para pruebas físicas de PWA.
- Validation: validate, E2E, auditoría runtime y CI; verificar staging/READY/alias, versión/SW y seis WAV con hash idéntico al local.
- Remote changes allowed: commits/push de rama y PR/merge staging para PRE. Sin DB, cambios de main, Production o v1.0.0.

## T01A - Avisos configurables de torneos
- Status: DONE (2026-10-17, local; 21 pruebas focalizadas, dos happy paths móviles y gates correctos)
- Objective: Preferencias locales de sonido/intensidad/modo/idioma/voces, inglés seguido de español con pausa y cuenta atrás de tres segundos sin alterar horarios.
- Validation: pruebas de preferencias, secuencias y cancelación/visibilidad; límites temporales, TypeScript/ESLint/i18n/presupuesto/build y happy paths móviles claro/oscuro con controles y persistencia.
- Remote changes allowed: none. Sin DB, migraciones, dependencias, commits ni publicación.

## T01PRE - Publicar Mis Competiciones y torneos en PRE
- Status: DONE (2026-10-17; gates locales/CI correctos y PRE1.15.23 READY/alias/health/SW verificados)
- Objective: Registrar rama, preparar v1.15.23, validar con lockfile exacto en copia aislada y publicar staging/PRE para pruebas físicas de PWA.
- Validation: npm run validate, npm run test:e2e y auditoría runtime; verificar SHA remoto, Vercel READY/rama/alias, health/version/PRE, SW y autenticación de API. OAuth, audio y bloqueo físicos quedan manuales.
- Remote changes allowed: commits y push de codex/mis-competiciones y staging, despliegue/alias exclusivamente PRE. Migraciones de torneos ya aplicadas: solo comprobar registro. Main, Production y v1.0.0 intactos.
- Stop condition: fallo crítico de validación; no publicar hasta resolverlo.

## T01H - Cabeceras compactas de torneos
- Status: DONE (2026-10-16, local; dos happy paths móviles y gates correctos)
- Objective: Compactar creación y cabecera compartida de las cinco vistas siguiendo la identidad/tipografía de Home de ligas; nombre con ancho completo, contexto breve y sin filas redundantes.
- Validation: ESLint, TypeScript, tipografía/i18n/presupuesto y happy paths móviles claro/oscuro con capturas 393×852.
- Remote changes allowed: none. Sin datos, migraciones, commits ni despliegue.

## T01L - Seguimiento desde inicio real con avisos
- Status: DONE (2026-10-16, local; 36 pruebas focalizadas, cinco recorridos móviles y build correctos)
- Objective: Reutilizar started_at para preparación de 2 min, seis rondas/pausas automáticas, calendario coherente, avisos de inicio/dos minutos/fin y Wake Lock opcional; actualización local ligera y recuperación tras recargar.
- Validation: límites temporales y avisos unitarios, integración de horarios, TypeScript/ESLint/i18n/presupuesto/build y happy path E2E móvil con reloj simulado, sonido/Wake Lock simulados y capturas 393×852. Sonido audible y bloqueo físico son comprobaciones manuales en dispositivo.
- Remote changes allowed: none. Sin migraciones, datos remotos, commits ni despliegue.

## T01N - Corregir la vuelta a Mis Competiciones con torneos
- Status: DONE (2026-10-16; 8 pruebas focalizadas y dos recorridos móviles completos correctos)
- Objective: Evitar el error Intl al renderizar fechas de torneos en el hub. Reproducido con listado no vacío en ES/EN/EU.
- Validation: pruebas del hub, ESLint/TypeScript/i18n y happy path móvil con vuelta al hub en borrador y finalizado.
- Remote changes allowed: none. Sin DB, commits ni publicación.

## T01VC - Compactar el calendario para móvil
- Status: DONE (2026-10-16; seguimiento CSS de descansos en línea validado en los dos happy paths móviles)
- Objective: Cabeceras y parejas compactas, ubicación única bajo la fecha, sin etiquetas Pareja 1/2 ni acceso rápido a rondas; fuentes y radios coherentes con AppCard/Mis Partidos.
- Validation: ESLint, TypeScript, i18n/tipografía/presupuesto, happy path E2E mobile claro/oscuro y capturas completas 393×852 a escala CSS; mantener prueba estrecha 320 px y accesibilidad.
- Remote changes allowed: none. Sin DB, commits ni publicación.

## T01V - Pulido visual de creación y calendario de torneos
- Status: DONE (2026-10-16, local; 11 pruebas focalizadas, 4 happy paths y 6 regresiones E2E correctos)
- Objective: Mejorar jerarquía del formulario, claridad de rondas/pistas/parejas y evitar solapamientos en la Navbar del torneo, conservando el happy path y las opciones futuras bloqueadas.
- Validation: ESLint selectivo, TypeScript, i18n, quality:source, pruebas focalizadas de torneos y E2E mobile/escritorio con fixtures; revisar capturas claro/oscuro, 320 px y navegación sin desbordamientos.
- Remote changes allowed: none. Sin DB, commits, despliegue ni pruebas automatizadas con cuentas reales.

## T01 - Torneo rápido Americana 12 jugadores (happy path)
- Status: DONE (2026-10-16, rama local `codex/mis-competiciones`; PRE validado con fixtures sintéticos)
- Objective: Implementar creación privada por el organizador, plantilla fija Americana 12/2/120, sorteo antes de iniciar, seis rondas persistidas, resultados, clasificación individual y finalización dentro de la PWA.
- Scope: Una única modalidad y configuración fija según la solicitud Smash & Lob Torneos Rápidos V1. Nuevas rutas `/tournaments/*`, API autenticada, tablas propias con RLS y una migración aditiva. No modificar ligas/amistosos/tema ni funcionalidades futuras.
- Validation: 953 pruebas en 244 archivos; cuatro E2E mobile (hub claro/oscuro, historial y torneo crear→finalizar); TypeScript, traducciones, presupuesto, ESLint de todos los archivos tocados y build correctos. PRE confirmó tablas, RLS/grants y flujo transaccional completo con cuenta sintética eliminada al terminar. El comando global `npm run lint` se dejó tras más de cuatro minutos sin salida; ESLint selectivo pasa. Docker/pgTAP no disponible localmente/en PRE; las verificaciones DB se ejecutaron en PRE por SQL transaccional. No hay datos de usuarios de prueba persistidos. Presupuesto total ampliado de forma acotada a 133500; resto sin cambios.
- Remote changes allowed: Aplicar y verificar exclusivamente la nueva migración en el PRE identificado. Sin push, merge, despliegue, escritura de torneos de usuarios ni cambios de PROD.
- Stop condition: Un fallo crítico de seguridad, datos, migración o gates detiene este hito; conservar archivos y datos locales para reanudar.

## MC01P - Aligerar la actividad personal del hub
- Status: DONE (2026-10-16; 10 pruebas focalizadas, lint/tipos/presupuesto y seis recorridos Playwright correctos; capturas móvil/escritorio revisadas)
- Objective: Ocultar fecha/lugar solo en la tarjeta del último encuentro del resumen y mover Ver Mis partidos a su cabecera. Conservar metadatos en detalle, historial y próximos partidos.
- Validation: pruebas focalizadas de hub/tarjeta/navegación, lint de archivos afectados, TypeScript y recorridos Playwright del hub con fixtures; revisar capturas y `git diff --check`.
- Remote changes allowed: none. Sin commits, instalaciones, DB ni publicación.

## MC01 - Mis Competiciones: hub existente
- Status: DONE (2026-10-16; primera versión local, 943 pruebas, 90 E2E y cuatro recorridos finales del hub correctos; revisión visual móvil/escritorio claro/oscuro)
- Objective: Convertir `/leagues` en Mis Competiciones con vistas Resumen/Ligas/Torneos/Amistosos según petición del 2026-10-16: resumen con hasta dos ligas y encuentro propio destacado, listado completo con finalizadas plegadas. Conservar rutas, permisos, tema y Navbars. Torneos solo como aviso sin destino.
- Scope: primera tarea de `docs/torneos-auditoria-navegacion.md`; rama local `codex/mis-competiciones`, descendiente de staging, sin commits ni publicación.
- Validation: pruebas focalizadas existentes de navegación/idiomas, `npm run validate`, `npm run test:e2e` con entorno ficticio y `git diff --check`. Revisar cualquier diferencia visual antes de aceptar baselines.
- Remote changes allowed: lectura de referencias Git; no push, merge, despliegue ni operaciones DB.
- Stop condition: una validación crítica fallida impide cerrar el hito o avanzar a las tareas 2/3 de la auditoría.

## C01 - Audit correction: validation toolchain (BUG-040)
- Status: DONE (2026-10-10; BUG-040 fixed in the local correction branch and validated in isolation)
- Objective: Remove vulnerable test dependencies and obsolete overrides before executing further code or advancing to functional corrections.
- Acceptance: complete dependency audit has no high/critical findings; compatible tools retain existing validation coverage.
- Validation: `npm audit --json`, `npm audit --omit=dev --json`, then (only if the security gate passes) `npm run validate` and `npm run test:e2e` in the isolated placeholder checkout.
- Remote changes allowed: package registry reads/downloads only; no push, deployment or database operations.
- Stop condition: an unresolved high/critical finding keeps this milestone incomplete and blocks subsequent milestones. Do not silence advisories or downgrade the Next.js lint configuration to bypass them.
- Depends on: completed documentary audit A03.

Last updated: 2026-07-16 23:31:46 +02:00

## C02 - Auth, invitation and Push trust boundaries (BUG-001/005/008/009)
- Status: DONE (2026-10-10; full validate passed, 887 tests / 224 files)
- Acceptance: auth reads cannot overwrite profile/privileges; wrong invitation codes fail closed; public invitation previews exclude financial/private incident information; only supported Push providers can be stored or sent to, including stored/retry endpoints.
- Validation: installed full dependency audit; targeted in-memory auth/invite/Push regressions; `npm run validate` in the isolated placeholder checkout. No real network Push or user data.
- Remote changes allowed: documentation/registry reads only; no push, deploy or data writes.
- Depends on: C01.

## C03 - Account export and localized confirmation (BUG-002/004)
- Status: DONE (2026-10-10; 13 targeted tests, lint and TypeScript passed)
- Acceptance: export uses account IDs, player IDs and email columns correctly; query errors fail explicitly; localized confirmation matches the displayed instruction while sending a stable API token.
- Validation: in-memory account export and localized confirmation regression tests, targeted ESLint and TypeScript in the isolated checkout.
- Remote changes allowed: none.
- Depends on: C02. Account deletion transaction/privacy lifecycle (BUG-003) is a separate database milestone, not claimed resolved here.

## C04 - Score and ranking consistency (BUG-030/031)
- Status: DONE (2026-10-10; targeted tests, lint, TypeScript and typography passed; final visual regression gate will review changed tie labels)
- Acceptance: completed results have a winner across supported formats; tied ranking positions are consistent in UI/export. Cent allocation (BUG-029) must also update the existing SQL booking rebuild and belongs to the later financial database milestone.
- Validation: targeted arithmetic/result/ranking regression suites, targeted ESLint, TypeScript and relevant source checks in isolation.
- Remote changes allowed: none.
- Depends on: C03.

## C05 - Document language, modal keyboard focus and version docs (BUG-034/036/038)
- Status: DONE (2026-10-10; 10 targeted tests, lint, onboarding check and TypeScript passed)
- Acceptance: document lang follows selected locale; guided tour traps focus and restores it on close; README does not describe an obsolete release as current.
- Validation: jsdom language/focus regressions, existing onboarding tests/check, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C04.

## C06 - Waitlist membership and position (BUG-006/007/010)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: own queue position is derived from the full waiting order without exposing other users; cancelled entries can rejoin at the end; own promotion identified by authenticated account ID rather than player ID.
- Validation: waitlist API/helper regressions with in-memory data, targeted lint, TypeScript.
- Remote changes allowed: none.
- Depends on: C05. Capacity reservation and promotion expiration (BUG-011/012) remain separate atomic database work.

## C07 - Chat coordination history and activity pagination (BUG-027/039)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: chat coordination does not depend on the recent text window; equal activity timestamps do not skip records between pages and visibility filtering does not terminate pagination prematurely.
- Validation: API/helper regression tests with synthetic data, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C06.

## C08 - Season duplication length and round order input (BUG-017/021)
- Status: DONE (2026-10-10; four targeted tests, lint and TypeScript passed)
- Acceptance: duplication retains valid custom schedule length; partial/invalid round permutations fail before writing any match.
- Validation: duplication and round order regression tests, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C07. Atomic duplication/round mutation failures remain separate database work (BUG-018/019/022).

## C09 - Push retry persistence errors (BUG-033)
- Status: DONE (2026-10-10; 32 directed tests, lint and TypeScript passed)
- Acceptance: queue reads/writes cannot silently fail; a delivery persistence error is not handled as a transport failure or counted as durable success.
- Validation: synthetic error injection for queue operations, existing Push regressions, lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C08. Push transport remains at-least-once; this milestone does not claim exactly-once delivery.

## C10 - Protect edited drafts from idle PWA updates (BUG-035)
- Status: DONE (2026-10-10; six directed tests, lint and TypeScript passed)
- Acceptance: blurring an edited field and waiting cannot silently reload the app; clean sessions still update automatically. A generic edited control is conservatively protected for the rest of the app session because it cannot prove successful persistence.
- Validation: idle update/draft regressions, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C09.

## C11 - Availability time zone comparisons (BUG-026)
- Status: DONE (2026-10-10; nine targeted tests, lint and TypeScript passed)
- Acceptance: availability intervals refer to actual instants in each player's saved time zone; date overrides and daylight saving transitions do not produce false full coverage.
- Validation: cross-zone/date override/DST recommendations and existing availability suites, targeted lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C10.

## C12 - Extended calendar capacity independent of player IDs (BUG-020)
- Status: DONE (2026-10-10; 29 targeted tests including 85 boundary cases, lint and TypeScript passed)
- Acceptance: advertised custom duration boundaries work with arbitrary real IDs, not only the names used to precompute maximums; all existing calendar invariants remain enforced.
- Validation: 8–24-player boundary sweep with arbitrary IDs, existing flexible duration and calendar suites, lint and TypeScript.
- Remote changes allowed: none.
- Depends on: C11.

## C13 - Cumulative local regression gate
- Status: DONE (2026-10-10; validate, 922 tests, 76 E2E, full/runtime audits and diff check passed)
- Acceptance: all local non-database corrections pass complete validation and isolated browser regressions; changed visuals are reviewed before accepting any baseline updates.
- Validation: `npm run validate`, `npm run test:e2e`, full and runtime dependency audits, `git diff --check` in the isolated placeholder checkout.
- Remote changes allowed: registry reads only; no push, deployments, user data or PRE/Production writes.
- Depends on: C12.

## C14 - Database transaction validation prerequisite
- Status: DONE (2026-10-10; identical database quality script passed in worker-local disposable Supabase, GitHub Actions 38078565124/job 114290558197; workstation Docker remains unavailable)
- Acceptance: an isolated disposable local Supabase/PostgreSQL engine can replay migrations, run pgTAP/schema lint and verify restore/upgrade before transactional corrections are accepted.
- Validation: `npm run database:quality` in the isolated checkout, using synthetic data only.
- Remote changes allowed: following the user's PRE publication request and delegated judgment, push the validated correction candidate and open a PR to staging solely to run the existing isolated GitHub Actions database gate. No remote database writes or deployment before that gate passes. The worker-local disposable Supabase stack uses synthetic data only.
- Stop condition: missing local engine or failed database gate blocks transactional implementation/acceptance; preserve the 17 open findings and do not bypass the database gate with mocks.
- Depends on: C13. Following domains: account lifecycle BUG-003; league/season transactions BUG-013/014/015/016/018/019/037; result/calendar/incident atomicity BUG-022/023/024/025; financial/participant consistency BUG-028/029/032; waitlist reservation/expiration BUG-011/012.

## C15 - Publish validated audit corrections to PRE
- Status: DONE (2026-10-10; v1.15.10 published to PRE, PR #20/staging 33604cee verified; all four final candidate and staging CI jobs passed; deployment/alias/health/access smoke verified)
- Acceptance: coherent new app/PWA version, all local release gates pass, final candidate CI passes, staging merge and PRE deployment/alias/health are explicitly verified. No unresolved transactional finding is represented as fixed.
- Validation: version/source/secret checks, npm run validate, npm run test:e2e, dependency audits; existing four release-quality jobs; authenticated PRE smoke and remote SHA verification.
- Remote changes allowed: candidate branch/PR, staging merge and PRE deployment only. No remote database writes; main, Production and v1.0.0 untouched.
- Depends on: C14. Seventeen database transaction findings remain OPEN for separately scoped correction milestones.

## C16 - Correct installed app system surfaces
- Status: DONE (2026-10-15; native black verified on Android, pre-existing inset/appearance accepted by the user; reviewed v1.15.22 published and verified on PRE and Production)
- Final checkpoint: PR39/staging cb86dc76 and PR40/main 9578fe00 published after successful CI368/369. PRE dpl_6fiDVFPEcnW5vjWYG2Bu6L9KrBnK and Production dpl_HDP2LSmSA27D1gxCv5CkFAvd2Snz READY with correct SHA/aliases. Production smoke and public manifest/SW/HTML/removed-diagnostic checks passed. Temporary diagnostic code and unused CSS variable removed. Height was accepted, not corrected; no transparency, automatic native-update timing or new physical Production validation claimed. Historical checkpoints below retain their original status at the time of observation.
- Additional acceptance verified on Android13/Chrome153: same PRE package updated code1→2, firstInstallTime15-Aug preserved, native colors become black, and user confirms session retained without login. Calendar was accelerated manually through chrome://webapks; automatic completion and Android16 in-place are not claimed. Native black remains accepted on the original Xiaomi. Follow-up remains open for a measured extra88px outside the web viewport above Android13's44px navigation bar, coinciding with mandatory gesture insets. User updated Chrome153→155.0.8059.39; stable loaded PRE retains exactly the same viewport/insets, so that update does not fix the gap. No justified CSS workaround has been found. No reinstall, data clear, manifest marker experiment or Production action.
- PRE v1.15.21 passed local/CI gates and is deployed/verified. Physical CSP violation fixed for four public PRE icons. Authorized fresh installation produced a native PRE WebAPK with #FF000000 theme/background colors; ADB screenshot confirms pure black gesture region and a contrasting native indicator. User confirms black and persistence across theme changes and closing/reopening. Keyboard, explicit background restoration and frame-by-frame cold-start flash checks remain residual manual coverage, not claimed verified. No transparency, flags, wrapper migration or Production changes.
- Diagnostic support delivered in PRE v1.15.14: explicit technical report with server whitelist, Production denial, incidence code and JSON fallback. Native bar acceptance remains open.
- Physical result in PRE v1.15.20: FAILED (user screenshot 111744.jpg, 2026-10-15); white native gesture region persists after black web canvas correction. Current USB inspection confirms PRE WebAPK versionCode 3 (11-Oct) still contains white theme/background colors. Native package update and a verified before/after result are the next gate.
- Acceptance: user selected fixed pure black native gesture navigation across all themes, including startup/resume (2026-10-15); transparency research is retained in ANDROID_GESTURE_NAVIGATION_AUDIT.md. No fake overlay or manually enabled experimental flags. Physical Android standalone evidence of pure black with adequate native indicator contrast is required to close C16; compilation/DOM tests alone do not prove it. Fixed black manifest/runtime/canvas configuration is published in PRE v1.15.20; installed-package behavior remains unverified.
- Validation: startup theme regressions, npm run validate in isolation; candidate CI; verified PRE deployment/version. Native Android/iOS rendering remains a physical device gate.
- Remote changes allowed: user explicitly authorizes review/cleanup and promoting all pending PRE application changes to Production (2026-10-15). This session authorization supersedes the earlier main/Production freeze for the reviewed release only. No database migrations or v1.0.0 tag changes; placeholder tests only.
- Depends on: C15.

## H00 - Inventory and initial diff review
- Status: DONE
- Objective: Review the existing uncommitted hardening work and establish the exact starting point.
- Domains: git state, existing invite hardening diff, migrations, current validations
- Acceptance:
  - `git status`, `git diff --stat`, `git diff --check`, and current modified files reviewed
  - partial invite hardening work classified as valid / incomplete / risky
  - resumable docs created with real state
- Validation:
  - `git status -sb`
  - `git diff --stat`
  - `git diff --check`
  - targeted file review of modified hardening files
- Remote changes allowed: none
- Rollback: no rollback required; documentation only
- Depends on: none

## H01 - Common auth and authorization helpers
- Status: DONE
- Objective: Centralize session, app user, request parsing, UUID validation, and safe server error handling.
- Domains: `src/auth.ts`, `src/lib/supabaseServer.ts`, `src/lib/serverLeagueAccess.ts`, new server-only helpers
- Acceptance:
  - session identity always comes from `auth()`
  - email normalization happens on the server
  - shared helpers exist for auth/app user/request validation
  - server modules are marked `server-only` where appropriate
  - routes stop returning SQL/internal messages to the client
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted route review
- Remote changes allowed: none
- Rollback: revert local helper refactors before any remote action
- Depends on: H00

## H02 - Invites, player claim, and spectators
- Status: DONE
- Objective: Finish hardening invite read/claim flows and spectator access behind server authorization.
- Domains: `invites`, `spectator_invites`, `league_spectators`, invite UI/API
- Acceptance:
  - no client fallback from invite snapshot to anon Supabase
  - claim flow runs only through server API
  - invite code, league, player, and occupancy validated server-side
  - spectator cleanup happens server-side
  - no client-controlled identity or role is trusted
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - static search for direct client writes to `invites`
- Remote changes allowed: local migration creation only
- Rollback: revert local invite route/helper changes before remote migration
- Depends on: H01

## H03 - League create, edit, and delete
- Status: DONE
- Objective: Move sensitive league lifecycle operations behind server-side authorization.
- Domains: `leagues`, `invites`, `league_locations`, destructive league operations
- Acceptance:
  - create/regenerate/delete run only on server
  - creator/admin/superuser checks enforced server-side
  - multi-step destructive operations are consistent and do not leak partial state
  - UI contracts remain compatible
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - targeted route review
- Remote changes allowed: local migration creation only
- Rollback: revert local league lifecycle changes before remote migration
- Depends on: H01

## H04 - Users and memberships
- Status: DONE
- Objective: Protect `app_users` and `league_memberships` from direct client abuse.
- Domains: `app_users`, `league_memberships`, user profile/avatar flows, role changes
- Acceptance:
  - no unrestricted browser reads of all user emails
  - no client can set `is_superuser` or `can_create_leagues`
  - role changes and unlink actions require server-side authorization
  - membership APIs return minimum required data
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted authz review
- Remote changes allowed: local migration creation only
- Rollback: revert local membership/user hardening before remote migration
- Depends on: H01, H03

## H05 - Availability
- Status: DONE
- Objective: Protect `player_availability`.
- Domains: availability UI/API, `player_availability`
- Acceptance:
  - only the linked user can modify their own availability
  - admin/member reads are limited to their league scope
  - no cross-league reads or writes by guessed IDs
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted availability review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert availability route/data changes
- Depends on: H01, H04

## H06 - Result confirmations
- Status: DONE
- Objective: Protect `match_result_confirmations`.
- Domains: confirmations UI/API, participant authorization
- Acceptance:
  - only match participants can confirm
  - user identity comes from session + membership, never client `playerId`
  - conflict/race handling is safe
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted confirmation review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert confirmation hardening changes
- Depends on: H01, H04, H07

## H07 - Matches and results
- Status: DONE
- Current checkpoint: match-detail mutations plus the remaining season-admin `matches` writes now run through server routes, and the local `matches` lock-down migration has been created and validated with `supabase db reset` + `db lint --local`.
- Objective: Protect `matches` operations and field-level writes.
- Domains: scheduling, results, locks, admin match actions
- Acceptance:
  - reads require league access
  - writes require explicit participant/admin authorization
  - only allowed fields are writable from each operation
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
  - targeted route/data review
- Remote changes allowed: local migration creation only
- Rollback: revert match/result hardening changes
- Depends on: H01, H04

## H08 - Seasons, settings, players, and calendars
- Status: DONE
- Current checkpoint: Supabase-backed season creation, finish/start/reopen, round-settings saves, round-order changes, balanced-calendar repair, round deletion, and season deletion now run through league-scoped admin routes. The remaining `players` client lookup was confirmed to live in `src/lib/activity.ts`, so the unresolved browser read boundary now belongs to H10 instead of season/player administration.
- Objective: Protect season and player administration.
- Domains: `seasons`, `season_settings`, `season_players`, `players`
- Acceptance:
  - only admins can manage seasons/settings/calendars/admin player edits
  - members only read their league data
  - avatar flows distinguish account/player/admin cases
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - `npm run build`
- Remote changes allowed: local migration creation only
- Rollback: revert season/player hardening changes
- Depends on: H01, H04

## H09 - MVP
- Status: DONE
- Current checkpoint: Supabase-backed MVP reads, match voting, vote clearing, and manual selections now run through server routes; the browser no longer mutates `mvp_votes` or `mvp_manual_selections` directly, and a local lock-down migration has been validated with `supabase db reset` + `db lint --local`.
- Objective: Protect `mvp_votes` and `mvp_manual_selections`.
- Domains: MVP voting/manual selection flows
- Acceptance:
  - only participants can vote
  - no self-voting
  - no identity spoofing via client voter/player IDs
  - manual selection remains admin-only
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted MVP review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert MVP hardening changes
- Depends on: H01, H04, H07

## H10 - Activity
- Status: DONE
- Current checkpoint: activity feed reads and `leagues.activity_settings` reads/writes run through league-scoped server routes, and the browser no longer inserts `activity_events` or resolves activity actors directly. Event creation now lives in the owning server routes/helpers, while the final RLS/grant closure for `activity_events` remains part of H13.
- Objective: Move activity writes fully server-side and scope reads by league access.
- Domains: `activity_events`, activity generation and feeds
- Acceptance:
  - browser writes to `activity_events` are gone
  - client cannot forge activity events through app routes
  - feed reads are scoped to members/spectators with access
  - final DB policy/grant closure for `activity_events` is explicitly tracked in H13
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted activity review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert activity hardening changes
- Depends on: H01, H04

## H11 - Notifications and cron
- Status: DONE
- Current checkpoint: notification preferences and push subscriptions now require league-scoped server authorization, admin-only push dispatch, constant-time cron secret comparison, and a validated local migration for notification-table grants plus per-league device uniqueness.
- Objective: Protect notification tables and preserve cron hardening.
- Domains: `notification_preferences`, `push_subscriptions`, cron routes
- Acceptance:
  - service-role-only server routes remain the write path
  - users can modify only their own preferences/subscriptions
  - cron fails closed without valid secret
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted notification review/tests
- Remote changes allowed: local migration creation only
- Rollback: revert notification hardening changes
- Depends on: H01

## H12 - QA, superuser, storage, and files
- Status: DONE
- Current checkpoint: QA mode now stays admin-gated behind server authorization with generic failure codes, and the avatar/logo path is explicitly treated as validated image input instead of accepting arbitrary strings or silently overwriting custom account avatars from the OAuth session image.
- Objective: Protect QA/superuser-only operations and audit storage/file uploads.
- Domains: QA APIs, superuser gates, storage buckets, upload validation
- Acceptance:
  - QA routes require real authorization
  - production QA disabled behavior is safe
  - storage writes are scoped and validated
- Validation:
  - `npm run lint`
  - `npx tsc --noEmit`
  - targeted QA/storage review
- Remote changes allowed: local migration creation only
- Rollback: revert QA/storage hardening changes
- Depends on: H01

## H13 - RLS policies, grants, and privileged functions
- Status: DONE
- Current checkpoint: the local migration chain now closes current-table grants/policies across all public business tables, fixes the remaining global `PUBLIC` execute default for future `postgres`-owned functions via `20260716014000_fix_function_default_execute_privileges.sql`, and passes `db reset` + `db lint` from scratch. Fresh local probes confirm that new `postgres`-owned tables, sequences, and functions no longer inherit anon/authenticated access, while the remaining `supabase_admin` default privileges are explicitly treated as a platform-owned H19 audit item because the local migration runner cannot alter that role directly and all current business tables remain owned by `postgres`.
- Objective: Create the final migration set for RLS/grants/function exposure.
- Domains: all public tables, policies, grants, helper SQL functions
- Acceptance:
  - every public table has RLS enabled
  - no `dev all` policies remain
  - no always-true write policies remain
  - anon/authenticated DML is closed except explicit safe cases
  - privileged functions are not exposed to PUBLIC/anon/authenticated
- Validation:
  - `npx supabase db reset`
  - `npx supabase db lint --local --schema public --level warning --fail-on none`
  - local SQL audit queries
- Remote changes allowed: local migrations only until H19
- Rollback: add forward-fix migrations only; do not edit applied migrations
- Depends on: H02 through H12

## H14 - Full static audit
- Status: DONE
- Current checkpoint: repo-wide static searches now show `supabase.*` runtime calls confined to API/server modules, all `use client` modules free of `server-only` / `supabaseServer` imports, `serverPushDispatch.ts` and `serverQa.ts` explicitly marked `server-only`, shared QA action types extracted to `src/lib/qaTypes.ts`, and the dead legacy `NEXT_PUBLIC_SUPERUSER_PLAYER_IDS` helper removed.
- Objective: Audit all Supabase access paths and remaining client/server boundaries.
- Domains: entire `src` tree, env usage, client imports, sensitive writes
- Acceptance:
  - all `@/lib/supabase` usage classified
  - no client imports of server-only modules
  - no sensitive direct browser writes remain
- Validation:
  - `rg` audit across `src`
  - targeted diff review
- Remote changes allowed: none
- Rollback: documentation/audit only
- Depends on: H02 through H13

## H15 - Tests, lint, build, and local Supabase
- Status: DONE
- Current checkpoint: `npm ci`, `npm audit`, `npx tsc --noEmit`, `npm run lint`, and an elevated `npm run build` now pass on the current repo state. A fresh local Supabase start/reset/lint/audit/stop cycle also passes, and the repo still has no automated test suite or test files to execute.
- Objective: Run required local validations end to end.
- Domains: npm install, lint, build, tests, local Supabase reset/lint, local SQL audits
- Acceptance:
  - `npm ci`, lint, build, and tests pass
  - local Supabase starts, resets, and lints
  - local SQL audits confirm expected RLS/policy/grant state
- Validation:
  - `git diff --check`
  - `npm ci`
  - `npm run lint`
  - `npm run build`
  - test command(s)
  - `npx supabase start`
  - `npx supabase db reset`
  - `npx supabase db lint --local --schema public --level warning --fail-on none`
  - `npx supabase stop`
- Remote changes allowed: none
- Rollback: no remote changes yet
- Depends on: H13, H14

## H16 - Backup before remote changes
- Status: DONE
- Current checkpoint: the existing `2026-07-14` encrypted backup archive and SHA256 file were verified in `D:\BACKUPS`, and a fresh `release/production-hardening` git bundle plus SHA256 was created there for rollback coverage before any remote DB action.
- Objective: Verify backup artifacts and create a fresh git bundle before remote DB changes.
- Domains: `D:\BACKUPS`, git bundle, sha256
- Acceptance:
  - encrypted backup and SHA256 from 2026-07-14 verified present
  - fresh bundle created with checksum
- Validation:
  - filesystem checks in `D:\BACKUPS`
  - checksum generation
- Remote changes allowed: none
- Rollback: no remote changes yet
- Depends on: H15

## H17 - Release commits and push
- Status: DONE
- Current checkpoint: `release/production-hardening` now contains six H17 commits ending at `07168b5`, the push to `origin/release/production-hardening` succeeded, and `git ls-remote --heads origin release/production-hardening` verified the remote branch HEAD explicitly.
- Objective: Commit validated local work in small domain-based commits and push release branch.
- Domains: git history on `release/production-hardening`
- Acceptance:
  - diff reviewed and clean
  - commits created with no secrets or temp files
  - branch pushed without force
- Validation:
  - `git diff --check`
  - `git status -sb`
  - `git log --oneline`
- Remote changes allowed: push to release branch only
- Rollback: new revert commits only
- Depends on: H15, H16

## H18 - Preview deployment and smoke tests
- Status: DONE
- Current checkpoint: Preview deployment `dpl_EmRooXAtzhxC4KN3WW2uLHn3gpYQ` for SHA `07168b539b926bd7e8fc249a4d3c45d4da0e2e13` is `Ready`, and authenticated `npx vercel curl` smoke checks now pass against both the Preview URL and the stable alias. Verified responses include `/`, `/manifest.webmanifest`, icon assets, `/api/auth/session`, `/api/auth/providers`, invalid invite routes, cron without secret (`401`), and protected member/admin routes without session (`401`). The stable alias provider metadata returns the alias host in the Google sign-in/callback URLs, so the registered OAuth callback surface is aligned; only a later interactive end-to-end login remains manual.
- Objective: Validate the release SHA on Vercel Preview.
- Domains: Vercel preview deploy, preview smoke tests, anon write checks
- Acceptance:
  - preview for exact SHA is `Ready`
  - automated smoke checks pass
  - stable preview alias works for invite routes and OAuth callback registration
- Validation:
  - `npx vercel list --environment=preview --meta "githubCommitSha=<SHA>"`
  - HTTP smoke checks against preview
- Remote changes allowed: Vercel preview only
- Rollback: redeploy previous preview or revert release commits
- Depends on: H17

## H19 - Remote migrations and remote audit
- Status: DONE
- Current checkpoint: The linked remote project now has the full validated hardening migration chain through `20260716014000`, `npx supabase db lint --linked --schema public --level warning --fail-on none` passes, remote SQL audits return zero current-object RLS/grant/function regressions, and the remaining `supabase_admin` default ACL rows are confirmed as the same platform-owned residual seen locally while all current public tables remain owned by `postgres`.
- Objective: Apply only the planned new migrations and verify remote DB state.
- Domains: linked Supabase migrations, remote lint, remote SQL audits
- Acceptance:
  - linked migration list understood
  - dry-run matches expected new migrations only
  - push succeeds and local/remote migration lists match
  - remote SQL audits show no hardening regressions
- Validation:
  - `npx supabase migration list --linked`
  - `npx supabase db push --linked --dry-run`
  - `npx supabase db push --linked`
  - `npx supabase db lint --linked --schema public --level warning --fail-on none`
- Remote changes allowed: linked Supabase only
- Rollback: forward-fix migrations only; no destructive rollback
- Depends on: H18

## H20 - Integrate with production branch
- Status: DONE
- Current checkpoint: The real production branch was verified as `main`, `git fetch --all --prune` completed successfully, and the final UI-only beta-label commit was pushed through the existing release flow. `origin/main` and `origin/release/production-hardening` now point to the same final release line, and the required pre-production validations (`git diff --check`, `npm run lint`, `npm run build`) passed before the rollout continued.
- Objective: Merge the validated release work with the real production branch.
- Domains: git integration with production branch
- Acceptance:
  - production branch identified from current remote config
  - release branch updated with latest production changes
  - validations rerun on final SHA
- Validation:
  - `git fetch --all --prune`
  - `git status -sb`
  - validation suite from H15
- Remote changes allowed: non-destructive merge/push
- Rollback: revert merge with a new commit if needed
- Depends on: H19

## H21 - Production deployment
- Status: DONE
- Current checkpoint: The Production deployment for the final release run reached `Ready` on `https://smash-lob.vercel.app`, and Vercel build logs confirmed the deployment was built from the intended `main` commit during the rollout. Production env-name presence was confirmed without printing secrets, and the QA/app-url checks passed after normalizing the pulled env-file format.
- Objective: Ship the validated production branch to Vercel Production.
- Domains: Vercel production deployment, env presence check
- Acceptance:
  - production deployment `Ready`
  - expected env var names present
  - forbidden public env exposure absent
- Validation:
  - Vercel deployment inspection
  - production build/log checks
- Remote changes allowed: Vercel production only
- Rollback: restore prior production deployment or revert merge
- Depends on: H20

## H22 - Production smoke tests
- Status: DONE
- Current checkpoint: The live production domain passed the automated smoke suite for `/`, `/manifest.webmanifest`, `/api/auth/session`, `/api/auth/providers`, Google provider metadata, cron without secret (`401`), protected admin/member routes without session (`401`), invalid invite routes with controlled `404` responses, and a direct REST write probe using the deployed anon key returned a blocked `401 Invalid API key` response. A post-smoke production log scan found zero repeated `500`/`error` keywords. On 2026-07-18, the project owner also completed the documented two-Google-account Production walkthrough for organizer, member/player, availability, calendar/ranking, results, confirmations, MVP, and spectator access.
- Objective: Verify the live production app and protected data surface.
- Domains: live app routes, cron, PWA, anon access restrictions
- Acceptance:
  - public routes and auth endpoints respond correctly
  - protected routes fail closed without session
  - anon writes remain blocked
  - no major runtime/log regressions
- Validation:
  - HTTP smoke checks against `https://smash-lob.vercel.app`
  - anon access tests
- Remote changes allowed: read-only checks only
- Rollback: production deployment restore and/or revert commit
- Depends on: H21

## H23 - Final report and cleanup
- Status: DONE
- Current checkpoint: The release run has an evidence-backed final report, updated hardening docs, explicit residual risks, captured repo/release history, and completed human acceptance for the two-account Google organizer/member/spectator walkthrough on Production. The closed-beta release has no remaining documented release blocker.
- Objective: Deliver the final evidence-based report and leave repo state clean.
- Domains: report, final git state, validation summary, residual manual checks
- Acceptance:
  - final report covers all required sections
  - human-only checks are recorded with their evidence source and completion state
  - repo state and recent history captured
- Validation:
  - final `git status -sb`
  - final `git log --oneline -10`
  - cross-check against objective requirements
- Remote changes allowed: none
- Rollback: documentation only
- Depends on: H22
## MC28 - Recuperar servidor local tras actualizar Next
- Status: DONE (2026-10-23; reinicio local y tres rutas HTTP 200)
- Objective: Corregir el HTTP 500 local sin tocar PRE ni las funcionalidades.
- Validation: comprobar /api/health, /leagues y detalle de partido tras reiniciar el proceso local con Next actualizado.
- Remote changes allowed: ninguno.
