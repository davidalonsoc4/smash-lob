# Instrucciones para generar el .zip de vídeos (con manifest.json)

Texto para pegar en el otro chat de Claude. La subida masiva de `/admin/tutorials` lee el `manifest.json` del .zip y rellena sola cada fila: título, descripción, destino, pantalla, quién lo ve y ligas.

## Qué pegar en el otro chat

```text
Genera un único archivo .zip con todo en la raíz (sin carpetas) que contenga:

1. Un MP4 por vídeo (máx. 50 MB cada uno) y su miniatura con EXACTAMENTE el mismo nombre y extensión .jpg (máx. 5 MB). Usa estos nombres, que llevan el número del plan para mantener el orden:
   01_como-funciona-una-liga
   02_como-se-puntua
   03_tu-primera-jornada
   04_estados-de-un-partido
   05_sorteo-del-saque
   06_subir-el-resultado
   07_confirmar-o-disputar-un-resultado
   08_mvp-votar-y-premios
   09_aplazar-lesion-y-sustituciones
   10_quien-lleva-las-bolas
   11_pagos-de-pista
   12_instalar-la-app-y-activar-los-avisos
   13_configurar-tus-notificaciones
   14_tu-perfil-y-tu-disponibilidad
   15_apariencia-idioma-y-sonidos
   16_estadisticas-y-records
   17_compartir-con-espectadores
   18_amistosos
   19_liguilla
   20_torneos
   21_crear-tu-liga-e-invitar-jugadores
   22_crear-una-temporada
   23_gestionar-la-temporada-en-curso
   24_economia-de-la-temporada
   25_comunicados-y-chat-de-la-liga
   26_roles-usuarios-y-espectadores
   27_cerrar-la-temporada-y-empezar-la-siguiente
   28_kit-de-medios-y-pack-de-bienvenida
   (cada uno con su .mp4 y su .jpg)

2. Un único archivo llamado manifest.json (UTF-8, JSON válido, sin comentarios) con este contenido exacto. Solo has de ajustar "descripcion" si cambia el contenido del vídeo; no cambies ningún otro valor:

<AQUÍ EL JSON DE ABAJO>

Reglas del manifest, por si algún vídeo cambia:
- "archivo": nombre exacto del MP4.
- "destino": "generico" (tutorial de la app), "ligas" (vídeo de una liga concreta; entonces añade "ligas": ["Nombre exacto de la liga"]) o "redes" (material para redes sociales).
- "pantalla" (solo en genéricos): uno de home, matches, match, match-chat, chats, ranking, statistics, notification-settings, profile, settings, personal-matches, payments, leagues, activity, season-admin, league-admin, users-admin, tournaments. Si es un vídeo general, omite el campo.
- "quien": "borrador" (solo yo, lo publico después) o "publico".
- "rol": a quién va dirigido el vídeo: "jugador" (cualquier jugador) o "creator" (solo quien organiza la liga: creadores y administradores; los jugadores no lo ven). En los vídeos 21 a 28 es "creator".
- "titulo" y "descripcion" son opcionales; el orden de la lista es el orden en la app.

Entrégame solo el .zip.
```

## manifest.json

