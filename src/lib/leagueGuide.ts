import type { Locale } from "@/i18n/translations"

export type LeagueGuideSettings = {
  requiresThreeSets: boolean
  mvpSystem: "none" | "automatic" | "voting"
  resultConfirmationMode: "required" | "optional" | "none"
  registrationFee: {
    enabled: boolean
    amount: number
    purpose: string
  }
  rosterMode: "fixed" | "self_registration"
  playerCapacity: number | null
  registrationOpen: boolean
  scheduleMode: "single" | "double" | "extended"
  calendarMode: "balanced" | "manual"
  roundWindowMode: "none" | "fixed-days"
  roundWindowDays: number | null
  allowPlayerIncidents: boolean
  allowPlayerSubstitutions: boolean
}

export type LeagueGuideItem = {
  id: string
  title: string
  description: string
}

type GuideCopy = {
  currentSeasonTitle: string
  currentSeasonDescription: string
  appToolsTitle: string
  appToolsDescription: string
  rosterFixedTitle: string
  rosterFixedDescription: (capacity: number | null) => string
  rosterSelfTitle: string
  rosterSelfDescription: (capacity: number | null, registrationOpen: boolean) => string
  calendarBalancedTitle: string
  calendarBalancedDescription: string
  calendarManualTitle: string
  calendarManualDescription: string
  scheduleSingleTitle: string
  scheduleSingleDescription: string
  scheduleDoubleTitle: string
  scheduleDoubleDescription: string
  scheduleExtendedTitle: string
  scheduleExtendedDescription: string
  roundWindowTitle: string
  roundWindowDescription: (days: number | null) => string
  roundWindowNoneTitle: string
  roundWindowNoneDescription: string
  threeSetsTitle: string
  threeSetsDescription: string
  optionalSetsTitle: string
  optionalSetsDescription: string
  confirmationsRequiredTitle: string
  confirmationsRequiredDescription: string
  confirmationsOptionalTitle: string
  confirmationsOptionalDescription: string
  confirmationsNoneTitle: string
  confirmationsNoneDescription: string
  mvpAutomaticTitle: string
  mvpAutomaticDescription: string
  mvpVotingTitle: string
  mvpVotingDescription: string
  registrationTitle: string
  registrationDescription: (amount: string, purpose: string) => string
  incidentsTitle: string
  incidentsDescription: string
  substitutionsTitle: string
  substitutionsDescription: string
  availabilityTitle: string
  availabilityDescription: string
  schedulingTitle: string
  schedulingDescription: string
  resultsTitle: string
  resultsDescription: string
  paymentsTitle: string
  paymentsWithFeeDescription: string
  paymentsWithoutFeeDescription: string
  notificationsTitle: string
  notificationsDescription: string
  activityTitle: string
  activityDescription: string
  suggestionsTitle: string
  suggestionsDescription: string
  spectatorsTitle: string
  spectatorsDescription: string
  inviteParticipationFixedTitle: string
  inviteParticipationFixedDescription: (capacity: number | null) => string
  inviteParticipationSelfTitle: string
  inviteParticipationSelfDescription: (capacity: number | null) => string
  inviteCalendarTitle: string
  inviteResultsTitle: string
  inviteResultsDescription: (confirmation: string, mvp: string) => string
  invitePlayerActionsTitle: string
  invitePlayerActionsDescription: (incidents: boolean, substitutions: boolean) => string
  inviteCommitmentTitle: string
  inviteCommitmentDescription: string
  inviteGameRulesTitle: string
  inviteGameRulesDescription: string
}

