export const es = {
  common: {
    appName: "Smash & Lob",
    season: "Temporada 2",
    privateLeague: "Liga privada de pádel",
    individualRanking: "Ranking individual",
    pointsShort: "pts",
    back: "Volver",
    backToMatches: "← Volver a partidos",
    versus: "vs",
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
    title: "Elige como empezar",
    description:
      "Tu cuenta de Google esta lista. Ahora crea una liga o entra en una invitacion existente.",
    createTitle: "Crear nueva liga",
    createDescription:
      "Pronto definiremos el alta completa de ligas, jugadores y temporada inicial.",
    createAction: "Crear liga",
    joinTitle: "Unirme a liga existente",
    joinDescription:
      "Introduce el codigo que te ha pasado el administrador de la liga.",
    joinAction: "Validar invitacion",
  },

  invites: {
    subtitle: "Invitacion privada",
    title: "Unirme a una liga",
    description:
      "Confirma la liga y reclama el jugador que te corresponde dentro de ella.",
    codeLabel: "Codigo de invitacion",
    codePlaceholder: "SL-8KQ4-P7M2-X9RA",
    invalidCode: "Codigo invalido.",
    leagueNotFound: "Liga no encontrada.",
    notFoundTitle: "Invitacion no encontrada",
    notFoundDescription:
      "Revisa el enlace o pide al administrador un codigo nuevo.",
    foundLeague: "Liga encontrada",
    closedMode: "Modo cerrado: jugadores predefinidos por el admin.",
    openMode: "Modo abierto preparado para mas adelante.",
    claimTitle: "Reclama tu jugador",
    claimDescription:
      "Elige quien eres en esta liga. Solo podras reclamar un jugador por liga.",
    selectPlayerError: "Selecciona un jugador para continuar.",
    playerAlreadyClaimed: "Jugador ya reclamado.",
    alreadyInLeague: "Ya perteneces a esta liga.",
    alreadyInLeagueDescription:
      "Tu cuenta ya tiene un jugador vinculado en esta liga.",
    noPlayersAvailable: "No quedan jugadores sin reclamar en esta liga.",
    confirmClaim: "Confirmar y entrar",
    enterLeague: "Entrar en la liga",
    accessDenied: "No tienes permisos para ver esta liga.",
  },

  appHeader: {
    leagueSelectorLabel: "Seleccionar liga",
    settingsLabel: "Ajustes",
  },

  nav: {
    home: "Inicio",
    ranking: "Ranking",
    matches: "Partidos",
    player: "Jugador",
    profile: "Perfil",
  },

  dashboard: {
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
  },

  ranking: {
    subtitle: "Clasificación general",
    description:
      "Ordenado por puntos, diferencia de juegos y juegos a favor.",
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
    played: "Jugado",
    pendingPlay: "Pendiente de jugar",
    pendingDate: "Pendiente de fecha",
    pendingReschedule: "Pendiente de nueva fecha",
    missingSchedule: "Falta añadir hora, fecha y lugar",
    needsReschedule: "Hay que reprogramar este partido",
    noMatches: "No hay partidos en esta temporada.",
  },

  matchDetail: {
    title: "Partido",
    notFound: "Partido no encontrado",
    teamA: "Pareja A",
    teamB: "Pareja B",
    set: "Set",
    schedule: "Programación",
    scheduleDescription:
      "Fecha, hora y lugar acordados para este partido.",
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
    gamesA: "Games A",
    gamesB: "Games B",
    pointsA: "Puntos A",
    pointsB: "Puntos B",
    editSchedule: "Editar programación",
    editScheduleButton: "Editar",
    postponeButton: "Aplazar partido",
    rescheduleButton: "Reprogramar",
    scheduleFormDescription:
      "Añade o modifica la fecha, hora y lugar del partido.",
    scheduleDateLabel: "Fecha y hora",
    scheduleLocation: "Lugar",
    scheduleLocationPlaceholder: "Selecciona un lugar",
    otherLocation: "Otro",
    customLocation: "Lugar personalizado",
    customLocationPlaceholder: "Escribe el lugar del partido",
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
    invalidSet:
      "Set no válido. Usa marcadores tipo 6-0, 6-4, 7-5 o 7-6.",
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
    description:
      "Tus estadísticas como jugador dentro de la temporada activa.",
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
      "Estadísticas públicas del jugador dentro de la temporada activa.",
    seasonStats: "Estadísticas de temporada",
    playerMatches: "Partidos del jugador",
    futureTitle: "Historial y tendencias",
    futureDescription:
      "Más adelante aquí se mostrarán mejores parejas, rivales más frecuentes y evolución del ranking.",
  },

  leagues: {
    activeLeague: "Liga activa",
  },

  settings: {
    title: "Ajustes",
    description:
      "Gestiona tus preferencias de la aplicación.",
    backToProfile: "← Volver al perfil",
    profileShortcutDescription:
      "Cambia la liga activa, el idioma y las preferencias de la aplicación.",
    leagueTitle: "Liga",
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
    languageDescription:
      "Cambia el idioma de la aplicación.",
    accountTitle: "Cuenta e invitaciones",
    accountDescription:
      "Más adelante esta sección conectará el usuario registrado, las invitaciones y las ligas a las que se una mediante enlace.",
    connectedEmail: "Email conectado",
    joinNewExistingLeague: "Unirme a una nueva liga existente",
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
      "Comparte este codigo o enlace con la cuenta de Google que quieras invitar.",
    inviteCodeLabel: "Codigo",
    inviteLinkLabel: "Enlace",
    copyCode: "Copiar codigo",
    copyLink: "Copiar enlace",
    inviteCopied: "Copiado",
    inviteHelper:
      "Al entrar en {leagueName}, la persona invitada iniciara sesion con Google y reclamara uno de los jugadores sin vincular.",
    regenerateInviteCode: "Regenerar codigo",
    regenerateInviteCodeDescription:
      "El codigo anterior dejara de funcionar para nuevas invitaciones.",
    futureTitle: "Próximas herramientas",
    futureDescription:
      "Aquí se agruparán jugadores, invitaciones, reglas, generación de jornadas, notificaciones y auditoría.",
    accessDeniedTitle: "Sin permisos de administrador",
    accessDeniedCardTitle: "No puedes acceder a este panel",
    accessDeniedDescription:
      "Solo los creadores y administradores de la liga activa pueden gestionar esta sección.",
  },

  adminLeague: {
    backToSettings: "← Volver a ajustes",
    title: "Administrar liga",
    description:
      "Configura los datos básicos de la liga activa.",
    locationsTitle: "Lugares habituales",
    locationsDescription:
      "Estos lugares aparecerán como selección rápida al programar partidos. Siempre seguirá existiendo la opción Otro.",
    emptyLocations:
      "No hay lugares habituales configurados. Al programar partidos se podrá usar la opción Otro.",
    addLocationTitle: "Añadir lugar",
    locationName: "Nombre del lugar",
    locationPlaceholder: "Ejemplo: Pádel Indoor",
    duplicatedLocation: "Ese lugar ya está en la lista.",
    addLocation: "Añadir lugar",
    removeLocation: "Quitar",
    save: "Guardar cambios",
    saved: "Configuración guardada.",
  },

  adminSeason: {
    backToSettings: "← Volver a ajustes",
    title: "Administrar temporada",
    description:
      "Configura cómo se organizan las jornadas de la temporada activa.",
    roundWindowTitle: "Margen de jornadas",
    roundWindowDescription:
      "Define si cada jornada tiene una ventana oficial para jugarse.",
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
    lifecycleTitle: "Ciclo de temporada",
    lifecycleDescription:
      "Termina la temporada actual o abre una nueva con sus propios jugadores.",
    currentSeason: "Temporada actual",
    statusActive: "Activa",
    statusFinished: "Finalizada",
    finishSeason: "Terminar temporada",
    newSeasonTitle: "Comenzar nueva temporada",
    newSeasonDescription:
      "Cada temporada puede tener jugadores y ajustes distintos dentro de la misma liga.",
    newSeasonName: "Nombre de la temporada",
    newSeasonNamePlaceholder: "Ejemplo: Temporada 3",
    newSeasonRounds: "Jornadas",
    seasonPlayersTitle: "Jugadores de esta temporada",
    seasonPlayersDescription:
      "Selecciona quienes participan. No tienen que ser los mismos que en otras temporadas.",
    startSeason: "Comenzar temporada",
    seasonFinished: "Temporada finalizada.",
    seasonStarted: "Nueva temporada creada.",
    save: "Guardar configuración",
    saved: "Configuración guardada.",
  },

  language: {
    current: "Español",
    switchToSpanish: "ES",
    switchToEnglish: "EN",
  },
} as const
