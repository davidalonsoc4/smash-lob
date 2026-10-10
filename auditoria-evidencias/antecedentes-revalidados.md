# Antecedentes revalidados — 10/10/2026

Estado actual: 6fa8c72, no nuevas correcciones. RESUELTO se limita al contrato descrito y evidencia citada; no equivale a recorrer cada variante visual. PENDIENTE conserva explícitamente las validaciones no realizadas. Se agrupan hallazgos repetidos: no se crean varias fichas BUG por el mismo problema.

## V01: los 47 puntos de docs/VISUAL_AUDIT_RESULTS.md

| ID | Antecedente | Estado | Contraste actual y límite |
|---|---|---|---|
| V01-01 | Estados vacíos/incidencias sin semántica | RESUELTO | Tokens Competition y tests competitionLight/competitionVisualStyle correctos; no implica contraste de todas las combinaciones. |
| V01-02 | Tinta/CTA Media Kit/Welcome Pack | PENDIENTE | Normalizador mediaKitTheme y sus pruebas pasan; reproducción visual ampliada de esas pantallas bloqueada. |
| V01-03 | Estado amistoso diferente entre vistas | RESUELTO | personalMatchDetailModel compartido, unitarias y E2E de amistosos; no se reabre un bug de estado por recorte del historial de chat. |
| V01-04 | Enlace a partido en otra liga/contexto | RESUELTO | Resolución de contexto y guards actuales conservados; tests de acceso/selección correctos. Recorrido real anterior se identifica como histórico. |
| V01-05 | Fecha sin lugar sin explicación | RESUELTO | Modelo y componentes mantienen Lugar pendiente; pruebas de reserva ausente pasan. |
| V01-06 | Nombres cortados/ambiguos | RESUELTO | Abreviatura con detección de colisiones y fallback completo; tests chatProposalVoters y compactos, baseline de tarjetas. No garantiza cero homónimos completos. |
| V01-07 | Metadatos demasiado pequeños | RESUELTO | globals.css conserva caption 12/micro 10; referencias nuevas coinciden y muestras abiertas son legibles. Texto secundario tenue sigue observación, no contraste universal. |
| V01-08 | Forma reciente V/D poco contrastada | PENDIENTE | Implementación semántica presente; no se volvió a renderizar perfil completo en todos los temas. |
| V01-09 | Indicadores y nombres de Chats incoherentes | RESUELTO | Indicador compartido/ayuda y nombres compactos conservados; pruebas statusHelp y chatProposalVoters pasan. |
| V01-10 | Cabecera chat amistoso desequilibrada | RESUELTO | Cabecera compartida y seis capturas nuevas de chat/selector; no hay solapamiento en muestras examinadas. |
| V01-11 | Carga/vacío en chat cerrado invita a escribir | RESUELTO | Rama de carga/solo lectura actual y pruebas de amistosos conservadas; no confundir estado de carga con error persistente. |
| V01-12 | Deuda propia perdida entre otras | RESUELTO | Orden y resumen personal en componentes compartidos, bookingPaymentSummary; nuevos bugs de concurrencia e IDs 028/032 son distintos. |
| V01-13 | Guardar cambios sin traducir | RESUELTO | Traducción/gate ES/EN/EU actual correcto para ese texto; BUG-004 trata otra confirmación. |
| V01-14 | Notificaciones muestra detalle de configuración | PENDIENTE | Copy actual sin variable técnica; activación/dispositivo no revisado de nuevo. |
| V01-15 | Temporadas no ordenadas por creación | RESUELTO | seasonSelection/getNewestLeagueSeasons y seasonSelectionOrder; no depende del nombre de temporada. |
| V01-16 | Temporada repetida bajo rendimiento | RESUELTO | Fuente actual de perfil y playerProfileSeasonSelector; título duplicado eliminado. Captura global de perfil pendiente. |
| V01-17 | Plurales para una victoria/derrota | RESUELTO | Formateo/copy actual singulariza; tests i18n actuales pasan. No extrapolar a páginas excluidas del gate. |
| V01-18 | Campeones con cero resultados válidos | RESUELTO | seasonStatistics excluye ausencia de ganador; pruebas y resumen baseline Sin campeón calculado. BUG-030 es inconsistencia distinta con ranking. |
| V01-19 | Cierre sin avisar de partidos históricos pendientes | PENDIENTE | Aviso está implementado; no se repite cierre real con esa plantilla. |
| V01-20 | Sustitución en temporada cerrada | RESUELTO | Guard requireMutable y SQL de sustitución/reemplazo revisados; excepción superusuario deliberada. PostgreSQL fresco bloqueado. |
| V01-21 | Administración global 404 | OBSOLETO | Es restricción deliberada de permisos, no defecto que deba eliminarse. Guards actuales presentes. |
| V01-22 | Totales/carga antes de hidratar | RESUELTO | Playwright nuevo con respuesta access retrasada y caché, snapshotHydration; contenido espera respuesta inicial. |
| V01-23 | Home llama Ranking a recorte personal | RESUELTO | Baseline Home abierta muestra Tu posición. |
| V01-24 | Nombres largos en Mis ligas | PENDIENTE | Wrapping está en código; no captura nueva de esa pantalla con nombres largos. |
| V01-25 | Jornada repetida en tarjetas | OBSOLETO | Decisión deliberada de identificar tarjeta fuera del grupo; no error funcional. |
| V01-26 | Leyenda/cifras secundarias | PENDIENTE | Tipografía común conserva mejora; gráfica completa no reabierta en esta pasada. |
| V01-27 | MVP demasiado dominante/mayúsculas | PENDIENTE | Reglas y copy conservados; conjunto visual de todas sus variantes no inspeccionado de nuevo. |
| V01-28 | Composición de rendimiento/contexto repetido | PENDIENTE | Eliminación de duplicado comprobada en V01-16; composición completa del perfil requiere captura aislada adicional. |
| V01-29 | Filtros de historial pequeños | PENDIENTE | Altura mínima presente y gates correctos; revisión táctil/renderizada ampliada pendiente. |
| V01-30 | Empates recortados y +N ambiguo | RESUELTO | Resumen expandible con número/lista y tests vigentes; no se cambia la regla deportiva. Numeración inconsistente es BUG-031 separado. |
| V01-31 | Comparación con nombres cortados | PENDIENTE | Apilado/controles presentes; no nueva captura cara a cara con nombres largos. |
| V01-32 | Gráfica demasiado poblada inicialmente | PENDIENTE | Selección inicial acotada a tres y leyenda táctil presentes; render completo y orientaciones pendientes. |
| V01-33 | Récords parecen enlaces | OBSOLETO | Se mantienen tarjetas informativas por decisión explícita; no hay navegación prometida incumplida. |
| V01-34 | Detalles sin explicación/columnas estrechas | RESUELTO | Baseline resumen móvil abierta, explicación y una columna; desktop usa espacio común ampliado. |
| V01-35 | Actividad/notificaciones poco contextualizadas | PENDIENTE | Agrupación/copy presentes; historial real no recorrido; BUG-039 confirmado en cursor, distinto al estilo. |
| V01-36 | Competition marcado Experimental/solo oscuro | OBSOLETO | Tema claro ya implementado; tests actuales competitionLight y selector nuevo claro/oscuro pasan. |
| V01-37 | Disponibilidad desactivada sin salida | PENDIENTE | Salida Chats presente, editor habilitado no renderizado con fixture adicional; BUG-026 prueba cálculo, no todo editor. |
| V01-38 | Selector manual de amistosos demasiado largo | RESUELTO | Flujo simplificado con búsqueda conservado; E2E personal-matches actual correcto. |
| V01-39 | Estado/importe desconocido en partido | RESUELTO | Modelo y layout compartidos, estados económicos con —, tests de booking; capturas amistoso no muestran desplazamiento del selector. |
| V01-40 | Personas/totales/nombres largos | PENDIENTE | Source/guards revisados, carga protegida; no nueva interacción de admin global con volumen/nombres largos. |
| V01-41 | Jugadores casi duplicados en PRE | OBSOLETO | Datos de prueba, no regla de producto demostrada; no fusionar ni borrar cuentas. |
| V01-42 | Media Kit jerarquía/identidad/contraste | PENDIENTE | Estructura y mediaKitTheme conservados; visual ampliado de workspace pendiente. |
| V01-43 | Excel demasiado protagonista | PENDIENTE | Ayuda secundaria conservada; importación/visual completo de exportación pendiente. |
| V01-44 | Ayuda difícil de encontrar | RESUELTO | Búsqueda/tours actuales, E2E abre/repite ayuda. BUG-036 identifica accesibilidad modal independiente. |
| V01-45 | Héroes públicos excesivos en móvil | PENDIENTE | Gates públicos pasan; nueva revisión manual de about/legal completos y variantes pendiente. |
| V01-46 | Laboratorio estados/aviso poco legibles | PENDIENTE | Aislamiento/carga comprobados por código/tests; snapshots de Ajustes excluyen lab deliberadamente, no prueba visual de lab. |
| V01-47 | Ancho desktop y flotantes incoherentes | RESUELTO | CSS 640 y referencias estadísticas/ajustes desktop abiertas; no certifica todos los flotantes en cada scroll. |

