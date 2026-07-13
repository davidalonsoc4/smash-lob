import type { Locale } from "@/i18n/translations"

export type SettingsSearchCapabilities = {
  isSpectator: boolean
  canAccessAdmin: boolean
  hasAdminRole: boolean
  canCreateLeague: boolean
  canSelfUnlink: boolean
  qaEnabled: boolean
}

export type SettingsSearchEntry = {
  id: string
  title: string
  description: string
  section: string
  href: string
  keywords: string[]
  suggested?: boolean
}

type SearchCopy = {
  title: string
  description: string
  placeholder: string
  clear: string
  results: string
  suggested: string
  recent: string
  noResultsTitle: string
  noResultsDescription: string
  open: string
  sections: {
    preferences: string
    account: string
    league: string
    season: string
    admin: string
    help: string
    testing: string
  }
}

type EntryCopy = Omit<SettingsSearchEntry, "id" | "href" | "section" | "suggested"> & {
  section: keyof SearchCopy["sections"]
}

const copyByLocale: Record<Locale, SearchCopy> = {
  es: {
    title: "Buscar ajustes",
    description: "Encuentra opciones personales, de liga y de temporada.",
    placeholder: "Buscar notificaciones, MVP, margen...",
    clear: "Limpiar búsqueda",
    results: "Resultados",
    suggested: "Sugerencias",
    recent: "Usados recientemente",
    noResultsTitle: "No se ha encontrado ninguna opción",
    noResultsDescription: "Prueba con otro término o un sinónimo.",
    open: "Abrir",
    sections: {
      preferences: "Preferencias",
      account: "Cuenta",
      league: "Liga",
      season: "Temporada",
      admin: "Administración",
      help: "Ayuda",
      testing: "Pruebas",
    },
  },
  en: {
    title: "Search settings",
    description: "Find personal, league and season options.",
    placeholder: "Search notifications, MVP, round window...",
    clear: "Clear search",
    results: "Results",
    suggested: "Suggestions",
    recent: "Recently used",
    noResultsTitle: "No setting was found",
    noResultsDescription: "Try another term or a synonym.",
    open: "Open",
    sections: {
      preferences: "Preferences",
      account: "Account",
      league: "League",
      season: "Season",
      admin: "Administration",
      help: "Help",
      testing: "Testing",
    },
  },
  eu: {
    title: "Ezarpenak bilatu",
    description: "Bilatu kontu, liga eta denboraldiko aukerak.",
    placeholder: "Bilatu jakinarazpenak, MVP, jardunaldi-marjina...",
    clear: "Bilaketa garbitu",
    results: "Emaitzak",
    suggested: "Iradokizunak",
    recent: "Duela gutxi erabilitakoak",
    noResultsTitle: "Ez da aukerarik aurkitu",
    noResultsDescription: "Saiatu beste termino edo sinonimo batekin.",
    open: "Ireki",
    sections: {
      preferences: "Hobespenak",
      account: "Kontua",
      league: "Liga",
      season: "Denboraldia",
      admin: "Administrazioa",
      help: "Laguntza",
      testing: "Probak",
    },
  },
}

