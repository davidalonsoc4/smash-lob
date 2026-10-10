# V02 — Aceptación funcional manual PRE, 2026-10-09

Estado: CERRADO dentro del alcance documentado. Rama `codex/functional-audit-fixes`.
Sin commit ni publicación; listo para revisión local. Registro cronológico debajo.
El usuario autoriza crear/eliminar ligas y temporadas desechables en localhost/PRE.
No se modifica ninguna liga previa ni se usa PRE en las suites automatizadas.

## Entorno y recursos creados

- Configuración local verificada contra el proyecto PRE conocido, app localhost:3000,
  variante no Production y proceso del servidor ejecutando este checkout.
- Liga creada por la UI: `QA V02 desechable 2026-10-09`.
- Temporada: `QA ciclo inicial`, ocho jugadores, calendario equilibrado de siete
  jornadas, disponibilidad e inscripción habilitadas. El primer jugador corresponde
  a la cuenta organizadora; los otros siete tienen nombres ficticios QA Jugador 2–8.
- Partido propio inicial: `38f24c2d-52dd-4d58-84b4-c6b4f755a637`.
- Limpieza de esta liga/temporadas finalizada y verificada; detalle al final del registro.

## Comprobaciones realizadas

- Creación de liga y redirección a configuración de primera temporada correctas.
- Creación de temporada y calendario correctas; confirmación de guardado visible.
- Recarga completa conserva liga, temporada y calendario.
- Inicio bloqueado mientras hay inscripciones pendientes; registrar siete pagos
  ficticios completa 8/8 y habilita Comenzar temporada. No son transferencias reales.
- El nombre provisional del organizador se sustituye al recargar por su perfil
  vinculado, conforme al modelo de identidad; no se ha modificado su cuenta.

## Incidencia de herramienta al iniciar (histórica)

Al pulsar Comenzar temporada, la confirmación nativa bloquea las acciones CDP del
navegador integrado. `getJsDialog` no devuelve un diálogo utilizable y recargar
también agota el tiempo. Se pidió al usuario resolver la confirmación visible.
No se ha repetido la escritura ni se considera iniciada sin verificar el estado.

Evidencia fuera del repo: carpeta `visual-audit/after/functional`, captura
`01-season-created.png`. Se ampliará con resultados y limpieza verificables.

## Continuación verificada

- Navegador recuperado; temporada activa confirmada. El bloqueo nativo anterior ya no está activo.
- Programación manual guardada para 10/10/2026 00:00 en Polideportivo Lasesarre; reserva fijada aparece en chat.
- Selector de calendario abre desde reserva; descarga Apple .ics válida (VEVENT y fecha UTC equivalente). No se ha creado un evento en servicios externos.
- Mensaje QA enviado, estado Enviado comprobado y persistencia tras recarga correcta. Chat bloquea envío tras finalizar partido.
- Resultado incompleto bloqueado; tres sets 6-2/6-3/6-4 guardados y persistentes. Ranking: ganadores 3 puntos/+9 juegos, perdedores 0/-9.
- Disponibilidad L-V 16:00–22:00 guardada y persistente (cinco franjas).
- Defecto observado: durante hidratación, Inicio muestra brevemente UUIDs y disponibilidad muestra temporalmente que no está habilitada. Después carga datos correctos; no se ha observado corrupción persistente.
- Limitación de herramienta: fill de campos nativos time/datetime-local no cambia el valor efectivo; no se atribuye por sí solo a defecto de la app.
- Evidencias 02–05 en carpeta functional fuera del repositorio. Limpieza y otros flujos todavía pendientes.

- Edición del resultado a 6-2/6-3/4-6 confirmada: clasificación recalculada 2/1 puntos y +5/-5 juegos.
- Horario recomendado seleccionado por UI (12/10/2026 18:00), programación guardada.
- Pagos: varios pagadores, edición a único pagador, reparto 20 € en cuatro partes, deuda propia 5 € primero, liquidación ficticia y recarga muestran Tu parte saldada y dos deudas ajenas pendientes. Sin movimientos reales de dinero.
- Propuesta de ubicación enviada en Jornada 3; voto favorable y detalle con cuatro jugadores, incluidos tres sin cuenta. Los nombres ficticios QA comparten abreviatura QA J.; conviene desambiguar colisiones si se adopta como requisito.
- En controles optimistas hay que esperar al guardado antes de recargar; el voto no muestra un estado Guardando visible. Se verifica persistencia tras espera de otras comprobaciones, no solo tras el cambio optimista.

## Ciclo, amistosos y exportación

