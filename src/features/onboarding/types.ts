import type { Locale } from "@/i18n/translations"

export type OnboardingTourKey =
  | "app-introduction"
  | "home"
  | "matches"
  | "chats"
  | "match"
  | "competitions"
  | "notification-settings"
  | "personal-matches"
  | "personal-match"
  | "payments"
  | "chat"
  | "ranking"
  | "statistics"
  | "season-admin"
  | "settings"

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
  firstRunOnly?: boolean
  wide?: boolean
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
  screenVideo: string
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
      allTutorials: "Help and tutorials",
      screenVideo: "Watch this screen's video",
      noTourTitle: "No guide on this screen",
      noTourDescription: "Open Help to see the available videos, guides and rules.",
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
      allTutorials: "Laguntza eta tutorialak",
      screenVideo: "Ikusi pantaila honen bideoa",
      noTourTitle: "Ez dago gidarik pantaila honetan",
      noTourDescription: "Ireki Laguntza eskuragarri dauden bideoak, gidak eta arauak ikusteko.",
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
    allTutorials: "Ayuda y tutoriales",
    screenVideo: "Ver el vídeo de esta pantalla",
    noTourTitle: "Esta pantalla no tiene guía",
    noTourDescription: "Abre Ayuda para ver los vídeos, las guías y las reglas disponibles.",
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