const COPY: Record<Locale, GuideCopy> = {
  es: {
    currentSeasonTitle: "Configuración de esta temporada",
    currentSeasonDescription:
      "La guía se adapta a las reglas activas de la temporada que estás consultando.",
    appToolsTitle: "Herramientas de la aplicación",
    appToolsDescription:
      "Estas son las funciones disponibles para organizar la liga y seguir tu participación.",
    rosterFixedTitle: "Plantilla preparada por la organización",
    rosterFixedDescription: (capacity) =>
      capacity
        ? `La temporada tiene ${capacity} plazas definidas y cada cuenta reclama uno de los jugadores preparados.`
        : "La organización prepara la plantilla y cada cuenta reclama uno de los jugadores disponibles.",
    rosterSelfTitle: "Plantilla por autoinscripción",
    rosterSelfDescription: (capacity, registrationOpen) => {
      const capacityText = capacity ? ` hasta completar ${capacity} plazas` : ""
      return registrationOpen
        ? `Los participantes pueden ocupar una plaza desde la invitación${capacityText}.`
        : `La plantilla se creó por autoinscripción${capacityText}, pero el registro está cerrado actualmente.`
    },
    calendarBalancedTitle: "Calendario equilibrado",
    calendarBalancedDescription:
      "La aplicación intenta repartir compañeros y rivales de forma equilibrada.",
    calendarManualTitle: "Calendario manual",
    calendarManualDescription:
      "La organización define directamente las parejas, rivales y jornadas.",
    scheduleSingleTitle: "Una vuelta",
    scheduleSingleDescription:
      "El calendario utiliza una vuelta completa de emparejamientos.",
    scheduleDoubleTitle: "Doble vuelta",
    scheduleDoubleDescription:
      "La temporada amplía el calendario con una segunda vuelta.",
    scheduleExtendedTitle: "Calendario ampliado",
    scheduleExtendedDescription:
      "La temporada utiliza un calendario extendido con más jornadas y combinaciones.",
    roundWindowTitle: "Jornadas con plazo",
    roundWindowDescription: (days) =>
      days
        ? `Cada jornada dispone de ${days} días para completar sus partidos.`
        : "Las jornadas tienen un periodo definido por la organización.",
    roundWindowNoneTitle: "Jornadas sin plazo automático",
    roundWindowNoneDescription:
      "La organización activa, cierra y ordena las jornadas manualmente.",
    threeSetsTitle: "Tres sets obligatorios",
    threeSetsDescription:
      "Se registran tres sets completos: un 3-0 reparte 3 puntos y un 2-1 reparte 2 puntos a la pareja ganadora y 1 a la perdedora.",
    optionalSetsTitle: "Sets flexibles",
    optionalSetsDescription:
      "Cada set ganado suma un punto y solo cuentan los sets realmente completados y guardados.",
    confirmationsRequiredTitle: "Confirmación obligatoria de resultados",
    confirmationsRequiredDescription:
      "Los participantes deben confirmar el resultado antes de que quede consolidado para la clasificación.",
    confirmationsOptionalTitle: "Confirmación opcional de resultados",
    confirmationsOptionalDescription:
      "Los participantes pueden confirmar o revisar el resultado, pero la confirmación no bloquea el avance de la competición.",
    confirmationsNoneTitle: "Resultados sin confirmación",
    confirmationsNoneDescription:
      "El resultado registrado se aplica sin un paso adicional de confirmación de los jugadores.",
    mvpAutomaticTitle: "MVP automático",
    mvpAutomaticDescription:
      "La aplicación calcula el MVP de jornada utilizando el rendimiento registrado en los partidos.",
    mvpVotingTitle: "MVP por votación",
    mvpVotingDescription:
      "Después de jugar, cada participante vota a otro jugador de su partido; no puede votarse a sí mismo.",
    registrationTitle: "Cuota de temporada",
    registrationDescription: (amount, purpose) =>
      purpose
        ? `La cuota es ${amount} por jugador. Destino indicado: ${purpose}.`
        : `La cuota activa es ${amount} por jugador y su pago puede controlarse desde la aplicación.`,
    incidentsTitle: "Incidencias de partido",
    incidentsDescription:
      "Los jugadores pueden comunicar problemas del encuentro para que la administración los revise y resuelva.",
    substitutionsTitle: "Suplentes y reemplazos",
    substitutionsDescription:
      "Se permiten sustituciones puntuales y reemplazos permanentes. Los puntos y estadísticas pertenecen a quien juega realmente.",
    availabilityTitle: "Disponibilidad habitual",
    availabilityDescription:
      "Configura tus franjas habituales para facilitar que el grupo encuentre fecha para cada partido.",
    schedulingTitle: "Programación de partidos",
    schedulingDescription:
      "Las fechas, horas y pistas se proponen o editan desde cada partido según los permisos disponibles.",
    resultsTitle: "Resultados y clasificación",
    resultsDescription:
      "Los sets y juegos guardados actualizan la clasificación individual, los desempates y las estadísticas.",
    paymentsTitle: "Pagos y reservas",
    paymentsWithFeeDescription:
      "La aplicación reúne la cuota de temporada, reservas de pista, bolas y pagos pendientes entre participantes.",
    paymentsWithoutFeeDescription:
      "La aplicación permite repartir reservas de pista, bolas y pagos pendientes entre participantes.",
    notificationsTitle: "Notificaciones",
    notificationsDescription:
      "Cada usuario elige qué avisos recibir y activa las notificaciones push en cada dispositivo.",
    activityTitle: "Actividad e historial",
    activityDescription:
      "La actividad de la liga conserva cambios, resultados, programación y acciones relevantes según tu acceso.",
    suggestionsTitle: "Buzón de sugerencias",
    suggestionsDescription:
      "Puedes enviar mejoras o nuevas ideas desde Ajustes y consultar el estado de las propuestas que hayas enviado.",
    spectatorsTitle: "Acceso para espectadores",
    spectatorsDescription:
      "Una invitación independiente puede dar acceso de solo lectura sin ocupar una plaza de jugador.",
    inviteParticipationFixedTitle: "Tu plaza en la plantilla",
    inviteParticipationFixedDescription: (capacity) =>
      capacity
        ? `La organización ha preparado ${capacity} plazas. Después de aceptar las reglas reclamarás tu jugador y sumarás puntos individualmente aunque juegues por parejas.`
        : "Después de aceptar las reglas reclamarás uno de los jugadores preparados y sumarás puntos individualmente aunque juegues por parejas.",
    inviteParticipationSelfTitle: "Autoinscripción",
    inviteParticipationSelfDescription: (capacity) =>
      capacity
        ? `Al continuar ocuparás una de las ${capacity} plazas con tu perfil y sumarás puntos individualmente aunque juegues por parejas.`
        : "Al continuar se creará tu plaza con los datos de tu perfil y sumarás puntos individualmente aunque juegues por parejas.",
    inviteCalendarTitle: "Calendario de la temporada",
    inviteResultsTitle: "Resultados, confirmaciones y MVP",
    inviteResultsDescription: (confirmation, mvp) =>
      [confirmation, mvp].filter(Boolean).join(" "),
    invitePlayerActionsTitle: "Incidencias y sustituciones",
    invitePlayerActionsDescription: (incidents, substitutions) => {
      if (incidents && substitutions) {
        return "Los jugadores pueden comunicar incidencias y gestionar sustituciones permitidas antes de finalizar el partido."
      }
      if (incidents) {
        return "Los jugadores pueden comunicar incidencias para que la administración las revise."
      }
      return "La temporada permite gestionar suplentes y sustituciones antes de finalizar el partido."
    },
    inviteCommitmentTitle: "Compromiso y buena fe",
    inviteCommitmentDescription:
      "Los partidos deben programarse y disputarse con responsabilidad. Los aplazamientos se reservan para causas reales.",
    inviteGameRulesTitle: "Normas de juego",
    inviteGameRulesDescription:
      "Se aplica Star Point en el tercer 40-40 y tie-break cuando el set llega a 6-6. Los juegos también cuentan para desempatar.",
  },
  en: {
    currentSeasonTitle: "This season's configuration",
    currentSeasonDescription:
      "The guide adapts to the active rules of the season you are viewing.",
    appToolsTitle: "Application tools",
    appToolsDescription:
      "These features are available to organise the league and follow your participation.",
    rosterFixedTitle: "Roster prepared by the organisers",
    rosterFixedDescription: (capacity) =>
      capacity
        ? `The season has ${capacity} defined places and each account claims one of the prepared players.`
        : "The organisers prepare the roster and each account claims one of the available players.",
    rosterSelfTitle: "Self-registration roster",
    rosterSelfDescription: (capacity, registrationOpen) => {
      const capacityText = capacity ? ` until ${capacity} places are filled` : ""
      return registrationOpen
        ? `Participants can take a place from the invitation${capacityText}.`
        : `The roster was created through self-registration${capacityText}, but registration is currently closed.`
    },
    calendarBalancedTitle: "Balanced calendar",
    calendarBalancedDescription:
      "The application tries to distribute partners and opponents evenly.",
    calendarManualTitle: "Manual calendar",
    calendarManualDescription:
      "The organisers directly define partners, opponents and rounds.",
    scheduleSingleTitle: "Single round",
    scheduleSingleDescription: "The calendar uses one complete round of pairings.",
    scheduleDoubleTitle: "Double round",
    scheduleDoubleDescription: "The season adds a second round of pairings.",
    scheduleExtendedTitle: "Extended calendar",
    scheduleExtendedDescription:
      "The season uses an extended calendar with more rounds and combinations.",
    roundWindowTitle: "Rounds with a deadline",
    roundWindowDescription: (days) =>
      days
        ? `Each round has ${days} days to complete its matches.`
        : "Rounds have a period defined by the organisers.",
    roundWindowNoneTitle: "Rounds without an automatic deadline",
    roundWindowNoneDescription:
      "The organisers activate, close and order rounds manually.",
    threeSetsTitle: "Three mandatory sets",
    threeSetsDescription:
      "Three full sets are recorded: a 3-0 awards 3 points, while a 2-1 awards 2 points to the winners and 1 to the losing pair.",
    optionalSetsTitle: "Flexible sets",
    optionalSetsDescription:
      "Each set won gives one point and only completed, saved sets count.",
    confirmationsRequiredTitle: "Mandatory result confirmation",
    confirmationsRequiredDescription:
      "Participants must confirm the result before it is consolidated in the standings.",
    confirmationsOptionalTitle: "Optional result confirmation",
    confirmationsOptionalDescription:
      "Participants may confirm or review the result, but confirmation does not block competition progress.",
    confirmationsNoneTitle: "Results without confirmation",
    confirmationsNoneDescription:
      "A submitted result applies without an additional player confirmation step.",
    mvpAutomaticTitle: "Automatic MVP",
    mvpAutomaticDescription:
      "The application calculates the round MVP using the performance recorded in matches.",
    mvpVotingTitle: "MVP voting",
    mvpVotingDescription:
      "After playing, each participant votes for another player in the match and cannot vote for themselves.",
    registrationTitle: "Season fee",
    registrationDescription: (amount, purpose) =>
      purpose
        ? `The fee is ${amount} per player. Stated purpose: ${purpose}.`
        : `The active fee is ${amount} per player and its payment can be tracked in the application.`,
    incidentsTitle: "Match incidents",
    incidentsDescription:
      "Players can report match issues for administrators to review and resolve.",
    substitutionsTitle: "Substitutes and replacements",
    substitutionsDescription:
      "One-match substitutions and permanent replacements are enabled. Points and statistics belong to the person who actually plays.",
    availabilityTitle: "Regular availability",
    availabilityDescription:
      "Set your usual time slots to help the group find a date for every match.",
    schedulingTitle: "Match scheduling",
    schedulingDescription:
      "Dates, times and courts are proposed or edited from each match according to available permissions.",
    resultsTitle: "Results and standings",
    resultsDescription:
      "Saved sets and games update the individual standings, tie-breakers and statistics.",
    paymentsTitle: "Payments and bookings",
    paymentsWithFeeDescription:
      "The application brings together the season fee, court bookings, balls and pending payments between participants.",
    paymentsWithoutFeeDescription:
      "The application can split court bookings, balls and pending payments between participants.",
    notificationsTitle: "Notifications",
    notificationsDescription:
      "Each user chooses which alerts to receive and enables push notifications on each device.",
    activityTitle: "Activity and history",
    activityDescription:
      "League activity keeps relevant changes, results, scheduling and actions according to your access.",
    suggestionsTitle: "Suggestion inbox",
    suggestionsDescription:
      "You can submit improvements or new ideas from Settings and track the status of your own proposals.",
    spectatorsTitle: "Spectator access",
    spectatorsDescription:
      "A separate invitation can grant read-only access without occupying a player place.",
    inviteParticipationFixedTitle: "Your roster place",
    inviteParticipationFixedDescription: (capacity) =>
      capacity
        ? `The organisers have prepared ${capacity} places. After accepting the rules you will claim your player and earn individual points although matches are played in pairs.`
        : "After accepting the rules you will claim a prepared player and earn individual points although matches are played in pairs.",
    inviteParticipationSelfTitle: "Self-registration",
    inviteParticipationSelfDescription: (capacity) =>
      capacity
        ? `Continuing will occupy one of the ${capacity} places with your profile, and you will earn individual points although matches are played in pairs.`
        : "Continuing will create your player place using your profile details, and you will earn individual points although matches are played in pairs.",
    inviteCalendarTitle: "Season calendar",
    inviteResultsTitle: "Results, confirmations and MVP",
    inviteResultsDescription: (confirmation, mvp) =>
      [confirmation, mvp].filter(Boolean).join(" "),
    invitePlayerActionsTitle: "Incidents and substitutions",
    invitePlayerActionsDescription: (incidents, substitutions) => {
      if (incidents && substitutions) {
        return "Players can report incidents and manage allowed substitutions before the match is finished."
      }
      if (incidents) {
        return "Players can report incidents for administrators to review."
      }
      return "The season allows substitutes and substitutions to be managed before the match is finished."
    },
    inviteCommitmentTitle: "Commitment and good faith",
    inviteCommitmentDescription:
      "Matches should be scheduled and played responsibly. Postponements are reserved for genuine reasons.",
    inviteGameRulesTitle: "Playing rules",
    inviteGameRulesDescription:
      "Star Point applies on the third deuce and a tie-break is played at 6-6. Games also count for standings tie-breakers.",
  },
  eu: {
    currentSeasonTitle: "Denboraldi honetako konfigurazioa",
    currentSeasonDescription:
      "Gida ikusten ari zaren denboraldiko arau aktiboetara egokitzen da.",
    appToolsTitle: "Aplikazioaren tresnak",
    appToolsDescription:
      "Funtzio hauek liga antolatzeko eta zure parte-hartzea jarraitzeko daude erabilgarri.",
    rosterFixedTitle: "Antolakuntzak prestatutako taldea",
    rosterFixedDescription: (capacity) =>
      capacity
        ? `Denboraldiak ${capacity} plaza ditu eta kontu bakoitzak prestatutako jokalari bat hartzen du.`
        : "Antolakuntzak taldea prestatzen du eta kontu bakoitzak erabilgarri dagoen jokalari bat hartzen du.",
    rosterSelfTitle: "Autoinskripzio bidezko taldea",
    rosterSelfDescription: (capacity, registrationOpen) => {
      const capacityText = capacity ? ` ${capacity} plaza bete arte` : ""
      return registrationOpen
        ? `Parte-hartzaileek gonbidapenetik plaza bat har dezakete${capacityText}.`
        : `Taldea autoinskripzioz sortu zen${capacityText}, baina izen-ematea itxita dago une honetan.`
    },
    calendarBalancedTitle: "Egutegi orekatua",
    calendarBalancedDescription:
      "Aplikazioak bikotekideak eta aurkariak modu orekatuan banatzen saiatzen da.",
    calendarManualTitle: "Eskuzko egutegia",
    calendarManualDescription:
      "Antolakuntzak zuzenean zehazten ditu bikoteak, aurkariak eta jardunaldiak.",
    scheduleSingleTitle: "Itzuli bakarra",
    scheduleSingleDescription: "Egutegiak parekatzeen itzuli oso bat erabiltzen du.",
    scheduleDoubleTitle: "Itzuli bikoitza",
    scheduleDoubleDescription: "Denboraldiak bigarren itzuli bat gehitzen du.",
    scheduleExtendedTitle: "Egutegi zabaldua",
    scheduleExtendedDescription:
      "Denboraldiak jardunaldi eta konbinazio gehiagoko egutegi zabaldua erabiltzen du.",
    roundWindowTitle: "Epea duten jardunaldiak",
    roundWindowDescription: (days) =>
      days
        ? `Jardunaldi bakoitzak ${days} egun ditu partidak osatzeko.`
        : "Jardunaldiek antolakuntzak zehaztutako epea dute.",
    roundWindowNoneTitle: "Epe automatikorik gabeko jardunaldiak",
    roundWindowNoneDescription:
      "Antolakuntzak eskuz aktibatzen, ixten eta ordenatzen ditu jardunaldiak.",
    threeSetsTitle: "Nahitaezko hiru set",
    threeSetsDescription:
      "Hiru set oso erregistratzen dira: 3-0 batek 3 puntu ematen ditu, eta 2-1 batek 2 puntu irabazleei eta 1 galtzaileei.",
    optionalSetsTitle: "Set malguak",
    optionalSetsDescription:
      "Irabazitako set bakoitzak puntu bat ematen du eta amaitutako eta gordetako setek soilik balio dute.",
    confirmationsRequiredTitle: "Emaitzen nahitaezko baieztapena",
    confirmationsRequiredDescription:
      "Parte-hartzaileek emaitza baieztatu behar dute sailkapenean finkatu aurretik.",
    confirmationsOptionalTitle: "Emaitzen aukerako baieztapena",
    confirmationsOptionalDescription:
      "Parte-hartzaileek emaitza baieztatu edo berrikusi dezakete, baina baieztapenak ez du lehiaketa geldiarazten.",
    confirmationsNoneTitle: "Baieztapenik gabeko emaitzak",
    confirmationsNoneDescription:
      "Erregistratutako emaitza jokalarien aparteko baieztapenik gabe aplikatzen da.",
    mvpAutomaticTitle: "MVP automatikoa",
    mvpAutomaticDescription:
      "Aplikazioak jardunaldiko MVP kalkulatzen du partidetan erregistratutako errendimenduarekin.",
    mvpVotingTitle: "MVP bozketa bidez",
    mvpVotingDescription:
      "Partidaren ondoren, parte-hartzaile bakoitzak beste jokalari bat bozkatzen du eta ezin du bere burua bozkatu.",
    registrationTitle: "Denboraldiko kuota",
    registrationDescription: (amount, purpose) =>
      purpose
        ? `Kuota ${amount} da jokalari bakoitzeko. Adierazitako helburua: ${purpose}.`
        : `Kuota aktiboa ${amount} da jokalari bakoitzeko eta ordainketa aplikazioan kontrola daiteke.`,
    incidentsTitle: "Partidako gorabeherak",
    incidentsDescription:
      "Jokalariek partidako arazoak jakinaraz ditzakete administrazioak berrikusi eta konpontzeko.",
    substitutionsTitle: "Ordezkoak eta ordezkapenak",
    substitutionsDescription:
      "Partida bakarreko ordezkapenak eta ordezkapen iraunkorrak onartzen dira. Puntuak eta estatistikak benetan jokatzen duenari dagozkio.",
    availabilityTitle: "Ohiko erabilgarritasuna",
    availabilityDescription:
      "Ezarri zure ohiko ordutegiak taldeak partida bakoitzerako data aurki dezan.",
    schedulingTitle: "Partiden programazioa",
    schedulingDescription:
      "Datak, orduak eta pistak partida bakoitzetik proposatzen edo editatzen dira baimenen arabera.",
    resultsTitle: "Emaitzak eta sailkapena",
    resultsDescription:
      "Gordetako setek eta jokoek banakako sailkapena, berdinketak eta estatistikak eguneratzen dituzte.",
    paymentsTitle: "Ordainketak eta erreserbak",
    paymentsWithFeeDescription:
      "Aplikazioak denboraldiko kuota, pista-erreserbak, pilotak eta parte-hartzaileen arteko ordainketak biltzen ditu.",
    paymentsWithoutFeeDescription:
      "Aplikazioak pista-erreserbak, pilotak eta parte-hartzaileen arteko ordainketak banatzeko aukera ematen du.",
    notificationsTitle: "Jakinarazpenak",
    notificationsDescription:
      "Erabiltzaile bakoitzak jaso nahi dituen abisuak aukeratzen ditu eta push jakinarazpenak gailu bakoitzean aktibatzen ditu.",
    activityTitle: "Jarduera eta historia",
    activityDescription:
      "Ligaren jarduerak aldaketa, emaitza, programazio eta ekintza garrantzitsuak gordetzen ditu zure sarbidearen arabera.",
    suggestionsTitle: "Iradokizunen postontzia",
    suggestionsDescription:
      "Ezarpenetatik hobekuntzak edo ideia berriak bidal ditzakezu eta zure proposamenen egoera kontsultatu.",
    spectatorsTitle: "Ikusleentzako sarbidea",
    spectatorsDescription:
      "Gonbidapen independente batek irakurtzeko sarbidea eman dezake jokalari-plazarik bete gabe.",
    inviteParticipationFixedTitle: "Zure plaza taldean",
    inviteParticipationFixedDescription: (capacity) =>
      capacity
        ? `Antolakuntzak ${capacity} plaza prestatu ditu. Arauak onartu ondoren zure jokalaria hartuko duzu eta puntuak banaka pilatuko dituzu, partidak bikoteka jokatu arren.`
        : "Arauak onartu ondoren prestatutako jokalari bat hartuko duzu eta puntuak banaka pilatuko dituzu, partidak bikoteka jokatu arren.",
    inviteParticipationSelfTitle: "Autoinskripzioa",
    inviteParticipationSelfDescription: (capacity) =>
      capacity
        ? `Jarraitzean ${capacity} plazetako bat beteko duzu zure profilarekin eta puntuak banaka pilatuko dituzu, partidak bikoteka jokatu arren.`
        : "Jarraitzean zure jokalari-plaza sortuko da profileko datuekin eta puntuak banaka pilatuko dituzu, partidak bikoteka jokatu arren.",
    inviteCalendarTitle: "Denboraldiko egutegia",
    inviteResultsTitle: "Emaitzak, baieztapenak eta MVP",
    inviteResultsDescription: (confirmation, mvp) =>
      [confirmation, mvp].filter(Boolean).join(" "),
    invitePlayerActionsTitle: "Gorabeherak eta ordezkapenak",
    invitePlayerActionsDescription: (incidents, substitutions) => {
      if (incidents && substitutions) {
        return "Jokalariek gorabeherak jakinarazi eta baimendutako ordezkapenak kudea ditzakete partida amaitu aurretik."
      }
      if (incidents) {
        return "Jokalariek gorabeherak jakinaraz ditzakete administrazioak berrikusteko."
      }
      return "Denboraldiak ordezkoak eta ordezkapenak kudeatzeko aukera ematen du partida amaitu aurretik."
    },
    inviteCommitmentTitle: "Konpromisoa eta fede ona",
    inviteCommitmentDescription:
      "Partidak arduraz programatu eta jokatu behar dira. Atzerapenak benetako arrazoietarako gordetzen dira.",
    inviteGameRulesTitle: "Joko-arauak",
    inviteGameRulesDescription:
      "Star Point hirugarren 40-40ean aplikatzen da eta tie-breaka 6-6an jokatzen da. Jokoek ere sailkapeneko berdinketak hausten dituzte.",
  },
}

