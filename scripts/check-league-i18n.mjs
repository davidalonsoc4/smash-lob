import fs from "node:fs"
import path from "node:path"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const ts = require("typescript")
const root = process.cwd()

function fail(messages) {
  const lines = Array.isArray(messages) ? messages : [messages]
  console.error("League i18n/UI incompleto:")
  lines.forEach((message) => console.error(`- ${message}`))
  process.exit(1)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

function sourceFile(relativePath) {
  const filePath = path.join(root, relativePath)
  const source = fs.readFileSync(filePath, "utf8")
  return ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
}

function unwrapExpression(node) {
  let current = node
  while (
    current &&
    (ts.isAsExpression(current) ||
      ts.isSatisfiesExpression?.(current) ||
      ts.isParenthesizedExpression(current))
  ) {
    current = current.expression
  }
  return current
}

function propertyName(node, source) {
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node) || ts.isNumericLiteral(node)) {
    return node.text
  }
  return node.getText(source).replace(/^['"]|['"]$/g, "")
}

function findVariableInitializer(relativePath, variableName) {
  const source = sourceFile(relativePath)
  let initializer = null

  function visit(node) {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === variableName &&
      node.initializer
    ) {
      initializer = unwrapExpression(node.initializer)
      return
    }
    ts.forEachChild(node, visit)
  }

  visit(source)
  if (!initializer) {
    fail(`${relativePath}: no se encuentra ${variableName}`)
  }
  return { source, initializer }
}

function getObjectProperty(objectNode, source, name) {
  if (!ts.isObjectLiteralExpression(objectNode)) return null
  for (const property of objectNode.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    if (propertyName(property.name, source) === name) {
      return unwrapExpression(property.initializer)
    }
  }
  return null
}

function collectStringLeaves(objectNode, source, prefix = "", result = new Map()) {
  if (!ts.isObjectLiteralExpression(objectNode)) return result

  for (const property of objectNode.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const key = propertyName(property.name, source)
    const nextPath = prefix ? `${prefix}.${key}` : key
    const value = unwrapExpression(property.initializer)

    if (ts.isObjectLiteralExpression(value)) {
      collectStringLeaves(value, source, nextPath, result)
    } else if (ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      result.set(nextPath, value.text)
    }
  }

  return result
}

function collectObjectStringEntries(objectNode, source) {
  const result = new Map()
  if (!ts.isObjectLiteralExpression(objectNode)) return result

  for (const property of objectNode.properties) {
    if (!ts.isPropertyAssignment(property)) continue
    const value = unwrapExpression(property.initializer)
    if (ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value)) {
      result.set(propertyName(property.name, source), value.text)
    }
  }

  return result
}

function collectLocaleDictionary(locale) {
  const relativePath = `src/i18n/locales/${locale}.ts`
  const { source, initializer } = findVariableInitializer(relativePath, locale)
  return collectStringLeaves(initializer, source)
}

const dictionaries = {
  es: collectLocaleDictionary("es"),
  en: collectLocaleDictionary("en"),
  eu: collectLocaleDictionary("eu"),
}

const parityErrors = []
for (const locale of ["en", "eu"]) {
  for (const key of dictionaries.es.keys()) {
    if (!dictionaries[locale].has(key)) {
      parityErrors.push(`${locale}: falta la clave ${key}`)
    }
  }
  for (const key of dictionaries[locale].keys()) {
    if (!dictionaries.es.has(key)) {
      parityErrors.push(`${locale}: sobra la clave ${key}`)
    }
  }
}
if (parityErrors.length) fail(parityErrors)

const dictionarySourceMaps = { en: new Map(), eu: new Map() }
for (const [key, spanishValue] of dictionaries.es.entries()) {
  dictionarySourceMaps.en.set(spanishValue, dictionaries.en.get(key))
  dictionarySourceMaps.eu.set(spanishValue, dictionaries.eu.get(key))
}

