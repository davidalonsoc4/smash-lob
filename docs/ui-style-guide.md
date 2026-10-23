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