const entryCopyByLocale: Record<Locale, Record<string, EntryCopy>> = {
  es: {
    language: { title: "Idioma", description: "Cambia el idioma de la aplicación.", section: "preferences", keywords: ["lenguaje", "español", "inglés", "euskera"] },
    appearance: { title: "Apariencia", description: "Elige modo claro, oscuro o sistema.", section: "preferences", keywords: ["tema", "modo oscuro", "dark", "claro", "sistema"] },
    notifications: { title: "Notificaciones", description: "Activa push y elige los avisos personales.", section: "preferences", keywords: ["push", "avisos", "recordatorios", "alertas"] },
    payments: { title: "Mis pagos", description: "Consulta deudas, cobros y reservas.", section: "account", keywords: ["dinero", "deuda", "pista", "cuota", "inscripción"] },
    availability: { title: "Mi disponibilidad", description: "Define cuándo puedes jugar.", section: "preferences", keywords: ["horarios", "días", "jugar", "franjas"] },
    help: { title: "Ayuda", description: "Consulta reglas y conceptos de la aplicación.", section: "help", keywords: ["reglas", "star point", "tie break", "tutorial"] },
    activity: { title: "Actividad de la liga", description: "Consulta el historial de cambios y acciones.", section: "league", keywords: ["historial", "auditoría", "eventos", "cambios"] },
    adminView: { title: "Vista admin", description: "Muestra u oculta los accesos de administrador.", section: "preferences", keywords: ["administrador", "ocultar admin", "modo jugador"] },
    leagues: { title: "Mis ligas", description: "Cambia entre ligas de jugador y espectador.", section: "league", keywords: ["cambiar liga", "selector", "espectador"] },
    account: { title: "Cuenta e imagen de perfil", description: "Gestiona tu sesión y avatar.", section: "account", keywords: ["foto", "avatar", "google", "email", "perfil"] },
    joinLeague: { title: "Unirme a una liga", description: "Entra mediante un código o enlace de invitación.", section: "account", keywords: ["invitación", "código", "entrar", "vincular"] },
    createLeague: { title: "Crear nueva liga", description: "Crea una competición desde cero.", section: "league", keywords: ["nueva", "crear", "competición"] },
    unlink: { title: "Desvincularme de esta liga", description: "Libera tu jugador sin borrar el historial.", section: "account", keywords: ["salir", "abandonar", "desvincular"] },
    adminPanel: { title: "Panel de administrador", description: "Accede a toda la gestión de la liga.", section: "admin", keywords: ["admin", "gestión", "configurar"] },
    leagueIdentity: { title: "Identidad de la liga", description: "Edita nombre, descripción y logotipo.", section: "league", keywords: ["logo", "nombre", "descripción", "imagen"] },
    leaguePlaces: { title: "Lugares habituales", description: "Gestiona pistas y ubicaciones.", section: "league", keywords: ["pistas", "ubicaciones", "dirección", "club"] },
    statusColors: { title: "Código de color", description: "Activa o desactiva colores en estados y etiquetas.", section: "league", keywords: ["colores", "etiquetas", "estados", "gris"] },
    playerInvites: { title: "Invitaciones de jugadores", description: "Comparte o regenera el acceso de jugadores.", section: "league", keywords: ["invitar", "código", "enlace", "jugadores"] },
    users: { title: "Jugadores y usuarios", description: "Gestiona cuentas vinculadas y permisos.", section: "league", keywords: ["cuentas", "roles", "administradores", "vinculados"] },
    spectators: { title: "Espectadores", description: "Consulta y retira accesos de solo lectura.", section: "league", keywords: ["público", "solo lectura", "invitación espectador"] },
    rankingAvatars: { title: "Fotos en la clasificación", description: "Muestra u oculta avatares en Ranking y Home.", section: "league", keywords: ["fotos", "imágenes", "avatares", "ranking", "home"] },
    audit: { title: "Historial y auditoría", description: "Revisa toda la actividad administrativa.", section: "admin", keywords: ["actividad", "registro", "eventos", "logs"] },
    leagueNotifications: { title: "Notificaciones de la liga", description: "Activa o desactiva cada tipo de aviso general.", section: "admin", keywords: ["push", "tipos", "avisos", "recordatorios"] },
    seasonAdmin: { title: "Administrar temporada", description: "Gestiona calendario, reglas y estado.", section: "season", keywords: ["temporada", "jornadas", "configuración"] },
    rounds: { title: "Gestión y orden de jornadas", description: "Reordena, activa y finaliza jornadas.", section: "season", keywords: ["orden", "jornadas", "rondas", "calendario"] },
    roundWindow: { title: "Margen de jornadas", description: "Configura fechas y días disponibles por jornada.", section: "season", keywords: ["margen", "fechas", "plazo", "fuera de plazo", "ventana"] },
    calendarAudit: { title: "Equilibrio del calendario", description: "Comprueba compañeros, rivales y partidos.", section: "season", keywords: ["auditoría calendario", "equilibrado", "parejas", "rivales", "whist"] },
    mvp: { title: "Sistema MVP", description: "Configura MVP automático, votación o desactivado.", section: "season", keywords: ["votación", "mejor jugador", "estrella"] },
    confirmations: { title: "Confirmación de resultados", description: "Configura confirmaciones opcionales u obligatorias.", section: "season", keywords: ["resultado", "confirmar", "impugnar", "fijar"] },
    registration: { title: "Inscripción", description: "Activa y modifica la cuota de temporada.", section: "season", keywords: ["cuota", "pago", "importe", "dinero"] },
    seasonPlayers: { title: "Jugadores de la temporada", description: "Revisa los participantes de la temporada.", section: "season", keywords: ["plantilla", "participantes", "jugadores"] },
    closeSeason: { title: "Cerrar o reabrir temporada", description: "Gestiona el estado final de la competición.", section: "season", keywords: ["terminar", "finalizar", "reabrir"] },
    newSeason: { title: "Crear siguiente temporada", description: "Prepara una nueva temporada para la liga.", section: "season", keywords: ["nueva temporada", "siguiente", "crear"] },
    qa: { title: "Herramientas de prueba", description: "Simula resultados, votos y confirmaciones.", section: "testing", keywords: ["qa", "test", "simular", "pruebas"] },
  },
  en: {
    language: { title: "Language", description: "Change the application language.", section: "preferences", keywords: ["english", "spanish", "basque", "locale"] },
    appearance: { title: "Appearance", description: "Choose light, dark or system mode.", section: "preferences", keywords: ["theme", "dark mode", "light", "system"] },
    notifications: { title: "Notifications", description: "Enable push and choose personal alerts.", section: "preferences", keywords: ["push", "alerts", "reminders"] },
    payments: { title: "My payments", description: "Review debts, collections and bookings.", section: "account", keywords: ["money", "debt", "court", "fee", "registration"] },
    availability: { title: "My availability", description: "Define when you can play.", section: "preferences", keywords: ["schedule", "days", "time slots"] },
    help: { title: "Help", description: "Review rules and application concepts.", section: "help", keywords: ["rules", "star point", "tie break", "tutorial"] },
    activity: { title: "League activity", description: "Review the history of changes and actions.", section: "league", keywords: ["history", "audit", "events", "changes"] },
    adminView: { title: "Admin view", description: "Show or hide administration shortcuts.", section: "preferences", keywords: ["administrator", "player mode"] },
    leagues: { title: "My leagues", description: "Switch between player and spectator leagues.", section: "league", keywords: ["switch league", "selector", "spectator"] },
    account: { title: "Account and profile image", description: "Manage your session and avatar.", section: "account", keywords: ["photo", "avatar", "google", "email", "profile"] },
    joinLeague: { title: "Join a league", description: "Enter with an invitation code or link.", section: "account", keywords: ["invitation", "code", "join", "link"] },
    createLeague: { title: "Create a new league", description: "Create a competition from scratch.", section: "league", keywords: ["new", "create", "competition"] },
    unlink: { title: "Unlink from this league", description: "Release your player without deleting history.", section: "account", keywords: ["leave", "unlink", "exit"] },
    adminPanel: { title: "Admin panel", description: "Open all league management tools.", section: "admin", keywords: ["admin", "management", "configure"] },
    leagueIdentity: { title: "League identity", description: "Edit name, description and logo.", section: "league", keywords: ["logo", "name", "description", "image"] },
    leaguePlaces: { title: "Regular venues", description: "Manage courts and locations.", section: "league", keywords: ["courts", "locations", "address", "club"] },
    statusColors: { title: "Status colours", description: "Enable or disable colours in labels.", section: "league", keywords: ["colors", "labels", "status", "grey"] },
    playerInvites: { title: "Player invitations", description: "Share or regenerate player access.", section: "league", keywords: ["invite", "code", "link", "players"] },
    users: { title: "Players and users", description: "Manage linked accounts and permissions.", section: "league", keywords: ["accounts", "roles", "admins", "linked"] },
    spectators: { title: "Spectators", description: "Review and remove read-only access.", section: "league", keywords: ["audience", "read only", "spectator invite"] },
    rankingAvatars: { title: "Photos in standings", description: "Show or hide avatars in Ranking and Home.", section: "league", keywords: ["photos", "images", "avatars", "ranking", "home"] },
    audit: { title: "History and audit", description: "Review all administrative activity.", section: "admin", keywords: ["activity", "log", "events"] },
    leagueNotifications: { title: "League notifications", description: "Enable or disable each general alert type.", section: "admin", keywords: ["push", "types", "alerts", "reminders"] },
    seasonAdmin: { title: "Manage season", description: "Manage calendar, rules and status.", section: "season", keywords: ["season", "rounds", "configuration"] },
    rounds: { title: "Round management and order", description: "Reorder, activate and finish rounds.", section: "season", keywords: ["order", "rounds", "calendar"] },
    roundWindow: { title: "Round window", description: "Configure dates and days available per round.", section: "season", keywords: ["window", "dates", "deadline", "overdue"] },
    calendarAudit: { title: "Calendar balance", description: "Check teammates, opponents and matches.", section: "season", keywords: ["calendar audit", "balanced", "pairs", "opponents"] },
    mvp: { title: "MVP system", description: "Configure automatic, voting or disabled MVP.", section: "season", keywords: ["voting", "best player", "star"] },
    confirmations: { title: "Result confirmations", description: "Configure optional or required confirmations.", section: "season", keywords: ["result", "confirm", "dispute", "lock"] },
    registration: { title: "Registration fee", description: "Enable and edit the season fee.", section: "season", keywords: ["fee", "payment", "amount", "money"] },
    seasonPlayers: { title: "Season players", description: "Review season participants.", section: "season", keywords: ["roster", "participants", "players"] },
    closeSeason: { title: "Close or reopen season", description: "Manage the final competition status.", section: "season", keywords: ["finish", "close", "reopen"] },
    newSeason: { title: "Create next season", description: "Prepare a new season for the league.", section: "season", keywords: ["new season", "next", "create"] },
    qa: { title: "Testing tools", description: "Simulate results, votes and confirmations.", section: "testing", keywords: ["qa", "test", "simulate", "testing"] },
  },
  eu: {
    language: { title: "Hizkuntza", description: "Aldatu aplikazioaren hizkuntza.", section: "preferences", keywords: ["euskara", "gaztelania", "ingelesa"] },
    appearance: { title: "Itxura", description: "Aukeratu modu argia, iluna edo sistema.", section: "preferences", keywords: ["gaia", "modu iluna", "argia", "sistema"] },
    notifications: { title: "Jakinarazpenak", description: "Aktibatu push eta aukeratu abisu pertsonalak.", section: "preferences", keywords: ["push", "abisuak", "oroigarriak"] },
    payments: { title: "Nire ordainketak", description: "Ikusi zorrak, kobrantzak eta erreserbak.", section: "account", keywords: ["dirua", "zor", "pista", "kuota", "izen-ematea"] },
    availability: { title: "Nire erabilgarritasuna", description: "Adierazi noiz joka dezakezun.", section: "preferences", keywords: ["ordutegiak", "egunak", "tarteak"] },
    help: { title: "Laguntza", description: "Ikusi arauak eta aplikazioaren kontzeptuak.", section: "help", keywords: ["arauak", "star point", "tie break", "tutoriala"] },
    activity: { title: "Ligako jarduera", description: "Ikusi aldaketen eta ekintzen historia.", section: "league", keywords: ["historia", "auditoria", "gertaerak", "aldaketak"] },
    adminView: { title: "Admin ikuspegia", description: "Erakutsi edo ezkutatu administrazio sarbideak.", section: "preferences", keywords: ["administratzailea", "jokalari modua"] },
    leagues: { title: "Nire ligak", description: "Aldatu jokalari eta ikusle ligaren artean.", section: "league", keywords: ["liga aldatu", "hautatzailea", "ikuslea"] },
    account: { title: "Kontua eta profileko irudia", description: "Kudeatu saioa eta avatarra.", section: "account", keywords: ["argazkia", "avatarra", "google", "emaila", "profila"] },
    joinLeague: { title: "Liga batera sartu", description: "Sartu gonbidapen kode edo esteka batekin.", section: "account", keywords: ["gonbidapena", "kodea", "sartu", "lotu"] },
    createLeague: { title: "Liga berria sortu", description: "Sortu lehiaketa hutsetik.", section: "league", keywords: ["berria", "sortu", "lehiaketa"] },
    unlink: { title: "Liga honetatik deslotu", description: "Askatu jokalaria historia ezabatu gabe.", section: "account", keywords: ["irten", "utzi", "deslotu"] },
    adminPanel: { title: "Administratzaile panela", description: "Ireki ligaren kudeaketa tresna guztiak.", section: "admin", keywords: ["admin", "kudeaketa", "konfiguratu"] },
    leagueIdentity: { title: "Ligaren identitatea", description: "Editatu izena, deskribapena eta logotipoa.", section: "league", keywords: ["logoa", "izena", "deskribapena", "irudia"] },
    leaguePlaces: { title: "Ohiko lekuak", description: "Kudeatu pistak eta kokapenak.", section: "league", keywords: ["pistak", "kokapenak", "helbidea", "kluba"] },
    statusColors: { title: "Kolore-kodea", description: "Aktibatu edo desaktibatu etiketen koloreak.", section: "league", keywords: ["koloreak", "etiketak", "egoerak", "grisa"] },
    playerInvites: { title: "Jokalarien gonbidapenak", description: "Partekatu edo berritu jokalarien sarbidea.", section: "league", keywords: ["gonbidatu", "kodea", "esteka", "jokalariak"] },
    users: { title: "Jokalariak eta erabiltzaileak", description: "Kudeatu lotutako kontuak eta baimenak.", section: "league", keywords: ["kontuak", "rolak", "administratzaileak", "lotuta"] },
    spectators: { title: "Ikusleak", description: "Ikusi eta kendu irakurketa hutseko sarbideak.", section: "league", keywords: ["publikoa", "irakurketa hutsa", "ikusle gonbidapena"] },
    rankingAvatars: { title: "Argazkiak sailkapenean", description: "Erakutsi edo ezkutatu avatarrak Ranking eta Homen.", section: "league", keywords: ["argazkiak", "irudiak", "avatarrak", "ranking", "home"] },
    audit: { title: "Historia eta auditoria", description: "Ikusi administrazio jarduera osoa.", section: "admin", keywords: ["jarduera", "erregistroa", "gertaerak"] },
    leagueNotifications: { title: "Ligako jakinarazpenak", description: "Aktibatu edo desaktibatu abisu mota bakoitza.", section: "admin", keywords: ["push", "motak", "abisuak", "oroigarriak"] },
    seasonAdmin: { title: "Denboraldia administratu", description: "Kudeatu egutegia, arauak eta egoera.", section: "season", keywords: ["denboraldia", "jardunaldiak", "konfigurazioa"] },
    rounds: { title: "Jardunaldien kudeaketa eta ordena", description: "Berrantolatu, aktibatu eta amaitu jardunaldiak.", section: "season", keywords: ["ordena", "jardunaldiak", "egutegia"] },
    roundWindow: { title: "Jardunaldi-marjina", description: "Konfiguratu jardunaldi bakoitzeko datak eta egunak.", section: "season", keywords: ["marjina", "datak", "epea", "epez kanpo"] },
    calendarAudit: { title: "Egutegiaren oreka", description: "Egiaztatu bikotekideak, aurkariak eta partidak.", section: "season", keywords: ["egutegi auditoria", "orekatua", "bikoteak", "aurkariak"] },
    mvp: { title: "MVP sistema", description: "Konfiguratu MVP automatikoa, bozketa edo desaktibatua.", section: "season", keywords: ["bozketa", "jokalari onena", "izarra"] },
    confirmations: { title: "Emaitzen baieztapena", description: "Konfiguratu aukerako edo nahitaezko baieztapenak.", section: "season", keywords: ["emaitza", "baieztatu", "eztabaidatu", "finkatu"] },
    registration: { title: "Izen-ematea", description: "Aktibatu eta aldatu denboraldiko kuota.", section: "season", keywords: ["kuota", "ordainketa", "zenbatekoa", "dirua"] },
    seasonPlayers: { title: "Denboraldiko jokalariak", description: "Ikusi denboraldiko parte-hartzaileak.", section: "season", keywords: ["zerrenda", "parte-hartzaileak", "jokalariak"] },
    closeSeason: { title: "Denboraldia itxi edo berrireki", description: "Kudeatu lehiaketaren amaierako egoera.", section: "season", keywords: ["amaitu", "itxi", "berrireki"] },
    newSeason: { title: "Hurrengo denboraldia sortu", description: "Prestatu ligaren denboraldi berria.", section: "season", keywords: ["denboraldi berria", "hurrengoa", "sortu"] },
    qa: { title: "Proba tresnak", description: "Simulatu emaitzak, botoak eta baieztapenak.", section: "testing", keywords: ["qa", "test", "simulatu", "probak"] },
  },
}

