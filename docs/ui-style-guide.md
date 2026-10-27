# Guía de estilos compartidos

## Etiquetas de resultado de partido

Referencia visual: **Competiciones → Actividad personal**.

Usar `src/components/matches/MatchOutcomeBadge.tsx` para cualquier etiqueta de
Victoria o Derrota. Las tarjetas de liga y personales lo comparten, incluyendo
Home, Calendario, Mis partidos y las previews de último encuentro.

```tsx
<MatchOutcomeBadge outcome="victory" />
<MatchOutcomeBadge outcome="defeat" />
```

- Texto «Victoria» o «Derrota», sin forzar mayúsculas, traducido al idioma activo.
- Tamaño `type-caption`, peso semibold y espaciado normal entre letras.
- Padding horizontal de 8 px y vertical de 2 px; ancho ajustado al texto.
- Forma redondeada, fondo suave verde/rojo y texto del mismo tono con contraste.
- Sin borde, anillo decorativo ni sombra. Los tokens existentes adaptan los
  colores a los temas claros y oscuros; no usar el acento de liga para el resultado.
- Conserva la explicación accesible mediante `StatusHelp`, tanto al tocar como
  al navegar con teclado. El foco de accesibilidad se mantiene.
- No introducir variantes grandes o clases locales que alteren este estilo.

`outcome="finished"` muestra «Finalizado» en tono neutro cuando no se conoce un
resultado personal; no se inventa una victoria o derrota.

Esta regla se aplica a etiquetas de resultado. Los círculos V/D del bloque Racha,
los gráficos, los marcadores y los indicadores estadísticos mantienen su diseño.

## Estados de partidos y ligas

- Las previews de partidos conservan `MatchStatusBadge variant="dot"`: punto de
  6 px con explicación accesible. Victoria/Derrota mantienen texto.
- Cuando el estado necesita texto, usar fondo suave, sin borde/anillo ni
  mayúsculas forzadas. `softStatusBadgeClassName` en `src/lib/statusStyles.ts`
  comparte este acabado entre `MatchStatusBadge variant="soft"` y Mis ligas.
- En Mis ligas el estado describe la temporada, nunca la liga seleccionada:
  En curso, Próximamente (con cuenta atrás cuando exista) o Terminada. Acompañar
  el punto con texto; mantener roles Admin/Espectador como información secundaria.
- Las tarjetas compactas de Competiciones usan el acento propio en un degradado
  lateral estrecho. Mis ligas usa borde superior fino de 2px del acento propio,
  adaptado a claro/oscuro, laterales neutros y logo sin marco. Conserva el acento
  en el progreso y no lleva degradado. Diseño aprobado por el usuario.
  Los estados mantienen sus colores semánticos.

## Cabeceras de pantalla

- Competition centra el contenido con padding vertical simétrico de `.625rem`.
  La regla común evita que el padding superior de Clásico desplace el título
  hacia arriba. No compensar pantallas individuales con transformaciones.
- Las cabeceras inmersivas de chat conservan su geometría y safe area propias.

## Paneles y acciones de Partido

- Con resultado, una sola superficie contiene ambas parejas en una cuadrícula
  compartida: cabecera S1/S2/S3/Sets una sola vez y números centrados a la altura
  del separador entre los dos nombres. Conservar nombres adaptables y total de sets
  destacado. Prueba local MC90: ganador con trofeo junto al total y etiqueta accesible,
  sin otra caja. Referencia anterior con raya lateral: aef3211f; alternativas2/3
  documentadas en PLAN/STATUS, pendientes de valoración.
- El MVP resuelto se reconoce en una fila compacta debajo del marcador, con estrella
  de acento y ámbito explícito (partido/jornada). La votación pendiente queda después
  de confirmar el resultado. La gestión tiene menor peso visual; bloqueo y disputa
  mantienen su explicación visible y las acciones destructivas siguen desplegables.
  Editar resultado queda a la derecha del título; bloqueo y limpieza dentro de Más
  acciones. La estrella de reconocimiento mide28px y adapta su acento al contraste.

