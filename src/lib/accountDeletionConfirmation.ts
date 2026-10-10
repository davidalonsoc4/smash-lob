import type { Locale } from "@/i18n/translations"

export const accountDeletionApiConfirmation = "ELIMINAR MI CUENTA"
export const accountDeletionPhrases: Record<Locale, string> = {
  es: "ELIMINAR MI CUENTA", en: "DELETE MY ACCOUNT", eu: "KONTUA EZABATU",
}

export function isAccountDeletionConfirmation(value: string, locale: Locale) {
  return value.trim().toUpperCase() === accountDeletionPhrases[locale]
}