- Voto cambiado a negativo, persistencia confirmada después de finalizar guardado.
- Cierre de QA ciclo inicial confirmado en Inicio/histórico tras recuperar pestaña; el diálogo nativo produjo timeout, pero el estado remoto sí terminó. No se asumió éxito por el click.
- Duplicar última temporada creó QA ciclo inicial 2, ocho jugadores/catorce partidos, próxima. Selector ordena más nueva primero. Perfil sigue selección y al elegir histórico recupera 2 puntos/+5 juegos y sus estadísticas.
- Inmediatamente tras duplicar, Administración mostró temporalmente cero jugadores/reglas por defecto para la temporada anterior; entrar de nuevo carga el histórico correcto. Revisar hidratación/retención de snapshots históricos.
- Amistoso QA creado: bd49b671-ad14-4114-b0b9-b0c2d4e8f48a. Tres participantes manuales ficticios. Un set 6-4 válido, reserva 24 €, reparto tres transferencias de 6 €, marcar pagado y volver pendiente correctos. Resultado y reserva persisten tras recarga.
- Chat amistoso permite escribir durante su ventana posterior al partido; mensaje QA enviado/persistente. No muestra reserva fijada ni acceso a calendario en el chat: diferencia respecto al chat de liga a corregir si se exige paridad.
- CSV clasificación: ocho filas/diez columnas. CSV resultados: catorce filas/doce columnas. XLSX contiene workbook y dos hojas XML no vacías. Selector de exportación cambia a segunda temporada y muestra cero finalizados correctamente.
- No se ha verificado importación en aplicaciones externas ni realtime entre dos identidades/dispositivos.


## Reanudación del 10 de octubre

- Guardado de descripción administrativa verificado en Mis ligas tras recarga.
- Inicio programado habilitado/guardado, fecha 10/10/2026 11:00 y cuenta atrás persistentes tras recarga. Vuelto a inicio manual; checkbox desmarcado y guardar deshabilitado tras finalizar operación. No se ha esperado la activación automática por tiempo.
- CSV descargados y comprobados: clasificación 8×10; resultados 14×12. Libro XLSX ZIP válido, workbook y dos hojas no vacías. No equivale a una prueba visual en Excel.
- No se han cambiado archivos de aplicación durante esta aceptación; únicamente este registro y STATUS. No commit, push ni despliegue. Los gates anteriores V01 siguen siendo 850 unitarias/70 E2E/build; no se repiten por cambios exclusivos de documentación/datos QA. git diff --check correcto.

## Incidencia de limpieza (resuelta posteriormente)

Eliminar el amistoso por UI abre una confirmación nativa que bloquea el navegador
integrado. getJsDialog no expone el diálogo; press y close agotan el tiempo.
La recuperación por API documentada no ha funcionado esta vez. No se supone que
la eliminación haya sucedido ni se usan APIs ocultas o bypass para evitarla.

Recursos desechables pendientes de comprobar/eliminar:

- Liga QA V02 desechable 2026-10-09, temporadas QA ciclo inicial y QA ciclo inicial 2.
- Amistoso bd49b671-ad14-4114-b0b9-b0c2d4e8f48a (tres jugadores QA manuales).
- Archivos de evidencia/exportación locales se conservan deliberadamente.

La pestaña 5 permanece en el detalle del amistoso, posiblemente con confirmación
pendiente. Recuperada la UI, comprobar primero si existe; después eliminar solo
estos recursos. Liga: Administración > Configuración general > Zona sensible,
escribir nombre exacto y eliminar. Verificar ausencia tras recarga de Mis ligas y
Mis partidos. Restaurar Smash & Lob PRO League, temporada a8403e02-76a2-458a-8f3c-3252ecdfc78e
y URL statistics original. No se ha marcado V02 completado.

## Mejoras observadas / límites

1. Hidratación: evitar UUIDs y mensajes de función no habilitada antes de cargar datos.
2. Tras duplicación: mantener snapshot del histórico visible, sin mostrar temporalmente plantilla vacía/reglas por defecto.
3. Votos: indicar guardado pendiente y evitar que navegación inmediata descarte la operación optimista.
4. Chat amistoso: añadir la reserva fijada y selector de calendario si se exige la misma función que en liga.
5. Abreviaturas: desambiguar jugadores que coincidan en nombre/inicial (los QA muestran la colisión).
6. Confirmaciones nativas: limitan esta herramienta; su sustitución por diálogo accesible sería una mejora de UX/testabilidad, no se da por defecto funcional del servidor.

No verificados exhaustivamente: realtime entre dos cuentas/dispositivos, Google OAuth,
push/PWA física, importación externa de calendario/Excel, activación automática a
la hora prevista, reemplazos complejos, todos los permisos/idiomas y combinaciones
de reglas. La cobertura visual amplia V01 y la aceptación manual V02 no certifican
todas las combinaciones. No se ha detectado corrupción persistente en los datos QA.

## Limpieza resuelta — 10 de octubre

El usuario respondió a la confirmación nativa. Amistoso ausente tras recargar Mis
partidos. Se eliminó por UI la liga QA escribiendo su nombre exacto; tras recargar
Mis ligas no aparece. También desapareció su partido del historial personal.
Ausencia del enlace del amistoso y del partido QA comprobada en la UI cargada.
No se han borrado ligas previas. Capturas 14-league-cleanup y 15-matches-cleanup.

