# Serie de vídeos — Smash & Lob PRO League (Temporada 1)

Objetivo: informar a los 8 participantes antes del inicio (domingo 20-dic-2026) con vídeos cortos (30–45 s, 9:16)
para Instagram/WhatsApp. Estilo: tema "Competition" de la app + acento de la liga (`#d7a544`).

## Orden de envío a los jugadores (definitivo; el nº es el del archivo en `out/listos-para-subir/`)
Criterio: primero la visión general y la app; el **chat (03) es el punto de inflexión**: desde ahí los vídeos se publican en el chat de la app como "NOVEDAD" (hasta entonces el chat estará en desuso). Fechas orientativas.

| Nº | Fecha | Vídeo (composición) | Estado |
|---|---|---|---|
| 01 | Vie 20-nov | Bienvenida y formato (`BienvenidaV2`, `src/Bienvenida2.tsx`; voz `voice01b`, toma `assets/video1b/`): «Ya solo queda un mes… ¿sabes cómo funciona Smash and Lob?», con transición por elementos compartidos | **Aprobado (v2)**. La versión anterior queda en `01-bienvenida-anterior.mp4` y en `BienvenidaRapida` |
| 02 | ~23-nov | Presentación de la app (`PresentacionV3`, `src/Presentacion3.tsx`; voz `voice13c`, toma `assets/video13c/`): móvil con réplicas de las pantallas reales (datos ficticios), pelota dorada como guía, bolitas sueltas arriba a la derecha | **Aprobado (v3)**. Original en `02-presentacion-app-original.mp4` y en `PresentacionApp` |
| 03 | ~26-nov | **Chat de la liga**: activar notificaciones; avisos por el chat de la app (`ChatV2`, `src/Chat2.tsx`; voz `voice04c`, toma `assets/video04c/`): móvil con pantallas replicadas, tarjeta NOVEDAD con miniatura 16:9, bolitas de notificaciones/ajustes, grupos tachados con logo de WhatsApp | **Aprobado (v2)**. Original en `03-chat-liga-original.mp4` y en `ChatDeLaLiga` |
| 04 | ~30-nov | Para qué es la inscripción, sin cifras (`InscripcionV2`, `src/Inscripcion2.tsx`; voz `voiceInscripcion`, toma `assets/video-inscripcion/`): avatares → bote → pistas, bolas, detalle, premio → devolución → cuentas claras | **Aprobado (v2, 27 s)**. Original en `04-inscripcion-original.mp4` y `InscripcionSinCifras` |
| 05 | ~4-dic | Perfil y disponibilidad (`PerfilV2`, `src/Perfil2.tsx`; voz `voicePerfil`, toma `assets/video-perfil/`): móvil con réplicas (Ajustes → Mi perfil → Mi disponibilidad → horarios recomendados → disponibilidad total) | **Aprobado (v2b, 36 s)**. Original en `05-perfil-disponibilidad-original.mp4` y `PerfilDisponibilidad` |
| 06 | ~7-dic | Organiza tu próximo partido (`OrganizaV2`, `src/Organiza2.tsx`; voz `voiceOrganiza`, toma `assets/video-organiza/`): horarios recomendados → chat de la jornada → programar → calendario → recordatorios; sin pagos ni resultado | **v2 en revisión** (27 s). Original en `06-organiza-partido-original.mp4` y `OrganizaTuPartido` |
| 07 | ~8-dic | **Día de partido** (`DiaPartido`, `src/DiaPartido.tsx`; voz `voiceDiaPartido`, toma `assets/video-dia-partido/`): tarjeta de próximo partido, hora/lugar/cómo llegar, moneda 3D del saque, notificación «Falta el resultado», registrar resultado y clasificación | **Aprobado (v3, 37,6 s)**, `07-dia-de-partido.mp4` + miniatura |
| 08 | ~10-dic | Subir un resultado (`SubirResultado`) | Hecho y aprobado |
| 09 | ~13-dic | Cuenta atrás y desbloqueo del 20-dic (`CuentaAtrasDesbloqueo`): aviso 7 días antes | Hecho y aprobado |
| 10 | ~16-dic | Clasificación, desempate y MVP (`ClasificacionMvp`) | Hecho y aprobado |
| 11 | ~18-dic | Partidos normales / amistosos (`PartidosNormales`) | Hecho y aprobado |


Previstos y NO hechos todavía:
| Cuándo | Vídeo | Estado |
|---|---|---|
| Tras confirmar pista/hora (reserva 1-dic) | Jornada de apertura + plan del día (fusión de los antiguos 2 y 5: hora, quedada, comida/planes, cómo se desbloquean los enfrentamientos) | STAND BY hasta tener la reserva confirmada |
| Por decidir | Suplentes e incidencias (vídeo corto) | APARCADO hasta decidir el sistema de suplentes |
| Dom 20-dic | ¡Hoy empieza! | Pendiente (guion) |
| Opcional | Aviso de liga bloqueada (reutiliza escenas de la presentación) | Idea |
| Opcional | Vídeos de la serie "dentro de la liga" (jornada nueva desbloqueada, MVP de jornada, etc.) | Ideas, sin guion |

Instagram @smashandlob (genérico): `ig1-reel-liguilla` hecho (pendiente de aprobación final); `ig2-reel-pareja-nueva` hecho (guion v3: «¿Y si tu compañero no puede jugar?», voz `voiceApp2.ts`, toma `assets/app-reel2/`; pendiente de aprobación); `ig3-reel-gente-y-ganas` hecho (guion v6: «¿Quieres jugar más al pádel? Solo necesitas gente y ganas…», voz `voiceApp3.ts`, toma `assets/app-reel3/`; pendiente de aprobación; sustituye en la práctica a ig2 como Reel 2, que queda guardado como alternativa); ideas de vídeos genéricos de la app (instalar y notificaciones, crear una liga, unirse con invitación, torneos rápidos, espectadores, estadísticas).

Nota: los números reflejan el orden de envío (07 = Día de partido, insertado tras Organiza tu partido); al hacer el vídeo de apertura habrá que renumerar de nuevo. Las miniaturas de 08, 10 y 11 llevan aún el número antiguo grabado: se regeneran al rehacer cada vídeo. Las miniaturas son 16:9 (`Miniatura`); las 9:16 están en `miniaturas-9x16/`.

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
- `InstagramReel1` (`src/Reel1.tsx`, voz `voiceApp1.ts`, toma `assets/app-reel1b/`): guión 8 aprobado. Avatares ficticios, réplicas simplificadas, logo de la app al final, eslogan «Para los que nunca tienen suficiente pádel», sin «Nos vemos en la pista». Salida: `out/listos-para-subir/ig1-reel-liguilla.mp4` (pendiente de aprobación del usuario).
- Pendiente: guiones de los reels 2 y 3 (aprobar antes de generar voz).


## Instagram: numeración actual
- `ig1-reel-liguilla` (Reel 1), `ig2-reel-gente-y-ganas` (Reel 2, antes `ig3`), `ig-alt-pareja-nueva` (alternativa guardada: «¿Y si tu compañero no puede jugar?»).