- Jerarquía compartida: `app-action-button`/`app-action-primary` para guardar o
  confirmar y las acciones protagonistas Cómo llegar/Calendario de Programación
  (negro en claro, acento en oscuro); `app-action-secondary` para
  Cancelar/Cerrar/Editar (transparente, borde neutro y texto
  del tema). Los helpers de `matchPanelStyles.ts` aplican los roles a todos
  los formularios de Partido. Misma altura/tipografía, foco y disabled legibles;
  conservar orden secundario izquierda/principal derecha y estilos destructivos.

- Las cabeceras reutilizan `SectionHeader`, igual que Mis Competiciones. Dentro de
  un botón desplegable se usa `headingTag="span"` para conservar HTML válido.
- `src/components/match/matchPanelStyles.ts` centraliza botones principales,
  secundarios, destructivos, chevrons y etiquetas suaves. Guardar y confirmar
  destacan, al igual que mapa/calendario dentro de Programación; editar y cancelar
  son secundarios.
- Los pagos indican explícitamente «Por pagar» o «Por cobrar». Los avisos no
  dependen solo del color y conservan la explicación de `StatusHelp`.
- El resultado pendiente se muestra antes de Programación y Pagos. Antes de
  jugar sigue accesible desde su cabecera compacta. El resultado guardado agrupa
  confirmación, autor y correcciones junto al marcador, respetando permisos.

- Acciones de Partido: altura mínima 36 px, texto 12 px y borde visible en las
  secundarias; no usar fondos claros de pulsación en cabeceras desplegables.
- Registrar resultado: cada pareja conserva su fila, nombres a la izquierda,
  inputs de sets alineados a la derecha y puntos calculados al final.

- Programación identifica el lugar como Población · Ubicación · Pista cuando
  existen esos datos; mapa y calendario ocupan columnas de igual tamaño.

- Todas las previews usan getLeagueLocationCompactText a través de los metadatos
  compartidos: Población · Ubicación · Pista, omitiendo los datos ausentes.

### Acciones, parejas y contexto de jornadas (MC62)

Acciones principales reutilizan `app-action-button`: negro/blanco en claro y acento/contraste calculado en oscuro; las secundarias usan `app-action-secondary`, neutral y con borde. Primarios existentes bg-neutral-950 comparten criterio; navbars, iconos, selectores y acciones destructivas conservan su función visual. Paneles normales blancos en claro, respetando superficies explícitas con texto blanco. Parejas de Partido: dos columnas1fr, margen12px común, borde neutro mezclado con acento; nombres completos por FitText, sin avatares. Calendario muestra estados únicamente En curso/Fuera de plazo en cabecera, tenga o no ventanas. Actividad distingue ventana estimada de reserva, nunca inventa scheduledAt ni muestra parejas ocultas. Chats globales separan Activos/Próximos/Finalizados por proximidad (máximo jornada actual+2), con filtro de mensajes independiente y etiqueta de liga de color suave.

## Creación guiada de ligas
- Recorrido básico: identidad de liga → participantes de temporada → resumen. Avanzada es una pantalla opcional entre participantes y resumen; comparte el mismo estado.
- Estándares: calendario equilibrado automático, vuelta única, visibilidad completa, jornadas sin plazo, inicio manual, tres sets completos, MVP automático, sin confirmación adicional, sin cuota, sin bolas de organización ni recomendaciones de disponibilidad.
- La liga se guarda en el primer paso; la temporada solo al confirmar el resumen. Atrás/Editar conservan datos dentro del recorrido. La modalidad queda fijada por las reglas existentes al guardar la liga; avisarlo antes y después.
- Logo: LeagueLogo + ImageCropDialog existentes; si falla su guardado se conserva el ID creado para reintentar sin duplicados.
- Acciones locales compartidas: league-creation-primary (negro en claro/acento en oscuro), secondary y edit. Pie sticky con Atrás y un único CTA, mínimo44px y safe area. Ajustes avanzados agrupados en details con resumen de valores y chevron.
- Contador de plazas completadas incluye jugadores existentes, cuentas vinculadas y nombres manuales. Parejas agrupadas de dos en dos; directorio bajo búsqueda y sin vaciar nombres al alternar inscripción.