Restaurada la pantalla original de estadísticas con temporada 2 seleccionada
(a8403e02-76a2-458a-8f3c-3252ecdfc78e) en Smash & Lob PRO League. Tema oscuro
conservado, sin override de viewport. No quedan recursos de negocio QA conocidos.

La ejecución manual se cierra CON HALLAZGOS, no como certificación exhaustiva.
V02 permanece pendiente de resolver o disponer explícitamente las mejoras
funcionales listadas; ya no está bloqueado por limpieza. Las limitaciones de dos
identidades, dispositivos físicos e integraciones externas siguen vigentes.

## Correcciones locales — 10 de octubre

Nueva rama `codex/functional-audit-fixes`, conservando el trabajo anterior y sin
commit. Implementados los puntos 1–5: espera de hidratación completa, lectura
inicial de reglas guardadas, integración parcial de duplicación que conserva el
histórico, indicador de voto pendiente con bloqueo concurrente, reserva/calendario
en chat amistoso y nombres completos ante colisión de abreviaturas. La carga del
detalle amistoso reutiliza la autorización existente de participantes.

Pruebas nuevas: reglas disponibles desde el primer render; plantilla y reglas
históricas tras duplicar y recargar; reemplazo completo que elimina temporadas
ausentes; colisiones de nombre/inicial; reserva amistosa con selector Google/ICS;
ausencia de reserva/fecha; conservación del estilo del botón habitual.
TypeScript correcto. Validación general, pruebas de votos y revisión visual final
pendientes. Las confirmaciones nativas y los límites externos siguen documentados;
no se dan por probados automáticamente ni se marca V02 completo todavía.

### Cambios por pantalla y validación posterior

| Pantalla | Corrección | Comprobación |
| --- | --- | --- |
| Entrada y pantallas de liga | Espera al primer snapshot completo antes de habilitar el contenido; reglas guardadas disponibles en el primer render. | Playwright con acceso retrasado y caché; prueba del proveedor. |
| Administración / duplicar temporada y vistas históricas | La respuesta parcial conserva plantilla y reglas originales; la nueva temporada sigue activa. | Prueba de duplicación parcial, recarga y reemplazo completo posterior. |
| Chat de liga / encuestas | Guardando visible, controles bloqueados durante la escritura, respuesta confirmada desde servidor y petición keepalive. | Playwright móvil/escritorio: demora, un único envío, recarga, error sin voto falso y reintento para retirar el voto. |
| Chat de liga / votantes y listado de Chats | Nombre e inicial si son distintos; nombre completo si coinciden. Nombre/inicial no quedan separados al saltar línea. | Pruebas de colisión; revisión local de cuatro participantes y Chats. |
| Chat amistoso | Reserva fijada clickable con fecha/lugar y selector de calendario compartido, desde detalle autorizado. | Pruebas de reserva/fecha ausentes, selector y estilos; Playwright claro/oscuro móvil/escritorio y descarga ICS. |

Validación general correcta: 219 archivos / 858 pruebas; TypeScript, controles
estáticos, ESLint sin errores (4 avisos previos) y build dentro del presupuesto.
Suite completa Playwright 76/76 sin actualizar capturas de referencia. Revisadas
individualmente las seis capturas nuevas de guardado y calendario en ambas
anchuras/modos. Evidencias conservadas en la carpeta funcional fuera del repositorio.
Se repite validate después del último pulido del salto de línea antes del cierre.

El punto 6 (confirmaciones nativas) se dispone como límite de la herramienta y
mejora opcional; las operaciones de negocio y la limpieza se verificaron realmente.
No se sustituye el diálogo nativo en este bloque. Se mantienen expresamente los
límites de dispositivos físicos, OAuth, realtime entre identidades, calendario
externo, importación visual en Excel, activación temporizada y combinaciones de
reglas/permisos no recorridas. El alcance cerrado no es certificación exhaustiva.

## Cierre local — listo para revisión, sin commit

V02 completado dentro de la cobertura y límites anteriores. `npm run validate`
final repetido sobre el último ajuste: 219 archivos / 858 pruebas correctos,
TypeScript y controles estáticos correctos, 0 errores ESLint / 4 avisos previos.
132.188 líneas / 191 clientes / 50 páginas cliente; build 1.181.317 bytes gzip en
102 chunks, sin elevar presupuestos. Últimas 26 pruebas dirigidas y ESLint correctos;
Playwright completo 76/76, sin regenerar referencias. La revisión local confirmó
cuatro participantes y separadores legibles; Mis ligas restaurado, oscuro y sin
override de viewport. No se crearon más fixtures ni se enviaron mensajes/votos PRE
durante estas correcciones. Sin commit, push, despliegue ni cambios en Production.

Se conservan logs y seis capturas de casos nuevos en
`C:/Users/USER/.codex/visualizations/2026/10/08/01a11af9-6fc8-7e02-a8f7-85ee6222e399/visual-audit/after/functional`.
Los casos automatizados usaron exclusivamente el entorno placeholder de Playwright.
