export const es = {
  common: {
    appName: "Smash & Lob",
    season: "Temporada",
    privateLeague: "Liga privada de pádel",
    individualRanking: "Ranking individual",
    pointsShort: "pts",
    back: "Volver",
    backToMatches: "← Volver a partidos",
    versus: "vs",
    save: "Guardar",
    saving: "Guardando...",
    cancel: "Cancelar",
    retry: "Volver a comprobar",
    active: "Seleccionado",
    finishedSeasonBadge: "Terminada",
  },

  auth: {
    subtitle: "Liga privada",
    title: "Smash & Lob",
    description:
      "Entra con Google para acceder a tus ligas, partidos y resultados.",
    signInWithGoogle: "Entrar con Google",
    signOut: "Cerrar sesión",
    loadingTitle: "Comprobando sesión",
    loadingDescription: "Estamos preparando tu acceso.",
    pendingTitle: "Usuario pendiente de invitación",
    pendingDescription:
      "Tu cuenta de Google todavía no está vinculada a un jugador de esta liga. Pide al administrador que añada tu email.",
  },

  onboarding: {
    title: "Elige cómo empezar",
    description:
      "Tu cuenta de Google está lista. Ahora crea una liga o entra en una invitación existente.",
    createTitle: "Crear nueva liga",
    createDescription:
      "Crea una liga nueva con su primera temporada y sus jugadores iniciales.",
    createAction: "Crear liga",
    joinTitle: "Unirme a liga existente",
    joinDescription:
      "Introduce el código que te ha pasado el administrador de la liga.",
    joinAction: "Validar invitación",
  },

  invites: {
    subtitle: "Invitación privada",
    title: "Unirme a una liga",
    description:
      "Confirma la liga y reclama el jugador que te corresponde dentro de ella.",
    loadingDescription:
      "Comprobando invitación y cargando la liga desde la base de datos.",
    checkingCode: "Comprobando código",
    checkingCodeDescription:
      "Estamos buscando la liga asociada a esta invitación.",
    codeLabel: "Código de invitación",
    codePlaceholder: "SL-8KQ4-P7M2-X9RA",
    invalidCode: "Código inválido.",
    leagueNotFound: "Liga no encontrada.",
    notFoundTitle: "Invitación no encontrada",
    notFoundDescription:
      "Revisa el enlace o pide al administrador un código nuevo.",
    foundLeague: "Liga encontrada",
    closedMode: "Modo cerrado: jugadores predefinidos por el admin.",
    openMode: "Modo abierto preparado para más adelante.",
    activeSeasonTitle: "Temporada activa",
    activeSeasonDescription:
      "Solo se pueden reclamar jugadores que pertenecen a la temporada activa.",
    finishedSeasonTitle: "Temporada finalizada",
    finishedSeasonDescription:
      "La temporada está cerrada, pero todavía puedes vincular tu cuenta a uno de sus jugadores pendientes.",
    noActiveSeasonTitle: "Sin temporada activa",
    noActiveSeasonDescription:
      "La liga está pendiente de que el administrador cree una nueva temporada.",
    claimTitle: "Reclama tu jugador",
    claimDescription:
      "Elige quién eres en esta liga. Solo podrás reclamar un jugador por liga.",
    claimActiveDescription:
      "Estos son los jugadores pendientes de vincular en la temporada activa.",
    claimFinishedDescription:
      "Estos son los jugadores de la temporada cerrada que todavía no tienen una cuenta vinculada.",
    claimableActivePlayers: "Jugadores pendientes en la temporada activa",
    claimableFinishedPlayers: "Jugadores pendientes en la temporada finalizada",
    selectedPlayer: "Jugador seleccionado",
    inactivePlayersHidden:
      "Los jugadores de temporadas anteriores no aparecen aquí para evitar reclamaciones equivocadas.",
    selectPlayerError: "Selecciona un jugador para continuar.",
    playerAlreadyClaimed: "Jugador ya reclamado.",
    alreadyInLeague: "Ya perteneces a esta liga.",
    alreadyInLeagueDescription:
      "Tu cuenta ya tiene un jugador vinculado en esta liga.",
    noPlayersAvailable: "No quedan jugadores sin reclamar en esta temporada.",
    confirmClaim: "Confirmar y entrar",
    claiming: "Guardando...",
    enterLeague: "Entrar en la liga",
    accessDenied: "No tienes permisos para ver esta liga.",
    warningTitle: "Aviso de invitación",
    acceptRulesError:
      "Debes confirmar el reglamento antes de vincular tu cuenta a la temporada.",
    stepsCode: "Código",
    stepsRules: "Reglas",
    stepsPlayer: "Jugador",
    rulesEyebrow: "Reglas de la liga",
    rulesTitle: "Confirma el reglamento antes de reclamar jugador",
    rulesDescription:
      "La cuenta no se vinculará a ningún jugador hasta que aceptes este resumen de normas y compromisos.",
    acceptRulesLabel: "He leído y acepto el reglamento de la temporada.",
    acceptRulesBeforeSelect:
      "Confirma primero el reglamento para poder seleccionar tu jugador.",
    rules: {
      registrationTitle: "Inscripción antes del inicio",
      registrationFallbackAmount: "la cuota definida por la organización",
      registrationAmountPrefix: "Debes abonar",
      registrationAmountSuffix:
        "antes de que comience esta temporada. La app permite a la organización marcar el pago como realizado.",
      registrationNoAmount:
        "Si la organización activa una cuota de inscripción, deberás abonarla antes de que comience esta temporada.",
      registrationPurposePrefix: "Destino:",
      individualTitle: "Liga individual, partidos por parejas",
      individualDescription:
        "Reclamas tu jugador y sumas tus propios puntos, aunque cada partido se juegue en pareja.",
      calendarTitle: "Calendario equilibrado",
      calendarDescription:
        "La temporada busca que todos jueguen con todos y contra todos respetando el orden de jornadas.",
      scoringTitle: "Puntuación por sets",
      scoringThreeSets:
        "Se juegan 3 sets obligatorios: un 3-0 reparte 3 puntos y un 2-1 reparte 2 puntos a la pareja ganadora y 1 a la perdedora.",
      scoringOptionalSets:
        "Cada set ganado suma 1 punto. Si no se exigen 3 sets, solo cuentan los sets jugados y guardados.",
      commitmentTitle: "Compromiso y buena fe",
      commitmentDescription:
        "Los partidos están pensados para reservas de 2 horas. Si hay lesión o problema real de agenda, se recoloca sin bloquear la liga.",
      substitutesTitle: "Suplentes y reemplazos",
      substitutesDescription:
        "La organización puede asignar un suplente a un único partido o hacer un reemplazo permanente desde una jornada. Los puntos, MVP, confirmaciones y pagos corresponden siempre a quien juega realmente; el titular ausente no hereda esos puntos.",
      gameRulesTitle: "Normas de juego",
      gameRulesDescription:
        "Se juega con Star Point y tie-break a 6-6. Los juegos también importan porque desempatan el ranking.",
    },
    timeoutError:
      "La comprobación del código ha tardado demasiado. Revisa la conexión y vuelve a intentarlo.",
    genericError:
      "No se ha podido comprobar la invitación. Vuelve a intentarlo o pide un nuevo enlace al administrador.",
  },

  appHeader: {
    leagueSelectorLabel: "Seleccionar liga",
    settingsLabel: "Ajustes",
  },

  courtBooking: {
    expand: "Ver pagos",
    collapse: "Ocultar pagos",
    pendingPaymentSingular: "pago pendiente",
    pendingPaymentPlural: "pagos pendientes",
  },

  payments: {
    economyTitle: "Resumen económico",
    expandEconomy: "Ver resumen económico",
    collapseEconomy: "Ocultar resumen económico",
    scopeLabel: "Periodo",
    allLeague: "Toda la liga",
    recordedSpend: "Gasto registrado",
    yourEstimatedShare: "Tu parte estimada",
    matchesWithCosts: "partidos con gastos",
    matchShareAndFees: "Partidos e inscripción",
    courts: "Pistas",
    balls: "Bolas",
    registrationFees: "Cuotas de inscripción",
    collectedOf: "cobrados de",
    paid: "Pagado",
    pending: "Pendiente",
    economyNote:
      "Los gastos de pista y bolas se reparten entre quienes jugaron cada partido. Las cuotas se muestran aparte para no contar dos veces dinero que puede usarse después para cubrir esos gastos.",
  },

  nav: {
    home: "Inicio",
    ranking: "Ranking",
    matches: "Calendario",
    activity: "Actividad",
    player: "Jugador",
    profile: "Perfil",
    account: "Cuenta",
  },

  dashboard: {
    winner: "Ganador",
    seasonWinner: "Ganador de {seasonName}",
    finalChampion: "Campeón final de la liga",
    leader: "Líder",
    rounds: "Jornadas",
    regularLeague: "Liga regular",
    rankingTitle: "Clasificación",
    viewAll: "Ver todo",
    lastMatch: "Último partido",
    nextMatch: "Próximo partido",
    addSchedule: "Añadir fecha, hora y lugar",
    playersCanSchedule:
      "Los jugadores del partido podrán completar la programación.",
    closedSeasonTitle: "Temporada cerrada",
    closedSeasonHistoricalDescription:
      "Estás viendo el histórico de {seasonName}. La liga queda pendiente de crear una nueva temporada activa.",
    closedSeasonDescription:
      "La liga no tiene una temporada activa ahora mismo. Puedes consultar el histórico hasta que se cree una nueva.",
    createSeason: "Crear nueva temporada",
  },

  ranking: {
    subtitle: "Clasificación general",
    closedSeasonHistoricalDescription:
      "Este ranking queda como histórico de {seasonName}.",
    description:
      "Ordenado por PTS, diferencia de juegos y juegos a favor en caso de empate.",
    gamesDiff: "Dif. juegos",
    gamesFor: "Juegos a favor",
    gamesAgainst: "Juegos en contra",
    diff: "Dif.",
    forShort: "JF",
    againstShort: "JC",
  },

  rounds: {
    officialWindow: "Ventana oficial de jornada",
    from: "Del",
    to: "al",
    noSpecificWindow: "Sin margen específico para esta jornada",
    statusNoWindow: "Sin margen",
    statusUpcoming: "Próxima",
    statusActive: "En curso",
    statusOverdue: "Fuera de plazo",
    statusCompleted: "Completada",
    outsideWindowTitle: "Fuera de la ventana de jornada",
    outsideWindowDescription:
      "La fecha elegida está fuera del margen configurado para esta jornada. Se permite guardar, pero queda marcado como caso a revisar.",
    postponedWindowWarning:
      "Aplazado: las fechas previstas de esta jornada no se van a cumplir.",
    postponedWindowTitle: "Fechas de jornada no cumplidas",
    postponedWindowDescription:
      "Este partido está aplazado, así que la jornada queda pendiente fuera de sus fechas previstas hasta que se reprograme.",
  },

  matches: {
    subtitle: "Calendario de liga",
    description:
      "Jornadas fijas creadas por el admin. Los jugadores programan fecha, hora y lugar.",
    round: "Jornada",
    finished: "Finalizado",
    scheduled: "Programado",
    unscheduled: "Sin programar",
    postponed: "Aplazado",
    inProgress: "En juego",
    resultPending: "Pendiente resultado",
    played: "Jugado",
    pendingPlay: "Pendiente de jugar",
    pendingDate: "Pendiente de fecha",
    pendingReschedule: "Pendiente de nueva fecha",
    missingSchedule: "Falta añadir hora, fecha y lugar",
    needsReschedule: "Hay que reprogramar este partido",
    closedSeasonHistoricalDescription:
      "Estos son los partidos históricos de {seasonName}.",
    scopeAll: "Todos",
    scopeMineShort: "Míos",
    noMatches: "No hay partidos en esta temporada.",
  },

  matchDetail: {
    title: "Partido",
    notFound: "Partido no encontrado",
    teamA: "Pareja A",
    teamB: "Pareja B",
    set: "Set",
    schedule: "Programación",
    scheduleDescription: "Fecha, hora y lugar acordados para este partido.",
    addScheduleTitle: "Añadir programación",
    addScheduleDescription:
      "Selecciona la fecha, la hora y el lugar del partido.",
    postponedTitle: "Partido aplazado",
    postponedDescription:
      "Este partido sigue pendiente y necesita una nueva fecha.",
    noScheduleDescription:
      "El partido está pendiente de programar una nueva fecha y lugar.",
    pendingSchedule: "Pendiente de fecha, hora y lugar",
    pendingScheduleDescription:
      "Los jugadores del partido deberán completar estos datos cuando lo acuerden.",
    addScheduleButton: "Añadir programación",
    gamesA: "Juegos A",
    gamesB: "Juegos B",
    pointsA: "Puntos A",
    pointsB: "Puntos B",
    editSchedule: "Editar programación",
    editScheduleButton: "Editar",
    postponeButton: "Aplazar partido",
    clearScheduleButton: "Quitar programación",
    clearScheduleConfirm:
      "¿Seguro que quieres quitar la programación? El partido volverá a quedar sin fecha, hora ni lugar.",
    clearScheduleError:
      "No se ha podido quitar la programación. Revisa Supabase o el valor smash-lob-last-supabase-error.",
    clearingSchedule: "Quitando...",
    rescheduleButton: "Reprogramar",
    scheduleFormDescription:
      "Añade o modifica la fecha, hora y lugar del partido.",
    scheduleDateLabel: "Fecha y hora",
    scheduleLocation: "Lugar",
    scheduleLocationPlaceholder: "Selecciona un lugar",
    scheduleCourt: "Pista",
    scheduleCourtPlaceholder: "Selecciona pista",
    otherLocation: "Otro",
    customLocation: "Ubicación en Maps",
    customLocationPlaceholder:
      "Ejemplo: Polideportivo de Lasesarre, Barakaldo o URL de Maps",
    checkAddressButton: "Comprobar dirección",
    closePanel: "Cerrar",
    saving: "Guardando...",
    substitutionsTitle: "Sustituciones",
    substitutionsOptional: "Opcional",
    substitutionsDescription:
      "Sustituye a un titular solo en este partido. Los puntos, el MVP, las confirmaciones y los pagos corresponderán a quien juegue realmente.",
    substitutionsLoadError: "No se han podido cargar los suplentes.",
    substitutionsForbidden: "No tienes permiso para gestionar este partido.",
    substitutionsStarterCannotSubstitute:
      "Un titular de la temporada no puede actuar como suplente.",
    substitutionsAlreadyInMatch: "Ese suplente ya participa en el partido.",
    substitutionsUnavailable:
      "Ese jugador ya no está disponible en la bolsa de suplentes.",
    substitutionsSlotAlreadyReplaced:
      "Ese puesto del partido ya tiene una sustitución aplicada.",
    substitutionsFinishedLocked:
      "No se puede cambiar una sustitución después de registrar el resultado.",
    substitutionsSaveError: "No se ha podido guardar la sustitución.",
    substitutionsUndoError: "No se ha podido deshacer la sustitución.",
    substituteFallbackName: "Suplente",
    starterFallbackName: "titular",
    substituteForPrefix: "Por",
    substitutionPermanent: "permanente",
    substitutionThisMatch: "este partido",
    substitutionUndo: "Deshacer",
    substitutionOriginalPlaceholder: "Titular que no puede jugar",
    substitutionSelectPlaceholder: "Selecciona suplente",
    substitutionAddNew: "Añadir un suplente nuevo",
    substitutionNewNamePlaceholder: "Nombre del nuevo suplente",
    substitutionSavedToPool:
      "Quedará guardado también en la bolsa de suplentes.",
    substitutionAssign: "Asignar a este partido",
    directionsButton: "Cómo llegar",
    schedulePlaceholderDate: "Ejemplo: Viernes, 20:00",
    schedulePlaceholderLocation: "Ejemplo: Club Pádel Norte",
    saveSchedule: "Guardar programación",
    saveScheduleChanges: "Guardar cambios",
    cancelScheduleEdit: "Cancelar",
    calendarFutureDescription:
      "Más adelante añadiremos un botón para añadir este partido al calendario.",
  },

  matchResult: {
    title: "Registrar resultado",
    description:
      "Introduce los tres sets del partido. La app calculará automáticamente los puntos de cada pareja.",
    optionalSetsDescription:
      "Introduce los sets jugados. Los sets vacíos se ignorarán al guardar.",
    editTitle: "Editar resultado",
    editDescription:
      "Corrige los sets del partido. El ranking se recalculará automáticamente al guardar.",
    registeredTitle: "Resultado registrado",
    registeredDescription:
      "El partido ya está finalizado. Puedes editar el resultado si se ha introducido mal.",
    editButton: "Editar resultado",
    set: "Set",
    teamA: "Pareja A",
    teamB: "Pareja B",
    invalidSet: "Set no válido. Usa marcadores tipo 6-0, 6-4, 7-5 o 7-6.",
    save: "Guardar resultado",
    update: "Guardar cambios",
    cancelEdit: "Cancelar",
    pendingScheduleTitle: "Resultado pendiente",
    pendingScheduleDescription:
      "Programa el partido antes de registrar el resultado.",
    postponedTitle: "Resultado bloqueado",
    postponedDescription:
      "Reprograma el partido aplazado antes de registrar el resultado.",
  },

  profile: {
    title: "Mi perfil",
    subtitle: "Usuario actual",
    description: "Tus estadísticas como jugador dentro de la temporada activa.",
    notFound: "No se ha encontrado el jugador asociado al usuario actual.",
    points: "Puntos",
    seasonSummary: "Resumen de temporada",
    matchesPlayed: "Partidos",
    wins: "Victorias",
    losses: "Derrotas",
    myMatches: "Mis partidos",
    nextMatch: "Próximo partido",
    recentResults: "Últimos resultados",
    noUpcomingMatches: "No tienes partidos pendientes ahora mismo.",
    noRecentResults: "Todavía no tienes resultados registrados.",
    matchHistoryTitle: "Historial de partidos",
    matchHistoryDescription:
      "Consulta todos tus partidos de la temporada y filtra por estado.",
    matchHistoryPageDescription:
      "Todos tus partidos de la temporada activa, con filtros rápidos por estado.",
    filteredMatches: "Partidos",
    noFilteredMatches: "No hay partidos con este filtro.",
    filterLabel: "Mostrar",
    filterAll: "Todos",
    filterFinished: "Jugados",
    filterPending: "Pendientes",
    filterScheduled: "Programados",
    filterUnscheduled: "Sin programar",
    filterPostponed: "Aplazados",
    placeholderTitle: "Perfil pendiente de conectar",
    placeholderDescription:
      "De momento usaremos un jugador falso como usuario actual. Más adelante se conectará con el login real.",
  },

  playerProfile: {
    backToRanking: "← Volver al ranking",
    notFound: "Jugador no encontrado",
    description:
      "Estadísticas públicas del jugador dentro de la temporada seleccionada.",
    scopeSelectorTitle: "Temporada",
    scopeSelectorDescription:
      "Elige una temporada concreta o consulta el total histórico del jugador.",
    seasonStats: "Estadísticas de temporada",
    playerMatches: "Partidos del jugador",
    matchHistoryDescription:
      "Consulta todos sus partidos de la temporada y filtra por estado.",
    matchHistoryPageDescription:
      "Todos sus partidos de la temporada seleccionada, con filtros rápidos por estado.",
    futureTitle: "Historial y tendencias",
    futureDescription:
      "Más adelante aquí se mostrarán mejores parejas, rivales más frecuentes y evolución del ranking.",
  },

  playerStats: {
    title: "Estadísticas avanzadas",
    subtitle: "Rendimiento de temporada",
    winRate: "Victorias",
    record: "balance",
    setsBalance: "Balance de sets",
    gamesBalance: "Juegos",
    mvpWon: "MVPs ganados",
    wonPercentage: "ganados",
    forPercentage: "a favor",
    bestPartner: "Mejor compañero",
    toughestRival: "Rival más duro",
    bestRound: "Mejor jornada",
    roundShort: "J",
    toughestRound: "Jornada más dura",
    showDetails: "Mostrar",
    hideDetails: "Ocultar",
  },

  help: {
    title: "Ayuda y conceptos básicos",
    description: "Una guía rápida para jugadores nuevos de la liga.",
    fullDescription:
      "Guía rápida para entender el formato de la liga, la puntuación, los estados de los partidos y los MVPs.",
    quickSummaryEyebrow: "Resumen rápido",
    quickSummaryTitle: "Lo importante de un vistazo",
    quickSummaryDescription:
      "Smash & Lob está pensada para crear ligas individuales aunque los partidos se jueguen por parejas. La clasificación premia la regularidad durante toda la temporada.",
    summaryOwnPointsTitle: "Cada jugador suma sus propios puntos",
    summaryOwnPointsDescription:
      "La app organiza una clasificación individual a partir de partidos jugados por parejas rotativas.",
    summarySetsTitle: "Los sets son la base del ranking",
    summarySetsThree:
      "Un 3-0 reparte 3 puntos a la pareja ganadora. Un 2-1 reparte 2 puntos a la ganadora y 1 a la perdedora.",
    summarySetsOptional:
      "Cada set ganado suma 1 punto a cada jugador de la pareja que lo gana. Si se juegan menos de 3 sets, solo cuentan los sets guardados.",
    summaryGamesTitle: "Los juegos ayudan a desempatar",
    summaryGamesDescription:
      "Si dos jugadores empatan a puntos, cuentan los juegos ganados, perdidos y la diferencia de juegos.",
    tipsEyebrow: "Tips",
    tipsTitle: "Tips / recomendaciones",
    tipsIntro:
      "Lo ideal es reservar 10/15 minutos antes del partido para entrar en ritmo, calentar bien y empezar con sensaciones reales de juego.",
    tipsParallelTitle: "Peloteo en paralelo",
    tipsParallelDescription:
      "Cada jugador pelotea con el contrincante que tiene enfrente, sin cruzar bolas con la otra diagonal.",
    tipsBackCourtTitle: "Fondo de pista",
    tipsBackCourtDescription:
      "Empezad con unos minutos desde el fondo, ambos buscando control, profundidad y ritmo.",
    tipsNetDefenseTitle: "Red y defensa",
    tipsNetDefenseDescription:
      "Un jugador sube a red y trabaja ataque mientras el contrincante defiende desde el fondo. Después se cambian posiciones.",
    tipsHighBallsTitle: "Bolas altas y remates",
    tipsHighBallsDescription:
      "Dedicad unos minutos a globos, víboras, bandejas y remates, cambiando posiciones para que todos pasen por cada rol.",
    tipsBeforeServeTitle: "Antes del saque",
    tipsBeforeServeDescription:
      "Hidratación, se decide el sacador jugando un punto en el que todos tocan la bola al menos una vez, y empieza el partido.",
    registrationEyebrow: "Inscripción",
    registrationTitle: "Inscripción, fianza y material",
    registrationFallbackAmount: "Es el importe definido por la organización",
    registrationFeeTitle: "Cuota de temporada",
    registrationFeeDescriptionSuffix:
      "por persona. Si la temporada tiene cuota activa, la app permite controlar quién la tiene pagada.",
    registrationFundTitle: "Fondo y fianza",
    registrationFundDescription:
      "La cuota funciona como fondo de compromiso para cubrir premios y gastos comunes. El sobrante se puede reservar para la clausura o devolver al final.",
    registrationBallsTitle: "Bolas nuevas",
    registrationBallsDescription:
      "La referencia recomendada es estrenar un bote de bolas nuevo en cada partido.",
    registrationPurposePrefix: "Destino indicado por la organización:",
    formatEyebrow: "Formato",
    formatTitle: "Cómo funciona una temporada",
    formatRotatingPairsTitle: "Parejas rotativas",
    formatRotatingPairsDescription:
      "La temporada intenta que todos jueguen con todos y contra todos de forma equilibrada.",
    formatRoundsTitle: "Jornadas",
    formatRoundsDescription:
      "Cada jornada contiene los partidos que tocan según el calendario de la temporada. Lo ideal es respetar el orden y las fechas acordadas por la organización.",
    formatRankingTitle: "Clasificación individual",
    formatRankingDescription:
      "Aunque juegues en pareja, los puntos se suman a cada jugador por separado.",
    formatCourtBookingTitle: "Reserva de pista",
    formatCourtBookingDescription:
      "El formato está pensado para exprimir una reserva de 2 horas, incluyendo calentamiento, partido e hidratación.",
    formatGoodFaithTitle: "Buena fe y aplazamientos",
    formatGoodFaithDescription:
      "Si hay vacaciones, lesión o un problema real de agenda, el partido se recoloca intentando no bloquear el calendario.",
    injuriesEyebrow: "Suplentes",
    injuriesTitle: "Bolsa, sustituciones y reemplazos",
    injuriesRealTitle: "Bolsa de suplentes",
    injuriesRealDescription:
      "La organización puede mantener una bolsa opcional y añadir perfiles durante la temporada. Un suplente creado desde un partido queda guardado en esa bolsa.",
    injuriesAgreedTitle: "Quién puede gestionarlos",
    injuriesAgreedDescription:
      "Los jugadores del partido, administradores y creador pueden gestionar una sustitución puntual mientras el encuentro no esté finalizado.",
    injuriesSingleTitle: "Sustitución puntual",
    injuriesSingleDescription:
      "Cambia a un titular solo en ese partido, manteniendo su pareja y posición. Puede deshacerse antes de registrar el resultado.",
    injuriesPermanentTitle: "Reemplazo permanente",
    injuriesPermanentDescription:
      "Se aplica desde una jornada concreta. El saliente conserva su histórico y aparece como baja; el entrante pasa a titular y comienza desde cero.",
    injuriesNoInheritedTitle: "Puntos de quien juega",
    injuriesNoInheritedDescription:
      "Los puntos, estadísticas, MVP, confirmaciones y pagos corresponden al suplente que disputa el partido. El titular ausente no recibe esos puntos.",
    injuriesHistoryNote:
      "Las etiquetas del calendario, del partido y del ranking identifican los cambios. La administración conserva el historial de sustituciones y reemplazos.",
    scoringEyebrow: "Puntuación",
    scoringTitle: "Cómo se suman los puntos",
    scoringThreeNilLabel: "Partido 3-0",
    scoringThreeNilValue: "3 puntos para cada jugador de la pareja ganadora",
    scoringTwoOneLabel: "Partido 2-1",
    scoringTwoOneValue:
      "2 puntos para la pareja ganadora y 1 para la perdedora",
    scoringEachSetLabel: "Cada set ganado",
    scoringEachSetValue:
      "1 punto para cada jugador de la pareja que gana ese set",
    scoringPlayedSetsLabel: "Sets jugados",
    scoringPlayedSetsValue:
      "Solo cuentan los sets completados y guardados en el resultado",
    scoringTiebreakLabel: "Desempates",
    scoringTiebreakValue:
      "Primero puntos, después juegos y diferencia de juegos",
    scoringThreeSetsNote:
      "El ranking mide sets ganados por jugador. Por eso incluso perdiendo un partido puedes sumar si peleas un set.",
    scoringOptionalSetsNote:
      "El ranking mide sets ganados por jugador. Si el partido se cierra antes de tres sets, la clasificación se calcula con los sets realmente jugados.",
    scoringIncompleteSetNote:
      "Si el tiempo de pista termina con el tercer set incompleto, la app no reparte medios puntos de forma automática. La organización debe decidir si se termina el set, se aplaza el cierre del partido o se aplica un ajuste manual fuera del resultado guardado.",
    keyRuleEyebrow: "Regla clave",
    keyRuleThreeSetsTitle: "Por qué se juegan siempre 3 sets",
    keyRuleOptionalSetsTitle: "Qué pasa si no se exigen 3 sets",
    keyRuleThreeSetsIntro:
      "Jugar siempre 3 sets hace que todos los partidos repartan el mismo volumen de puntos y juegos. Así la clasificación es más justa y comparable.",
    keyRuleOptionalSetsIntro:
      "En esta temporada no es obligatorio completar tres sets. La app permite guardar únicamente los sets jugados y calcula la clasificación con esos datos.",
    keyRuleFairTitle: "Más justo",
    keyRuleFairDescription:
      "Todos los jugadores compiten por la misma cantidad de sets.",
    keyRuleEmotionTitle: "Más emoción",
    keyRuleEmotionDescription:
      "Aunque una pareja pierda los dos primeros sets, el tercero todavía cuenta.",
    keyRuleConsistencyTitle: "Menos castigo por un mal set",
    keyRuleConsistencyDescription:
      "La regularidad pesa más que un inicio malo o un bajón puntual.",
    keyRuleFlexTitle: "Más flexible",
    keyRuleFlexDescription:
      "Si falta tiempo o el partido termina antes, se pueden registrar solo los sets completados.",
    keyRuleSetPointsTitle: "Puntos por set",
    keyRuleSetPointsDescription:
      "Cada set ganado suma 1 punto individual para los dos jugadores de la pareja.",
    keyRuleGamesTiebreakTitle: "Desempates con juegos",
    keyRuleGamesTiebreakDescription:
      "Los juegos guardados siguen ayudando a ordenar la clasificación cuando hay empate a puntos.",
    matchesEyebrow: "Partidos",
    matchesTitle: "Estados de un partido",
    matchesUnscheduledLabel: "Sin fecha",
    matchesUnscheduledValue:
      "El partido existe, pero todavía no está cerrado cuándo se juega",
    matchesScheduledLabel: "Programado",
    matchesScheduledValue: "Tiene fecha, hora o lugar asignado",
    matchesPostponedLabel: "Aplazado",
    matchesPostponedValue: "Se ha marcado como pendiente de recolocar",
    matchesFinishedLabel: "Finalizado",
    matchesFinishedValue: "Ya tiene resultado registrado",
    padelEyebrow: "Pádel",
    padelTitle: "Star Point y tie-break",
    padelStarPointTitle: "Star Point",
    padelStarPointDescription:
      "No es punto de oro directo en cada 40-40. En los dos primeros 40-40 se juega con el sistema clásico de ventajas. Si el juego llega a un tercer 40-40, se juega un punto decisivo: quien gana ese punto, gana el juego.",
    padelTieBreakWhenTitle: "Cuándo se juega el tie-break",
    padelTieBreakWhenDescription:
      "Si el set llega a 6-6, se juega un tie-break para decidir quién gana ese set. En la app se apunta como 7-6 para la pareja ganadora.",
    padelTieBreakServeTitle: "Desde dónde se saca",
    padelTieBreakServeDescription:
      "Empieza sacando el jugador al que le toque por el orden normal de saque. Ese primer punto se saca desde el lado derecho. Después, el siguiente jugador saca dos puntos: primero desde el lado izquierdo y luego desde el derecho.",
    padelServeRotationTitle: "Cómo rota el saque",
    padelServeRotationDescription:
      "Tras el primer punto, cada jugador saca dos puntos seguidos, manteniendo el orden normal de saque entre las cuatro personas. En cada turno de dos puntos se alterna izquierda y derecha.",
    padelSideChangesTitle: "Cambios de lado",
    padelSideChangesDescription:
      "Las parejas cambian de lado cada 6 puntos jugados: por ejemplo 3-3, 6-0, 6-6, 9-3. También se cambia de lado al terminar el tie-break si corresponde por el orden del partido.",
    padelHowToWinTitle: "Cómo se gana",
    padelHowToWinDescription:
      "Gana la primera pareja que llega a 7 puntos con al menos 2 de diferencia. Si queda 6-6, se sigue jugando hasta que alguien gane por dos: 8-6, 9-7, 10-8, etc.",
    mvpEyebrow: "MVP",
    mvpTitle: "Cómo funcionan los MVP",
    mvpDescription:
      "El MVP de jornada se calcula automáticamente cuando todos los partidos de esa jornada están terminados. Se premian las victorias más contundentes, dando prioridad a los sets ganados y después a la diferencia de juegos.",
    mvpTip:
      "Un 3-0 con mucha diferencia de juegos suele ser el resultado más fuerte. Si hay empate real, la app puede mostrar MVP compartido. El MVP de temporada sale de los MVPs de jornada acumulados.",
    starPointsTitle: "Star Points",
    starPointsDescription:
      "El Star Point es un punto decisivo que se juega cuando un juego llega a 40-40. En vez de seguir con ventajas, se juega un único punto: quien gana ese punto, gana el juego.",
    starPointsTip:
      "Antes de sacar, la pareja que resta elige el lado en el que quiere recibir. Después se juega el punto normal y el resultado se apunta como cualquier otro juego.",
    tieBreakTitle: "Tie-breaks",
    tieBreakDescription:
      "El tie-break se juega cuando un set llega a 6-6. Gana el primer lado que llegue a 7 puntos con diferencia mínima de 2 puntos. Si queda 6-6 en el tie-break, se continúa hasta que alguien saque dos puntos de ventaja.",
    tieBreakTip:
      "En el resultado del set se registra como 7-6 para la pareja que gana el tie-break. No hace falta guardar el detalle de puntos del tie-break en la app.",
    threeSetsTitle: "Por qué se juegan siempre 3 sets",
    threeSetsDescription:
      "En esta liga se juegan los 3 sets de forma obligatoria para que todos los partidos repartan la misma cantidad de sets y oportunidades. Así la clasificación individual es más justa: una pareja puede perder el partido, pero seguir peleando el tercer set para sumar puntos, mejorar diferencia de juegos y mantener emoción hasta el final.",
    threeSetsBalance:
      "Este formato reduce el peso de un mal set, premia la regularidad y hace que cada jornada aporte información comparable al ranking, porque todos los jugadores compiten por el mismo volumen de sets y juegos.",
    futureTitle: "Más adelante",
    futureDescription:
      "Esta sección podrá ampliarse con más reglas, dudas frecuentes y conceptos para nuevos jugadores.",
  },

  leagues: {
    activeLeague: "Liga activa",
  },

  settings: {
    title: "Ajustes",
    description: "Gestiona tus preferencias de la aplicación.",
    helpTitle: "Ayuda y conceptos básicos",
    helpDescription:
      "Consulta cómo funcionan los suplentes, la puntuación, Star Points, tie-breaks y el formato de la temporada.",
    backToProfile: "← Volver al perfil",
    profileShortcutDescription:
      "Cambia la liga activa, el idioma y las preferencias de la aplicación.",
    leagueTitle: "Liga",
    createNewLeague: "Crear nueva liga",
    adminPanelTitle: "Panel de administrador",
    adminPanelDescription:
      "Gestiona la liga activa, la temporada, los lugares y las futuras herramientas de administración.",
    adminLeagueTitle: "Administrar liga",
    adminLeagueDescription:
      "Configura los lugares habituales de juego de la liga activa.",
    adminSeasonTitle: "Administrar temporada",
    adminSeasonDescription:
      "Configura el margen de jornadas, fechas y reglas básicas de la temporada activa.",
    languageTitle: "Idioma",
    language: "Idioma",
    languageDescription: "Cambia el idioma de la aplicación.",
    appearanceTitle: "Apariencia",
    appearanceDescription: "Elige el tema de la aplicación en este dispositivo.",
    appearanceLight: "Claro",
    appearanceDark: "Oscuro",
    appearanceSystem: "Sistema",
    accountTitle: "Cuenta e invitaciones",
    accountDescription:
      "Gestiona tu sesión, tu imagen y el acceso a nuevas ligas.",
    accountSettingsTitle: "Ajustes de cuenta",
    accountSettingsDescription:
      "Personaliza la imagen que se muestra en tu perfil de esta liga.",
    connectedEmail: "Email conectado",
    joinNewExistingLeague: "Unirme a una nueva liga existente",
    avatarCustomActive: "Imagen personalizada activa.",
    avatarGoogleFallback: "Se usa tu imagen de Google por defecto.",
    avatarInitialsFallback: "Se usan tus iniciales si no subes imagen.",
    uploadAvatar: "Subir imagen",
    removeAvatar: "Quitar imagen",
    avatarSaved: "Imagen guardada.",
    avatarSaveError:
      "No se ha podido guardar la imagen. Revisa Supabase o smash-lob-last-supabase-error.",
    avatarProcessError: "No se ha podido procesar la imagen.",
    futureTitle: "Próximamente",
    futureDescription:
      "Aquí añadiremos modo claro/oscuro, gestión de cuenta, temporadas, ligas, invitaciones y cierre de sesión.",
  },

  adminPanel: {
    backToSettings: "← Volver a ajustes",
    backToAdmin: "← Volver al panel admin",
    title: "Panel de administrador",
    description:
      "Centraliza la gestión de la liga activa y sus configuraciones.",
    leagueTitle: "Administrar liga",
    leagueDescription:
      "Configura los datos de la liga y sus lugares habituales.",
    seasonTitle: "Administrar temporada",
    seasonDescription:
      "Configura jornadas, ventanas y reglas básicas de la temporada activa.",
    inviteTitle: "Invitar jugadores",
    inviteDescription:
      "Comparte este código o enlace con la cuenta de Google que quieras invitar.",
    inviteCodeLabel: "Código",
    inviteLinkLabel: "Enlace",
    copyCode: "Copiar código",
    copyLink: "Copiar enlace",
    inviteCopied: "Copiado",
    inviteHelper:
      "Al entrar en {leagueName}, la persona invitada iniciará sesión con Google y reclamará uno de los jugadores sin vincular.",
    regenerateInviteCode: "Regenerar código",
    regenerateInviteCodeDescription:
      "El código anterior dejará de funcionar para nuevas invitaciones.",
    futureTitle: "Próximas herramientas",
    futureDescription:
      "Aquí se agruparán jugadores, invitaciones, reglas, generación de jornadas, notificaciones y auditoría.",
    rankingAvatarsTitle: "Fotos en la clasificación",
    rankingAvatarsDescription:
      "Muestra las imágenes de perfil en Ranking y en el resumen de clasificación de Home. Desactívalo para usar solo posición y nombre.",
    rankingAvatarsSaveError:
      "No se ha podido guardar la visibilidad de las fotos. Revisa Supabase o inténtalo de nuevo.",
    qaTitle: "Herramientas de prueba",
    qaDescription:
      "Simula jugadores, resultados, confirmaciones y votaciones MVP sin crear más cuentas.",
    accessDeniedTitle: "Sin permisos de administrador",
    accessDeniedCardTitle: "No puedes acceder a este panel",
    accessDeniedDescription:
      "Solo los creadores y administradores de la liga activa pueden gestionar esta sección.",
  },

  qa: {
    title: "Herramientas de prueba",
    description:
      "Simula acciones de jugadores y recorre los flujos críticos sin necesitar varias cuentas de Google.",
    disabledTitle: "Modo QA desactivado",
    disabledDescription:
      "Activa NEXT_PUBLIC_QA_MODE=true y QA_MODE=true en el entorno de pruebas. El acceso seguirá limitado a administradores.",
    warningTitle: "Solo para una liga de pruebas",
    warningDescription:
      "Estas acciones escriben datos reales en Supabase y pueden enviar notificaciones reales a las cuentas vinculadas.",
    loading: "Cargando datos de prueba...",
    error: "No se han podido cargar las herramientas de prueba.",
    actionError: "No se ha podido ejecutar la acción de prueba.",
    actionCompleted: "Acción QA completada y datos recargados.",
    contextTitle: "Contexto de la prueba",
    season: "Temporada",
    match: "Partido",
    matchStatus: "Estado",
    configuration: "Configuración",
    votes: "Votos MVP",
    confirmations: "Confirmaciones",
    disputedShort: "impugnadas",
    simulatedPlayerTitle: "Actuar como jugador",
    simulatedPlayerDescription:
      "Elige qué participante simula la acción. No necesita tener una cuenta vinculada.",
    scheduleMatch: "Programar mañana",
    recordResult: "Registrar 2-1",
    confirmAll: "Confirmar por todos",
    disputeResult: "Impugnar resultado",
    autoValidate: "Simular 24 h",
    lockResult: "Fijar resultado",
    unlockResult: "Desbloquear",
    mvpTitle: "Escenarios MVP",
    mvpDescription:
      "Genera votos válidos, cierres anticipados y notificaciones usando la misma lógica de la aplicación.",
    target: "Objetivo",
    secondTarget: "Segundo objetivo",
    castOneVote: "Emitir un voto",
    awardThreeVotes: "Dar 3 votos",
    tieVotes: "Empate 2-2",
    completeRoundScenario: "Completar jornada MVP",
    resetTitle: "Reiniciar datos QA",
    resetDescription:
      "Borra resultado, votos y confirmaciones del partido o de toda la jornada seleccionada. Solo elimina eventos MVP creados por estas herramientas.",
    resetMatch: "Reiniciar partido",
    resetRound: "Reiniciar jornada",
    noDataTitle: "Sin partidos disponibles",
    noDataDescription:
      "Crea una temporada con calendario y vuelve a abrir estas herramientas.",
  },

  adminLeague: {
    backToSettings: "← Volver a ajustes",
    title: "Administrar liga",
    description: "Configura los datos básicos de la liga activa.",
    locationsTitle: "Lugares habituales",
    locationsDescription:
      "Configura lugares con localidad, ubicación en Maps y número de pistas para programar partidos, abrir navegación y guardar la ubicación en el calendario.",
    emptyLocations:
      "No hay lugares habituales configurados. Al programar partidos se podrá usar la opción Otro.",
    addLocationTitle: "Añadir lugar",
    locationName: "Nombre corto",
    locationPlaceholder: "Ejemplo: Lasesarre",
    town: "Localidad",
    townPlaceholder: "Ejemplo: Barakaldo",
    googleLocation: "Ubicación en Maps",
    googleLocationPlaceholder:
      "Ejemplo: Polideportivo de Lasesarre, Barakaldo o URL de Maps",
    courts: "Pistas",
    courtsPlaceholder: "Ejemplo: 4",
    duplicatedLocation: "Ese lugar ya está en la lista.",
    addLocation: "Añadir lugar",
    editLocation: "Editar",
    saveLocation: "Guardar lugar",
    cancelLocationEdit: "Cancelar",
    removeLocation: "Quitar",
    openMaps: "Cómo llegar",
    searchMaps: "Probar en Maps",
    googleApiMissing:
      "Escribe una ubicación o pega una URL de Maps. La app abrirá Maps con esa referencia.",
    save: "Guardar cambios",
    saved: "Configuración guardada.",
  },

  adminSeason: {
    backToSettings: "← Volver a ajustes",
    title: "Administrar temporada",
    description:
      "Configura las fechas y márgenes que pueden cambiar durante la temporada activa.",
    finishedDescription:
      "La temporada actual está finalizada. Define los ajustes necesarios para comenzar una nueva.",
    roundWindowTitle: "Margen de jornadas",
    roundWindowDescription:
      "Define si cada jornada tiene una ventana oficial para jugarse.",
    newRoundWindowDescription:
      "Este ajuste podrá modificarse durante la temporada si hace falta.",
    roundWindowEditDescription:
      "Cambia el margen antes o durante la temporada. Las ventanas de todas las jornadas se recalcularán al guardar.",
    roundWindowRecalculationNotice:
      "No se modifican partidos, resultados ni reservas. La gestión manual de jornadas seguirá teniendo prioridad hasta volver al modo automático.",
    roundWindowSave: "Guardar margen",
    roundWindowSaving: "Guardando...",
    roundWindowSaved: "Margen de jornadas actualizado.",
    roundWindowSaveError:
      "No se ha podido guardar el margen de jornadas en Supabase.",
    roundWindowInvalid:
      "Indica la fecha de inicio y un número entero de días igual o superior a 1.",
    noWindowTitle: "Sin margen específico",
    noWindowDescription:
      "Las jornadas no tendrán una fecha límite calculada automáticamente.",
    fixedDaysTitle: "Margen fijo por jornada",
    fixedDaysDescription:
      "Cada jornada tendrá el mismo número de días para jugarse.",
    fixedDaysSettings: "Configuración del margen fijo",
    seasonStartDate: "Fecha de inicio de la Jornada 1",
    daysPerRound: "Días por jornada",
    resultRulesTitle: "Reglas de resultado",
    resultRulesDescription:
      "Define cómo se validan los resultados introducidos por los jugadores.",
    requireThreeSetsTitle: "Exigir tres sets jugados",
    requireThreeSetsDescription:
      "Si está activo, el formulario obliga a completar tres sets válidos. Si no, se podrán guardar solo los sets jugados.",
    activePlayersTitle: "Jugadores de la temporada",
    activePlayersDescription:
      "Listado solo de consulta para comprobar qué jugadores ya han vinculado su cuenta de Google.",
    playerLinked: "Vinculado",
    playerPending: "Pendiente",
    lifecycleTitle: "Ciclo de temporada",
    lifecycleDescription:
      "Termina la temporada actual o abre una nueva con sus propios jugadores.",
    currentSeason: "Temporada actual",
    statusActive: "Activa",
    statusFinished: "Finalizada",
    finishTitle: "Cerrar temporada activa",
    finishDescription:
      "Al cerrarla, la temporada quedará como histórico y volverás al resumen de la liga. No se creará una nueva automáticamente.",
    finishConfirmMessage:
      "¿Seguro que quieres cerrar esta temporada? No se creará otra automáticamente y la liga quedará pendiente de nueva temporada.",
    finishSeason: "Terminar temporada",
    newSeasonTitle: "Crear nueva temporada",
    newSeasonDescription:
      "Cada temporada guarda sus propios jugadores, calendario y reglas dentro de la misma liga.",
    newSeasonName: "Nombre de la temporada",
    newSeasonNamePlaceholder: "Ejemplo: Temporada 3",
    newSeasonRounds: "Jornadas",
    playerCount: "Cantidad de jugadores",
    newPlayerName: "Nuevo jugador",
    seasonPlayersTitle: "Jugadores de esta temporada",
    seasonPlayersDescription:
      "Elige jugadores de la liga y completa los huecos con nuevos nombres pendientes de vincular.",
    calendarTitle: "Calendario",
    calendarDescription:
      "Elige duración y generación de jornadas para la nueva temporada.",
    seasonLengthTitle: "Duración",
    seasonLengthDescription:
      "Define si la temporada tendrá una vuelta normal, una segunda vuelta exacta o una segunda vuelta remezclada.",
    roundsShortLabel: "jornadas",
    singleRoundCalendar: "Vuelta única",
    singleRoundCalendarDescription:
      "Como hasta ahora: con 8 jugadores se generan 7 jornadas.",
    doubleRoundCalendar: "Doble vuelta",
    doubleRoundCalendarDescription:
      "Repite el calendario una segunda vez: con 8 jugadores se generan 14 jornadas.",
    extendedCalendar: "Temporada larga",
    extendedCalendarDescription:
      "Añade una segunda vuelta completa y equilibrada, repitiendo todas las parejas pero con partidos diferentes.",
    balancedCalendar: "Calendario equilibrado",
    balancedCalendarDescription:
      "En cada vuelta, cada jugador jugará una vez con cada compañero y dos veces contra cada rival.",
    manualCalendar: "Calendario manual",
    manualCalendarDescription:
      "Permite configurar jornadas y emparejamientos a mano antes de crear la temporada.",
    calendarModeLabel: "Tipo de calendario",
    manualCalendarSingleHelp:
      "Elige manualmente la Pareja A y la Pareja B de cada jornada.",
    manualCalendarDoubleHelp:
      "Edita la primera vuelta manualmente; la segunda vuelta repetirá exactamente ese calendario.",
    manualCalendarLongHelp:
      "Configura manualmente todas las jornadas de la temporada larga.",
    manualCalendarBlocked:
      "Completa todos los desplegables del calendario manual para continuar.",
    calendarAuditTitle: "Equilibrio del calendario",
    calendarAuditDescription:
      "Comprueba jugadores, jornadas, partidos, parejas, rivales y la estructura específica de la modalidad.",
    calendarAuditOk: "Verificado",
    calendarAuditNeedsRepair: "Revisar",
    calendarAuditMode: "Modalidad",
    calendarAuditPlayers: "Jugadores",
    calendarAuditRounds: "Jornadas",
    calendarAuditMatches: "Partidos",
    calendarAuditMatchStructure: "Partidos bien formados",
    calendarAuditRoundStructure: "Una aparición por jornada",
    calendarAuditIncorrectMatches: "partidos incorrectos",
    calendarAuditRoundStructureError:
      "{rounds} jornadas y {appearances} apariciones incorrectas",
    calendarAuditPartners: "Compañeros",
    calendarAuditOpponents: "Rivales",
    calendarAuditExpectedTimes: "Frecuencia esperada: {count} veces",
    calendarAuditFirstLeg: "Primera vuelta",
    calendarAuditSecondLeg: "Segunda vuelta",
    calendarAuditBalancedLeg: "Vuelta completa y equilibrada",
    calendarAuditUnbalancedLeg: "La vuelta no está equilibrada",
    calendarAuditExactSecondLeg: "Repetición exacta",
    calendarAuditRemixedSecondLeg: "Segunda vuelta remezclada",
    calendarAuditRepeatedRounds: "{count} jornadas idénticas de {total}",
    calendarAuditRepeatedMatches: "{count} partidos repetidos exactamente",
    calendarAuditAllCorrect: "Todos correctos",
    calendarAuditIncorrect: "parejas incorrectas",
    calendarAuditRepairHelp:
      "El calendario se creó con el generador anterior. Puedes regenerar únicamente los emparejamientos antes de comenzar la temporada. No se modificarán jugadores ni ajustes.",
    repairCalendar: "Regenerar calendario equilibrado",
    repairingCalendar: "Regenerando...",
    repairCalendarConfirm:
      "¿Regenerar los emparejamientos de esta temporada? Solo continuará si ningún partido ha sido programado o modificado.",
    repairCalendarSuccess:
      "Calendario regenerado y verificado correctamente.",
    repairCalendarError: "No se ha podido regenerar el calendario.",
    startSeason: "Comenzar temporada",
    seasonFinished: "Temporada finalizada.",
    seasonStarted: "Nueva temporada creada.",
    inviteTitle: "Enlace de invitación",
    inviteDescription:
      "Copia este enlace para enviárselo a nuevos jugadores o sustitutos de {leagueName}.",
    copyInviteLink: "Copiar enlace de invitación",
    inviteCopied: "Enlace copiado",
    inviteCopyError: "No se ha podido copiar el enlace.",
    save: "Guardar configuración",
    saved: "Configuración guardada.",
  },

  newLeague: {
    title: "Crear nueva liga",
    description:
      "Define el grupo, su primera temporada y las reglas iniciales. Luego podrás invitar jugadores a la liga.",
    leagueTitle: "Datos de la liga",
    leagueName: "Nombre de la liga",
    leagueNamePlaceholder: "Ejemplo: Liga de los jueves",
    leagueDescription: "Descripción",
    leagueDescriptionPlaceholder:
      "Ejemplo: Liga privada de pádel entre amigos.",
    defaultDescription: "Liga privada de pádel.",
    locationsTitle: "Lugares habituales",
    locationsDescription:
      "Puedes dejar preparadas las pistas habituales desde el principio. Luego aparecerán al programar partidos y se guardarán en el calendario.",
    seasonTitle: "Primera temporada",
    seasonDescription:
      "Las reglas y participantes quedan ligados a esta temporada, no a toda la liga.",
    seasonName: "Nombre de la temporada",
    playerCount: "Cantidad de jugadores",
    playersTitle: "Jugadores iniciales",
    playersDescription:
      "El primer jugador quedará vinculado a tu cuenta como creador. El resto podrá reclamar su jugador con invitación de liga.",
    playerName: "Jugador",
    rulesTitle: "Reglas de juego",
    rulesDescription:
      "Estos ajustes pertenecen a la primera temporada y podrán cambiarse en temporadas futuras.",
    create: "Crear liga",
    createError: "No se ha podido crear la liga con el usuario actual.",
  },

  notifications: {
    title: "Notificaciones",
    description:
      "Elige qué avisos quieres recibir. Todas las opciones vienen activadas por defecto.",
    deviceTitle: "Push en este dispositivo",
    supportUnsupported:
      "Este navegador no permite notificaciones push web. En iPhone necesitas instalar la PWA en la pantalla de inicio.",
    supportMissingPublicKey:
      "Falta configurar NEXT_PUBLIC_VAPID_PUBLIC_KEY para activar el permiso push. Puedes guardar preferencias igualmente.",
    supportPermissionDenied:
      "Las notificaciones están bloqueadas en el navegador. Tendrás que permitirlas desde los ajustes del sistema o del navegador.",
    supportReady:
      "Activa este dispositivo para recibir avisos aunque no tengas la app abierta.",
    active: "Activo",
    inactive: "Inactivo",
    missingConfiguration:
      "Falta configuración de servidor o las tablas SQL. La pantalla queda preparada, pero el envío real necesita completar la configuración.",
    enablePush: "Activar push",
    disablePush: "Desactivar",
    typesTitle: "Tipos de aviso",
    enabledCount: "Activados: {enabled}/{total}",
    mandatoryPaymentReminders:
      "Los recordatorios de pago de pista e inscripción, automáticos o enviados manualmente, se reciben siempre.",
    disableAll: "Desactivar todo",
    enableAll: "Activar todo",
    preferencesSaved: "Preferencias guardadas.",
    preferencesSaveError:
      "No se han podido guardar las preferencias. Revisa las tablas de notificaciones y SUPABASE_SERVICE_ROLE_KEY.",
    deviceEnabled: "Notificaciones activadas en este dispositivo.",
    deviceEnableError:
      "No se ha podido guardar este dispositivo. Revisa VAPID, SUPABASE_SERVICE_ROLE_KEY y las tablas de notificaciones.",
    deviceDisabled: "Notificaciones desactivadas en este dispositivo.",
    deviceDisableError: "No se ha podido desactivar este dispositivo.",
    preferences: {
      next_match: {
        title: "Mi próximo partido",
        description:
          "Programación, cambios de fecha, lugar, pista, aplazamientos y recordatorio 2 h antes de tus partidos.",
      },
      my_match_result: {
        title: "Resultados de mis partidos",
        description:
          "Resultado informado, modificado, eliminado, confirmaciones y recordatorios para registrar el resultado o votar al MVP.",
      },
      round_events: {
        title: "Jornadas y MVP",
        description:
          "Avisos de jornada en juego y MVP asignados durante la temporada.",
      },
      season_events: {
        title: "Temporadas",
        description:
          "Nueva temporada creada, temporada iniciada o temporada finalizada en tu liga.",
      },
      booking_i_owe: {
        title: "Reservas de pista",
        description:
          "Una reserva indica que debes pagar tu parte a otro jugador o se actualiza una reserva de tus partidos.",
      },
      booking_paid_to_me: {
        title: "Pagos recibidos de pista",
        description:
          "Alguien que te debía una transferencia de pista la marca como pagada.",
      },
      player_account: {
        title: "Cuenta y jugadores",
        description:
          "Cambios sobre tu perfil, avatar, rol, vinculación o datos de usuario.",
      },
    },
  },

  activity: {
    title: "Actividad",
    description: "Cambios importantes de la liga y de tus partidos.",
    general: "General",
    personal: "Personal",
    personalTitle: "Actividad personal",
    wallTitle: "Muro de actividad",
    refresh: "Actualizar",
    loading: "Cargando actividad...",
    loadErrorTitle: "No se ha podido cargar",
    loadErrorDescription:
      "No se ha podido cargar la actividad. Revisa Supabase o vuelve a intentarlo.",
    emptyGeneralTitle: "Aún no hay actividad",
    emptyGeneralDescription:
      "Cuando alguien programe un partido, registre o modifique un resultado, aplace una jornada o actualice una reserva, aparecerá aquí.",
    emptyPersonalTitle: "Aún no tienes actividad",
    emptyPersonalDescription:
      "Aquí aparecerán cambios relacionados con tus partidos, reservas y pagos.",
    lastErrorTitle: "Último error al registrar actividad",
    actorFallback: "Usuario",
    round: "Jornada",
    noGames: "sin juegos registrados",
    sets: "Sets",
    games: "Juegos",
    admin: "Admin",
    adminTitle: "Auditoría completa",
    adminDescription:
      "Vista completa para administradores con todos los eventos y sus datos internos.",
    adminMetadata: "Datos internos",
    adminEventType: "Tipo de evento",
    notificationSettingsTitle: "Gestión de notificaciones",
    notificationSettingsDescription:
      "Decide qué eventos envían una notificación push, cuáles quedan en la actividad personal y cuáles se muestran solo en el historial general.",
    notificationFutureHint:
      "Los cambios se aplican a las nuevas notificaciones de la liga. Cada jugador conserva además sus preferencias personales.",
    notificationSettingsCollapsedHint:
      "El panel queda plegado para dejar visible la auditoría. Despliégalo solo cuando quieras cambiar avisos.",
    showNotificationSettings: "Configurar",
    hideNotificationSettings: "Plegar",
    modeActivityOnly: "Solo historial general",
    modePersonal: "Sin push · visible en actividad personal",
    modeNotify: "Enviar notificación push",
    modeActivityOnlyShort: "General",
    modePersonalShort: "Personal",
    modeNotifyShort: "Push",
    pushPreparationTitle: "Todos los avisos configurables",
    pushPreparationDescription:
      "Todos los tipos de notificación disponibles aparecen aquí y se pueden configurar de forma independiente.",
    pushReady: "Configurable",
    mandatoryPaymentRemindersTitle: "Recordatorios de pago siempre activos",
    mandatoryPaymentRemindersDescription:
      "Los recordatorios de pista e inscripción, tanto automáticos como enviados manualmente, no se pueden desactivar.",
    notificationEnabledCount: "Activadas",
    notificationDisabledCount: "Desactivadas",
    notificationEnabled: "Notificación activada",
    notificationDisabled: "Notificación desactivada",
    notificationToggleDescription:
      "Desactivar un tipo detiene su push, pero el evento continúa apareciendo en el historial de actividad.",
    personalScopeLabel: "Ámbito personal",
    categoryLabels: {
      match: "Partidos",
      court: "Reserva y pagos",
      season: "Temporadas",
      league: "Liga",
      player: "Jugadores y usuarios",
    },
    personalScopeLabels: {
      match_participants: "Jugadores del partido",
      target_player: "Jugador afectado",
      league_wide: "Toda la liga",
      admin_only: "Solo gestión admin",
    },
    saveNotificationSettings: "Guardar configuración de avisos",
    settingsSaved: "Configuración de avisos guardada.",
    settingsLoadError:
      "No se ha podido cargar la configuración de avisos. Ejecuta el SQL de activity_settings o revisa Supabase.",
    settingsSaveError:
      "No se ha podido guardar la configuración de avisos. Revisa Supabase o los permisos.",
    notificationLabels: {
      match_scheduled: "Partido programado",
      match_schedule_updated: "Programación de partido modificada",
      match_postponed: "Partido aplazado",
      match_result_saved: "Resultado registrado",
      match_result_updated: "Resultado corregido",
      match_result_disputed: "Resultado marcado como incorrecto",
      match_result_cleared: "Resultado eliminado",
      match_result_missing_reminder: "Recordatorio para registrar resultado",
      match_result_confirmation_reminder: "Recordatorio para confirmar resultado",
      match_mvp_vote_reminder: "Recordatorio para votar al MVP",
      match_mvp_awarded: "MVP del partido decidido",
      match_upcoming_reminder: "Recordatorio de partido próximo",
      round_in_play: "Jornada en juego",
      round_mvp_awarded: "MVP de jornada decidido",
      court_booking_updated: "Reserva de pista creada o modificada",
      court_booking_cleared: "Reserva de pista eliminada",
      court_booking_payment_paid: "Pago de pista recibido",
      court_booking_payment_reminder: "Recordatorio de pago de pista",
      season_registration_payment_reminder: "Recordatorio de pago de inscripción",
      league_created: "Liga creada",
      league_updated: "Liga modificada",
      league_logo_updated: "Logo de liga modificado",
      league_locations_updated: "Ubicaciones de liga modificadas",
      league_invite_regenerated: "Invitación de jugadores regenerada",
      season_finished: "Temporada finalizada",
      season_created: "Temporada creada",
      season_started: "Temporada iniciada",
      player_name_updated: "Nombre de jugador modificado",
      player_avatar_updated: "Foto de jugador modificada",
      player_role_updated: "Rol de jugador modificado",
      player_unlinked: "Jugador desvinculado",
      user_updated: "Cuenta de usuario modificada",
    },
    labels: {
      match_scheduled: "Programación",
      match_schedule_updated: "Programación",
      match_postponed: "Aplazamiento",
      match_result_saved: "Resultado",
      match_result_updated: "Resultado",
      match_result_disputed: "Resultado",
      match_result_cleared: "Resultado",
      match_mvp_vote_reminder: "Votación MVP",
      match_mvp_awarded: "MVP del partido",
      match_result_missing_reminder: "Resultado",
      match_result_confirmation_reminder: "Confirmación",
      match_upcoming_reminder: "Recordatorio",
      round_in_play: "Jornada",
      round_mvp_awarded: "MVP",
      court_booking_updated: "Reserva",
      court_booking_cleared: "Reserva",
      court_booking_payment_paid: "Pago",
      court_booking_payment_reminder: "Recordatorio",
      season_registration_payment_reminder: "Inscripción",
      league_created: "Liga",
      league_updated: "Liga",
      league_logo_updated: "Liga",
      league_locations_updated: "Liga",
      league_invite_regenerated: "Invitación",
      season_finished: "Temporada",
      season_started: "Temporada",
      season_created: "Temporada",
      player_name_updated: "Jugador",
      player_avatar_updated: "Jugador",
      player_role_updated: "Usuario",
      player_unlinked: "Usuario",
      user_updated: "Usuario",
    },
  },

  language: {
    current: "Español",
    switchToSpanish: "ES",
    switchToEnglish: "EN",
    switchToBasque: "EU",
  },
} as const;
