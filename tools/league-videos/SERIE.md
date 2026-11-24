# Serie de vídeos — Smash & Lob PRO League (Temporada 1)

Objetivo: informar a los 8 participantes antes del inicio (domingo 20-dic-2026) con vídeos cortos (30–45 s, 9:16)
para Instagram/WhatsApp. Estilo: tema "Competition" de la app + acento de la liga (`#d7a544`).

## Orden de envío a los jugadores (definitivo; el nº es el del archivo en `out/listos-para-subir/`)
Criterio: primero la visión general y la app; el **chat (03) es el punto de inflexión**: desde ahí los vídeos se publican en el chat de la app como "NOVEDAD" (hasta entonces el chat estará en desuso). Fechas orientativas.

| Nº | Fecha | Vídeo (composición) | Estado |
|---|---|---|---|
| 01 | Vie 20-nov | Bienvenida y formato (`BienvenidaV2`, `src/Bienvenida2.tsx`; voz `voice01b`, toma `assets/video1b/`): «Ya solo queda un mes… ¿sabes cómo funciona Smash and Lob?», con transición por elementos compartidos | **Aprobado (v2)**. La versión anterior queda en `01-bienvenida-anterior.mp4` y en `BienvenidaRapida` |
| 02 | Lun 23-nov | Presentación de la app (`PresentacionV3`, `src/Presentacion3.tsx`; voz `voice13c`, toma `assets/video13c/`): móvil con réplicas de las pantallas reales (datos ficticios), pelota dorada como guía, bolitas sueltas arriba a la derecha | **Aprobado (v3)**. Original en `02-presentacion-app-original.mp4` y en `PresentacionApp` |
| 03 | Jue 26-nov | **Chat de la liga**: activar notificaciones; avisos por el chat de la app (`ChatV2`, `src/Chat2.tsx`; voz `voice04c`, toma `assets/video04c/`): móvil con pantallas replicadas, tarjeta NOVEDAD con miniatura 16:9, bolitas de notificaciones/ajustes, grupos tachados con logo de WhatsApp | **Aprobado (v2)**. Original en `03-chat-liga-original.mp4` y en `ChatDeLaLiga` |
| 04 | Lun 30-nov | Para qué es la inscripción, sin cifras (`InscripcionV2`, `src/Inscripcion2.tsx`; voz `voiceInscripcion`, toma `assets/video-inscripcion/`): avatares → bote → pistas, bolas, detalle, premio → devolución → cuentas claras | **Aprobado (v2, 27 s)**. Original en `04-inscripcion-original.mp4` y `InscripcionSinCifras` |
| 04b | Mar 1-dic | **Confirmación de la reserva** (`ConfirmacionReserva`, por crear): pista reservada, domingo 20-dic a las 12:00 (hora estimada) en el Polideportivo Pando, Portugalete. El plan detallado del día va en otro vídeo posterior | **Aprobado provisionalmente** (hora 12:00 pendiente de confirmar la reserva; al confirmarla se regenera solo esa frase). Vídeo hecho (`ReservaConfirmada`, `src/Reserva.tsx`, voz `voiceReserva`, toma `assets/video-reserva/`; 20 s; cierre propio «Ya queda menos. Nos vemos en la pista»; la hora está en `HORA` y su frase se regenera aparte al confirmarla) (no decir «día entero» ni cerrar la puerta a la comida: «ve dejando libre el mediodía»). Al aprobarse se renumera (pasaría a 05 y los siguientes suben uno) |
| 05 | Vie 4-dic | Perfil y disponibilidad (`PerfilV2`, `src/Perfil2.tsx`; voz `voicePerfil`, toma `assets/video-perfil/`): móvil con réplicas (Ajustes → Mi perfil → Mi disponibilidad → horarios recomendados → disponibilidad total) | **Aprobado (v2b, 36 s)**. Original en `05-perfil-disponibilidad-original.mp4` y `PerfilDisponibilidad` |
| 06 | Lun 7-dic | Organiza tu próximo partido (`OrganizaV2`, `src/Organiza2.tsx`; voz `voiceOrganiza`, toma `assets/video-organiza/`): horarios recomendados → chat de la jornada → programar → calendario → recordatorios; sin pagos ni resultado | **Aprobado (v2, 27 s)**. La versión ampliada (36 s) queda guardada en `06-organiza-partido-v2b-extendida.mp4` y su código en `assets/video-organiza2-extendida/`. Original en `06-organiza-partido-original.mp4` y `OrganizaTuPartido` |
| 07 | Jue 10-dic | **Día de partido** (`DiaPartido`, `src/DiaPartido.tsx`; voz `voiceDiaPartido`, toma `assets/video-dia-partido/`): tarjeta de próximo partido, hora/lugar/cómo llegar, moneda 3D del saque, notificación «Falta el resultado», registrar resultado y clasificación | **Aprobado (v3, 37,6 s)**, `07-dia-de-partido.mp4` + miniatura |
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

