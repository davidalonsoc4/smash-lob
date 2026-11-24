import type { Locale } from "@/i18n/translations"
import type {
  OnboardingAudience,
  OnboardingTourDefinition,
  OnboardingTourKey,
  OnboardingTourStep,
} from "./types"

const everyone = () => true
const players = (audience: OnboardingAudience) => !audience.isSpectator
const managers = (audience: OnboardingAudience) =>
  audience.isSuperuser || audience.isLeagueAdmin

type LocalizedTourText = {
  title: string
  description: string
  steps: Array<Pick<OnboardingTourStep, "title" | "description">>
}

const tourTexts: Record<Locale, Record<OnboardingTourKey, LocalizedTourText>> = {
  es: {
    "app-introduction": {
      title: "Primeros pasos",
      description: "Conoce la navegación principal y dónde encontrar ayuda cuando la necesites.",
      steps: [
        {
          title: "Bienvenido a Smash & Lob",
          description: "La aplicación reúne partidos, clasificación, estadísticas y gestión de tu liga en un único lugar.",
        },
        {
          title: "Tu liga y temporada",
          description: "Aquí puedes comprobar siempre en qué liga y temporada estás trabajando.",
        },
        {
          title: "Navegación principal",
          description: "Usa esta barra para volver al inicio, consultar la clasificación, abrir partidos o revisar tu perfil.",
        },
        {
          title: "Ayuda cuando la necesites",
          description: "Pulsa este botón para repetir la guía de cualquier pantalla o consultar todos los tutoriales.",
        },
      ],
    },
    home: {
      title: "Pantalla de inicio",
      description: "Entiende de un vistazo el estado de la temporada y tus siguientes acciones.",
      steps: [
        {
          title: "Bienvenido a Smash & Lob",
          description: "La aplicación reúne partidos, clasificación, estadísticas y gestión de tu liga en un único lugar.",
        },
        {
          title: "Resumen de la liga",
          description: "La cabecera identifica la liga, la temporada seleccionada y si ya ha finalizado.",
        },
        { title: "Cambia de liga rápidamente", description: "Toca el nombre de la liga para cambiar de competición o abrir Mis partidos. Si esta liga tiene una temporada programada, solo su competición queda bloqueada hasta el inicio: Mis Competiciones, Mis partidos, Ajustes, Ayuda y Notificaciones siguen disponibles." },
        { title: "Consulta otras temporadas", description: "Si la liga tiene más de una temporada, toca el subtítulo de temporada para abrir una anterior sin cambiar de liga." },
        {
          title: "Comunicados importantes",
          description: "Los avisos de los administradores aparecen aquí para que no se pierdan entre los partidos.",
        },
        {
          title: "Tu siguiente partido",
          description: "Abre la tarjeta para consultar jugadores, fecha, ubicación, chat y acciones del encuentro.",
        },
        {
          title: "Temporadas terminadas",
          description: "Cuando la temporada finaliza, desde aquí puedes consultar su histórico o compartir el resumen final.",
        },
        {
          title: "Ajustes",
          description: "Gestiona tu perfil, preferencias, ligas y las opciones administrativas disponibles para tu rol.",
        },
        {
          title: "Notificaciones",
          description: "Consulta avisos sobre partidos, resultados, mensajes y actividad importante de la liga.",
        },
        {
          title: "Compartir con espectadores",
          description: "Cuando está disponible, este botón genera un acceso de solo lectura para seguir la competición.",
        },
        {
          title: "Invitar jugadores",
          description: "Los administradores pueden compartir desde aquí el enlace para vincular a los jugadores pendientes.",
        },
        {
          title: "Ayuda visual",
          description: "Abre la guía de la pantalla actual, su vídeo si lo tiene, o entra en Ayuda para ver todos los tutoriales y las reglas.",
        },
      ],
    },
    matches: {
      title: "Partidos y jornadas",
      description: "Consulta el calendario completo o céntrate únicamente en tus encuentros.",
      steps: [
        {
          title: "Todos o solo los tuyos",
          description: "Cambia entre el calendario completo y una vista filtrada con los partidos en los que participas.",
        },
        {
          title: "Jornadas y estados",
          description: "Cada bloque agrupa los partidos de una jornada e indica su estado. Los paneles de partido son pulsables: tócalos para abrir el detalle completo del encuentro.",
        },
      ],
    },
    chats: { title: "Chats", description: "Ubica primero las conversaciones que requieren atención.", steps: [{ title: "Chats activos", description: "Aquí están la jornada en curso, la siguiente y cualquier chat futuro que ya tenga mensajes. Las conversaciones con actividad reciente suben como en una app de mensajería." }, { title: "Próximos", description: "Las jornadas posteriores sin actividad quedan separadas aquí. En cuanto llegue un mensaje, ese chat pasa automáticamente a Activos." }, { title: "Chats finalizados", description: "Los partidos terminados se separan debajo y pasan a Solo lectura para conservar el historial sin mezclarlos con los chats en curso." }] },
    match: {
      title: "Detalle de partido",
      description: "Recorre las partes del partido: estado, parejas, sorteo, fecha, pista, resultado y MVP.",
      steps: [
        { title: "Estado del partido", description: "Resume en qué punto está el partido (por ejemplo, por programar, programado o con el resultado pendiente) y se actualiza solo." },
        { title: "Parejas y marcador", description: "Aquí ves quién juega con quién. Cuando hay resultado, aparecen también el marcador y los sets." },
        { title: "Sorteo del saque", description: "Cuando se acerca la hora del partido, aquí se sortea el saque con una moneda. El resultado queda guardado para los participantes." },
        { title: "Fecha y lugar", description: "Aquí se fija o se cambia la fecha, la hora y el lugar. Cuando el partido ya tiene fecha, puedes añadirlo a tu calendario." },
        { title: "Pista y pagos", description: "Con el partido programado, aquí se anota la reserva de la pista y quién ha pagado su parte. Lo que tengas pendiente también aparece en Pagos." },
        { title: "Resultado", description: "Aquí se sube el resultado cuando se ha jugado y se confirma o se discute según la configuración de tu liga. Si hay un error, puede corregirse mientras el resultado no esté bloqueado." },
        { title: "MVP del partido", description: "Tras jugar, cada participante vota al MVP del partido entre los demás jugadores (no puedes votarte a ti mismo). Tu voto pendiente se resalta hasta que lo emites." },
        { title: "Más acciones", description: "El menú ⋯ reúne las acciones del partido que tienes disponibles, como avisar de una incidencia o gestionar una sustitución. Qué aparece depende de los ajustes de tu liga y de tu rol." },
        { title: "Chat del partido", description: "Esta burbuja abre el chat privado de los cuatro participantes. Todas tus conversaciones están también en Chats, en la NAVBAR." },
      ],
    },
    competitions: {
      title: "Mis competiciones",
      description: "Tu punto de partida: tu actividad, tus ligas y cómo crear o unirte a una competición.",
      steps: [
        { title: "Tu actividad personal", description: "De un vistazo, tu próximo partido, el último que has jugado y los que esperan resultado. Desliza para pasar de uno a otro." },
        { title: "Tus ligas", description: "Cada tarjeta es una liga a la que perteneces, con el estado de su temporada. Tócala para entrar en esa liga." },
        { title: "Ver todas", description: "Abre el listado completo de tus ligas, incluidas las finalizadas, y desde ahí puedes unirte a otra con una invitación." },
        { title: "Tus torneos", description: "Los torneos en los que participas aparecen aquí con su estado." },
        { title: "Botón de crear", description: "Desde aquí creas un partido amistoso y, si tienes permiso, también una liga o un torneo." },
      ],
    },
    "notification-settings": {
      title: "Ajustes de notificaciones",
      description: "Elige qué avisos recibes y en qué dispositivo.",
      steps: [
        { title: "Este dispositivo", description: "Aquí activas o desactivas los avisos en este dispositivo. El indicador de la derecha te dice si están activos." },
        { title: "Todo o nada", description: "Activa o desactiva de una vez los seis grupos de avisos." },
        { title: "Seis grupos de avisos", description: "Cada interruptor controla un grupo: Antes de jugar, Cambios en tus partidos, Resultados y MVP, Mensajes del chat, Actualizaciones de liga y Pagos. Si en un grupo hay avisos activados y desactivados, se muestra activado." },
        { title: "Avisos que siempre llegan", description: "Las novedades de la liga y las menciones con @ en el chat te llegan siempre y no se pueden apagar." },
      ],
    },
    "personal-matches": {
      title: "Mis partidos",
      description: "Tus próximos amistosos y el historial de tus partidos.",
      steps: [
        { title: "Próximos partidos", description: "Tus amistosos programados, por orden de fecha. Tócalos para ver el detalle." },
        { title: "Historial", description: "Tus partidos de liga terminados y los amistosos terminados o con fecha pasada, de más reciente a más antiguo. Se cargan de 10 en 10." },
        { title: "Crear un encuentro", description: "Crea un amistoso: eliges los jugadores (con cuenta o con nombre externo) y después fijas fecha y lugar, y subes el resultado." },
      ],
    },
    "personal-match": {
      title: "Detalle de amistoso",
      description: "Todo lo que puedes hacer con un amistoso, de los jugadores al resultado.",
      steps: [
        { title: "Estado del amistoso", description: "Resume en qué punto está: por programar, programado o terminado. Se actualiza solo." },
        { title: "Parejas y marcador", description: "Aquí ves quién juega con quién y, cuando hay resultado, los sets y el marcador." },
        { title: "Sorteo del saque", description: "Cuando se acerca la hora del partido, aquí se sortea el saque con una moneda. El resultado queda guardado para los participantes." },
        { title: "Jugadores del amistoso", description: "Cambia a tu pareja o a los contrincantes antes de registrar el resultado. Pueden ser jugadores con cuenta o nombres externos; guarda los cambios con «Guardar jugadores»." },
        { title: "Fecha y lugar", description: "Aquí se fija o se cambia la fecha, la hora y el lugar. Cuando el partido ya tiene fecha, puedes añadirlo a tu calendario." },
        { title: "Pista y pagos", description: "Aquí se anota la reserva de la pista y quién ha pagado su parte. Lo pendiente también aparece en Pagos." },
        { title: "Resultado", description: "Registra los sets cuando se haya jugado. Quien tiene permiso de edición puede corregirlos después si detecta un error." },
        { title: "Chat del partido", description: "Esta burbuja abre el chat del amistoso con los participantes." },
        { title: "Un amistoso es personal", description: "No pertenece a ninguna competición, así que no afecta a la clasificación, a las estadísticas oficiales ni a los récords." },
        { title: "Eliminar el partido", description: "Solo quien creó el amistoso puede eliminarlo." },
      ],
    },
    payments: {
      title: "Mis pagos",
      description: "Qué debes, qué te deben y cómo saldar cada pago.",
      steps: [
        { title: "Estado y movimientos", description: "«Estado» muestra lo que tienes pendiente y «Movimientos», el historial de tus pagos y cobros." },
        { title: "Vista de administración", description: "Como administrador, aquí ves los movimientos de pago de toda la liga activa." },
        { title: "Liga o amistosos", description: "Filtra los pagos por Todos, Liga o Amistosos." },
        { title: "Liga y temporada", description: "Con el filtro Liga, elige de qué liga y de qué temporada quieres ver los pagos." },
        { title: "Debes y Te deben", description: "Resume cuánto tienes que pagar y cuánto te deben, con el número de movimientos de cada lado." },
        { title: "Economía de la liga", description: "Con el filtro Liga, despliega el gasto registrado, tu parte estimada y el desglose de pistas, bolas e inscripción." },
        { title: "Pagos pendientes", description: "Cada movimiento muestra el importe y el partido. «Ver partido» lo abre y «Marcar como pagado» lo salda. Solo quien puede revertirlo ve «Marcar como pendiente»." },
      ],
    },
    chat: { title: "Chat del partido", description: "Coordina el partido con mensajes y propuestas que responden al instante.", steps: [{ title: "Identidad y lectura", description: "Los mensajes consecutivos se agrupan por jugador: su avatar y color identifican el inicio del bloque y los mensajes nuevos entran con una animación breve. Desliza un mensaje hacia la derecha para responderlo. En los tuyos, ✓ confirma el envío y ✓✓ azul indica lectura de todos los demás vinculados." }, { title: "Propuestas y reserva", description: "El clip abre propuestas de fecha o ubicación. Puedes marcar hasta cuatro horarios, votar con ✓ o ✕ y retirar tu voto pulsando de nuevo el mismo botón. Toca una propuesta para ver quién ha votado a favor, en contra o sigue pendiente. En cuanto una fecha y hora llegan a 4/4, el partido pasa a Pendiente de reserva y aparece un aviso fijado para confirmar fecha, ubicación y pista o descartar ese acuerdo y proponer otra fecha. Los avisos de acuerdo y de partido programado se agrupan en la misma conversación. Cuando la reserva queda confirmada, su resumen queda fijado sobre el historial." }] },
    ranking: {
      title: "Clasificación",
      description: "Interpreta posiciones, puntos y criterios de desempate.",
      steps: [
        {
          title: "Puntos y desempates",
          description: "La tabla ordena por puntos y aplica después los criterios configurados de sets y juegos.",
        },
        {
          title: "Más allá de la tabla",
          description: "Abre el histórico para consultar rachas, comparaciones, récords y temporadas anteriores.",
        },
      ],
    },
    statistics: {
      title: "Estadísticas",
      description: "Explora la temporada actual, temporadas anteriores o todo el histórico de la liga.",
      steps: [
        {
          title: "Resumen rápido",
          description: "Estas tarjetas muestran líderes, victorias, diferencia de juegos y mejores rachas.",
        },
        {
          title: "Cada análisis por separado",
          description: "Entra en clasificación, cara a cara, análisis individual, evolución, récords o resumen de temporada.",
        },
      ],
    },
    settings: {
      title: "Ajustes",
      description: "Conoce las secciones principales y encuentra rápidamente cualquier opción de la aplicación.",
      steps: [
        {
          title: "Tu perfil",
          description: "Desde aquí puedes revisar y editar los datos de tu cuenta y la imagen que te identifica en Smash & Lob.",
        },
        {
          title: "Apariencia",
          description: "Personaliza el tema, el estilo visual y la paleta de colores de la aplicación.",
        },
        {
          title: "Notificaciones",
          description: "Activa los avisos push en este dispositivo y decide cuáles quieres recibir en seis interruptores. Las Novedades de la liga y las menciones en el chat llegan siempre.",
        },
        {
          title: "Tus ligas y Mis partidos",
          description: "Desde Mis Competiciones cambias de competición y entras en Mis partidos, donde se reúnen tus partidos de liga y amistosos. Son áreas personales y siguen disponibles aunque la liga activa tenga una temporada programada.",
        },
        {
          title: "Buzón de sugerencias",
          description: "Envía ideas, mejoras o nuevas funciones directamente desde la aplicación.",
        },
        {
          title: "Buscador de ajustes",
          description: "Pulsa este botón flotante para buscar cualquier función o ajuste y saltar directamente a su apartado.",
        },
      ],
    },
    "season-admin": {
      title: "Administrar temporada",
      description: "Configura calendario, reglas, participantes y estado sin recorrer la pantalla a ciegas.",
      steps: [
        {
          title: "Accesos rápidos",
          description: "Estos botones llevan directamente a calendario, reglas, personas y acciones de estado. También puedes programar el inicio: hasta activarse, los jugadores quedan limitados a la HOME de esa competición, mientras los administradores conservan acceso normal al calendario y la gestión.",
        },
        {
          title: "Calendario y jornadas",
          description: "Aquí defines el formato, el orden y el margen de las jornadas de la temporada.",
        },
        {
          title: "Jugadores e inscripción",
          description: "Gestiona participantes, plazas e inscripción según el modo configurado para la temporada.",
        },
        {
          title: "Economía de temporada",
          description: "Si hay inscripción, abre la pantalla económica para controlar cobros, registrar gastos y ver el saldo disponible.",
        },
      ],
    },
  },
  en: {
    "app-introduction": {
      title: "Getting started",
      description: "Learn the main navigation and where to find help whenever you need it.",
      steps: [
        {
          title: "Welcome to Smash & Lob",
          description: "The app brings matches, standings, statistics and league management together in one place.",
        },
        {
          title: "Your league and season",
          description: "You can always check which league and season you are currently viewing here.",
        },
        {
          title: "Main navigation",
          description: "Use this bar to return home, view the standings, open matches or check your profile.",
        },
        {
          title: "Help whenever you need it",
          description: "Use this button to repeat the guide for any screen or browse all tutorials.",
        },
      ],
    },
    home: {
      title: "Home screen",
      description: "Understand the season status and your next actions at a glance.",
      steps: [
        {
          title: "Welcome to Smash & Lob",
          description: "The app brings matches, standings, statistics and league management together in one place.",
        },
        {
          title: "League overview",
          description: "The header identifies the league, selected season and whether it has already finished.",
        },
        { title: "Switch leagues quickly", description: "Tap the league name to switch competitions or open My matches. If this league has a scheduled season, only its competitive areas stay locked until the start: My Competitions, My matches, Settings, Help and Notifications remain available." },
        { title: "Browse other seasons", description: "If the league has more than one season, tap the season subtitle to open a previous one without switching leagues." },
        {
          title: "Important announcements",
          description: "Administrator notices appear here so they do not get lost among the matches.",
        },
        {
          title: "Your next match",
          description: "Open the card to check players, date, location, chat and match actions.",
        },
        {
          title: "Finished seasons",
          description: "When a season ends, use these actions to open its history or share the final summary.",
        },
        {
          title: "Settings",
          description: "Manage your profile, preferences, leagues and the administrative options available to your role.",
        },
        {
          title: "Notifications",
          description: "Review updates about matches, results, messages and important league activity.",
        },
        {
          title: "Share with spectators",
          description: "When available, this button creates read-only access to follow the competition.",
        },
        {
          title: "Invite players",
          description: "Administrators can share the link used to connect players who are still pending.",
        },
        {
          title: "Visual help",
          description: "Open the guide for the current screen, its video if it has one, or go to Help for all the tutorials and rules.",
        },
      ],
    },
    matches: {
      title: "Matches and rounds",
      description: "Browse the full calendar or focus only on your own matches.",
      steps: [
        {
          title: "All matches or only yours",
          description: "Switch between the full calendar and a filtered view of the matches you play in.",
        },
        {
          title: "Rounds and statuses",
          description: "Each block groups one round and shows its status. Match panels are clickable: open one to see the full match detail.",
        },
      ],
    },
    chats: { title: "Chats", description: "Keep the conversations that need attention at the top.", steps: [{ title: "Active chats", description: "This section contains the current round, the next round and any future chat that already has messages. Recent activity rises like in a messaging app." }, { title: "Upcoming", description: "Later rounds with no activity stay here. As soon as a message arrives, that chat automatically moves to Active." }, { title: "Finished chats", description: "Finished matches stay below in read-only mode so their history does not mix with ongoing chats." }] },
    match: {
      title: "Match detail",
      description: "Walk through the parts of a match: status, pairs, toss, date, court, result and MVP.",
      steps: [
        { title: "Match status", description: "Summarises where the match stands (for example, to schedule, scheduled or result pending) and updates by itself." },
        { title: "Pairs and score", description: "See who plays with whom. Once there is a result, the score and the sets appear here too." },
        { title: "Serve toss", description: "As the match time approaches, the serve is tossed here with a coin. The result is saved for the participants." },
        { title: "Date and place", description: "Set or change the date, time and place here. Once the match has a date, you can add it to your calendar." },
        { title: "Court and payments", description: "Once the match is scheduled, record the court booking here and who has paid their share. Anything you still owe also shows up in Payments." },
        { title: "Result", description: "Upload the result here after playing and confirm or dispute it according to your league settings. A mistake can be corrected while the result is not locked." },
        { title: "Match MVP", description: "After playing, each participant votes for the match MVP among the other players (you cannot vote for yourself). Your pending vote stays highlighted until you cast it." },
        { title: "More actions", description: "The ⋯ menu gathers the match actions available to you, such as reporting an incident or handling a substitution. What appears depends on your league settings and your role." },
        { title: "Match chat", description: "This bubble opens the private chat for the four participants. All your conversations are also available under Chats in the bottom navigation." },
      ],
    },
    competitions: {
      title: "My competitions",
      description: "Your starting point: your activity, your leagues and how to create or join a competition.",
      steps: [
        { title: "Your personal activity", description: "At a glance: your next match, the last one you played and those waiting for a result. Swipe to move between them." },
        { title: "Your leagues", description: "Each card is a league you belong to, with the status of its season. Tap it to enter that league." },
        { title: "See all", description: "Opens the full list of your leagues, finished ones included, and from there you can join another one with an invitation." },
        { title: "Your tournaments", description: "The tournaments you take part in appear here with their status." },
        { title: "Create button", description: "From here you create a friendly match and, if you have permission, also a league or a tournament." },
      ],
    },
    "notification-settings": {
      title: "Notification settings",
      description: "Choose which alerts you receive and on which device.",
      steps: [
        { title: "This device", description: "Turn alerts on or off on this device here. The badge on the right tells you whether they are active." },
        { title: "All or nothing", description: "Turn all six alert groups on or off at once." },
        { title: "Six alert groups", description: "Each switch controls a group: Before playing, Changes to your matches, Results and MVP, Chat messages, League updates and Payments. If a group mixes enabled and disabled alerts, it shows as enabled." },
        { title: "Alerts that always arrive", description: "League news and @ mentions in chat always reach you and cannot be switched off." },
      ],
    },
    "personal-matches": {
      title: "My matches",
      description: "Your upcoming friendlies and the history of your matches.",
      steps: [
        { title: "Upcoming matches", description: "Your scheduled friendlies, in date order. Tap one to see its detail." },
        { title: "History", description: "Your finished league matches and the friendlies that are finished or whose date has passed, most recent first. They load 10 at a time." },
        { title: "Create a match", description: "Create a friendly: pick the players (with an account or an external name), then set the date and place and upload the result." },
      ],
    },
    "personal-match": {
      title: "Friendly detail",
      description: "Everything you can do with a friendly, from the players to the result.",
      steps: [
        { title: "Friendly status", description: "Summarises where it stands: to schedule, scheduled or finished. It updates by itself." },
        { title: "Pairs and score", description: "See who plays with whom and, once there is a result, the sets and the score." },
        { title: "Serve toss", description: "As the match time approaches, the serve is tossed here with a coin. The result is saved for the participants." },
        { title: "Friendly players", description: "Change your partner or the opponents before recording the result. They can be players with an account or external names; save the changes with «Save players»." },
        { title: "Date and place", description: "Set or change the date, time and place here. Once the match has a date, you can add it to your calendar." },
        { title: "Court and payments", description: "Record the court booking here and who has paid their share. Anything pending also shows up in Payments." },
        { title: "Result", description: "Record the sets once it has been played. Whoever has edit permission can correct them later if they spot a mistake." },
        { title: "Match chat", description: "This bubble opens the friendly's chat with the participants." },
        { title: "A friendly is personal", description: "It does not belong to any competition, so it does not affect the standings, the official statistics or the records." },
        { title: "Delete the match", description: "Only the person who created the friendly can delete it." },
      ],
    },
    payments: {
      title: "My payments",
      description: "What you owe, what you are owed and how to settle each payment.",
      steps: [
        { title: "Status and movements", description: "«Status» shows what you have pending and «Movements» the history of your payments and collections." },
        { title: "Admin view", description: "As an administrator, you see the payment movements of the whole active league here." },
        { title: "League or friendlies", description: "Filter the payments by All, League or Friendlies." },
        { title: "League and season", description: "With the League filter, choose which league and season you want to see payments for." },
        { title: "You owe and You are owed", description: "Summarises how much you have to pay and how much you are owed, with the number of movements on each side." },
        { title: "League economy", description: "With the League filter, expand the recorded spending, your estimated share and the breakdown of courts, balls and registration." },
        { title: "Pending payments", description: "Each movement shows the amount and the match. «View match» opens it and «Mark as paid» settles it. Only whoever can revert it sees «Mark as pending»." },
      ],
    },
    chat: { title: "Match chat", description: "Coordinate the match with messages and proposals that react instantly.", steps: [{ title: "Identity and read receipts", description: "Consecutive messages are grouped by player: their avatar and color mark the start of the block and new messages enter with a short animation. Swipe a message to the right to reply to it. On your messages, ✓ confirms sending and blue ✓✓ means every other linked participant has read it." }, { title: "Proposals and booking", description: "The paperclip opens date or location proposals. Select up to four times, vote with ✓ or ✕ and remove your vote by tapping the same button again. Tap a proposal to see who voted yes, no or is still pending. As soon as one date and time reaches 4/4, the match moves to Awaiting booking and a pinned notice lets you confirm date, location and court or discard that agreement and propose a new date. Agreement and scheduled-match alerts stay grouped in the same conversation. Once the booking is confirmed, its summary stays pinned above the message history." }] },
    ranking: {
      title: "Standings",
      description: "Understand positions, points and tie-break rules.",
      steps: [
        {
          title: "Points and tie-breaks",
          description: "The table sorts by points and then applies the configured set and game criteria.",
        },
        {
          title: "Beyond the table",
          description: "Open the history to review streaks, comparisons, records and previous seasons.",
        },
      ],
    },
    statistics: {
      title: "Statistics",
      description: "Explore the current season, previous seasons or the full league history.",
      steps: [
        {
          title: "Quick overview",
          description: "These cards show leaders, wins, game difference and the best streaks.",
        },
        {
          title: "Separate analysis areas",
          description: "Open standings, head-to-head, player analysis, evolution, records or the season summary.",
        },
      ],
    },
    settings: {
      title: "Settings",
      description: "Learn the main sections and quickly find any option in the app.",
      steps: [
        {
          title: "Your profile",
          description: "Review and edit your account details and the image that identifies you in Smash & Lob.",
        },
        {
          title: "Appearance",
          description: "Customize the app theme, visual style and color palette.",
        },
        {
          title: "Notifications",
          description: "Turn on push alerts on this device and choose which ones you want with six switches. League news and chat mentions always arrive.",
        },
        {
          title: "Your leagues and My matches",
          description: "Use My Competitions to switch competitions or open My matches, where league matches and friendlies come together in one personal history. These personal areas remain available even when the active league has a scheduled season.",
        },
        {
          title: "Suggestions",
          description: "Send ideas, improvements or new feature requests directly from the app.",
        },
        {
          title: "Settings search",
          description: "Use this floating button to search for any feature or setting and jump directly to its section.",
        },
      ],
    },
    "season-admin": {
      title: "Season administration",
      description: "Configure the calendar, rules, participants and status without searching through the page.",
      steps: [
        {
          title: "Quick links",
          description: "These buttons take you directly to calendar, rules, people and status actions. You can also schedule the season start: until activation, players are limited to that competition’s Home, while administrators keep normal access to the calendar and management tools.",
        },
        {
          title: "Calendar and rounds",
          description: "Define the format, order and timing margin for the season rounds here.",
        },
        {
          title: "Players and registration",
          description: "Manage participants, available places and registration according to the season mode.",
        },
        {
          title: "Season finances",
          description: "When registration is enabled, open the finance screen to track collections, record expenses and see the available balance.",
        },
      ],
    },
  },
  eu: {
    "app-introduction": {
      title: "Lehen urratsak",
      description: "Ezagutu nabigazio nagusia eta laguntza behar duzunean non aurkitu.",
      steps: [
        {
          title: "Ongi etorri Smash & Lob-era",
          description: "Aplikazioak partidak, sailkapena, estatistikak eta ligaren kudeaketa leku berean biltzen ditu.",
        },
        {
          title: "Zure liga eta denboraldia",
          description: "Hemen ikus dezakezu beti zein liga eta denboraldi kontsultatzen ari zaren.",
        },
        {
          title: "Nabigazio nagusia",
          description: "Erabili barra hau hasierara itzultzeko, sailkapena ikusteko, partidak irekitzeko edo profila berrikusteko.",
        },
        {
          title: "Laguntza behar duzunean",
          description: "Sakatu botoi hau edozein pantailaren gida errepikatzeko edo tutorial guztiak ikusteko.",
        },
      ],
    },
    home: {
      title: "Hasierako pantaila",
      description: "Ikusi begirada batean denboraldiaren egoera eta hurrengo ekintzak.",
      steps: [
        {
          title: "Ongi etorri Smash & Lob-era",
          description: "Aplikazioak partidak, sailkapena, estatistikak eta ligaren kudeaketa leku bakarrean biltzen ditu.",
        },
        {
          title: "Ligaren laburpena",
          description: "Goiburuak liga, hautatutako denboraldia eta amaituta dagoen adierazten ditu.",
        },
        { title: "Aldatu liga azkar", description: "Sakatu ligaren izena lehiaketaz aldatzeko edo Nire partidak irekitzeko. Liga honek denboraldi programatua badu, bere lehiaketa-eremuak bakarrik blokeatzen dira hasi arte: Nire lehiaketak, Nire partidak, Ezarpenak, Laguntza eta Jakinarazpenak erabilgarri jarraitzen dute." },
        { title: "Ikusi beste denboraldiak", description: "Ligak denboraldi bat baino gehiago badu, sakatu denboraldiaren azpititulua aurreko bat irekitzeko liga aldatu gabe." },
        {
          title: "Ohar garrantzitsuak",
          description: "Administratzaileen oharrak hemen agertzen dira partidetan gal ez daitezen.",
        },
        {
          title: "Zure hurrengo partida",
          description: "Ireki txartela jokalariak, data, kokapena, txata eta partidaren ekintzak ikusteko.",
        },
        {
          title: "Amaitutako denboraldiak",
          description: "Denboraldia amaitzean, hemendik historia ireki edo azken laburpena parteka dezakezu.",
        },
        {
          title: "Ezarpenak",
          description: "Kudeatu profila, hobespenak, ligak eta zure rolarentzat erabilgarri dauden administrazio-aukerak.",
        },
        {
          title: "Jakinarazpenak",
          description: "Ikusi partiden, emaitzen, mezuen eta ligako jarduera garrantzitsuaren abisuak.",
        },
        {
          title: "Ikusleekin partekatu",
          description: "Erabilgarri dagoenean, botoi honek lehiaketa jarraitzeko irakurketa-soileko sarbidea sortzen du.",
        },
        {
          title: "Jokalariak gonbidatu",
          description: "Administratzaileek lotu gabe dauden jokalarientzako esteka parteka dezakete hemendik.",
        },
        {
          title: "Laguntza bisuala",
          description: "Ireki uneko pantailaren gida, bere bideoa baldin badu, edo sartu Laguntzan tutorial eta arau guztiak ikusteko.",
        },
      ],
    },
    matches: {
      title: "Partidak eta jardunaldiak",
      description: "Ikusi egutegi osoa edo zure partidetan bakarrik jarri arreta.",
      steps: [
        {
          title: "Guztiak edo zureak bakarrik",
          description: "Aldatu egutegi osoaren eta parte hartzen duzun partiden ikuspegi iragaziaren artean.",
        },
        {
          title: "Jardunaldiak eta egoerak",
          description: "Bloke bakoitzak jardunaldi bat eta haren egoera erakusten ditu. Partida-panelak sakagarriak dira: ireki bat partidaren xehetasun osoa ikusteko.",
        },
      ],
    },
    chats: { title: "Chats", description: "Jarri arreta behar duten elkarrizketak lehenengo.", steps: [{ title: "Chat aktiboak", description: "Uneko jardunaldia, hurrengoa eta dagoeneko mezuak dituen etorkizuneko edozein chat hemen agertzen dira. Jarduera berriena gorantz igotzen da mezularitza-aplikazio batean bezala." }, { title: "Hurrengoak", description: "Jarduerarik gabeko ondorengo jardunaldiak hemen geratzen dira. Mezu bat iritsi bezain laster, chat hori Aktiboetara pasatzen da." }, { title: "Amaitutako chat-ak", description: "Amaitutako partidak behean eta irakurketa-soilean geratzen dira, historia martxan dauden chatekin nahastu gabe." }] },
    match: {
      title: "Partidaren xehetasuna",
      description: "Ikusi partidaren atalak: egoera, bikoteak, zozketa, data, pista, emaitza eta MVP.",
      steps: [
        { title: "Partidaren egoera", description: "Partida zein puntutan dagoen laburbiltzen du (adibidez, programatzeke, programatuta edo emaitza zain) eta bere kabuz eguneratzen da." },
        { title: "Bikoteak eta markagailua", description: "Hemen ikusten duzu nor jokatzen duen norekin. Emaitza dagoenean, markagailua eta sets-ak ere agertzen dira." },
        { title: "Zerbitzuaren zozketa", description: "Partidaren ordua hurbiltzen denean, hemen zerbitzua txanponarekin zozkatzen da. Emaitza parte-hartzaileentzat gordetzen da." },
        { title: "Data eta lekua", description: "Hemen data, ordua eta lekua ezartzen edo aldatzen dira. Partidak data duenean, zure egutegian gehi dezakezu." },
        { title: "Pista eta ordainketak", description: "Partida programatuta dagoenean, hemen pistaren erreserba eta nork ordaindu duen bere zatia idazten da. Zain duzuna Ordainketak atalean ere agertzen da." },
        { title: "Emaitza", description: "Hemen emaitza igotzen da jokatu ondoren, eta zure ligaren konfigurazioaren arabera baieztatzen edo eztabaidatzen da. Akatsen bat badago, zuzendu daiteke emaitza blokeatuta ez dagoen bitartean." },
        { title: "Partidaren MVP-a", description: "Jokatu ondoren, parte-hartzaile bakoitzak partidaren MVP-a hautatzen du beste jokalarien artean (ezin duzu zeure burua bozkatu). Zure botoa zain dagoen bitartean nabarmenduta egongo da." },
        { title: "Ekintza gehiago", description: "⋯ menuak eskura dituzun partidaren ekintzak biltzen ditu, adibidez gertakari baten berri ematea edo ordezkapen bat kudeatzea. Zer agertzen den zure ligaren ezarpenen eta zure rolaren araberakoa da." },
        { title: "Partidako chat-a", description: "Burbuila honek lau parte-hartzaileen chat pribatua irekitzen du. Elkarrizketa guztiak NAVBAR-eko Chats atalean ere daude." },
      ],
    },
    competitions: {
      title: "Nire lehiaketak",
      description: "Zure abiapuntua: zure jarduera, zure ligak eta lehiaketa bat nola sortu edo harekin bat egin.",
      steps: [
        { title: "Zure jarduera pertsonala", description: "Begirada batean: zure hurrengo partida, jokatu duzun azkena eta emaitza zain daudenak. Irristatu batetik bestera pasatzeko." },
        { title: "Zure ligak", description: "Txartel bakoitza zu zaren liga bat da, bere denboraldiaren egoerarekin. Sakatu liga horretan sartzeko." },
        { title: "Ikusi guztiak", description: "Zure liga guztien zerrenda irekitzen du, amaitutakoak barne, eta handik gonbidapen batekin beste batean sartu zaitezke." },
        { title: "Zure txapelketak", description: "Parte hartzen duzun txapelketak hemen agertzen dira, beren egoerarekin." },
        { title: "Sortzeko botoia", description: "Hemendik lagunarteko partida bat sortzen duzu eta, baimena baduzu, liga bat edo txapelketa bat ere bai." },
      ],
    },
    "notification-settings": {
      title: "Jakinarazpenen ezarpenak",
      description: "Aukeratu zer abisu jasotzen dituzun eta zein gailutan.",
      steps: [
        { title: "Gailu hau", description: "Hemen gailu honetako abisuak aktibatzen edo desaktibatzen dituzu. Eskuineko adierazleak aktibo dauden ala ez esaten dizu." },
        { title: "Dena edo ezer ez", description: "Sei abisu-taldeak batera aktibatzen edo desaktibatzen ditu." },
        { title: "Sei abisu-talde", description: "Etengailu bakoitzak talde bat kontrolatzen du: Jokatu aurretik, Zure partiden aldaketak, Emaitzak eta MVP, Txateko mezuak, Ligaren eguneratzeak eta Ordainketak. Talde batean abisu aktibatuak eta desaktibatuak badaude, aktibatuta agertzen da." },
        { title: "Beti iristen diren abisuak", description: "Ligaren berriak eta txateko @ aipamenak beti iristen zaizkizu eta ezin dira itzali." },
      ],
    },
    "personal-matches": {
      title: "Nire partidak",
      description: "Zure hurrengo lagunarteko partidak eta zure partiden historia.",
      steps: [
        { title: "Hurrengo partidak", description: "Zure programatutako lagunarteko partidak, dataren arabera. Sakatu bat xehetasuna ikusteko." },
        { title: "Historia", description: "Amaitutako ligako partidak eta amaitutako edo data igaro duten lagunarteko partidak, berrienetik zaharrenera. 10ero kargatzen dira." },
        { title: "Partida bat sortu", description: "Sortu lagunarteko bat: jokalariak aukeratzen dituzu (kontua dutenak edo kanpoko izenekin), eta gero data eta lekua ezartzen dituzu eta emaitza igotzen duzu." },
      ],
    },
    "personal-match": {
      title: "Lagunarteko partidaren xehetasuna",
      description: "Lagunarteko partida batekin egin dezakezun guztia, jokalarietatik emaitzara.",
      steps: [
        { title: "Lagunartekoaren egoera", description: "Zein puntutan dagoen laburbiltzen du: programatzeke, programatuta edo amaituta. Bere kabuz eguneratzen da." },
        { title: "Bikoteak eta markagailua", description: "Hemen ikusten duzu nor jokatzen duen norekin eta, emaitza dagoenean, sets-ak eta markagailua." },
        { title: "Zerbitzuaren zozketa", description: "Partidaren ordua hurbiltzen denean, hemen zerbitzua txanponarekin zozkatzen da. Emaitza parte-hartzaileentzat gordetzen da." },
        { title: "Lagunartekoaren jokalariak", description: "Aldatu zure bikotekidea edo aurkariak emaitza erregistratu aurretik. Kontua duten jokalariak edo kanpoko izenak izan daitezke; gorde aldaketak «Save players» botoiarekin." },
        { title: "Data eta lekua", description: "Hemen data, ordua eta lekua ezartzen edo aldatzen dira. Partidak data duenean, zure egutegian gehi dezakezu." },
        { title: "Pista eta ordainketak", description: "Hemen pistaren erreserba eta nork ordaindu duen bere zatia idazten da. Zain dagoena Ordainketak atalean ere agertzen da." },
        { title: "Emaitza", description: "Erregistratu sets-ak jokatu ondoren. Edizio baimena duenak geroago zuzendu ditzake akatsen bat ikusten badu." },
        { title: "Partidako chat-a", description: "Burbuila honek lagunartekoaren chat-a irekitzen du parte-hartzaileekin." },
        { title: "Lagunartekoa pertsonala da", description: "Ez dago inongo lehiaketatan, beraz ez du eraginik sailkapenean, estatistika ofizialetan ezta errekorretan ere." },
        { title: "Partida ezabatu", description: "Lagunartekoa sortu zuenak soilik ezabatu dezake." },
      ],
    },
    payments: {
      title: "Nire ordainketak",
      description: "Zer zor duzun, zer zor dizuten eta ordainketa bakoitza nola kitatu.",
      steps: [
        { title: "Egoera eta mugimenduak", description: "«Egoera» atalak zain duzuna erakusten du eta «Mugimenduak» atalak zure ordainketen eta kobrantzen historia." },
        { title: "Administrazio ikuspegia", description: "Administratzaile gisa, hemen aktibo dagoen ligako ordainketa-mugimendu guztiak ikusten dituzu." },
        { title: "Liga edo lagunartekoak", description: "Iragazi ordainketak Guztiak, Liga edo Lagunartekoak aukeraren arabera." },
        { title: "Liga eta denboraldia", description: "Liga iragazkiarekin, aukeratu zein ligatako eta zein denboraldiko ordainketak ikusi nahi dituzun." },
        { title: "Zor duzu eta Zuri zor dizute", description: "Zenbat ordaindu behar duzun eta zenbat zor dizuten laburbiltzen du, alde bakoitzeko mugimendu kopuruarekin." },
        { title: "Ligaren ekonomia", description: "Liga iragazkiarekin, zabaldu erregistratutako gastua, zure zati estimatua eta pisten, pilota eta izen-emateen banaketa." },
        { title: "Ordaintzeke dauden ordainketak", description: "Mugimendu bakoitzak zenbatekoa eta partida erakusten ditu. «Ikusi partida» botoiak partida irekitzen du eta «Ordaindutzat markatu» botoiak kitatzen du. Atzera egin dezakeenak soilik ikusten du «Zain dagoela markatu»." },
      ],
    },
    chat: { title: "Partidako chat-a", description: "Koordinatu partida berehala erantzuten duten mezu eta proposamenekin.", steps: [{ title: "Identitatea eta irakurketa", description: "Jarraian datozen mezuak jokalariaren arabera taldekatzen dira: avatarrak eta koloreak blokearen hasiera markatzen dute eta mezu berriak animazio labur batekin sartzen dira. Irristatu mezu bat eskuinera hari erantzuteko. Zure mezuetan ✓ bidalketa baieztatzen du eta ✓✓ urdinak lotutako gainerako parte-hartzaile guztiek irakurri dutela adierazten du." }, { title: "Proposamenak eta erreserba", description: "Klipak data edo kokapen proposamenak irekitzen ditu. Gehienez lau ordutegi marka ditzakezu, ✓ edo ✕ bidez bozkatu eta boto bera berriro sakatuta zure botoa kendu. Sakatu proposamen bat nor dagoen alde, kontra edo erantzun gabe ikusteko. Data eta ordu batek 4/4 lortzen duenean, partida Erreserbaren zain egoerara pasatzen da eta finkatutako abisu batek data, kokapena eta pista baieztatzeko edo akordioa baztertu eta data berria proposatzeko aukera ematen du. Akordioaren eta programatutako partidaren abisuak elkarrizketa berean taldekatzen dira. Erreserba baieztatzen denean, haren laburpena mezuen historiaren gainean finkatuta geratzen da." }] },
    ranking: {
      title: "Sailkapena",
      description: "Ulertu postuak, puntuak eta berdinketa-irizpideak.",
      steps: [
        {
          title: "Puntuak eta berdinketak",
          description: "Taulak puntuen arabera ordenatzen du eta ondoren konfiguratutako set eta joko irizpideak aplikatzen ditu.",
        },
        {
          title: "Taulatik harago",
          description: "Ireki historia boladak, alderaketak, errekorrak eta aurreko denboraldiak ikusteko.",
        },
      ],
    },
    statistics: {
      title: "Estatistikak",
      description: "Aztertu uneko denboraldia, aurrekoak edo ligaren historia osoa.",
      steps: [
        {
          title: "Laburpen azkarra",
          description: "Txartel hauek liderrak, garaipenak, jokoen aldea eta boladarik onenak erakusten dituzte.",
        },
        {
          title: "Analisi bakoitza bereizita",
          description: "Ireki sailkapena, aurrez aurrekoa, jokalariaren analisia, bilakaera, errekorrak edo denboraldiaren laburpena.",
        },
      ],
    },
    settings: {
      title: "Ezarpenak",
      description: "Ezagutu atal nagusiak eta aurkitu azkar aplikazioko edozein aukera.",
      steps: [
        {
          title: "Zure profila",
          description: "Berrikusi eta editatu zure kontuko datuak eta Smash & Lob-en identifikatzen zaituen irudia.",
        },
        {
          title: "Itxura",
          description: "Pertsonalizatu aplikazioaren gaia, estilo bisuala eta kolore-paleta.",
        },
        {
          title: "Jakinarazpenak",
          description: "Aktibatu push abisuak gailu honetan eta aukeratu sei etengailuren bidez zeintzuk jaso nahi dituzun. Ligaren berriak eta txateko aipamenak beti iristen dira.",
        },
        {
          title: "Zure ligak eta Nire partidak",
          description: "Nire lehiaketak ataletik txapelketaz alda dezakezu edo Nire partidak ireki, ligako partidak eta lagunartekoak historia pertsonal berean ikusteko. Eremu pertsonal horiek erabilgarri jarraitzen dute liga aktiboak denboraldi programatua badu ere.",
        },
        {
          title: "Iradokizunak",
          description: "Bidali ideiak, hobekuntzak edo funtzio berrien proposamenak aplikaziotik zuzenean.",
        },
        {
          title: "Ezarpenen bilatzailea",
          description: "Sakatu botoi flotagarri hau edozein funtzio edo ezarpen bilatzeko eta haren atalera zuzenean joateko.",
        },
      ],
    },
    "season-admin": {
      title: "Denboraldia administratu",
      description: "Konfiguratu egutegia, arauak, parte-hartzaileak eta egoera pantailan galdu gabe.",
      steps: [
        {
          title: "Sarbide azkarrak",
          description: "Botoi hauek egutegira, arauetara, pertsonetara eta egoera-ekintzetara eramaten zaituzte. Denboraldiaren hasiera ere programa dezakezu: aktibatu arte, jokalariak lehiaketa horretako Hasierara mugatzen dira, eta ADMIN IKUSPEGIA aktibatuta duten administratzaileek kudeaketa osoa mantentzen dute.",
        },
        {
          title: "Egutegia eta jardunaldiak",
          description: "Hemen definitzen dituzu denboraldiko jardunaldien formatua, ordena eta denbora-marjina.",
        },
        {
          title: "Jokalariak eta izen-ematea",
          description: "Kudeatu parte-hartzaileak, plazak eta izen-ematea denboraldiaren moduaren arabera.",
        },
        {
          title: "Denboraldiko ekonomia",
          description: "Izen-ematea badago, ireki ekonomia pantaila kobrantzak, gastuak eta saldo erabilgarria kontrolatzeko.",
        },
      ],
    },
  },
}