function collectOverrides(variableName, locale) {
  const { source, initializer } = findVariableInitializer("src/i18n/leagueText.ts", variableName)
  const localeObject = getObjectProperty(initializer, source, locale)
  return collectObjectStringEntries(localeObject, source)
}

const overrideMaps = {
  en: ["EXACT_OVERRIDES", "ADDITIONAL_OVERRIDES", "FINAL_OVERRIDES"].map((name) =>
    collectOverrides(name, "en"),
  ),
  eu: ["EXACT_OVERRIDES", "ADDITIONAL_OVERRIDES", "FINAL_OVERRIDES"].map((name) =>
    collectOverrides(name, "eu"),
  ),
}

function hasStaticTranslation(locale, sourceText) {
  if (overrideMaps[locale].some((map) => map.has(sourceText))) return true
  return dictionarySourceMaps[locale].has(sourceText)
}

function collectDynamicTemplates(locale) {
  const { source, initializer } = findVariableInitializer("src/i18n/leagueText.ts", "DYNAMIC_TEMPLATES")
  const localeArray = getObjectProperty(initializer, source, locale)
  const values = new Set()
  if (!ts.isArrayLiteralExpression(localeArray)) return values

  for (const element of localeArray.elements) {
    const tuple = unwrapExpression(element)
    if (!ts.isArrayLiteralExpression(tuple) || tuple.elements.length < 2) continue
    const sourceTemplate = unwrapExpression(tuple.elements[0])
    if (ts.isStringLiteralLike(sourceTemplate) || ts.isNoSubstitutionTemplateLiteral(sourceTemplate)) {
      values.add(sourceTemplate.text)
    }
  }
  return values
}

const dynamicTemplates = {
  en: collectDynamicTemplates("en"),
  eu: collectDynamicTemplates("eu"),
}

const specialDynamicTemplates = new Set([
  "La liga tiene {} lugar{} habitual{}.",
  "{} mensaje{} sin leer",
  "{} fecha{} seleccionada{}",
  "Únete a {} en Smash & Lob. Quedan {} jugador{} sin vincular.",
])

const excludedLeaguePaths = [
  "/about/",
  "/privacy/",
  "/terms/",
  "/application-admin/",
  "/personal-matches/",
  "/components/personal/",
  "/features/avatar-lab/",
  "/components/legal/",
  "/components/changelog/",
  "/auth/error/",
  "/components/auth/AuthGate.tsx",
  "/components/auth/ProfileCompletionGate.tsx",
  "/app/error.tsx",
  "/app/global-error.tsx",
  "/app/not-found.tsx",
  "/components/layout/PwaInstallPrompt.tsx",
  "/components/loading/PageSkeletons.tsx",
  "/components/settings/LocalDataMaintenanceCard.tsx",
]

function isLeagueUiFile(relativePath) {
  const normalized = `/${relativePath.replaceAll("\\", "/")}`
  return !excludedLeaguePaths.some((fragment) => normalized.includes(fragment))
}

function walkTsx(directory, callback) {
  if (!fs.existsSync(directory)) return
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name)
    if (entry.isDirectory()) walkTsx(fullPath, callback)
    else if (/\.tsx?$/.test(entry.name)) callback(fullPath)
  }
}

function lineOf(source, node) {
  return source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
}

const staticTxSources = new Set()
const dynamicTxPatterns = new Set()
const rawSpanish = []
const visibleSourceStrings = new Set()
const visibleDynamicPatterns = new Set()
const visibleObjectPropertyNames = new Set([
  "label",
  "title",
  "description",
  "subtitle",
  "eyebrow",
  "heroValue",
  "heroLabel",
  "eventDateLabel",
  "eventTimeLabel",
  "roundLabel",
  "venue",
  "emptyText",
  "helperText",
  "caption",
])

function collectVisibleStringLiterals(node, collector) {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    const value = normalizeJsxText(node.text)
    if (value && looksSpanish(value)) collector.add(value)
    return
  }
  ts.forEachChild(node, (child) => collectVisibleStringLiterals(child, collector))
}

