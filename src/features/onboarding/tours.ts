import type { Locale } from "@/i18n/translations"
import type {
  OnboardingAudience,
  OnboardingTourDefinition,
  OnboardingTourKey,
  OnboardingTourStep,
} from "./types"

const everyone = () => true
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
          title: "Resumen de la liga",
          description: "La cabecera identifica la liga, la temporada seleccionada y si ya ha finalizado.",
        },
        {
          title: "Comunicados importantes",
          description: "Los avisos de los administradores aparecen aquí para que no se pierdan entre los partidos.",
        },
        {
          title: "Tu siguiente partido",
          description: "Abre la tarjeta para consultar jugadores, fecha, ubicación, disponibilidad y acciones del encuentro.",
        },
        {
          title: "Temporadas terminadas",
          description: "Cuando la temporada finaliza, desde aquí puedes consultar su histórico o compartir el resumen final.",
        },
      ],
    },
    matches: {
      title: "Partidos y jornadas",
      description: "Consulta el calendario completo o céntrate únicamente en tus encuentros.",
      steps: [
        {
          title: "Calendario de la temporada",
          description: "La cabecera confirma la liga y temporada que estás consultando.",
        },
        {
          title: "Todos o solo los tuyos",
          description: "Cambia entre el calendario completo y una vista filtrada con los partidos en los que participas.",
        },
        {
          title: "Jornadas y estados",
          description: "Cada bloque agrupa los partidos de una jornada e indica si está próxima, activa, fuera de plazo o completada.",
        },
      ],
    },
    ranking: {
      title: "Clasificación",
      description: "Interpreta posiciones, puntos y criterios de desempate.",
      steps: [
        {
          title: "Clasificación de la temporada",
          description: "Comprueba la liga y temporada antes de comparar posiciones.",
        },
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
          title: "Selecciona el periodo",
          description: "Cambia de temporada o elige toda la liga para analizar el histórico acumulado.",
        },
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
    "season-admin": {
      title: "Administrar temporada",
      description: "Configura calendario, reglas, participantes y estado sin recorrer la pantalla a ciegas.",
      steps: [
        {
          title: "Temporada seleccionada",
          description: "Antes de editar, confirma la liga, temporada y estado que aparecen en la cabecera.",
        },
        {
          title: "Accesos rápidos",
          description: "Estos botones llevan directamente a calendario, reglas, personas y acciones de estado.",
        },
        {
          title: "Calendario y jornadas",
          description: "Aquí defines el formato, el orden y el margen de las jornadas de la temporada.",
        },
        {
          title: "Jugadores e inscripción",
          description: "Gestiona participantes, plazas e inscripción según el modo configurado para la temporada.",
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
          title: "League overview",
          description: "The header identifies the league, selected season and whether it has already finished.",
        },
        {
          title: "Important announcements",
          description: "Administrator notices appear here so they do not get lost among the matches.",
        },
        {
          title: "Your next match",
          description: "Open the card to check players, date, location, availability and match actions.",
        },
        {
          title: "Finished seasons",
          description: "When a season ends, use these actions to open its history or share the final summary.",
        },
      ],
    },
    matches: {
      title: "Matches and rounds",
      description: "Browse the full calendar or focus only on your own matches.",
      steps: [
        {
          title: "Season calendar",
          description: "The header confirms the league and season you are currently viewing.",
        },
        {
          title: "All matches or only yours",
          description: "Switch between the full calendar and a filtered view of the matches you play in.",
        },
        {
          title: "Rounds and statuses",
          description: "Each block groups one round and shows whether it is upcoming, active, overdue or completed.",
        },
      ],
    },
    ranking: {
      title: "Standings",
      description: "Understand positions, points and tie-break rules.",
      steps: [
        {
          title: "Season standings",
          description: "Check the league and season before comparing positions.",
        },
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
          title: "Choose the period",
          description: "Change season or select the whole league to analyse the combined history.",
        },
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
    "season-admin": {
      title: "Season administration",
      description: "Configure the calendar, rules, participants and status without searching through the page.",
      steps: [
        {
          title: "Selected season",
          description: "Before editing, confirm the league, season and status shown in the header.",
        },
        {
          title: "Quick links",
          description: "These buttons take you directly to calendar, rules, people and status actions.",
        },
        {
          title: "Calendar and rounds",
          description: "Define the format, order and timing margin for the season rounds here.",
        },
        {
          title: "Players and registration",
          description: "Manage participants, available places and registration according to the season mode.",
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
          title: "Ligaren laburpena",
          description: "Goiburuak liga, hautatutako denboraldia eta amaituta dagoen adierazten ditu.",
        },
        {
          title: "Ohar garrantzitsuak",
          description: "Administratzaileen oharrak hemen agertzen dira partidetan gal ez daitezen.",
        },
        {
          title: "Zure hurrengo partida",
          description: "Ireki txartela jokalariak, data, kokapena, erabilgarritasuna eta partidaren ekintzak ikusteko.",
        },
        {
          title: "Amaitutako denboraldiak",
          description: "Denboraldia amaitzean, hemendik historia ireki edo azken laburpena parteka dezakezu.",
        },
      ],
    },
    matches: {
      title: "Partidak eta jardunaldiak",
      description: "Ikusi egutegi osoa edo zure partidetan bakarrik jarri arreta.",
      steps: [
        {
          title: "Denboraldiaren egutegia",
          description: "Goiburuak kontsultatzen ari zaren liga eta denboraldia berresten ditu.",
        },
        {
          title: "Guztiak edo zureak bakarrik",
          description: "Aldatu egutegi osoaren eta parte hartzen duzun partiden ikuspegi iragaziaren artean.",
        },
        {
          title: "Jardunaldiak eta egoerak",
          description: "Bloke bakoitzak jardunaldi bat biltzen du eta hurrengoa, aktiboa, epez kanpo edo osatua den erakusten du.",
        },
      ],
    },
    ranking: {
      title: "Sailkapena",
      description: "Ulertu postuak, puntuak eta berdinketa-irizpideak.",
      steps: [
        {
          title: "Denboraldiko sailkapena",
          description: "Egiaztatu liga eta denboraldia postuak alderatu aurretik.",
        },
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
          title: "Aukeratu aldia",
          description: "Aldatu denboraldia edo hautatu liga osoa historia metatua aztertzeko.",
        },
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
    "season-admin": {
      title: "Denboraldia administratu",
      description: "Konfiguratu egutegia, arauak, parte-hartzaileak eta egoera pantailan galdu gabe.",
      steps: [
        {
          title: "Hautatutako denboraldia",
          description: "Editatu aurretik, egiaztatu goiburuan agertzen diren liga, denboraldia eta egoera.",
        },
        {
          title: "Sarbide azkarrak",
          description: "Botoi hauek egutegira, arauetara, pertsonetara eta egoera-ekintzetara eramaten zaituzte.",
        },
        {
          title: "Egutegia eta jardunaldiak",
          description: "Hemen definitzen dituzu denboraldiko jardunaldien formatua, ordena eta denbora-marjina.",
        },
        {
          title: "Jokalariak eta izen-ematea",
          description: "Kudeatu parte-hartzaileak, plazak eta izen-ematea denboraldiaren moduaren arabera.",
        },
      ],
    },
  },
}

const tourStructure: Array<{
  key: OnboardingTourKey
  route: string
  audience: (audience: OnboardingAudience) => boolean
  steps: Array<Pick<OnboardingTourStep, "selector" | "side">>
}> = [
  {
    key: "app-introduction",
    route: "/",
    audience: everyone,
    steps: [
      { side: "center" },
      { selector: "[data-tour='home-header']", side: "bottom" },
      { selector: "[data-tour='bottom-navigation']", side: "top" },
      { selector: "[data-tour='floating-help']", side: "bottom" },
    ],
  },
  {
    key: "home",
    route: "/",
    audience: everyone,
    steps: [
      { selector: "[data-tour='home-header']", side: "bottom" },
      { selector: "[data-tour='home-announcements']", side: "bottom" },
      { selector: "[data-tour='home-next-match']", side: "top" },
      { selector: "[data-tour='home-season-actions']", side: "top" },
    ],
  },
  {
    key: "matches",
    route: "/matches",
    audience: everyone,
    steps: [
      { selector: "[data-tour='matches-header']", side: "bottom" },
      { selector: "[data-tour='matches-scope']", side: "bottom" },
      { selector: "[data-tour='matches-round-list']", side: "top" },
    ],
  },
  {
    key: "ranking",
    route: "/ranking",
    audience: everyone,
    steps: [
      { selector: "[data-tour='ranking-header']", side: "bottom" },
      { selector: "[data-tour='ranking-table']", side: "top" },
      { selector: "[data-tour='ranking-statistics-link']", side: "top" },
    ],
  },
  {
    key: "statistics",
    route: "/statistics",
    audience: everyone,
    steps: [
      { selector: "[data-tour='statistics-header']", side: "bottom" },
      { selector: "[data-tour='statistics-highlights']", side: "bottom" },
      { selector: "[data-tour='statistics-navigation']", side: "top" },
    ],
  },
  {
    key: "season-admin",
    route: "/admin/season",
    audience: managers,
    steps: [
      { selector: "[data-tour='season-admin-header']", side: "bottom" },
      { selector: "[data-tour='season-admin-navigation']", side: "bottom" },
      { selector: "[data-tour='season-admin-calendar']", side: "top" },
      { selector: "[data-tour='season-admin-people']", side: "top" },
    ],
  },
]

export function getOnboardingTours(locale: Locale): OnboardingTourDefinition[] {
  return tourStructure.map((definition) => {
    const text = tourTexts[locale][definition.key]
    return {
      key: definition.key,
      version: 1,
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

export function getTourForPathname({
  pathname,
  locale,
  audience,
  preferIntroduction = false,
}: {
  pathname: string
  locale: Locale
  audience: OnboardingAudience
  preferIntroduction?: boolean
}) {
  const tours = getOnboardingTours(locale).filter((tour) => tour.audience(audience))

  if (pathname === "/" && preferIntroduction) {
    return tours.find((tour) => tour.key === "app-introduction") ?? null
  }

  return tours.find((tour) => tour.route === pathname && tour.key !== "app-introduction") ?? null
}
