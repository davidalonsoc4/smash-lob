# Plan de vídeos, guías y tutoriales de Smash & Lob

Documento de planificación. No contiene guiones: para cada vídeo da la **idea que hay que enseñar**, a quién va dirigido y qué conceptos debe dejar claros. El guion, los visuales y la locución se preparan aparte.

Estado de partida (revisado en código y en la pantalla de Ayuda, no dentro de la app en uso real):

- Vídeos que ya existen en la biblioteca (11): Bienvenida, Presentación de la app, Chat de la liga, Inscripción, Perfil y disponibilidad, Organiza un partido, Subir resultado, Clasificación y MVP, Cuenta atrás y desbloqueo, Partidos normales, Liguilla (reel 1). No he visto su contenido: antes de grabar nada nuevo, hay que revisarlos contra esta lista (columna «¿Ya cubierto?»).
- Guías visuales (tours) que existen: Primeros pasos, Pantalla de inicio, Partidos y jornadas, Chats, Detalle de partido (1 paso), Chat del partido, Clasificación, Estadísticas, Ajustes y Administrar temporada.

---

## Parte 1 · Guías visuales sobre la pantalla (tours)

### Problemas detectados

| Guía | Problema | Propuesta |
|---|---|---|
| Pantalla de inicio | 11 pasos, la más larga. Mezcla la pantalla con los botones flotantes (ajustes, avisos, compartir, invitar, ayuda). | Dejar 6 o 7 pasos sobre la pantalla y mover los botones flotantes a una guía corta aparte («Botones de arriba»). |
| Detalle de partido | Solo 1 paso (la burbuja del chat). Es la pantalla con más acciones de toda la app. | Ampliarla: fecha y reserva, sorteo del saque, subir resultado, confirmar o disputar, votar MVP, incidencia. Es la guía más urgente. |
| Chat del partido | El texto del segundo paso es un párrafo enorme. | Partirlo en 3 pasos: proponer fecha, votar, confirmar reserva. |
| Detalle de partido y Chat | No salen en la biblioteca de Ayuda porque su ruta lleva el id del partido. Solo se ven con el botón flotante dentro del partido. | Aceptable; avisar en la propia Ayuda («Estas dos guías se abren desde un partido»). |
| Ajustes | Nombra las Notificaciones como una pantalla más; ahora tienen 6 interruptores. | Añadir guía de Notificaciones (ver abajo). |
| Todas | La guía solo se lanza sola la primera vez; después hay que ir a Ayuda. | Mantener. Valorar un punto de interrogación fijo en pantallas nuevas. |

### Guías nuevas que faltan

Cada una se asocia a una pantalla y tiene entre 3 y 6 pasos.

1. **Detalle de partido (ampliar)**, `/match/[id]`. Prioridad alta.
2. **Subir resultado** (el diálogo de resultado). Qué se rellena, cuándo hay que confirmarlo, qué pasa si se disputa.
3. **Notificaciones**, `/settings/notifications`. Activar push en el dispositivo, los 6 interruptores, qué avisos son obligatorios.
4. **Amistosos**, `/personal-matches`. Crear, invitar (cuenta enlazada o nombre externo), quién puede editar y quién puede borrar, pagos.
5. **Chat de amistoso**, `/personal-matches/[id]/chat`.
6. **Pagos**, `/payments`. Qué debo, qué me deben, cómo marcar un pago.
7. **Perfil y disponibilidad**, `/settings/profile` y `/availability`.
8. **Mis ligas**, `/leagues`. Cambiar de liga, unirse con enlace, crear una.
9. **Actividad**, `/activity`. Qué es el historial y cómo filtrar.
10. **Estadísticas por apartado**: comparar, evolución, récords. Hoy solo hay guía de la portada.
11. **Administración de liga**, `/admin/league`: identidad, lugares, recomendaciones.
12. **Usuarios y roles**, `/admin/users`: roles, espectadores, invitaciones.
13. **Comunicados e incidencias**, `/admin/announcements` y `/admin/incidents`.
14. **Torneos**, `/tournaments/*`. Solo cuando se habiliten (comprobar el feature flag real antes de hacerla).

