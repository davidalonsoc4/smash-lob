import { getIntlLocale } from "@/i18n/leagueText"
import type { Locale } from "@/i18n/translations"

type RegistrationFeeInput = {
  enabled: boolean
  amount: number
  purpose?: string | null
}

export type MediaKitWelcomeLetterInput = {
  locale: Locale
  recipientName?: string
  recipientGender?: "masculine" | "feminine"
  leagueName: string
  seasonName: string
  playerCount: number
  totalRounds: number
  hasByes: boolean
  registrationFee: RegistrationFeeInput
  scheduledStartAt?: string | null
  openingRoundEnabled?: boolean
  openingRoundAt?: string | null
  openingRoundLocation?: string | null
}

export type MediaKitWelcomeLetter = {
  eyebrow: string
  title: string
  bodyText: string
  signoff: string
  signature: string
}

const TIME_ZONE = "Europe/Madrid"

function formatDateTime(value: string | null | undefined, locale: Locale) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TIME_ZONE,
  }).format(date)
}

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function spanish(input: MediaKitWelcomeLetterInput): MediaKitWelcomeLetter {
  const recipientName = input.recipientName?.trim()
  const welcomeWord = input.recipientGender === "feminine" ? "Bienvenida" : "Bienvenido"
  const paragraphs = [
    `Nos complace darte la bienvenida a ${input.leagueName}${recipientName ? `, ${recipientName}` : ""}.`,
    "Desde este momento formas parte de una competición diseñada para ofrecer una experiencia de pádel organizada, equilibrada y cuidada en cada detalle.",
    "Toda la actividad de la liga se gestiona desde la aplicación oficial de Smash & Lob. Accede mediante el enlace de invitación, completa tu perfil de jugador y encontrarás en un único espacio tu calendario, próximos partidos, resultados, clasificación y comunicaciones de la temporada.",
    `La competición sigue el Formato Smash & Lob: clasificación individual, rotación de compañeros y rivales y un calendario generado para buscar el mayor equilibrio posible a lo largo de sus ${input.totalRounds} jornadas.`,
  ]

  if (input.hasByes) {
    paragraphs.push("El calendario incluye jornadas de descanso, distribuidas por el sistema para mantener un reparto lo más equilibrado posible entre todos los participantes.")
  }

  if (input.registrationFee.enabled && input.registrationFee.amount > 0) {
    const purpose = input.registrationFee.purpose?.trim()
    paragraphs.push(`La inscripción de esta temporada es de ${formatMoney(input.registrationFee.amount, input.locale)} por jugador${purpose ? ` y está destinada a ${purpose}` : ""}. El estado del pago puede consultarse desde la propia liga.`)
  }

  const openingAt = formatDateTime(input.openingRoundAt, input.locale)
  if (input.openingRoundEnabled && openingAt) {
    const location = input.openingRoundLocation?.trim()
    paragraphs.push(`La Jornada de Apertura se celebrará el ${openingAt}${location ? ` en ${location}` : ""}. La información de la jornada quedará disponible en la aplicación.`)
  } else {
    const scheduledAt = formatDateTime(input.scheduledStartAt, input.locale)
    if (scheduledAt) paragraphs.push(`El inicio de la temporada está programado para el ${scheduledAt}.`)
  }

  paragraphs.push("Agradecemos que formes parte de esta edición y esperamos que disfrutes de la competición.")
  paragraphs.push(`${welcomeWord} a Smash & Lob.`)

  return {
    eyebrow: "Comunicación oficial",
    title: "Carta de bienvenida",
    bodyText: paragraphs.join("\n\n"),
    signoff: "Atentamente,",
    signature: `Organización de ${input.leagueName}`,
  }
}

