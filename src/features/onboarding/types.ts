import type { Locale } from "@/i18n/translations"

export type OnboardingTourKey =
  | "app-introduction"
  | "home"
  | "matches"
  | "ranking"
  | "statistics"
  | "season-admin"

export type OnboardingProgressStatus = "completed" | "skipped"

export type OnboardingProgressItem = {
  tourKey: OnboardingTourKey
  tourVersion: number
  status: OnboardingProgressStatus
  completedAt: string | null
  skippedAt: string | null
}

export type OnboardingAudience = {
  isSuperuser: boolean
  isSpectator: boolean
  isLeagueAdmin: boolean
}

export type OnboardingTourStep = {
  selector?: string
  title: string
  description: string
  side?: "top" | "right" | "bottom" | "left" | "center"
}

export type OnboardingTourDefinition = {
  key: OnboardingTourKey
  version: number
  route: string
  title: string
  description: string
  audience: (audience: OnboardingAudience) => boolean
  steps: OnboardingTourStep[]
}

export type OnboardingCopy = {
  helpLabel: string
  helpTitle: string
  helpDescription: string
  startCurrent: string
  repeatCurrent: string
  allTutorials: string
  noTourTitle: string
  noTourDescription: string
  close: string
  previous: string
  next: string
  finish: string
  skip: string
  stepProgress: (current: number, total: number) => string
  completed: string
  pending: string
  unavailable: string
  libraryEyebrow: string
  libraryTitle: string
  libraryDescription: string
  openScreen: string
  resetAll: string
  resetDone: string
}

export function getOnboardingCopy(locale: Locale): OnboardingCopy {
  if (locale === "en") {
    return {
      helpLabel: "Help for this screen",
      helpTitle: "Screen help",
      helpDescription: "See a short visual guide to the features available here.",
      startCurrent: "Start guide",
      repeatCurrent: "Repeat guide",
      allTutorials: "All tutorials",
      noTourTitle: "No guide on this screen",
      noTourDescription: "Open the tutorial library to see the available guides.",
      close: "Close",
      previous: "Previous",
      next: "Next",
      finish: "Finish",
      skip: "Skip",
      stepProgress: (current, total) => `${current} of ${total}`,
      completed: "Completed",
      pending: "Not viewed",
      unavailable: "Unavailable for your role",
      libraryEyebrow: "Guides",
      libraryTitle: "Visual tutorials",
      libraryDescription: "Repeat any guide or open its screen to learn each feature in context.",
      openScreen: "Open guide",
      resetAll: "Show all again",
      resetDone: "Reset",
    }
  }

  if (locale === "eu") {
    return {
      helpLabel: "Pantaila honetako laguntza",
      helpTitle: "Pantailako laguntza",
      helpDescription: "Ikusi hemen dauden funtzioen gida bisual laburra.",
      startCurrent: "Gida hasi",
      repeatCurrent: "Gida errepikatu",
      allTutorials: "Tutorial guztiak",
      noTourTitle: "Ez dago gidarik pantaila honetan",
      noTourDescription: "Ireki tutorialen liburutegia eskuragarri dauden gidak ikusteko.",
      close: "Itxi",
      previous: "Aurrekoa",
      next: "Hurrengoa",
      finish: "Amaitu",
      skip: "Saltatu",
      stepProgress: (current, total) => `${current}/${total}`,
      completed: "Osatuta",
      pending: "Ikusi gabe",
      unavailable: "Ez dago erabilgarri zure rolarentzat",
      libraryEyebrow: "Gidak",
      libraryTitle: "Tutorial bisualak",
      libraryDescription: "Errepikatu edozein gida edo ireki dagokion pantaila funtzioak testuinguruan ikasteko.",
      openScreen: "Gida ireki",
      resetAll: "Guztiak berriro erakutsi",
      resetDone: "Berrezarrita",
    }
  }

  return {
    helpLabel: "Ayuda de esta pantalla",
    helpTitle: "Ayuda de esta pantalla",
    helpDescription: "Consulta una guía visual breve de las funciones disponibles aquí.",
    startCurrent: "Ver guía",
    repeatCurrent: "Repetir guía",
    allTutorials: "Todos los tutoriales",
    noTourTitle: "Esta pantalla no tiene guía",
    noTourDescription: "Abre la biblioteca para consultar todos los tutoriales disponibles.",
    close: "Cerrar",
    previous: "Anterior",
    next: "Siguiente",
    finish: "Terminar",
    skip: "Omitir",
    stepProgress: (current, total) => `${current} de ${total}`,
    completed: "Completado",
    pending: "Sin ver",
    unavailable: "No disponible para tu rol",
    libraryEyebrow: "Guías",
    libraryTitle: "Tutoriales visuales",
    libraryDescription: "Repite cualquier guía o abre su pantalla para aprender cada función en contexto.",
    openScreen: "Abrir guía",
    resetAll: "Mostrar todos de nuevo",
    resetDone: "Restablecidos",
  }
}