Cada guía necesita que los elementos de la pantalla lleven su marca `data-tour`. Hoy solo la llevan 10 pantallas; esta es la parte de código de cada guía.

---

## Parte 2 · Vídeos

Formato recomendado para todos: **vertical (9:16)**, entre **30 y 90 segundos**, con subtítulos, un solo concepto por vídeo y una llamada final a la acción dentro de la app («Abre Partidos y pruébalo»). Los ya hechos duran entre 30 y 50 segundos: es un buen tamaño.

Leyenda de prioridad: **A** = imprescindible para que la app se entienda, **B** = recomendable, **C** = cuando haya tiempo.

### Bloque 1 · Entender la app (jugadores)

**1. Cómo funciona una liga** · A · ¿Ya cubierto? Revisar «Presentación de la app» y «Bienvenida».
- Es una liga individual aunque se juegue por parejas: cada jugador suma sus propios puntos.
- Las parejas rotan entre jornadas.
- Una jornada = un partido por jugador en una ventana de tiempo.
- La clasificación premia la regularidad durante toda la temporada.
- Visual: calendario de jornadas, rotación de parejas, tabla individual.

**2. Cómo se puntúa** · A · Revisar «Clasificación y MVP».
- 3-0 reparte 3 puntos a la pareja ganadora; 2-1 reparte 2 a la ganadora y 1 a la perdedora.
- Los juegos desempatan: ganados, perdidos y diferencia.
- Qué cambia si la liga permite sets opcionales.
- Visual: un partido de ejemplo y cómo sube cada jugador en la tabla.

**3. Tu primera jornada paso a paso** · A · Revisar «Organiza un partido».
- Dónde ves tu partido y con quién juegas.
- Cuadrar el día: chat, propuestas de fecha, votar con ✓ o ✕.
- Cuando cuatro votan lo mismo, el partido pasa a «pendiente de reserva».
- Confirmar fecha, sitio y pista.
- Visual: pantalla de Partidos, chat y propuesta.

**4. Estados de un partido** · B
- Sin programar, programado, aplazado, terminado.
- Qué puedes hacer en cada estado.
- Qué significa «aplazado» y quién lo decide.

**5. El sorteo del saque (la moneda)** · A · Nuevo, no existe.
- Se abre 30 minutos antes de empezar y llega un aviso.
- Quién puede lanzar la moneda.
- Una vez hecho el sorteo, todos lo ven.
- Visual: aviso «¡Ya puedes sortear el saque de tu partido!», la moneda girando, el resultado.

**6. Subir el resultado** · A · Revisar «Subir resultado».
- Quién lo sube y cuándo.
- Cómo se introducen sets y juegos.
- Que hay una confirmación del otro lado y que puede disputarse.

**7. Confirmar o disputar un resultado** · B · Nuevo.
- Qué recibes cuando el rival sube un resultado.
- Confirmar, corregir o disputar.
- Qué ve la administración en una disputa.

**8. MVP: votar y premios** · B · Revisar «Clasificación y MVP».
- Se vota al terminar el partido; hay recordatorios.
- MVP del partido y de la jornada.
- Cuánto aporta a la clasificación, según la liga.

**9. Aplazar, lesión y sustituciones** · B · Nuevo.
- Cómo se avisa de que no puedes jugar.
- Lesión real, acordada, puntual y permanente (según lo que permita la liga).
- Que el histórico se conserva.

**10. Quién lleva las bolas** · C · Nuevo.
- Cómo se asigna.
- El recordatorio antes del partido.

**11. Pagos de pista** · B · Nuevo.
- Qué debo y qué me deben.
- Marcar un pago como hecho; recordatorios.
- Pagos de inscripción de la temporada.

### Bloque 2 · Mi cuenta y la app

**12. Instalar la app y activar los avisos** · A · Nuevo. El que más conversión da.
- Añadir a la pantalla de inicio (PWA), en iPhone y Android.
- Activar las notificaciones en el dispositivo.
- Por qué importa: los avisos de partido y sorteo.