function getCopy(locale: Locale) {
  return COPY[locale]
}

function getScheduleItem(settings: LeagueGuideSettings, copy: GuideCopy) {
  if (settings.scheduleMode === "double") {
    return {
      id: "schedule-mode",
      title: copy.scheduleDoubleTitle,
      description: copy.scheduleDoubleDescription,
    }
  }

  if (settings.scheduleMode === "extended") {
    return {
      id: "schedule-mode",
      title: copy.scheduleExtendedTitle,
      description: copy.scheduleExtendedDescription,
    }
  }

  return {
    id: "schedule-mode",
    title: copy.scheduleSingleTitle,
    description: copy.scheduleSingleDescription,
  }
}

function getConfirmationItem(settings: LeagueGuideSettings, copy: GuideCopy) {
  if (settings.resultConfirmationMode === "required") {
    return {
      id: "result-confirmations",
      title: copy.confirmationsRequiredTitle,
      description: copy.confirmationsRequiredDescription,
    }
  }

  if (settings.resultConfirmationMode === "optional") {
    return {
      id: "result-confirmations",
      title: copy.confirmationsOptionalTitle,
      description: copy.confirmationsOptionalDescription,
    }
  }

  return {
    id: "result-confirmations",
    title: copy.confirmationsNoneTitle,
    description: copy.confirmationsNoneDescription,
  }
}