const routeById: Record<string, string> = {
  language: "/settings#language",
  appearance: "/settings#appearance",
  notifications: "/settings/notifications",
  payments: "/payments",
  availability: "/availability",
  help: "/help",
  activity: "/activity?scope=all",
  adminView: "/settings#admin-view",
  leagues: "/leagues",
  account: "/settings#account",
  joinLeague: "/invite",
  createLeague: "/league/new",
  unlink: "/settings#unlink",
  adminPanel: "/admin",
  leagueIdentity: "/admin/league#identidad",
  leaguePlaces: "/admin/league#lugares",
  statusColors: "/admin#status-colors",
  playerInvites: "/admin#invitations",
  users: "/admin/users#users",
  spectators: "/admin/users#spectators",
  rankingAvatars: "/admin/users#ranking-avatars",
  audit: "/activity?scope=admin",
  leagueNotifications: "/activity?scope=admin#notification-settings",
  seasonAdmin: "/admin/season",
  rounds: "/admin/season#jornadas",
  roundWindow: "/admin/season#margen-jornadas",
  calendarAudit: "/admin/season#equilibrio-calendario",
  mvp: "/admin/season#mvp",
  confirmations: "/admin/season#confirmaciones",
  registration: "/admin/season#inscripcion",
  seasonPlayers: "/admin/season#jugadores",
  closeSeason: "/admin/season#cierre",
  newSeason: "/admin/season#nueva-temporada",
  qa: "/admin/qa",
}

