import { enText } from "./locales/enText"
import { euText } from "./locales/euText"
import { decodeJsxEntities } from "./localeFormatting"
import type { Locale } from "./translations"

export { getIntlLocale } from "./localeFormatting"

export function translateLeagueText(locale: Locale, source: string) {
  if (locale === "es") return decodeJsxEntities(source)
  return (locale === "en" ? enText : euText).tx(source)
}