function getMvpItem(settings: LeagueGuideSettings, copy: GuideCopy) {
  if (settings.mvpSystem === "voting") {
    return {
      id: "mvp-system",
      title: copy.mvpVotingTitle,
      description: copy.mvpVotingDescription,
    }
  }

  if (settings.mvpSystem === "automatic") {
    return {
      id: "mvp-system",
      title: copy.mvpAutomaticTitle,
      description: copy.mvpAutomaticDescription,
    }
  }

  return null
}

export function getLeagueGuideHeadings(locale: Locale) {
  const copy = getCopy(locale)

  return {
    currentSeasonTitle: copy.currentSeasonTitle,
    currentSeasonDescription: copy.currentSeasonDescription,
    appToolsTitle: copy.appToolsTitle,
    appToolsDescription: copy.appToolsDescription,
  }
}

export function buildSeasonConfigurationItems({
  settings,
  locale,
  registrationAmountLabel,
}: {
  settings: LeagueGuideSettings
  locale: Locale
  registrationAmountLabel: string
}): LeagueGuideItem[] {
  const copy = getCopy(locale)
  const hasRegistrationFee =
    settings.registrationFee.enabled && settings.registrationFee.amount > 0

  const items: LeagueGuideItem[] = [
    settings.rosterMode === "self_registration"
      ? {
          id: "roster-mode",
          title: copy.rosterSelfTitle,
          description: copy.rosterSelfDescription(
            settings.playerCapacity,
            settings.registrationOpen,
          ),
        }
      : {
          id: "roster-mode",
          title: copy.rosterFixedTitle,
          description: copy.rosterFixedDescription(settings.playerCapacity),
        },
    settings.calendarMode === "manual"
      ? {
          id: "calendar-mode",
          title: copy.calendarManualTitle,
          description: copy.calendarManualDescription,
        }
      : {
          id: "calendar-mode",
          title: copy.calendarBalancedTitle,
          description: copy.calendarBalancedDescription,
        },
    getScheduleItem(settings, copy),
    settings.roundWindowMode === "fixed-days"
      ? {
          id: "round-window",
          title: copy.roundWindowTitle,
          description: copy.roundWindowDescription(settings.roundWindowDays),
        }
      : {
          id: "round-window",
          title: copy.roundWindowNoneTitle,
          description: copy.roundWindowNoneDescription,
        },
    settings.requiresThreeSets
      ? {
          id: "scoring",
          title: copy.threeSetsTitle,
          description: copy.threeSetsDescription,
        }
      : {
          id: "scoring",
          title: copy.optionalSetsTitle,
          description: copy.optionalSetsDescription,
        },
    getConfirmationItem(settings, copy),
  ]

  const mvpItem = getMvpItem(settings, copy)
  if (mvpItem) items.push(mvpItem)

  if (hasRegistrationFee) {
    items.push({
      id: "registration-fee",
      title: copy.registrationTitle,
      description: copy.registrationDescription(
        registrationAmountLabel,
        settings.registrationFee.purpose.trim(),
      ),
    })
  }

  if (settings.allowPlayerIncidents) {
    items.push({
      id: "incidents",
      title: copy.incidentsTitle,
      description: copy.incidentsDescription,
    })
  }

  if (settings.allowPlayerSubstitutions) {
    items.push({
      id: "substitutions",
      title: copy.substitutionsTitle,
      description: copy.substitutionsDescription,
    })
  }

  return items
}

