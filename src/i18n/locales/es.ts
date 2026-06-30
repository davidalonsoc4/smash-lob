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
    noActiveSeasonTitle: "Sin temporada activa",
    noActiveSeasonDescription:
      "La liga está pendiente de que el administrador cree una nueva temporada.",
    claimTitle: "Reclama tu jugador",
    claimDescription:
      "Elige quién eres en esta liga. Solo podrás reclamar un jugador por liga.",
    claimActiveDescription:
      "Estos son los jugadores pendientes de vincular en la temporada activa.",
    claimableActivePlayers: "Jugadores pendientes en la temporada activa",
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
    expand: "Ver reserva",
    collapse: "Ocultar reserva",
    pendingPaymentSingular: "pago pendiente",
    pendingPaymentPlural: "pagos pendientes",
  },

  nav: {
    home: "Inicio",
    ranking: "Ranking",
    matches: "Partidos",
    activity: "Actividad",
    player: "Jugador",
    profile: "Perfil",
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
    description: "Ordenado por puntos, diferencia de juegos y juegos a favor.",
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
    closedSeasonHistoricalDescription:
      "Estos son los partidos históricos de {seasonName}.",
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
      "Estadísticas públicas del jugador dentro de la temporada activa.",
    seasonStats: "Estadísticas de temporada",
    playerMatches: "Partidos del jugador",
    futureTitle: "Historial y tendencias",
    futureDescription:
      "Más adelante aquí se mostrarán mejores parejas, rivales más frecuentes y evolución del ranking.",
  },

  playerStats: {
    title: "Estadísticas avanzadas",
    subtitle: "Rendimiento de temporada",
    winRate: "% victoria",
    record: "balance",
    setsBalance: "Balance de sets",
    gamesBalance: "Balance de juegos",
    bestPartner: "Mejor compañero",
    frequentRival: "Rival más frecuente",
    bestRound: "Mejor jornada",
    roundShort: "J",
    toughestRound: "Jornada más dura",
  },

  leagues: {
    activeLeague: "Liga activa",
  },

  settings: {
    title: "Ajustes",
    description: "Gestiona tus preferencias de la aplicación.",
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
    accountTitle: "Cuenta e invitaciones",
    accountDescription: "Gestiona tu sesión, tu imagen y el acceso a nuevas ligas.",
    accountSettingsTitle: "Ajustes de cuenta",
    accountSettingsDescription:
      "Personaliza la imagen que se muestra en tu perfil de esta liga.",
    connectedEmail: "Email conectado",
    joinNewExistingLeague: "Unirme a una nueva liga existente",
    avatarCustomActive: "Imagen personalizada activa.",
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
    description: "Centraliza la gestión de la liga activa y sus configuraciones.",
    leagueTitle: "Administrar liga",
    leagueDescription: "Configura los datos de la liga y sus lugares habituales.",
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
    accessDeniedTitle: "Sin permisos de administrador",
    accessDeniedCardTitle: "No puedes acceder a este panel",
    accessDeniedDescription:
      "Solo los creadores y administradores de la liga activa pueden gestionar esta sección.",
  },

  adminLeague: {
    backToSettings: "← Volver a ajustes",
    title: "Administrar liga",
    description: "Configura los datos básicos de la liga activa.",
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
      "Configura las fechas y márgenes que pueden cambiar durante la temporada activa.",
    finishedDescription:
      "La temporada actual está finalizada. Define los ajustes necesarios para comenzar una nueva.",
    roundWindowTitle: "Margen de jornadas",
    roundWindowDescription:
      "Define si cada jornada tiene una ventana oficial para jugarse.",
    newRoundWindowDescription:
      "Este ajuste podrá modificarse durante la temporada si hace falta.",
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
    newSeasonTitle: "Comenzar nueva temporada",
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
      "Elige cómo se generarán las jornadas de la nueva temporada.",
    balancedCalendar: "Calendario equilibrado",
    balancedCalendarDescription:
      "Todos los jugadores tendrán una distribución compensada de partidos. Configuraremos el detalle en el siguiente paso.",
    manualCalendar: "Calendario manual",
    manualCalendarDescription:
      "Permitirá configurar jornadas y emparejamientos a mano. Lo definiremos más adelante.",
    manualCalendarBlocked:
      "El calendario manual todavía no está disponible. Selecciona calendario equilibrado para continuar.",
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
    leagueDescriptionPlaceholder: "Ejemplo: Liga privada de pádel entre amigos.",
    defaultDescription: "Liga privada de pádel.",
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
    notificationSettingsTitle: "Avisos de actividad",
    notificationSettingsDescription:
      "Define qué eventos se quedan solo en el muro, cuáles cuentan como personales y cuáles deberán generar aviso cuando activemos notificaciones.",
    notificationFutureHint:
      "De momento esto ordena Actividad, decide qué entra en Personal y deja cada evento clasificado para futuras notificaciones push.",
    notificationSettingsCollapsedHint:
      "El panel queda plegado para dejar visible la auditoría. Despliégalo solo cuando quieras cambiar avisos.",
    showNotificationSettings: "Configurar",
    hideNotificationSettings: "Plegar",
    modeActivityOnly: "Solo actividad general",
    modePersonal: "Actividad personal si afecta al jugador",
    modeNotify: "Notificable más adelante",
    modeActivityOnlyShort: "General",
    modePersonalShort: "Personal",
    modeNotifyShort: "Aviso",
    pushPreparationTitle: "Base preparada para push",
    pushPreparationDescription:
      "Los eventos marcados como notificables todavía no envían push, pero ya quedan separados para generar avisos cuando añadamos el servicio de notificaciones.",
    pushReady: "Push",
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
    labels: {
      match_scheduled: "Programación",
      match_schedule_updated: "Programación",
      match_postponed: "Aplazamiento",
      match_result_saved: "Resultado",
      match_result_updated: "Resultado",
      match_result_cleared: "Resultado",
      court_booking_updated: "Reserva",
      court_booking_cleared: "Reserva",
      court_booking_payment_paid: "Pago",
      league_created: "Liga",
      league_updated: "Liga",
      league_logo_updated: "Liga",
      league_locations_updated: "Liga",
      league_invite_regenerated: "Invitación",
      season_finished: "Temporada",
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
} as const
