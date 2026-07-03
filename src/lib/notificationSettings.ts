import type { ActivityEventType } from "@/lib/activity"

export type NotificationPreferenceKey =
  | "next_match"
  | "my_match_result"
  | "season_events"
  | "booking_i_owe"
  | "booking_paid_to_me"

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export type NotificationPreferenceDefinition = {
  key: NotificationPreferenceKey
  title: string
  description: string
  eventTypes: ActivityEventType[]
}

export const notificationPreferenceDefinitions: NotificationPreferenceDefinition[] = [
  {
    key: "next_match",
    title: "Mi próximo partido",
    description:
      "Programación, cambios de fecha, lugar, pista o aplazamientos de partidos en los que juegas.",
    eventTypes: ["match_scheduled", "match_schedule_updated", "match_postponed"],
  },
  {
    key: "my_match_result",
    title: "Resultados de mis partidos",
    description:
      "Resultado informado, modificado o eliminado en cualquier partido en el que participas.",
    eventTypes: [
      "match_result_saved",
      "match_result_updated",
      "match_result_cleared",
    ],
  },
  {
    key: "season_events",
    title: "Temporadas",
    description:
      "Nueva temporada creada, temporada iniciada o temporada finalizada en tu liga.",
    eventTypes: ["season_created", "season_started", "season_finished"],
  },
  {
    key: "booking_i_owe",
    title: "Pagos pendientes de pista",
    description:
      "Una reserva indica que tienes que pagar tu parte a otro jugador.",
    eventTypes: ["court_booking_updated"],
  },
  {
    key: "booking_paid_to_me",
    title: "Pagos recibidos de pista",
    description:
      "Alguien que te debía una transferencia de pista la marca como pagada.",
    eventTypes: ["court_booking_payment_paid"],
  },
]

export const notificationPreferenceKeys = notificationPreferenceDefinitions.map(
  (definition) => definition.key
)

export const defaultNotificationPreferences = notificationPreferenceKeys.reduce(
  (preferences, key) => {
    preferences[key] = true
    return preferences
  },
  {} as NotificationPreferences
)

export function normalizeNotificationPreferences(
  value: unknown
): NotificationPreferences {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return { ...defaultNotificationPreferences }
  }

  const rawPreferences = value as Record<string, unknown>

  return notificationPreferenceKeys.reduce((preferences, key) => {
    preferences[key] =
      typeof rawPreferences[key] === "boolean"
        ? rawPreferences[key]
        : defaultNotificationPreferences[key]
    return preferences
  }, {} as NotificationPreferences)
}

export function getNotificationPreferenceKeyForEvent(
  eventType: ActivityEventType
): NotificationPreferenceKey | null {
  return (
    notificationPreferenceDefinitions.find((definition) =>
      definition.eventTypes.includes(eventType)
    )?.key ?? null
  )
}