export function buildApplicationToolItems({
  settings,
  locale,
}: {
  settings: LeagueGuideSettings
  locale: Locale
}): LeagueGuideItem[] {
  const copy = getCopy(locale)
  const hasRegistrationFee =
    settings.registrationFee.enabled && settings.registrationFee.amount > 0

  return [
    {
      id: "availability",
      title: copy.availabilityTitle,
      description: copy.availabilityDescription,
    },
    {
      id: "scheduling",
      title: copy.schedulingTitle,
      description: copy.schedulingDescription,
    },
    {
      id: "results",
      title: copy.resultsTitle,
      description: copy.resultsDescription,
    },
    {
      id: "payments",
      title: copy.paymentsTitle,
      description: hasRegistrationFee
        ? copy.paymentsWithFeeDescription
        : copy.paymentsWithoutFeeDescription,
    },
    {
      id: "notifications",
      title: copy.notificationsTitle,
      description: copy.notificationsDescription,
    },
    {
      id: "activity",
      title: copy.activityTitle,
      description: copy.activityDescription,
    },
    {
      id: "suggestions",
      title: copy.suggestionsTitle,
      description: copy.suggestionsDescription,
    },
    {
      id: "spectators",
      title: copy.spectatorsTitle,
      description: copy.spectatorsDescription,
    },
  ]
}