function looksSpanish(text) {
  return (
    /[áéíóúñ¿¡]/i.test(text) ||
    /\b(el|la|los|las|una?|de|del|para|por|con|sin|que|se|no|jornada|temporada|partido|liga|jugador|jugadores|guardar|eliminar|crear|cerrar|abrir|buscar|pendiente|disponible|ubicación|resultado|clasificación|ajustes|ayuda|cuota|pago|inscripción|fecha|hora|pista|resumen|compartir|calendario|estadísticas|economía|gasto|gastado|ingresado|administrador|inicio|datos|nombre|incidencia|reserva|movimiento|votación|comunicado|disponibilidad|franja|notificación|victoria|récord|rival|campeón|liderato|confirmación|configuración|invitación|preparación|premios|bolas|plaza|plazas|sustitución|suplente|reemplazo)\b/i.test(text)
  )
}

function normalizeJsxText(text) {
  return text.replace(/\s+/g, " ").trim()
}

function getTemplatePattern(node) {
  if (!ts.isTemplateExpression(node)) return null
  let pattern = node.head.text
  for (const span of node.templateSpans) {
    pattern += `{}` + span.literal.text
  }
  return normalizeJsxText(pattern)
}

function collectVisibleDynamicTemplates(node, collector) {
  if (ts.isTemplateExpression(node)) {
    const pattern = getTemplatePattern(node)
    if (pattern && looksSpanish(pattern)) collector.add(pattern)
  }
  ts.forEachChild(node, (child) => collectVisibleDynamicTemplates(child, collector))
}

function callName(expression) {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) {
    return `${callName(expression.expression)}.${expression.name.text}`
  }
  return ""
}

function isInsideTx(node) {
  let current = node.parent
  while (current) {
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === "tx"
    ) {
      return true
    }
    current = current.parent
  }
  return false
}

function jsxPresentationContext(node) {
  let current = node.parent
  while (current) {
    if (ts.isJsxAttribute(current)) {
      const attribute = current.name.getText()
      if (
        attribute === "id" ||
        attribute === "href" ||
        attribute === "key" ||
        attribute === "value" ||
        attribute.startsWith("data-")
      ) {
        return false
      }
      return true
    }
    if (ts.isJsxExpression(current)) {
      if (current.parent && ts.isJsxAttribute(current.parent)) {
        const attribute = current.parent.name.getText()
        if (
          attribute === "id" ||
          attribute === "href" ||
          attribute === "key" ||
          attribute === "value" ||
          attribute.startsWith("data-")
        ) {
          return false
        }
      }
      return true
    }
    if (ts.isSourceFile(current)) return false
    current = current.parent
  }
  return false
}