function english(input: MediaKitWelcomeLetterInput): MediaKitWelcomeLetter {
  const recipientName = input.recipientName?.trim()
  const paragraphs = [
    `We are pleased to welcome you to ${input.leagueName}${recipientName ? `, ${recipientName}` : ""}.`,
    "From this moment, you are part of a competition designed to provide an organised, balanced and carefully managed padel experience.",
    "All league activity is managed through the official Smash & Lob app. Join through your invitation link, complete your player profile and use one place to check your calendar, upcoming matches, results, standings and season communications.",
    `The competition follows the Smash & Lob Format: individual standings, rotating partners and opponents, and a calendar generated to seek the best possible balance throughout its ${input.totalRounds} rounds.`,
  ]

  if (input.hasByes) paragraphs.push("The calendar includes rest rounds, distributed by the system to keep them as balanced as possible across all participants.")
  if (input.registrationFee.enabled && input.registrationFee.amount > 0) {
    const purpose = input.registrationFee.purpose?.trim()
    paragraphs.push(`The registration fee for this season is ${formatMoney(input.registrationFee.amount, input.locale)} per player${purpose ? ` and is intended for ${purpose}` : ""}. Payment status can be checked in the league.`)
  }
  const openingAt = formatDateTime(input.openingRoundAt, input.locale)
  if (input.openingRoundEnabled && openingAt) {
    const location = input.openingRoundLocation?.trim()
    paragraphs.push(`The Opening Round will take place on ${openingAt}${location ? ` at ${location}` : ""}. Round information will be available in the app.`)
  } else {
    const scheduledAt = formatDateTime(input.scheduledStartAt, input.locale)
    if (scheduledAt) paragraphs.push(`The season is scheduled to start on ${scheduledAt}.`)
  }
  paragraphs.push("Thank you for being part of this edition. We hope you enjoy the competition.")
  paragraphs.push(`Welcome to Smash & Lob.`)

  return {
    eyebrow: "Official communication",
    title: "Welcome letter",
    bodyText: paragraphs.join("\n\n"),
    signoff: "Sincerely,",
    signature: `Organisation of ${input.leagueName}`,
  }
}

function basque(input: MediaKitWelcomeLetterInput): MediaKitWelcomeLetter {
  const recipientName = input.recipientName?.trim()
  const paragraphs = [
    `Poz handia ematen digu ${input.leagueName} ligara ongietorria emateak${recipientName ? `, ${recipientName}` : ""}.`,
    "Une honetatik aurrera, padel esperientzia antolatu, orekatu eta xehetasunez zaindua eskaintzeko diseinatutako lehiaketa baten parte zara.",
    "Ligako jarduera guztia Smash & Lob aplikazio ofizialetik kudeatzen da. Sartu gonbidapen-estekaren bidez, osatu jokalari-profila eta kontsultatu toki bakarrean egutegia, hurrengo partidak, emaitzak, sailkapena eta denboraldiko komunikazioak.",
    `Lehiaketak Smash & Lob Formatua jarraitzen du: banakako sailkapena, bikotekide eta aurkari txandakatuak eta ${input.totalRounds} jardunaldietan ahalik eta oreka handiena bilatzeko sortutako egutegia.`,
  ]

  if (input.hasByes) paragraphs.push("Egutegiak atseden-jardunaldiak ditu, sistemak parte-hartzaile guztien artean ahalik eta modu orekatuenean banatuta.")
  if (input.registrationFee.enabled && input.registrationFee.amount > 0) {
    const purpose = input.registrationFee.purpose?.trim()
    paragraphs.push(`Denboraldi honetako izen-ematea ${formatMoney(input.registrationFee.amount, input.locale)} da jokalari bakoitzeko${purpose ? `, eta honetara bideratzen da: ${purpose}` : ""}. Ordainketaren egoera ligan bertan kontsulta daiteke.`)
  }
  const openingAt = formatDateTime(input.openingRoundAt, input.locale)
  if (input.openingRoundEnabled && openingAt) {
    const location = input.openingRoundLocation?.trim()
    paragraphs.push(`Irekiera-jardunaldia ${openingAt}${location ? `, ${location} kokalekuan` : ""} izango da. Jardunaldiaren informazioa aplikazioan egongo da eskuragarri.`)
  } else {
    const scheduledAt = formatDateTime(input.scheduledStartAt, input.locale)
    if (scheduledAt) paragraphs.push(`Denboraldiaren hasiera ${scheduledAt} datarako programatuta dago.`)
  }
  paragraphs.push("Eskerrik asko edizio honen parte izateagatik. Lehiaketaz gozatzea espero dugu.")
  paragraphs.push(`Ongi etorri Smash & Lob-era.`)

  return {
    eyebrow: "Komunikazio ofiziala",
    title: "Ongietorri-gutuna",
    bodyText: paragraphs.join("\n\n"),
    signoff: "Adeitasunez,",
    signature: `${input.leagueName} ligaren antolakuntza`,
  }
}

export function buildMediaKitWelcomeLetter(input: MediaKitWelcomeLetterInput): MediaKitWelcomeLetter {
  if (input.locale === "en") return english(input)
  if (input.locale === "eu") return basque(input)
  return spanish(input)
}