export function buildInviteRuleItems({
  settings,
  locale,
  registrationAmountLabel,
}: {
  settings: LeagueGuideSettings
  locale: Locale
  registrationAmountLabel: string
}): LeagueGuideItem[] {
  const copy = getCopy(locale)
  const hasRegistrationFee =
    settings.registrationFee.enabled && settings.registrationFee.amount > 0
  const confirmationItem = getConfirmationItem(settings, copy)
  const mvpItem = getMvpItem(settings, copy)
  const scheduleItem = getScheduleItem(settings, copy)

  const calendarDescription = [
    settings.calendarMode === "manual"
      ? copy.calendarManualDescription
      : copy.calendarBalancedDescription,
    scheduleItem.description,
    settings.roundWindowMode === "fixed-days"
      ? copy.roundWindowDescription(settings.roundWindowDays)
      : "",
  ]
    .filter(Boolean)
    .join(" ")

  const items: LeagueGuideItem[] = [
    settings.rosterMode === "self_registration"
      ? {
          id: "invite-participation",
          title: copy.inviteParticipationSelfTitle,
          description: copy.inviteParticipationSelfDescription(
            settings.playerCapacity,
          ),
        }
      : {
          id: "invite-participation",
          title: copy.inviteParticipationFixedTitle,
          description: copy.inviteParticipationFixedDescription(
            settings.playerCapacity,
          ),
        },
    {
      id: "invite-calendar",
      title: copy.inviteCalendarTitle,
      description: calendarDescription,
    },
    settings.requiresThreeSets
      ? {
          id: "invite-scoring",
          title: copy.threeSetsTitle,
          description: copy.threeSetsDescription,
        }
      : {
          id: "invite-scoring",
          title: copy.optionalSetsTitle,
          description: copy.optionalSetsDescription,
        },
  ]

  if (hasRegistrationFee) {
    items.push({
      id: "invite-registration",
      title: copy.registrationTitle,
      description: copy.registrationDescription(
        registrationAmountLabel,
        settings.registrationFee.purpose.trim(),
      ),
    })
  }

  if (settings.resultConfirmationMode !== "none" || mvpItem) {
    items.push({
      id: "invite-results",
      title: copy.inviteResultsTitle,
      description: copy.inviteResultsDescription(
        settings.resultConfirmationMode === "none"
          ? ""
          : confirmationItem.description,
        mvpItem?.description ?? "",
      ),
    })
  }

  if (settings.allowPlayerIncidents || settings.allowPlayerSubstitutions) {
    items.push({
      id: "invite-player-actions",
      title: copy.invitePlayerActionsTitle,
      description: copy.invitePlayerActionsDescription(
        settings.allowPlayerIncidents,
        settings.allowPlayerSubstitutions,
      ),
    })
  }

  items.push(
    {
      id: "invite-commitment",
      title: copy.inviteCommitmentTitle,
      description: copy.inviteCommitmentDescription,
    },
    {
      id: "invite-game-rules",
      title: copy.inviteGameRulesTitle,
      description: copy.inviteGameRulesDescription,
    },
  )

  return items
}
