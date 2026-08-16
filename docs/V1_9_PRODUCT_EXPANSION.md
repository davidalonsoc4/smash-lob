# v1.9 - Expansión de producto

Última actualización: 2026-08-16

Rama de trabajo: `feature/v1.9.0-product-expansion`

## En desarrollo

### 1. Resumen de jornada

- Convertir la cabecera de cada jornada de CALENDARIO en acceso a una ficha propia.
- Reutilizar `/round/[id]` como `Resumen · Jornada X`.
- Mostrar resultados, progreso, métricas, MVP según el sistema de temporada, destacados y clasificación tras la jornada.
- Mientras la jornada siga abierta, mostrar clasificación provisional y reservar los destacados definitivos para la finalización.
- Primera iteración: pantalla y cálculo de datos.
- El botón `Compartir resumen de jornada` genera y comparte un exportable gráfico con la misma identidad visual que los resúmenes de temporada.

## Pendientes para valorar después del punto 1

### 2. Nivel global / rating para Mis partidos y amistosos

- No mezclarlo con la clasificación oficial de las ligas.
- Diseñar un `Nivel Smash & Lob` global orientado a amistosos y perfil personal.
- Valorar evolución de nivel, provisionalidad de jugadores nuevos y sugerencia de parejas equilibradas.

### 3. Estadísticas globales de parejas

- Deben vivir en `MIS PARTIDOS / MI PERFIL` y agregar ligas, temporadas y amistosos.
- Antes de desarrollar, auditar la funcionalidad global de parejas/rivales ya existente para evitar duplicarla.
- Valorar detalle de pareja y Cara a Cara entre parejas.

### 4. Sustituciones

- Perfeccionar el flujo para solicitar, ofrecerse y confirmar sustitutos.
- Definir antes cómo repercute cada sustitución en clasificación, estadísticas e histórico individual.

### 5. Cierre de temporada

- Valorar evolución del resumen final hacia una experiencia/carrusel de cierre de temporada.

### 6. Salud de la liga para administración

- Valorar un panel que agregue partidos fuera de plazo, sin fecha, pendientes de reserva, resultados pendientes e incidencias.

## Aparcado

- Récords / logros como funcionalidad nueva independiente. Revisar en el futuro únicamente si falta información real respecto a estadísticas y récords existentes.

### Estado v1.9.1

- Resumen de Jornada pulido con paneles de partido reutilizados desde PARTIDO, estado real de temporada y botón de compartir ya visible.
- Pendiente inmediato: diseñar y conectar el exportable de Resumen de Jornada.

### Estado v1.9.2

- `LO MÁS DESTACADO` adopta tarjetas editoriales compactas y deja de repetir los paneles completos de `RESULTADOS`.
- Los partidos destacados resumen el motivo, parejas, resultado global, sets y enlace al detalle.
- Pendiente inmediato: diseñar y conectar el exportable de Resumen de Jornada.

### Estado v1.9.3

- `LO MÁS DESTACADO` usa comparaciones directas que demuestran el dato: juegos frente a juegos en partidos, posición anterior frente a actual en clasificación y racha previa frente a actual.
- Los destacados de partido mantienen toda la tarjeta pulsable y eliminan el CTA redundante `Ver partido`.
- Pendiente inmediato: diseñar y conectar el exportable de Resumen de Jornada.

### Estado v1.9.4

- `LO MÁS DESTACADO` añade `DECIDIDO EN TIE-BREAK` para cualquier partido finalizado cuyo tercer set sea exactamente `7-6` o `6-7`.
- La tarjeta compara directamente el tercer set (`7 · TIE-BREAK · 6` o `6 · TIE-BREAK · 7`) y mantiene el partido completo accesible al pulsar.
- Para evitar repetir el mismo encuentro por dos motivos, un partido decidido en tie-break no vuelve a competir como `PARTIDO MÁS IGUALADO`; ese destacado busca otro partido si existe.
- Pendiente inmediato: diseñar y conectar el exportable de Resumen de Jornada.

### Estado v1.9.5

- `REGISTRAR RESULTADO` conserva el avance automático al introducir cada juego, pero al borrar un valor el foco permanece en el casillero actual y no retrocede al anterior.
- Se corrige el contrato histórico de `PARTIDO MÁS IGUALADO` para no usar como fixture un tercer set `7-6`, reservado desde v1.9.4 para `DECIDIDO EN TIE-BREAK`.
- El exportable de Resumen de Jornada continúa como siguiente desarrollo del punto 1.

### Estado v1.9.6

- Desde PARTIDO, pulsar el título `Jornada X` abre directamente `Resumen · Jornada X`.
- Los destacados simples de clasificación/racha se muestran en una única línea; los destacados de partido conservan la tarjeta detallada.
- El exportable de Resumen de Jornada continúa como siguiente desarrollo del punto 1.