const suggestedIds = new Set(["notifications", "appearance", "leagues", "seasonAdmin", "roundWindow", "users"])

export function getSettingsSearchCopy(locale: Locale) {
  return copyByLocale[locale]
}

export function buildSettingsSearchEntries(
  locale: Locale,
  capabilities: SettingsSearchCapabilities,
): SettingsSearchEntry[] {
  const source = entryCopyByLocale[locale]
  const ids = capabilities.isSpectator
    ? ["language", "appearance", "leagues", "help"]
    : [
        "language",
        "appearance",
        "notifications",
        "payments",
        "availability",
        "help",
        "activity",
        ...(capabilities.hasAdminRole ? ["adminView"] : []),
        "leagues",
        "account",
        "joinLeague",
        ...(capabilities.canCreateLeague ? ["createLeague"] : []),
        ...(capabilities.canSelfUnlink ? ["unlink"] : []),
        ...(capabilities.canAccessAdmin
          ? [
              "adminPanel",
              "leagueIdentity",
              "leaguePlaces",
              "statusColors",
              "playerInvites",
              "users",
              "spectators",
              "rankingAvatars",
              "audit",
              "leagueNotifications",
              "seasonAdmin",
              "rounds",
              "roundWindow",
              "calendarAudit",
              "mvp",
              "confirmations",
              "registration",
              "seasonPlayers",
              "closeSeason",
              "newSeason",
              ...(capabilities.qaEnabled ? ["qa"] : []),
            ]
          : []),
      ]

  return ids.map((id) => {
    const item = source[id]

    return {
      id,
      title: item.title,
      description: item.description,
      section: copyByLocale[locale].sections[item.section],
      href: routeById[id],
      keywords: item.keywords,
      suggested: suggestedIds.has(id),
    }
  })
}