const tourStructure: Array<{
  key: OnboardingTourKey
  version: number
  route: string
  audience: (audience: OnboardingAudience) => boolean
  steps: Array<Pick<OnboardingTourStep, "selector" | "side" | "firstRunOnly" | "wide">>
}> = [
  {
    key: "home",
    version: 7,
    route: "/league/home",
    audience: everyone,
    steps: [
      { side: "center", firstRunOnly: true, wide: true },
      { selector: "[data-tour='home-header']", side: "bottom" },
      { selector: "[data-tour='home-league-switcher']", side: "bottom" },
      { selector: "[data-tour='home-season-switcher']", side: "bottom" },
      { selector: "[data-tour='home-announcements']", side: "bottom" },
      { selector: "[data-tour='home-next-match']", side: "top" },
      { selector: "[data-tour='home-season-actions']", side: "top" },
      { selector: "[data-tour='floating-settings']", side: "bottom" },
      { selector: "[data-tour='floating-notifications']", side: "bottom" },
      { selector: "[data-tour='floating-share-spectators']", side: "bottom" },
      { selector: "[data-tour='floating-invite-players']", side: "bottom" },
      { selector: "[data-tour='floating-help']", side: "bottom" },
    ],
  },
  {
    key: "matches",
    version: 2,
    route: "/matches",
    audience: everyone,
    steps: [
      { selector: "[data-tour='matches-scope']", side: "bottom" },
      { selector: "[data-tour='matches-round-list']", side: "top" },
    ],
  },
  { key: "chats", version: 2, route: "/chats", audience: players, steps: [{ selector: "[data-tour='chats-conversations']", side: "bottom" }, { selector: "[data-tour='chats-upcoming']", side: "bottom" }, { selector: "[data-tour='chats-finished']", side: "top" }] },
  { key: "chat", version: 7, route: "/match/:id/chat", audience: players, steps: [{ selector: "[data-tour='chat-messages']", side: "center" }, { selector: "[data-tour='chat-proposals']", side: "top" }] },
  {
    key: "match",
    version: 2,
    route: "/match/:id",
    audience: players,
    steps: [
      { selector: "[data-tour='match-status']", side: "bottom" },
      { selector: "[data-tour='match-pairing']", side: "bottom" },
      { selector: "[data-tour='match-coin-toss']", side: "top" },
      { selector: "[data-tour='match-schedule']", side: "top" },
      { selector: "[data-tour='match-court-booking']", side: "top" },
      { selector: "[data-tour='match-result']", side: "top" },
      { selector: "[data-tour='match-mvp']", side: "top" },
      { selector: "[data-tour='match-actions-menu']", side: "left" },
      { selector: "[data-tour='match-chat-access']", side: "left" },
    ],
  },
  {
    key: "competitions",
    version: 1,
    route: "/leagues",
    audience: everyone,
    steps: [
      { selector: "[data-tour='competitions-activity']", side: "bottom" },
      { selector: "[data-tour='competitions-leagues']", side: "top" },
      { selector: "[data-tour='competitions-see-all']", side: "bottom" },
      { selector: "[data-tour='competitions-tournaments']", side: "top" },
      { selector: "[data-tour='floating-create']", side: "left" },
    ],
  },
  {
    key: "notification-settings",
    version: 1,
    route: "/settings/notifications",
    audience: everyone,
    steps: [
      { selector: "[data-tour='notifications-device']", side: "bottom" },
      { selector: "[data-tour='notifications-bulk']", side: "bottom" },
      { selector: "[data-tour='notifications-groups']", side: "top" },
      { selector: "[data-tour='notifications-required']", side: "top" },
    ],
  },
  {
    key: "personal-matches",
    version: 1,
    route: "/personal-matches",
    audience: players,
    steps: [
      { selector: "[data-tour='friendly-upcoming']", side: "bottom" },
      { selector: "[data-tour='friendly-history']", side: "top" },
      { selector: "[data-tour='floating-create']", side: "left" },
    ],
  },
  {
    key: "personal-match",
    version: 1,
    route: "/personal-matches/:id",
    audience: players,
    steps: [
      { selector: "[data-tour='match-status']", side: "bottom" },
      { selector: "[data-tour='match-pairing']", side: "bottom" },
      { selector: "[data-tour='match-coin-toss']", side: "top" },
      { selector: "[data-tour='friendly-participants']", side: "top" },
      { selector: "[data-tour='friendly-schedule']", side: "top" },
      { selector: "[data-tour='friendly-court']", side: "top" },
      { selector: "[data-tour='friendly-result']", side: "top" },
      { selector: "[data-tour='match-chat-access']", side: "left" },
      { selector: "[data-tour='friendly-personal-note']", side: "top" },
      { selector: "[data-tour='friendly-delete']", side: "top" },
    ],
  },
  {
    key: "payments",
    version: 1,
    route: "/payments",
    audience: everyone,
    steps: [
      { selector: "[data-tour='payments-tabs']", side: "bottom" },
      { selector: "[data-tour='payments-admin-tab']", side: "bottom" },
      { selector: "[data-tour='payments-scope']", side: "bottom" },
      { selector: "[data-tour='payments-league-picker']", side: "bottom" },
      { selector: "[data-tour='payments-summary']", side: "bottom" },
      { selector: "[data-tour='payments-economy']", side: "top" },
      { selector: "[data-tour='payments-pending']", side: "top" },
    ],
  },
  {
    key: "ranking",
    version: 2,
    route: "/ranking",
    audience: everyone,
    steps: [
      { selector: "[data-tour='ranking-table']", side: "top" },
      { selector: "[data-tour='ranking-statistics-link']", side: "top" },
    ],
  },
  {
    key: "statistics",
    version: 2,
    route: "/statistics",
    audience: everyone,
    steps: [
      { selector: "[data-tour='statistics-highlights']", side: "bottom" },
      { selector: "[data-tour='statistics-navigation']", side: "top" },
    ],
  },
  {
    key: "settings",
    version: 4,
    route: "/settings",
    audience: everyone,
    steps: [
      { selector: "[data-tour='settings-profile']", side: "bottom" },
      { selector: "[data-tour='settings-appearance']", side: "bottom" },
      { selector: "[data-tour='settings-notifications']", side: "bottom" },
      { selector: "[data-tour='settings-context-switcher']", side: "top" },
      { selector: "[data-tour='settings-suggestions']", side: "top" },
      { selector: "[data-tour='settings-search']", side: "left" },
    ],
  },
  {
    key: "season-admin",
    version: 3,
    route: "/admin/season",
    audience: managers,
    steps: [
      { selector: "[data-tour='season-admin-navigation']", side: "bottom" },
      { selector: "[data-tour='season-admin-calendar']", side: "top" },
      { selector: "[data-tour='season-admin-people']", side: "top" },
      { selector: "[data-tour='season-admin-finances']", side: "top" },
    ],
  },
]