### Estado v1.9.7

- `LO MÁS DESTACADO` corrige la compactación de v1.9.6: el tipo de destacado vuelve a ocupar su propia línea como título.
- Solo el contenido se compacta debajo en una fila, combinando protagonista y comparación directa.
- Los destacados de partido conservan su diseño detallado.
- El exportable de Resumen de Jornada continúa como siguiente desarrollo del punto 1.

## Hoja de ruta acordada desde v1.9.8

Se mantiene esta lista completa hasta cerrar todos los puntos; cada bloque se entrega en una versión independiente y el usuario avanza indicando `SIGUIENTE`.

1. Exportable `Compartir resumen de jornada`, con la base visual de los exportables de Resumen de Temporada.
2. Centro de difusión para creator/admin con piezas compartibles de reglas, inscripciones, calendario y fecha de inicio.
3. Fecha de inicio programada opcional por temporada, cuenta atrás y bloqueo de controles competitivos hasta el arranque; unirse, identificarse y completar perfil siguen permitidos.
4. Aviso de instalación PWA solo en HOME y únicamente para cuentas que ya pertenecen a una liga. **Incluido en v1.9.8.**
5. Fecha compacta `DD/MM/YYYY` en el resumen fijado de reserva de CHAT. **Incluido en v1.9.8.**
6. Separación visual homogénea entre mensajes consecutivos del mismo autor y propuestas, tomando como referencia los mensajes recibidos. **Incluido en v1.9.8.**
7. Imagen opcional en Completar Perfil, usando por defecto la imagen de Google si existe y sin convertirla en requisito de completitud.
8. El superadmin podrá cambiar las imágenes de los jugadores de la aplicación.
9. `EN RACHA` muestra únicamente la racha actual, sin comparación con la racha anterior. **Incluido en v1.9.8.**
10. Los destacados con resultado muestran los nombres de los dos jugadores de cada pareja en líneas separadas, sin `/`. **Incluido en v1.9.8.**
11. Eliminar los dos warnings `react-hooks/exhaustive-deps` de `MatchReservationConfirmation`. **Incluido en v1.9.8.**

Orden de desarrollo tras v1.9.8: **1 → 2/3 → 7/8**, manteniendo las versiones separadas para revisión local antes de continuar.

### Estado v1.9.8

- PWA: aviso de instalación solo en HOME para usuarios autenticados con pertenencia a liga.
- CHAT: fecha numérica compacta en la reserva fijada y separación visual de mensajes enviados alineada con la referencia de recibidos.
- Resumen de Jornada: `EN RACHA` conserva únicamente victorias actuales y las parejas de los destacados de partido se leen en dos líneas, una por jugador.
- Se eliminan los dos warnings de dependencias inestables de `MatchReservationConfirmation`.
- Siguiente entrega al recibir `SIGUIENTE`: exportable `Compartir resumen de jornada`.

## v1.9.9 - Exportable de Resumen de Jornada (2026-08-16)

- `Compartir resumen de jornada` deja de ser un placeholder y genera un PNG de 1080 px preparado para compartir o descargar.
- El exportable reutiliza el lenguaje visual de las imágenes de temporada: cabecera oscura, logo de liga opcional según disponibilidad, superficies claras y firma `Creado con Smash & Lob`.
- Incluye estado y fechas, métricas, resultados con sets, MVP de jornada o MVPs por partido según configuración, destacados y clasificación tras la jornada.
- Las jornadas aún abiertas se pueden compartir conservando su estado real: clasificación provisional y mensajes de MVP/destacados pendientes cuando corresponda.
- En navegadores con Web Share para archivos se abre el diálogo nativo; en el resto se descarga el PNG como fallback.
- No hay cambios de API, Supabase ni migraciones.


## v1.10.0 - Perfiles, temporada programada y Centro de Difusión (2026-08-16)

- Completar Perfil incorpora carga opcional de imagen manteniendo Google/predeterminado como fallback.
- Superadmin gestiona `players.competitive_avatar_url` como override competitivo separado de `app_users.avatar_url`, también para jugadores sin cuenta vinculada.
- Las temporadas admiten `scheduled_start_at`: countdown, estado visual programado, bloqueo de mutaciones competitivas y activación server-side al vencer la fecha respetando plantilla y pagos.
- Centro de Difusión genera piezas PNG 4:5 para Reglas, Inscripciones, Calendario, Inicio y Cuenta atrás con datos reales de liga/temporada.
- Quedan fuera deliberadamente: pulido visual del exportable de Jornada, nivel global y estadísticas de parejas.
