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

- Las cabeceras reutilizan `SectionHeader`, igual que Mis Competiciones. Dentro de
  un botón desplegable se usa `headingTag="span"` para conservar HTML válido.
- `src/components/match/matchPanelStyles.ts` centraliza botones principales,
  secundarios, destructivos, chevrons y etiquetas suaves. Guardar y confirmar
  destacan; editar, mapa, calendario y cancelar son secundarios.
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

Acciones normales reutilizan `app-action-button`: negro/blanco en claro y acento/contraste calculado en oscuro. Primarios existentes bg-neutral-950 comparten criterio; navbars, iconos, selectores y acciones destructivas conservan su función visual. Paneles normales blancos en claro, respetando superficies explícitas con texto blanco. Parejas de Partido: dos columnas1fr, margen12px común, borde neutro mezclado con acento; nombres completos por FitText, sin avatares. Calendario muestra estados únicamente En curso/Fuera de plazo en cabecera, tenga o no ventanas. Actividad distingue ventana estimada de reserva, nunca inventa scheduledAt ni muestra parejas ocultas. Chats globales separan Activos/Próximos/Finalizados por proximidad (máximo jornada actual+2), con filtro de mensajes independiente y etiqueta de liga de color suave.