export function getOnboardingTours(locale: Locale): OnboardingTourDefinition[] {
  return tourStructure.map((definition) => {
    const text = tourTexts[locale][definition.key]
    return {
      key: definition.key,
      version: definition.version,
      route: definition.route,
      title: text.title,
      description: text.description,
      audience: definition.audience,
      steps: definition.steps.map((step, index) => ({
        ...step,
        ...text.steps[index],
      })),
    }
  })
}

export function getTourStepsForLaunch(
  tour: OnboardingTourDefinition,
  { includeFirstRunOnly = false }: { includeFirstRunOnly?: boolean } = {},
) {
  return includeFirstRunOnly
    ? tour.steps
    : tour.steps.filter((step) => !step.firstRunOnly)
}

export function getTourForPathname({
  pathname,
  locale,
  audience,
}: {
  pathname: string
  locale: Locale
  audience: OnboardingAudience
}) {
  const tours = getOnboardingTours(locale).filter((tour) => tour.audience(audience))
  return tours.find((tour) => tour.route === pathname || (tour.route === "/match/:id" && /^\/match\/[^/]+$/.test(pathname)) || (tour.route === "/match/:id/chat" && /^\/match\/[^/]+\/chat$/.test(pathname)) || (tour.route === "/personal-matches/:id" && /^\/personal-matches\/(?!new$|chats$|profile$)[^/]+$/.test(pathname))) ?? null
}
