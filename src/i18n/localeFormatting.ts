import type { Locale } from "./translations"

export function getIntlLocale(locale: Locale) {
  if (locale === "en") return "en-GB"
  if (locale === "eu") return "eu-ES"
  return "es-ES"
}

export function decodeJsxEntities(value: string) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
}