## V02: los seis puntos de docs/FUNCTIONAL_PRE_ACCEPTANCE.md

| ID | Antecedente | Estado | Contraste actual y límite |
|---|---|---|---|
| V02-01 | Hidratación/reglas guardadas inicialmente incorrectas | RESUELTO | seasonSnapshotHydration y Playwright con respuesta retrasada; reglas desde primer snapshot. |
| V02-02 | Duplicación parcial borra datos históricos cliente | RESUELTO | Merge parcial y reemplazo total diferenciados, pruebas actuales. BUG-017/018/019 del servidor no anulan esta corrección cliente, pero impiden aceptación global de duplicación. |
| V02-03 | Voto optimista perdido/error invisible | RESUELTO | Playwright nuevo: retraso, Guardando, un envío, recarga, error/reintento. Realtime externo sigue pendiente. |
| V02-04 | Reserva fijada/calendario ausentes en chat amistoso | RESUELTO | Pruebas actuales y cuatro capturas nuevas Competition, descarga ICS. Importación física pendiente. |
| V02-05 | Nombre e inicial todavía ambiguos si coinciden | RESUELTO | Fallback a nombre completo con colisión, prueba vigente; homónimo completo no resuelto mágicamente. |
| V02-06 | Confirmación nativa bloquea herramienta | OBSOLETO | Límite de automatización/mejora opcional; no se registra como fallo de servidor. No se reemplazó confirm nativo. |

