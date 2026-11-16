# Serie de vídeos — Smash & Lob PRO League (Temporada 1)

Objetivo: informar a los 8 participantes antes del inicio (domingo 20-dic-2026) con vídeos cortos (30–45 s, 9:16)
para Instagram/WhatsApp. Estilo: tema "Competition" de la app + acento de la liga (`#d7a544`).

## Calendario previsto
| # | Cuándo | Vídeo | Estado |
|---|---|---|---|
| 1 | Vie 20-nov | Bienvenida y formato | **Aprobado** (`BienvenidaRapida`: voz natural, música A, transiciones variadas) |
| 2 | Mar 24-nov | Jornada de apertura en Pando y welcome pack (hora por confirmar) | Pendiente |
| 3 | Vie 27-nov | Para qué es la inscripción (versión sin cifras: `Inscripcion`) | Montado con voz (David Martin, `voice-03`) y música A; pendiente de aprobación |
| 4 | Mar 1-dic | El chat de la liga y los avisos | Pendiente |
| 5 | Mié 2-dic | Mini: hora de la jornada de apertura confirmada (tras reservar pista) | Condicionado a la reserva |
| 6 | Vie 4-dic | Perfil y disponibilidad | Pendiente |
| 7 | Lun 7-dic | Calendario y parejas secretas | Pendiente |
| 8 | Vie 11-dic | Subir un resultado | Pendiente |
| 9 | Dom 13-dic | (Opcional) Parejas de la jornada 1 reveladas | Pendiente |
| 10 | Mar 15-dic | Clasificación, desempates y MVP por votación | Pendiente |
| 11 | Vie 18-dic | Suplentes, incidencias y cuenta atrás | Pendiente |
| 12 | Dom 20-dic | ¡Hoy empieza! | Pendiente |

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
- Usar siempre "inscripción", nunca "fianza".

## Composiciones (Remotion)
`BienvenidaRapida` (vídeo 1, con voz), `Bienvenida` (versión lenta sin voz), `InscripcionSinCifras`, `LigaFormato` (explicativo genérico).
Colores y datos de liga: objeto `LeagueConfig` (`src/Bienvenida.tsx`); el acento y el contraste se derivan en `src/kit.tsx`.
