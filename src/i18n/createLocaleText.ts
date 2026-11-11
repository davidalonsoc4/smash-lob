import { decodeJsxEntities } from "./localeFormatting"
import { es } from "./locales/es"
import type { TranslationDictionary } from "./translations"

type DictionaryRecord = Record<string, unknown>

function mergeDictionary(base: DictionaryRecord, override: DictionaryRecord): DictionaryRecord {
  const result = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key]
    result[key] = isRecord(baseValue) && isRecord(value) ? mergeDictionary(baseValue, value) : value
  }
  return result
}

function isRecord(value: unknown): value is DictionaryRecord {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function flattenDictionary(
  source: DictionaryRecord,
  target: DictionaryRecord,
  result: Map<string, string>,
) {
  Object.entries(source).forEach(([key, sourceValue]) => {
    const targetValue = target[key]

    if (typeof sourceValue === "string" && typeof targetValue === "string") {
      result.set(decodeJsxEntities(sourceValue), targetValue)
      return
    }

    if (
      sourceValue &&
      targetValue &&
      typeof sourceValue === "object" &&
      typeof targetValue === "object" &&
      !Array.isArray(sourceValue) &&
      !Array.isArray(targetValue)
    ) {
      flattenDictionary(
        sourceValue as DictionaryRecord,
        targetValue as DictionaryRecord,
        result,
      )
    }
  })
}

function buildTemplateRegExp(sourceTemplate: string) {
  const escaped = sourceTemplate
    .split("{}")
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("(.*?)")
  return new RegExp(`^${escaped}$`)
}

export function createLocaleText(
  dictionary: DictionaryRecord,
  overrides: readonly Readonly<Record<string, string>>[],
  dynamicTemplates: readonly (readonly [string, string])[],
  specialRules: readonly (readonly [RegExp, (...captures: string[]) => string])[],
) {
  const dictionaryValues = new Map<string, string>()
  flattenDictionary(es, dictionary, dictionaryValues)
  const templates = [...dynamicTemplates]
    .sort(([left], [right]) => right.length - left.length)
    .map(([source, target]) => [buildTemplateRegExp(source), target] as const)

  function tx(rawSource: string): string {
    const source = decodeJsxEntities(rawSource)
    if (!source) return source
    for (const table of overrides) {
      const value = table[source]
      if (typeof value === "string") return value
    }
    const dictionaryValue = dictionaryValues.get(source)
    if (dictionaryValue) return dictionaryValue

    for (const [pattern, format] of specialRules) {
      const match = source.match(pattern)
      if (match) return format(...match.slice(1))
    }
    for (const [pattern, target] of templates) {
      const match = source.match(pattern)
      if (match) return target.replace(/\{(\d+)\}/g, (_placeholder, index: string) => tx(match[Number(index) + 1] ?? ""))
    }
    return source
  }

  return { t: mergeDictionary(es, dictionary) as TranslationDictionary, tx }
}