## H: los once puntos de docs/production-hardening/V1_15_4_HARDENING_AUDIT.md

| ID | Antecedente | Estado | Contraste actual y límite |
|---|---|---|---|
| H-01 | Amistosos excluidos de i18n | RESUELTO | Ya no excluye personal-matches/components/personal; gate actual pasa. Legales/lab/PWA continúan exclusiones expresas. |
| H-02 | Notificaciones sin lectura persistida | RESUELTO | Tabla notification_reads y API own user/onConflict, fuente y pruebas. Sin dos dispositivos reales nuevos. |
| H-03 | Actividad sin cursor compuesto | PERSISTENTE | Existe cursor solo fecha; BUG-039 reproduce omisión al empatar fechas. No resuelto por test textual de nextCursor. |
| H-04 | Auditoría administrativa mezclada con actividad | RESUELTO | Almacenamiento/helper application-admin separado; gates correctos. Atomicidad del log auxiliar queda recomendación de fiabilidad. |
| H-05 | Buscador sin contexto real/anchors | RESUELTO | settingsSearch filtra capacidades/estado y destinos; tests actuales correctos. No todos los hashes probados manualmente. |
| H-06 | Crear liga depende de experiencia activa | RESUELTO | canCreateLeaguesInCurrentView=canCreateLeagues; test actual comprueba separación; permiso servidor sigue obligatorio. |
| H-07 | Push sin cola/reintentos | RESUELTO | Cola existe, límite/reintento/unique por evento-suscripción. BUG-033 es defecto nuevo de manejo de errores, no ausencia de la funcionalidad. Entrega física pendiente. |
| H-08 | Lista de espera inexistente | RESUELTO | Tabla/API/orden/confirmación y UI existen. BUG-006..012 demuestran o señalan fallos actuales; resuelta solo ausencia inicial, no aceptación funcional de toda cola. |
| H-09 | Exportación/eliminación integral ausentes | PERSISTENTE | APIs existen, pero contratos incompletos: BUG-002/003, con reproducciones aisladas. No declarar anonimización integral. |
| H-10 | Administración de temporada monolítica | RESUELTO | Extractos/components actuales y 2.040 líneas no vacías frente a 6.308 históricas. Deuda técnica residual se trata como recomendación, no prueba de error. |
| H-11 | README anuncia v1.1.0 como actual | PERSISTENTE | BUG-038 por texto actual. No se cambia documentación funcional fuera de auditoría. |

