# Segunda revisión visual — 9 de octubre de 2026

Rama: `codex/visual-audit-polish`. Cambios locales sin commit ni publicación.
Se conservaron los cambios previos de Competition, estados, votantes y datos ficticios.

## Cobertura y evidencia

88 visitas registradas a 72 rutas/variantes en la segunda pasada. Recorrido amplio
en Competition oscuro a 390 × 844; muestra clara en estadísticas, perfil propio,
perfil global cargado, propuestas de chat, detalle/pagos amistosos, incidencias,
Media Kit y páginas públicas. Escritorio a 1280 × 900 en gráfica, estadísticas
y usuarios. Contenido y navegación medidos a 640 px, sin desbordamiento horizontal
en las vistas comprobadas. Esto no certifica todas las combinaciones de acento,
idioma, tamaño de texto o dispositivo físico.

Evidencia local fuera del repositorio:
`C:/Users/USER/.codex/visualizations/2026/10/08/01a11af9-6fc8-7e02-a8f7-85ee6222e399/visual-audit/after/`.
`coverage.json` registra rutas y capturas, sin exportar conversaciones o correos.
Las capturas de carga no se consideran evidencia de un fallo permanente.
Las capturas fullPage del navegador integrado presentaron recortes artificiales;
se sustituyeron por capturas de viewport para la revisión final. Playwright usa
su propio navegador y referencias completas con datos ficticios.

## Disposición de los 47 hallazgos

| Nº | Resultado |
|---|---|
| 1 | Corregidos colores semánticos de estados vacíos e incidencias; comprobados claro/oscuro. |
| 2 | Tinta sobre acento en Media Kit, Welcome Pack y páginas públicas; corregidos retorno y CTA. |
| 3 | Chats amistosos comparte cálculo de estado con detalle y tarjetas. |
| 4 | Enlace conocido y autorizado selecciona liga/temporada; probado desde otra liga hasta cargar el partido. No amplía permisos. |
| 5 | Fecha/hora informadas sin ubicación muestra Lugar pendiente. |
| 6 | Nombres completos con salto de línea en cabeceras/comparación; formatos compactos en Chats. |
| 7 | Caption/micro aumentados a 12/10 px; se conservan jerarquías y pesos existentes. |
| 8 | Forma reciente V/D tiene superficie contrastada y significado accesible; perfil cargado comprobado. |
| 9 | Indicadores de estado y nombres compactos compartidos por chats de liga/amistosos. |
| 10 | Cabecera compartida con columnas equilibradas y título Amistoso. |
| 11 | Carga explícita, vacío sin invitación a escribir cuando está cerrado y explicación de solo lectura. |
| 12 | Deuda propia primero y menor protagonismo de acciones en pagos globales. |
| 13 | Guardar cambios en ES/EN/EU. |
| 14 | Mensaje de disponibilidad de notificaciones sin variable de configuración. No se activó push. |
| 15 | Orden de temporadas por creación, más nuevas primero, en estadísticas/exportaciones/Welcome Pack. |
| 16 | Eliminada temporada duplicada en rendimiento; selector de contexto en análisis. El perfil público conserva su selector de ámbito independiente. |
| 17 | Singularización de victorias/derrotas en rendimiento y estadísticas. La notación abreviada de diferencias mantiene sus unidades. |
| 18 | Sin campeones cuando no hay partidos válidos contabilizados, cubierto por pruebas. |
| 19 | Aviso explícito de pendientes históricos al cerrar temporada. No se alteraron reglas deportivas ni datos. |
| 20 | Sustitución bloqueada en temporada cerrada; ayudas de MVP/finanzas distinguen cierre. |
| 21 | Revisado: se conserva 404/restricción deliberada de administración global; no se revela contenido protegido. |
| 22 | Totales de usuarios ocultos hasta hidratar y carga explícita en chat; perfil global comprobado después de cargar. |
| 23 | Inicio denomina Tu posición al recorte alrededor del usuario. |
| 24 | Nombres de ligas y ACTUAL permiten salto; se ajustó densidad sin retirar actividad personal. |
| 25 | Se mantiene Jornada en cada tarjeta para identificarla fuera del grupo; mejora tipográfica común y acceso discreto existentes conservados. |
| 26 | Leyenda y cifras secundarias reciben mejora tipográfica; alineación numérica comprobada. |
| 27 | MVP en caja normal y pesos equilibrados; aviso de histórico. Resultado deportivo sin cambios. |
| 28 | Se elimina contexto repetido y se conserva composición de rendimiento tras revisión clara/oscura; no se rehízo la arquitectura de paneles. |
| 29 | Filtros de historial con altura mínima de 40 px y controles coherentes. |
| 30 | Empates expandibles con número explícito de jugadores; se elimina +N ambiguo. |
| 31 | Comparadores apilados en móvil, nombres legibles y selectores de 40 px; métricas conservadas. |
| 32 | Gráfica inicia con usuario y dos comparadores, o tres disponibles; leyenda táctil de 40 px. |
| 33 | Jerarquía y nombres de récords mejorados; se conservan tarjetas informativas sin prometer enlaces que no existen. |
| 34 | Explicación bajo Detalles y vistas en una columna móvil / tres en ancho suficiente. |
| 35 | Actividad/notificaciones agrupadas por fecha, contexto de temporada y títulos largos legibles. |
| 36 | Retirado Experimental de Competition en los tres idiomas; modos y permisos conservados. |
| 37 | Disponibilidad desactivada ofrece salida a Chats. Editor habilitado pendiente de acceso de prueba. |
| 38 | Selección manual de amistosos compacta con búsqueda junto al campo. No se creó un partido. |
| 39 | Estado centrado, importe desconocido — distinto de cero y pagos compartidos con liga. |
| 40 | Búsqueda de personas, nombres con salto y carga de totales; filtro probado sin guardar. |
| 41 | Revisado: los nombres casi duplicados son datos de prueba. Se conservan búsqueda e identificación existentes; sin fusionar/borrar datos ni añadir reglas de duplicidad. |
| 42 | Título antes de controles, identidad plegable y contraste de composición corregido. |
| 43 | Recomendación Excel pasa a ayuda secundaria neutra. |
| 44 | Búsqueda de ayuda por sección/tarea; registro de cambios conserva distinción existente entre resumen público y detalle administrativo. |
| 45 | Héroes móviles más compactos, retorno y CTA contrastados. |
| 46 | Aviso experimental con colores semánticos y estado de carga conservado; laboratorio no aplica avatar al perfil. |
| 47 | Columna de escritorio ampliada a 640 px con navegación y flotantes coordinados. Móvil conserva su estructura. |