**13. Configurar tus notificaciones** · A · Nuevo.
- Los 6 interruptores y qué agrupa cada uno.
- Los avisos obligatorios y cómo dejar de recibir todo (desactivar en el dispositivo).

**14. Tu perfil y tu disponibilidad** · B · Revisar «Perfil y disponibilidad».
- Avatar, nombre, tema.
- Marcar cuándo puedes jugar y por qué ayuda a organizar.

**15. Apariencia, idioma y sonidos** · C
- Temas, idioma (es, en, eu), sonidos.

**16. Estadísticas y récords** · B · Nuevo.
- Resumen, comparar con otro jugador, evolución, récords.
- Qué dato mirar para qué.

**17. Compartir con espectadores** · B · Nuevo.
- Enlace de solo lectura.
- Qué ven y qué no (solo información explícitamente pública).

### Bloque 3 · Amistosos y torneos

**18. Partidos normales (amistosos)** · A · Revisar «Partidos normales».
- Crear un amistoso, invitar jugadores con cuenta o con nombre.
- Quién puede editar (creador y enlazados) y quién puede borrar (solo el creador).
- Resultado, chat y pagos.

**19. Liguilla** · C · Revisar «Liguilla (reel 1)» y comprobar qué función es.

**20. Torneos** · C · Solo cuando se habiliten en producción.
- Crear, inscribirse, cuadro y seguimiento en directo.

### Bloque 4 · Organizadores y administradores

**21. Crear tu liga e invitar jugadores** · A · Nuevo (Inscripción cubre la parte del jugador).
- Crear liga, nombre y escudo, lugares.
- Enlace de invitación, código y cómo se unen.

**22. Crear una temporada** · A · Nuevo.
- Formato, número de jornadas, reglas de sets.
- Inscripción y cuota (si hay).
- Calendario secreto y revelado de parejas.
- Inicio programado y cuenta atrás: ver «Cuenta atrás y desbloqueo».

**23. Gestionar la temporada en curso** · A · Nuevo.
- Jornadas, márgenes, aplazamientos.
- Incidencias y sustituciones.
- Corregir un resultado.

**24. Economía de la temporada** · B · Nuevo.
- Cobros de inscripción, gastos y saldo.

**25. Comunicados y chat de la liga** · B · Revisar «Chat de la liga».
- Novedades: llegan siempre a todos.
- Cuándo usar comunicados y cuándo el chat.

**26. Roles, usuarios y espectadores** · B · Nuevo.
- Quién puede qué: creador, administradores, jugadores y espectadores.

**27. Cerrar la temporada y empezar la siguiente** · B · Nuevo.
- Cierre, resumen final, duplicar la temporada.

**28. Kit de medios y pack de bienvenida** · C · Nuevo.

---

## Orden recomendado

1. **Primera tanda (lo que desbloquea que alguien use la app):** 1, 3, 5, 6, 12, 13, 18, 21, 22.
2. **Segunda tanda:** 2, 7, 8, 9, 11, 14, 16, 17, 23, 25.
3. **Tercera tanda:** el resto.

Las guías visuales se hacen en paralelo, empezando por **Detalle de partido ampliado**, **Notificaciones** y **Amistosos**, porque son las pantallas con más acciones y menos explicación.

## Auditoría de guías (24 nov 2026)

**Guías existentes: ¿siguen vigentes?** Comprobado leyendo el código y verificando, una a una, que cada elemento que señala una guía (`data-tour`) sigue existiendo en la pantalla. Los 30 puntos de anclaje existen (algunos se generan por código, como los de Ajustes y el selector de temporada). No he recorrido las guías dentro de la app.