## Otros documentos recuperados: reconciliación sin duplicar incidencias

- COMPETITION_DARK_VISUAL_REVIEW: contraste de botón (V01-01/02), flotantes/ancho (47), disabled (01 y gate Competition), avatares (PlayerAvatar onError vigente y avatarResolution), estadísticas/empates (18/30), nombres (06/V02-05), resumen incompleto (19/34). Evidencia de color calculado antigua se conserva histórica; actual contraste de todos los controles no se da por medido. Advertencia solo oscuro: OBSOLETO (36). No se añaden siete bugs duplicados.
- V0.14.5_REACT_EFFECT_VALIDATION: antiguos tres errores ESLint NO REPRODUCIBLES actualmente; lint/tsc/build nuevo pasa. Comprobación de cancelación/asíncrono sigue en suite. No convertir warnings heredados de variables sin uso en los mismos errores.
- V1_1_ACCEPTANCE_CHECKLIST: sus resultados físicos y OAuth son históricos. Regresiones locales equivalentes pasan hoy; limpieza Push simulada sigue cubierta, pero endpoint físico caducado no comprobado. Estado de esas comprobaciones físicas: PENDIENTE en auditoría actual, sin borrar aceptación histórica.
- V1_RELEASE_CHECKLIST y V1_2_11_RELEASE_CHECKLIST: listas de aceptación, no evidencias de ejecución nueva. Versiones antiguas son OBSOLETAS como release objetivo, URLs/seguridad/avatar/RLS/QR se contrastan con gates actuales. Identidad histórica en PRE/PROD, uploads reales y migraciones desplegadas: PENDIENTE.
- V1_15_4_PRE_MANUAL_QA: QR/espectador, notificaciones y amistosos tienen cobertura mock actual; cuenta presenta BUG-002/003; manual real con dos cuentas/instalación/Excel continúa PENDIENTE.
- production-hardening/VALIDATION: hallazgos antiguos de imports server-only/QA types/privilegios/default ACL no se trasladan como bugs actuales por una fecha histórica. Gates actuales de seguridad/boundary pasan; pgTAP/CI anterior mismo código aporta evidencia histórica. ACL de plataforma y roles desplegados actuales: PENDIENTE, no reset ni consulta PRE/PROD nueva.
- VISUAL_AUDIT_PLAN/STATUS: V01/V02/V03 son fases históricas ya cerradas en su alcance; publicación PRE verificada previamente no equivale a nueva publicación ni a seguridad funcional completa. Esta auditoría no cambia main ni el tag.
- Conversaciones antiguas: solo historial suministrado por el usuario y documentos recuperados; no se simula acceso a conversaciones no consultadas ni evidencia de pantallas no abiertas.

La tabla canónica tiene 64 elementos (47 + 6 + 11). Los bloques anteriores de checklists/duplicados no se suman como bugs ni como nuevas correcciones. Los estados PENDIENTE son límites explícitos de revalidación, no defectos confirmados.

