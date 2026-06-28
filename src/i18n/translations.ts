import { en } from "./locales/en"
import { es } from "./locales/es"
import { eu } from "./locales/eu"

export const defaultLocale = "es"

export const translations = {
  es,
  en,
  eu,
} as const

export type Locale = keyof typeof translations
export type TranslationDictionary = typeof es

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function deepMerge<T extends Record<string, unknown>>(
  base: T,
  override: Record<string, unknown>
): T {
  const result = { ...base } as Record<string, unknown>

  Object.entries(override).forEach(([key, value]) => {
    const baseValue = result[key]

    if (isObject(baseValue) && isObject(value)) {
      result[key] = deepMerge(baseValue, value)
    } else {
      result[key] = value
    }
  })

  return result as T
}

export function getTranslations(locale: Locale = defaultLocale) {
  if (locale === defaultLocale) {
    return es
  }

  return deepMerge(es, translations[locale] as Record<string, unknown>)
}