| Guía | Estado |
|---|---|
| Primeros pasos, Partidos y jornadas, Chats, Clasificación, Estadísticas, Administrar temporada | Vigentes. |
| Pantalla de inicio | Vigente pero demasiado larga (11 pasos). Texto de «Ayuda visual» **actualizado** (menciona el vídeo de la pantalla). |
| Ajustes | Texto de «Notificaciones» **actualizado** (seis interruptores y avisos obligatorios). |
| Chat del partido | Vigente; un paso con un párrafo demasiado largo. |
| Detalle de partido | Desactualizada por defecto: un solo paso, y no cubre sorteo del saque, resultado, confirmación, MVP, reserva ni incidencias. |

**Pantallas sin guía, por orden de prioridad**
1. Detalle de partido (ampliar), subir resultado y sorteo del saque.
2. Ajustes de notificaciones.
3. Amistosos (lista, detalle y chat).
4. Pagos.
5. Perfil y disponibilidad.
6. Mis ligas (unirse, crear, cambiar).
7. Actividad.
8. Estadísticas por apartado (comparar, evolución, récords).
9. Administración: liga, usuarios y roles, comunicados e incidencias.
10. Torneos (cuando se habiliten).

Las guías de esta lista se crean pantalla a pantalla: cada una exige marcar los elementos de la pantalla con `data-tour` y probar el recorrido dentro de la app.

## Vídeo de cada pantalla

Cada vídeo puede asignarse a una pantalla desde `/admin/tutorials` (campo «Pantalla del vídeo»). El botón de ayuda de esa pantalla ofrece entonces «Ver el vídeo de esta pantalla». Pantallas disponibles: Inicio, Partidos y jornadas, Detalle de partido, Chat del partido, Chats, Clasificación, Estadísticas, Ajustes, Ajustes de notificaciones, Perfil y disponibilidad, Amistosos, Pagos, Mis ligas, Actividad, Administrar temporada, Administrar liga, Usuarios y roles y Torneos. Si una pantalla tiene varios vídeos, se ofrece el primero por orden.

Propuesta de asignación para los vídeos de prioridad A: sorteo del saque y subir resultado a «Detalle de partido»; configurar notificaciones a «Ajustes de notificaciones»; instalar la app y avisos a «Ajustes»; tu primera jornada a «Partidos y jornadas»; amistosos a «Amistosos»; crear temporada a «Administrar temporada»; crear tu liga a «Mis ligas».

## Antes de grabar

- Revisar los 11 vídeos actuales contra la lista y marcar cuáles se rehacen.
- Cada cambio de interfaz queda reflejado en la guía asociada; los vídeos se quedan desfasados antes, así que conviene no mostrar menús profundos que cambian a menudo.
- Cuando una función cambia de nombre (como las Notificaciones, ahora en 6 interruptores), revisar los vídeos que la nombran.
- Preguntas de producto abiertas: qué parte de torneos y liguilla está visible en producción, y si los vídeos de administración van solo para administradores (la biblioteca ya filtra por audiencia).

## Subida masiva de vídeos

En `/admin/tutorials`, el botón «Subir varios vídeos» permite elegir todos los archivos de una vez.

- **Emparejado por nombre:** un MP4 y una imagen (JPG, PNG o WebP) con el mismo nombre forman un tutorial con su miniatura. Sin imagen, se toma un fotograma del vídeo.
- **Orden:** los tutoriales se añaden por orden natural del nombre del archivo. Conviene numerarlos: `01_bienvenida.mp4`, `02_chat-de-la-liga.mp4`, `10_pagos.mp4`.
- **Título:** se propone a partir del nombre, sin el número ni los guiones (`02_chat-de-la-liga` pasa a «Chat de la liga»), y se puede cambiar antes de subir.
- **Pantalla:** cada vídeo puede asignarse a su pantalla antes de subir.
- **Quién los ve:** por defecto quedan como **borrador**, para revisarlos y publicarlos después; también se pueden subir como públicos. No se envía el aviso al chat de las ligas.
- **Límites:** MP4 de hasta 50 MB y miniaturas de hasta 5 MB. Los archivos que no se pueden usar se listan antes de subir.
- **Si falla uno:** los demás siguen; se vuelve a pulsar «Subir» y solo se reintentan los pendientes.