function scanLeagueUiFile(fullPath) {
  const relativePath = path.relative(root, fullPath).replaceAll("\\", "/")
  if (!isLeagueUiFile(relativePath)) return

  const source = ts.createSourceFile(
    fullPath,
    fs.readFileSync(fullPath, "utf8"),
    ts.ScriptTarget.Latest,
    true,
    relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "tx" &&
      node.arguments[0]
    ) {
      const argument = node.arguments[0]
      if (ts.isStringLiteralLike(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
        staticTxSources.add(argument.text)
      } else if (ts.isTemplateExpression(argument)) {
        let pattern = argument.head.text
        for (const span of argument.templateSpans) {
          pattern += `{}` + span.literal.text
        }
        dynamicTxPatterns.add(pattern)
      }
    }

    if (ts.isJsxText(node)) {
      const value = normalizeJsxText(node.getText(source))
      if (value && looksSpanish(value)) {
        rawSpanish.push(`${relativePath}:${lineOf(source, node)} texto JSX: ${value}`)
      }
    }

    if (
      ts.isTemplateExpression(node) &&
      !isInsideTx(node) &&
      jsxPresentationContext(node)
    ) {
      const pattern = getTemplatePattern(node)
      if (pattern && looksSpanish(pattern)) {
        rawSpanish.push(
          `${relativePath}:${lineOf(source, node)} plantilla JSX sin tx: ${pattern}`,
        )
      }
    }

    if (
      (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
      !isInsideTx(node) &&
      jsxPresentationContext(node)
    ) {
      const value = normalizeJsxText(node.text)
      if (value && looksSpanish(value)) {
        rawSpanish.push(
          `${relativePath}:${lineOf(source, node)} expresión JSX sin tx: ${value}`,
        )
      }
    }

    if (
      ts.isJsxAttribute(node) &&
      ["title", "aria-label", "placeholder", "alt", "label"].includes(node.name.text) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer)
    ) {
      const value = normalizeJsxText(node.initializer.text)
      if (value && looksSpanish(value)) {
        rawSpanish.push(`${relativePath}:${lineOf(source, node)} ${node.name.text}: ${value}`)
      }
    }

    if (ts.isCallExpression(node)) {
      const name = callName(node.expression)
      const isVisibleCall =
        name === "window.confirm" ||
        name === "window.alert" ||
        name === "showActionFeedback" ||
        /^set(?:[A-Za-z0-9]+)?Error$/.test(name)

      if (isVisibleCall) {
        for (const argument of node.arguments) {
          collectVisibleStringLiterals(argument, visibleSourceStrings)
          collectVisibleDynamicTemplates(argument, visibleDynamicPatterns)
          if (ts.isStringLiteralLike(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
            if (argument.text) visibleSourceStrings.add(argument.text)
          }
          if (ts.isObjectLiteralExpression(argument)) {
            for (const property of argument.properties) {
              if (!ts.isPropertyAssignment(property)) continue
              const key = propertyName(property.name, source)
              const value = unwrapExpression(property.initializer)
              if (
                ["message", "actionLabel", "title"].includes(key) &&
                (ts.isStringLiteralLike(value) || ts.isNoSubstitutionTemplateLiteral(value)) &&
                value.text
              ) {
                visibleSourceStrings.add(value.text)
              }
            }
          }
        }
      }
    }

    if (ts.isPropertyAssignment(node)) {
      const key = propertyName(node.name, source)
      if (visibleObjectPropertyNames.has(key)) {
        collectVisibleStringLiterals(node.initializer, visibleSourceStrings)
        collectVisibleDynamicTemplates(node.initializer, visibleDynamicPatterns)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(source)
}

walkTsx(path.join(root, "src/app"), scanLeagueUiFile)
walkTsx(path.join(root, "src/components"), scanLeagueUiFile)

if (rawSpanish.length) fail(rawSpanish)

const missingStatic = []
for (const sourceText of staticTxSources) {
  for (const locale of ["en", "eu"]) {
    if (!hasStaticTranslation(locale, sourceText)) {
      missingStatic.push(`${locale}: tx(${JSON.stringify(sourceText)}) no tiene traducción estática`)
    }
  }
}
if (missingStatic.length) fail(missingStatic)

const missingVisible = []
for (const sourceText of visibleSourceStrings) {
  for (const locale of ["en", "eu"]) {
    if (!hasStaticTranslation(locale, sourceText)) {
      missingVisible.push(`${locale}: mensaje visible ${JSON.stringify(sourceText)} no tiene traducción`)
    }
  }
}
if (missingVisible.length) fail(missingVisible)

const missingVisibleDynamic = []
for (const pattern of visibleDynamicPatterns) {
  if (specialDynamicTemplates.has(pattern)) continue
  for (const locale of ["en", "eu"]) {
    if (!dynamicTemplates[locale].has(pattern)) {
      missingVisibleDynamic.push(
        `${locale}: mensaje visible dinámico ${JSON.stringify(pattern)} no está cubierto`,
      )
    }
  }
}
if (missingVisibleDynamic.length) fail(missingVisibleDynamic)

const missingDynamic = []
for (const pattern of dynamicTxPatterns) {
  if (specialDynamicTemplates.has(pattern)) continue
  for (const locale of ["en", "eu"]) {
    if (!dynamicTemplates[locale].has(pattern)) {
      missingDynamic.push(`${locale}: tx dinámico ${JSON.stringify(pattern)} no está cubierto`)
    }
  }
}
if (missingDynamic.length) fail(missingDynamic)

const provider = read("src/i18n/I18nProvider.tsx")
if (!provider.includes("tx: (source: string) => string") || !provider.includes("translateLeagueText(locale, source)")) {
  fail("I18nProvider no expone tx mediante el sistema de locale existente")
}

const shell = read("src/components/layout/AppShell.tsx")
if (!shell.includes("data-floating-top-toolbar")) {
  fail("AppShell no contiene el toolbar flotante compacto")
}
if (!shell.includes('className={`flex items-center gap-2')) {
  fail("El toolbar flotante no usa un layout flex compacto")
}
if (shell.includes("rightOffsetPx")) {
  fail("AppShell conserva offsets manuales que pueden dejar huecos al desaparecer Añadir")
}

const spectatorShare = read("src/components/spectator/FloatingSpectatorShareButton.tsx")
for (const marker of [
  'const title = tx(`Ver ${leagueName}`)',
  'const text = tx(`Sigue ${leagueName} · ${seasonName} en Smash & Lob como espectador.`)',
  'title={copied ? tx("Enlace copiado") : tx("Compartir con espectadores")}',
]) {
  if (!spectatorShare.includes(marker)) {
    fail(`FloatingSpectatorShareButton.tsx deja sin i18n: ${marker}`)
  }
}

const inviteShare = read("src/components/invite/FloatingInviteShareButton.tsx")
if (!inviteShare.includes('? tx("Enlace copiado")')) {
  fail("FloatingInviteShareButton.tsx deja sin traducir el title de enlace copiado")
}

const leagueChat = read("src/app/match/[id]/chat/page.tsx")
for (const marker of [
  'aria-label={tx(`${mine === "available" ? "Quitar mi voto favorable" : "Me viene bien"} · ${yes} votos`)}',
  'aria-label={tx(`${mine === "unavailable" ? "Quitar mi voto negativo" : "No puedo"} · ${no} votos`)}',
]) {
  if (!leagueChat.includes(marker)) {
    fail(`CHAT de Liga deja una acción de votación sin i18n: ${marker}`)
  }
}

const mediaKitPage = read("src/app/admin/media-kit/page.tsx")
if (!mediaKitPage.includes(
  'title={disabled ? tx("Configura fecha de inicio") : data.subtitle ? tx(data.subtitle) : tx(titles[kind])}',
)) {
  fail("Media Kit deja el subtítulo del preset sin traducir en el tooltip")
}

const exportImage = read("src/lib/seasonExportImages.ts")
for (const marker of [
  "translateLeagueText",
  "locale: Locale",
  "const regularScoreCenterX = defaultCenterX + defaultCenterWidth / 2",
  "const scoreCenterX = fixturesOnly ? x + width / 2 : regularScoreCenterX",
  "const fixtureVsHalfGap = 24",
  "scoreCenterX - fixtureVsHalfGap - leftX",
  "scoreCenterX + fixtureVsHalfGap",
]) {
  if (!exportImage.includes(marker)) fail(`seasonExportImages.ts no contiene ${marker}`)
}

for (const relativePath of ["src/lib/seasonSummaryImage.ts", "src/lib/leagueMediaKitImage.ts"]) {
  const source = read(relativePath)
  if (!source.includes("translateLeagueText") || !source.includes("locale")) {
    fail(`${relativePath} no propaga el idioma a la imagen generada`)
  }
}

console.log(
  `League i18n/UI correcto: ${dictionaries.es.size} claves estructuradas por idioma, ` +
    `${staticTxSources.size} textos tx, ${dynamicTxPatterns.size} plantillas dinámicas y ` +
    `${visibleSourceStrings.size} mensajes estáticos y ${visibleDynamicPatterns.size} mensajes dinámicos visibles cubiertos.`,
)