```json
{
  "destino": "generico",
  "quien": "borrador",
  "rol": "jugador",
  "videos": [
    { "archivo": "01_como-funciona-una-liga.mp4", "titulo": "Cómo funciona una liga", "descripcion": "Qué es una liga, cómo se juega y cómo se organiza una temporada." },
    { "archivo": "02_como-se-puntua.mp4", "titulo": "Cómo se puntúa", "descripcion": "Cómo se reparten los puntos y cómo se calcula la clasificación.", "pantalla": "ranking" },
    { "archivo": "03_tu-primera-jornada.mp4", "titulo": "Tu primera jornada paso a paso", "descripcion": "Desde ver tu partido hasta jugarlo y subir el resultado.", "pantalla": "matches" },
    { "archivo": "04_estados-de-un-partido.mp4", "titulo": "Estados de un partido", "descripcion": "Qué significa cada estado de un partido.", "pantalla": "match" },
    { "archivo": "05_sorteo-del-saque.mp4", "titulo": "El sorteo del saque (la moneda)", "descripcion": "Cómo se decide quién saca primero con la moneda.", "pantalla": "match" },
    { "archivo": "06_subir-el-resultado.mp4", "titulo": "Subir el resultado", "descripcion": "Cómo registrar el resultado de un partido.", "pantalla": "match" },
    { "archivo": "07_confirmar-o-disputar-un-resultado.mp4", "titulo": "Confirmar o disputar un resultado", "descripcion": "Qué hacer cuando el rival sube un resultado.", "pantalla": "match" },
    { "archivo": "08_mvp-votar-y-premios.mp4", "titulo": "MVP: votar y premios", "descripcion": "Cómo votar al MVP y qué se gana.", "pantalla": "match" },
    { "archivo": "09_aplazar-lesion-y-sustituciones.mp4", "titulo": "Aplazar, lesión y sustituciones", "descripcion": "Qué hacer si no puedes jugar tu partido.", "pantalla": "matches" },
    { "archivo": "10_quien-lleva-las-bolas.mp4", "titulo": "Quién lleva las bolas", "descripcion": "Cómo se reparte quién lleva las bolas.", "pantalla": "match" },
    { "archivo": "11_pagos-de-pista.mp4", "titulo": "Pagos de pista", "descripcion": "Qué debes, qué te deben y cómo marcar un pago.", "pantalla": "payments" },
    { "archivo": "12_instalar-la-app-y-activar-los-avisos.mp4", "titulo": "Instalar la app y activar los avisos", "descripcion": "Cómo instalar la app en el móvil y recibir avisos.", "pantalla": "settings" },
    { "archivo": "13_configurar-tus-notificaciones.mp4", "titulo": "Configurar tus notificaciones", "descripcion": "Qué avisos recibes y cómo ajustarlos.", "pantalla": "notification-settings" },
    { "archivo": "14_tu-perfil-y-tu-disponibilidad.mp4", "titulo": "Tu perfil y tu disponibilidad", "descripcion": "Cómo completar tu perfil e indicar cuándo puedes jugar.", "pantalla": "profile" },
    { "archivo": "15_apariencia-idioma-y-sonidos.mp4", "titulo": "Apariencia, idioma y sonidos", "descripcion": "Cómo cambiar el tema, el idioma y los sonidos." },
    { "archivo": "16_estadisticas-y-records.mp4", "titulo": "Estadísticas y récords", "descripcion": "Cómo consultar tus estadísticas y los récords.", "pantalla": "statistics" },
    { "archivo": "17_compartir-con-espectadores.mp4", "titulo": "Compartir con espectadores", "descripcion": "Cómo compartir la liga con quien no juega." },
    { "archivo": "18_amistosos.mp4", "titulo": "Partidos normales (amistosos)", "descripcion": "Cómo crear y gestionar un amistoso.", "pantalla": "personal-matches" },
    { "archivo": "19_liguilla.mp4", "titulo": "Liguilla", "descripcion": "Reel de la liguilla.", "destino": "redes" },
    { "archivo": "20_torneos.mp4", "titulo": "Torneos", "descripcion": "Cómo funcionan los torneos.", "pantalla": "tournaments" },
    { "archivo": "21_crear-tu-liga-e-invitar-jugadores.mp4", "titulo": "Crear tu liga e invitar jugadores", "descripcion": "Cómo crear una liga e invitar a los jugadores.", "pantalla": "leagues", "rol": "creator" },
    { "archivo": "22_crear-una-temporada.mp4", "titulo": "Crear una temporada", "descripcion": "Cómo configurar y crear una temporada.", "pantalla": "season-admin", "rol": "creator" },
    { "archivo": "23_gestionar-la-temporada-en-curso.mp4", "titulo": "Gestionar la temporada en curso", "descripcion": "Cómo gestionar partidos y jornadas durante la temporada.", "pantalla": "season-admin", "rol": "creator" },
    { "archivo": "24_economia-de-la-temporada.mp4", "titulo": "Economía de la temporada", "descripcion": "Cómo llevar los pagos y las cuentas de la temporada.", "pantalla": "payments", "rol": "creator" },
    { "archivo": "25_comunicados-y-chat-de-la-liga.mp4", "titulo": "Comunicados y chat de la liga", "descripcion": "Cómo comunicarte con los jugadores de la liga.", "pantalla": "chats", "rol": "creator" },
    { "archivo": "26_roles-usuarios-y-espectadores.mp4", "titulo": "Roles, usuarios y espectadores", "descripcion": "Cómo gestionar roles, usuarios y espectadores.", "pantalla": "users-admin", "rol": "creator" },
    { "archivo": "27_cerrar-la-temporada-y-empezar-la-siguiente.mp4", "titulo": "Cerrar la temporada y empezar la siguiente", "descripcion": "Cómo cerrar una temporada y abrir la siguiente.", "pantalla": "season-admin", "rol": "creator" },
    { "archivo": "28_kit-de-medios-y-pack-de-bienvenida.mp4", "titulo": "Kit de medios y pack de bienvenida", "descripcion": "Material para redes y pack de bienvenida.", "rol": "creator" }
  ]
}
```

## Qué hace la app con él

- Si falta o falla un valor (pantalla que no existe, destino raro), esa fila queda marcada con un aviso y se corrige a mano antes de subir.
- Los vídeos con `"rol": "creator"` solo los ven quienes organizan alguna liga (creadores y administradores) y quien gestiona los tutoriales; los jugadores ni se enteran y no se avisa en el chat de la liga.
- Los vídeos del manifest con destino propio ignoran los selectores generales de la pantalla; los demás los usan.
- Una liga que no existe con ese nombre se avisa y hay que elegirla con los selectores generales.
- Todo entra como borrador: se publica después desde la gestión.
- Sin `manifest.json` todo funciona como antes (título por el nombre del archivo).