## Idea provisional del plan del día de apertura (NO es plan fijo; no se publica aún)
Supuesto reserva a las 12:00. Idea del organizador: quedar sobre las 11:00 (desayuno/café), reunirse en la entrada del polideportivo hacia las 11:30–11:40, cambiarse y pistas a las 12:00; partido de 2 h (hasta ~14:00); ducha; comida sobre las 15:00 (intentar reservar mesa para 8; si no se puede, buscar sitio); tarde libre (opcional: tomar algo, bolera…). Plan fijo: 11:00 quedada · 12:00 partido · ~14:00 ducha · ~15:00 comida. Welcome pack (bote de bolas, 2 overgrips, chuches): decidir momento (recomendado: en la quedada de las 11:00). No revelar su contenido en los vídeos.

## Tutoriales genéricos (vídeos de ayuda para todos los usuarios, no de la liga) — primera tanda de `docs/PLAN_VIDEOS_Y_GUIAS.md` (en `origin/staging`)
Nombre de catálogo: «Tutoriales genéricos» (pídelos así). Reglas: sin PRO League ni nombres reales; avatares y nombres genéricos; cierre propio (llamada a la acción, sin «Nos vemos en la pista»); guiones con las variables de configuración de ligas/temporadas y sus alternativas. Salida: `out/listos-para-subir/ayuda/`.
Orden aprobado de guiones: 12, 13, 1, 3, 5, 6, 18, 21, 22a, 22b (guiones en la conversación; el 5: lo puede lanzar cualquiera de los cuatro jugadores; no hay ligas por parejas fijas activas).
- 12 Instalar la app y activar los avisos: **hecho, en revisión** (`Gen12Instalar`, `src/Gen12.tsx`, voz `voiceGen12`, toma `assets/gen12-instalar/`, 31 s).
- Por verificar antes de hacerlos: 22a calendario manual activo; 22b «todo se puede cambiar después».

### Estado de los Tutoriales genéricos (prioridad A) — ver también `out/tutoriales-genericos-A.zip`
Hechos (en revisión): 12 Instalar la app y avisos (31 s), 13 Configurar notificaciones (40 s, `Gen13Notificaciones`), 1 Cómo funciona una liga (35 s, `Gen01ComoFunciona`), 3 Tu primera jornada (47 s, `Gen03Primera`), 5 Sorteo del saque (31 s, `Gen05Sorteo`), 6 Subir el resultado (47 s, `Gen06Resultado`), 18 Partidos amistosos (29 s, `Gen18Amistosos`). Código en `src/Gen*.tsx` + `src/GenKit.tsx`; voces en `assets/gen*/` y `src/voice_gen*.ts`.
Hecho también: 2 Cómo se puntúa (34 s, `Gen02Puntuacion`; guion aprobado). Con él, **toda la prioridad A está hecha** (8 tutoriales; en revisión). Miniaturas «TUTORIAL NN» (16:9). Los de «Crear…» (21, 22a, 22b) y todo el bloque de administración quedan aparcados (solo hay un usuario con rol de creador).

Norma de los Tutoriales genéricos: **sin escena de cierre con logo y frase**; la última frase de la locución va dentro del vídeo (etiqueta/texto en pantalla) y el vídeo acaba con una cola corta sin voz (logo + pelota), igual que 3, 5 y 6. Aplicado a 2, 12, 13 y 18.

Preferencia de entrega: **no enviar zips** (el usuario los ve desde el móvil): enviar vídeos y miniaturas como archivos sueltos.

Fix (24-nov): la transcripción de ElevenLabs convierte «and» en «&» en `VOICE`; las animaciones deben buscar «&», no «and» (afectó a 1, 2 y 12). Pendiente: el 13 dice «eme-uve-pe» en vez de «Em-Bi-Pi» (regenerar solo las 2 frases con MVP y empalmar; la cuenta de ElevenLabs tenía 344 créditos restantes al intentarlo con la toma completa de 534).

Actualización: cuenta ElevenLabs ampliada a Creator (121.344 créditos/mes, reinicio ~24-dic). El 13 rehecho con «Em-Bi-Pi» (534 créditos); los subtítulos muestran «MVP».