Las propuestas de rediseño no aplicadas literalmente están identificadas arriba;
no se presentan como defectos resueltos mediante cambios inexistentes.

## Límites de la revisión

- Administración global, creación de ligas y QA mantienen sus restricciones.
- Invitación válida y espectador no se comprobaron manualmente con accesos reales;
  sus flujos automatizados usan respuestas ficticias.
- Sin envío de mensajes, votos, pagos, resultados ni formularios administrativos.
- OAuth real, push, instalación física PWA, latencia del chat y persistencia de
  operaciones requieren aceptación funcional independiente.
- Se restauraron tema oscuro, temporada original, URL de Estadísticas y viewport
  normal. No se alteró el servidor de VSCode, main, Production ni v1.0.0.

## Validación

La validación se ejecuta en una copia aislada con dependencias del lockfile y
variables placeholder; no utiliza cuentas personales ni datos PRE en tests.
Las referencias visuales autenticadas/públicas se revisaron antes de aceptarlas.
Resultado final de gates:

- `npm run validate`: correcto; 217 archivos / 850 pruebas. TypeScript, seguridad,
  traducciones, tipografía, validaciones de dominio y build correctos.
- ESLint: 0 errores y 4 advertencias de código sin uso.
- Presupuesto de fuente: 132.184 líneas, 191 clientes y 50 páginas cliente,
  sin elevar límites. JS: 1.178.599 bytes gzip / 102 chunks, dentro del presupuesto.
- `npm run test:e2e -- --max-failures=1`: 70/70 correctas sin actualizar capturas
  durante la ejecución final; cubre móvil, escritorio, Axe y recuperación offline.
- `git diff --check`: correcto. Código, scripts y tests de la copia contrastados
  con el árbol principal mediante hashes, sin diferencias.

Los logs de Auth.js UntrustedHost pertenecen al entorno placeholder de las
pruebas; no demuestran el estado de OAuth real. No se alteró autenticación para
silenciarlos. La instalación aislada usa Next 16.3.8 del lockfile; se conservan
las dependencias y el proceso de desarrollo existentes del usuario.