## Identidad de Competiciones y Mis ligas

- `CompetitionsOverview.module.css` concentra estas variantes de presentación;
  no modifica `PersonalMatchCard`, `LeagueLogo` ni el carrusel compartido.
- Actividad personal es el foco de la home: acento puro al100%, sin borde ni
  sombra en la tarjeta del partido, sin una segunda envoltura visual exterior.
  Las cajas de parejas conservan sus espacios y fondo transparente, con borde
  fino del color de superficie de las tarjetas de competiciones, sin sombra;
  nombres con contraste del acento y marcadores con fondo propio. No añadir
  estadísticas, mensajes ni acciones para llenar espacio.
- En esta superficie de acento, el origen/competición aparece como texto
  discreto sin pastilla, ajustado al ancho disponible y con contraste del tema.
  Victoria/Derrota conservan el componente semántico compartido y su ayuda;
  los próximos partidos mantienen el indicador de punto.
- Sobre el acento, Victoria/Derrota usan verde/rojo opacos y texto blanco.
  El punto de estado de partido usa `StatusDot` compartido de8px en toda la app;
  conserva su color y añade contorno interior del tono de las
  cajas solo cuando su contraste con el fondo sea inferior a3:1. La medición
  responde a cambios de tema sin temporizadores y no afecta a otros contextos.
- Los nombres de jugadores en las previews personales reutilizan `FitText`
  en una línea, reduciendo desde14px hasta10px antes de recurrir a elipsis.
  Respetar la alineación de cada pareja y recalcular al cambiar ancho o tema.
- Previews de liga conservan su degradado lateral estrecho; torneos utilizan
  copa y un tinte sutil del tema. Los colores de estado mantienen su significado.
- Mis ligas usa logo destacado sobre un fondo suave del color de la liga,
  borde superior propio, lateral más evidente en temporadas en curso y una
  franja inferior para los datos existentes. Finalizadas sigue contraído.
- Todas las variantes respetan Clásico/Competition, claro/oscuro y movimiento
  reducido; texto secundario de métricas con contraste suficiente sobre su fondo.

## Ventanas flotantes y búsqueda

- Reutilizar `FloatingDialog` y las clases `app-dialog-*` de `globals.css`.
  Es un diálogo nativo en el portal de `document.body`: foco contenido, fondo
  inerte, bloqueo del scroll y devolución del foco al cerrar. No duplicar overlays.
- Variantes: `search` para búsqueda/filtros (posición de Ajustes), `actions` para
  decisiones breves centradas, `content` para QR/imágenes/edición. La ayuda usa
  `help`, inferior en móvil y centrada en escritorio. Los tooltips siguen aparte.
- Borde sutil, radio16px, misma sombra y backdrop; títulos16px y controles44px.
  Contenido largo con scroll interior y medidas que respetan el viewport/safe area.
- `DialogCloseButton` para búsquedas/previsualizaciones. Acciones breves conservan
  Cancelar abajo; edición conserva Cancelar/Guardar. Bloquear cierre al guardar
  y confirmar descarte si se perderían cambios (por ejemplo encuadre de imagen).
- `app-dialog-option`, `app-dialog-primary`, `app-dialog-cancel`, `DialogChevron`
  y `DialogOptionIcon` comparten controles. Principal negro en claro/acento en
  oscuro; mantener contraste, estados disabled, foco y selección visibles.
- Cerrar al completar una acción; ante error conservar la ventana con explicación
  y reintento. Copiar ubicación confirma mediante el aviso compartido de la app.
- `FloatingSearchButton` coloca la lupa sobre navbar y safe area. Chats conserva
  consulta/filtros al cerrar, señala filtros activos y ofrece Limpiar filtros;
  los buscadores de navegación conservan sus propias reglas de consulta reciente.
