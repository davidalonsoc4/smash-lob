# Serie de vídeos — Smash & Lob PRO League (Temporada 1)

Objetivo: informar a los 8 participantes antes del inicio (domingo 20-dic-2026) con vídeos cortos (30–45 s, 9:16)
para Instagram/WhatsApp. Estilo: tema "Competition" de la app + acento de la liga (`#d7a544`).

## Calendario previsto
| # | Cuándo | Vídeo | Estado |
|---|---|---|---|
| 1 | Vie 20-nov | Bienvenida y formato | **Aprobado** (`BienvenidaRapida`: voz natural, música A, transiciones variadas) |
| 2+5 | Tras confirmar hora (reserva 1-dic) | Jornada de apertura fusionada con el mini 5: plan del día, hora de quedada, comida u otros planes y cómo se desbloquean los enfrentamientos al empezar la liga (sorpresa para todos) | **STAND BY** hasta tener la hora confirmada |
| 3 | Vie 27-nov | Para qué es la inscripción (versión sin cifras: `Inscripcion`) | Montado con voz (guion v5: incluye premio; lista de cuentas con importes cifrados) y música A; **Aprobado** |
| 4 | Mar 1-dic | Anuncio del chat de la liga dentro de la app: recordar activar las notificaciones y cómo; los avisos de la liga se harán por el chat de la app; abrir la app para que se actualice automáticamente | **Aprobado** (v2, `ChatDeLaLiga`: chat alto con mensajes subiendo y NOVEDAD al final). Réplicas del chat de jugador (sin adjuntos ni fotos/vídeos); de aquí en adelante los vídeos se publican en el chat como "NOVEDAD" con vídeo |
| 6 | Vie 4-dic | Perfil y disponibilidad (`PerfilDisponibilidad`) | **Aprobado**. Montado con voz y música A. Requiere activar recomendaciones en la temporada (hecho) y, idealmente, mover la disponibilidad al perfil |
| 7 | Lun 7-dic | Calendario y parejas secretas | Pendiente |
| 8 | Vie 11-dic | Subir un resultado (`SubirResultado`) | Montado con voz y música A (v2: corregido recuadro de pareja en "Tu partido"). Incluye aviso de notificaciones ("Falta el resultado" a las 2, 3, 4 y 24 h de la hora de inicio) |
| 9 | — | (Descartado) Parejas de la jornada 1 reveladas | No se hace; la explicación del desbloqueo va en el 2+5 |
| 10 | Mar 15-dic | Clasificación, desempate y MVP automático avanzado (`ClasificacionMvp`; la liga usa `automatic_advanced`, no votación) | **Aprobado** (v3: voz "Em-Bi-Pí" con subtítulos "MVP", música enlazada y fundido largo) |
| 11 | Vie 18-dic | Suplentes e incidencias | APARCADO hasta que el organizador decida si mantiene el sistema de suplentes (vídeo corto aparte: son algo puntual) |
| 11b | Antes del 13-dic | Cuenta atrás y desbloqueo del 20-dic (`CuentaAtrasDesbloqueo`): cuenta atrás, aviso de jornada de apertura 7 días antes, desbloqueo automático y jornadas que se van desvelando | **Aprobado** (versión final v5: con jornadas y chats bloqueados con candado y "te avisamos cuando se desbloquee tu siguiente partido"). La v4 queda en el repo (`assets/video12`) |
| 12 | Dom 20-dic | ¡Hoy empieza! | Pendiente |
| + | Antes del 20-dic (por decidir) | Presentación de la app (`PresentacionApp`): navegación fuera/dentro de la liga, botones de arriba y liga bloqueada hasta el 20-dic | **Aprobado** (montado con voz y música A) |
| + | PENDIENTE (recordar al organizador) | "¿Sabías que también puedes registrar tus partidos normales en la app?": crear un encuentro (amistoso) con jugadores de la liga o escritos a mano, guardar el resultado, historial y estadísticas de MI PERFIL (compañeros, rivales, mejor pareja, némesis, diferencia de juegos y sets...) | **Aprobado** (`11-partidos-normales`) |
| + | Sustituye al vídeo 7 de calendario | "Ha llegado el día, ¿cómo organizas tu próximo encuentro?" (`OrganizaTuPartido`): horarios recomendados, propuestas en el chat, programar el partido, calendario y recordatorios, pagos de la pista (sin bolas: van con la inscripción), resultado | **Aprobado** (`05-organiza-partido`) |
| + | — | Aviso de liga bloqueada | Incluido dentro de la presentación (escenas 5 y 6; reutilizables como vídeo corto) |

## Reglas de contenido
- Escenas con datos de ejemplo llevan la etiqueta **"EJEMPLO · DATOS FICTICIOS"**.
- Se usan **solo nombres de pila** de los jugadores (sin apellidos ni iniciales; hay dos Álvaros y dos Andonis a propósito).
- Los cuadros de ejemplo **no deben coincidir con ningún enfrentamiento real** de la liga: se comprueba a nivel de persona y de
  nombre de pila con una consulta que solo devuelve un cuadro válido (nunca se muestran los emparejamientos reales).
- La hora de la jornada de apertura es **"por confirmar"** hasta reservar pista (1-dic).
- Vídeo de la inscripción: versión **sin cifras** (publicable siempre). El contenido del welcome pack es sorpresa y no se muestra.
  Las cuentas **no se publican en la app**: la pantalla de economía es privada (solo organizador, con exportación a Excel/imagen por si
  alguien las pide). No se muestra esa pantalla en ningún vídeo. La versión con cifras queda en espera (incierta).
- El dinero sobrante de la inscripción **se devuelve** (si se decidiera otro uso, se comunicaría aparte). **No se anuncian** premios
  ni comida de cierre (aún sin decidir).
- Se destina una parte fija a **premios** (sin decir cuáles). En el vídeo aparece como fila "Premios". La lista de cuentas muestra los
  importes cifrados (`•••• €`) y se titula "Cuentas de la liga" (sin cabecera/pestañas de la app).
- Cierre de todos los vídeos: "Nos vemos en la pista" (decidido por el organizador; no cambiar). Desde el vídeo de presentación se antepone "Así que recuerda," (con 0,7 s de pausa) salvo que choque con el contenido; el cierre entra palabra a palabra con golpe de sonido y destello del logo.
- Usar siempre "inscripción", nunca "fianza".

## Composiciones (Remotion)
`BienvenidaRapida` (vídeo 1, con voz), `Bienvenida` (versión lenta sin voz), `InscripcionSinCifras`, `LigaFormato` (explicativo genérico).
Colores y datos de liga: objeto `LeagueConfig` (`src/Bienvenida.tsx`); el acento y el contraste se derivan en `src/kit.tsx`.

- Nunca consultar ni mostrar emparejamientos reales: ni el organizador ni yo los vemos. Solo nombres de pila de la liga con emparejamientos ficticios y etiqueta de ejemplo (o signos de interrogación).

## Instagram @smashandlob · Reel 1 (genérico, sin PRO League)
- `InstagramReel1` (`src/Reel1.tsx`, voz `voiceApp1.ts`, toma `assets/app-reel1b/`): guión 8 aprobado. Avatares ficticios, réplicas simplificadas, logo de la app al final, eslogan «Para los que nunca tienen suficiente pádel», sin «Nos vemos en la pista». Salida: `out/listos-para-subir/12-reel1-liguilla.mp4` (pendiente de aprobación del usuario).
- Pendiente: guiones de los reels 2 y 3 (aprobar antes de generar voz).
