import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { buildRapidFixtures, buildRapidRounds } from "@/lib/rapidTournament"
import { getEffectiveRapidRounds } from "@/lib/rapidTournamentTiming"

const id = "47b0b645-4790-491f-8f15-b1fe8bf8be13"
const playerNames = Array.from({ length: 12 }, (_, index) => `Jugador ${String(index + 1).padStart(2, "0")}${index < 2 ? " Apellido Compuesto de Prueba" : ""}`)
const playerIds = new Map(playerNames.map((name, index) => [String.fromCharCode(65 + index), `player-${index + 1}`]))
const start = "2026-10-17T07:00:00.000Z"
const venue = "Localidad - Club de prueba"

function makeTournament() {
  const players = playerNames.map((name, index) => ({ id: `player-${index + 1}`, slot: String.fromCharCode(65 + index), name }))
  const rounds = buildRapidRounds(start).map((round) => ({ ...round, id: `round-${round.round}` }))
  const matches = buildRapidFixtures().map((fixture, index) => ({
    id: `match-${index + 1}`, round: fixture.round, court: fixture.court, courtName: `${venue} · Pista ${fixture.court}`,
    teamA: fixture.teamA.map((slot) => players[slot.charCodeAt(0) - 65].name) as [string, string],
    teamB: fixture.teamB.map((slot) => players[slot.charCodeAt(0) - 65].name) as [string, string],
    teamAIds: fixture.teamA.map((slot) => playerIds.get(slot)!) as [string, string],
    teamBIds: fixture.teamB.map((slot) => playerIds.get(slot)!) as [string, string], scoreA: null as number | null, scoreB: null as number | null,
  }))
  return {
    tournament: { id, name: "Americana de prueba", description: "", startsAt: start, startedAt: null as string | null, courtNames: [`${venue} · Pista 1`, `${venue} · Pista 2`], status: "draft" as "draft" | "in_progress" | "finished", createdByUserId: "creator", finishedAt: null, configuration: {} },
    players, rounds, matches,
  }
}

for (const theme of ["light", "dark"] as const) {
test(`creates and completes the fixed 12-player tournament happy path (${theme})`, async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  if (testInfo.project.name === "mobile-chromium") await page.setViewportSize({ width: 393, height: 852 })
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { user: { name: "QA Torneos", email: "qa-tournament@example.test", image: null }, expires: "2099-01-01T00:00:00Z" } }))
  await page.route("**/api/account/profile", (route) => route.fulfill({ json: { profile: { firstName: "QA", lastName: "Torneos", displayName: "QA Torneos", profileCompletedAt: "2026-08-03T00:00:00Z", availabilityCompletedAt: "2026-08-03T00:00:00Z", standardAvailabilityTimezone: "Europe/Madrid", standardAvailabilityWeeklySlots: {}, preferredSide: "reves", dominantHand: "right", isComplete: true, isSuperuser: false } } }))
  await page.route("**/api/onboarding/progress", (route) => route.fulfill({ json: { items: [], ok: true } }))
  await page.route("**/api/personal-matches?**", (route) => route.fulfill({ json: { items: [], upcoming: [], hasMore: false, nextOffset: null } }))
  await page.route("**/api/locations", (route) => route.fulfill({ json: { locations: [{ id: "fixture-venue", name: "Club de prueba", town: "Localidad" }] } }))
  await page.addInitScript((mode) => { localStorage.setItem("smash-lob-theme-mode", mode); localStorage.setItem("smash-lob-visual-style", "competition") }, theme)
  await page.addInitScript(() => {
    const probe = { speech: [] as string[], tones: 0, locks: 0, releases: 0, countdowns: 0, spoken: [] as Array<{lang: string; voice: string | undefined; volume: number}> }
    Object.assign(window, { rapidTest: probe })
    class AudioStub {
      state = "suspended"; currentTime = 0; destination = {}
      async resume() { this.state = "running" }
      async suspend() { this.state = "suspended" }
      createOscillator() { return { frequency: { value: 0 }, connect() {}, disconnect() {}, start() { probe.tones++ }, stop() {}, onended: null } }
      createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {}, disconnect() {} } }
      async decodeAudioData() { return {} }
      createBufferSource() { return { connect() {}, disconnect() {}, start() { probe.countdowns++ }, stop() {}, buffer: null, onended: null } }
    }
    class LockStub extends EventTarget {
      released = false
      async release() { if (!this.released) { this.released = true; probe.releases++; this.dispatchEvent(new Event("release")) } }
    }
    Object.defineProperty(window, "AudioContext", { value: AudioStub, configurable: true })
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: class { text: string; constructor(text: string) { this.text = text } }, configurable: true })
    Object.defineProperty(window, "speechSynthesis", { value: { cancel() {}, getVoices: () => [{ voiceURI: "qa-es", name: "Voz QA española", lang: "es-ES", localService: true }, { voiceURI: "qa-en", name: "English QA voice", lang: "en-GB", localService: true }], addEventListener() {}, removeEventListener() {}, speak(utterance: SpeechSynthesisUtterance) { probe.speech.push(utterance.text); probe.spoken.push({ lang: utterance.lang, voice: utterance.voice?.voiceURI, volume: utterance.volume }); setTimeout(() => utterance.onend?.call(utterance, new Event("end") as SpeechSynthesisEvent), 100) } }, configurable: true })
    Object.defineProperty(navigator, "wakeLock", { value: { async request() { probe.locks++; return new LockStub() } }, configurable: true })
    localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-tournament@example.test", "dismissed")
    localStorage.setItem("smash-lob-user-league-memberships", JSON.stringify([{ userId: "qa-tournament@example.test", leagueId: "league-smash-lob", playerId: "davo", role: "admin" }]))
  })

  const data = makeTournament()
  let deleted = false
  await page.route("**/api/tournaments", async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON().courtNames).toEqual(["Localidad - Club de prueba · Pista 1", "Localidad - Club de prueba · Pista 2"])
      return route.fulfill({ status: 201, json: { id } })
    }
    return route.fulfill({ json: { tournaments: deleted ? [] : [{ id, name: data.tournament.name, startsAt: start, status: data.tournament.status }] } })
  })
  await page.route(`**/api/tournaments/${id}`, (route) => { if (route.request().method() === "DELETE") { deleted = true; return route.fulfill({ json: { ok: true } }) }; return route.fulfill({ json: { ...data, canRestartForTesting: true, rounds: getEffectiveRapidRounds(data.rounds, data.tournament.startedAt ?? start) } }) })
  await page.route(`**/api/tournaments/${id}/**`, async (route) => {
    const url = new URL(route.request().url())
    const action = url.pathname.split("/").at(-1)
    if (action === "start") { data.tournament.status = "in_progress"; data.tournament.startedAt = "2026-10-16T12:00:00Z" }
    if (action === "finish") data.tournament.status = "finished"
    if (action === "restart") { data.tournament.status = "in_progress"; data.tournament.startedAt = "2026-10-16T13:53:00Z"; data.matches.forEach((match) => { match.scoreA = null; match.scoreB = null }) }
    if (action === "result") {
      const matchId = url.pathname.split("/").at(-2)
      const match = data.matches.find((item) => item.id === matchId)
      const body = route.request().postDataJSON() as { scoreA: number; scoreB: number }
      if (match) { match.scoreA = body.scoreA; match.scoreB = body.scoreB }
    }
    return route.fulfill({ json: { ok: true } })
  })

  await page.goto("/tournaments/new")
  const modeSelect = page.locator('select[aria-describedby="tournament-mode-help"]')
  const formatSelect = page.locator('select[aria-describedby="tournament-format-help"]')
  await expect(modeSelect).toHaveValue("rapid")
  await expect(modeSelect.locator('option[value="traditional"]')).toHaveAttribute("disabled", "")
  await expect(formatSelect).toHaveValue("balanced-americana")
  await expect(formatSelect.locator('option[value="mexicana"]')).toHaveAttribute("disabled", "")
  await expect(formatSelect.locator('option[value="fixed-pairs"]')).toHaveAttribute("disabled", "")
  await expect(page.locator('input[type="number"][disabled]')).toHaveValue("2")
  await page.getByLabel("Nombre del torneo *").fill(data.tournament.name)
  await page.getByLabel("Fecha").fill("2026-10-17")
  await page.getByLabel("Hora de inicio").fill("09:00")
  await page.getByRole("combobox", { name: /^Ubicación/ }).selectOption("fixture-venue")
  for (let index = 0; index < playerNames.length; index += 1) await page.getByLabel(`Jugador ${index + 1}`, { exact: true }).fill(playerNames[index])
  await page.getByRole("heading", { name: "Crear torneo rápido" }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath(`create-${theme}.png`), scale: "css" })
  await page.locator('section[aria-labelledby="tournament-participants"]').screenshot({ path: testInfo.outputPath(`participants-${theme}.png`) })
  const createAccessibility = await new AxeBuilder({ page }).analyze()
  expect(createAccessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.getByRole("button", { name: "Crear y generar calendario" }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/calendar$`))
  await expect(page.getByRole("heading", { name: "Ronda 6 · 10:37–10:53" })).toBeVisible()
  await expect(page.getByText("Descansan · 4", { exact: true }).first()).toBeVisible()
  await expect(page.getByRole("navigation", { name: "Navegación del torneo" })).toBeVisible()
  await expect(page.locator(".app-bottom-nav")).toHaveCount(0)
  await expect(page.getByText(venue, { exact: true })).toHaveCount(1)
  await expect(page.locator("header.app-page-header").getByText(venue, { exact: true })).toBeVisible()
  await expect(page.getByText(/^Pareja [12]$/)).toHaveCount(0)
  await expect(page.getByRole("navigation", { name: "Ir a una ronda" })).toHaveCount(0)
  const originalViewport = page.viewportSize()!
  await page.setViewportSize({ width: 393, height: 852 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath(`calendar-mobile-393-${theme}.png`), scale: "css" })
  await page.setViewportSize({ width: 320, height: 812 })
  const nav = page.getByRole("navigation", { name: "Navegación del torneo" })
  expect(await nav.evaluate(el => {
    const grid = el.firstElementChild!, item = el.querySelector("a")!, icon = item.querySelector("svg")!
    return [el.getBoundingClientRect().height, getComputedStyle(grid).paddingTop, getComputedStyle(grid).paddingBottom, getComputedStyle(grid).columnGap, getComputedStyle(item).fontSize, getComputedStyle(item).borderRadius, item.getBoundingClientRect().height, icon.getBoundingClientRect().width, icon.getBoundingClientRect().height]
  })).toEqual([73, "7px", "7px", "6px", "11px", "12px", 58, 16, 16])
  expect(await nav.locator("a").evaluateAll((links) => links.every((link) => {
    const item = link.getBoundingClientRect(), label = link.querySelector("span")!.getBoundingClientRect()
    return label.left >= item.left - 1 && label.right <= item.right + 1
  }))).toBe(true)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.locator('section[aria-labelledby="round-1"]').screenshot({ path: testInfo.outputPath(`round-320-${theme}.png`) })
  await page.screenshot({ path: testInfo.outputPath(`calendar-nav-320-${theme}.png`) })
  await page.evaluate(() => { document.documentElement.style.fontSize = "20px" })
  expect(await nav.locator("a").evaluateAll((links) => links.every((link) => link.scrollWidth <= link.clientWidth))).toBe(true)
  await page.evaluate(() => { document.documentElement.style.fontSize = "" })
  await page.setViewportSize(originalViewport)
  const calendarAccessibility = await new AxeBuilder({ page }).analyze()
  expect(calendarAccessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.locator('section[aria-labelledby="round-1"]').screenshot({ path: testInfo.outputPath(`round-${theme}.png`) })
  await expect(page.getByRole("navigation", { name: "Navegación del torneo" })).toHaveCount(1)
  await expect(page.getByRole("navigation", { name: "Navegación global" })).toHaveCount(0)
  await page.getByRole("link", { name: /Mis Competiciones/ }).click()
  await expect(page).toHaveURL(/\/leagues$/)
  await expect(page.getByRole("navigation", { name: "Navegación global" })).toHaveCount(1)
  await page.getByRole("link", { name: /Americana de prueba/ }).click()
  await page.getByRole("link", { name: "Calendario completo", exact: true }).click()
  await page.getByRole("button", { name: "Volver a sortear" }).click()
  await page.getByRole("button", { name: "Iniciar torneo" }).first().click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/live$`))
  await expect(page.getByRole("heading", { name: "Preparación", exact: true })).toBeVisible()
  const timer = page.getByRole("timer")
  await expect(timer).toHaveText("02:00")
  await page.getByRole("button", { name: "Probar sonido" }).click()
  const speech = () => page.evaluate(() => (window as unknown as { rapidTest: { speech: string[] } }).rapidTest.speech)
  await expect.poll(speech).toContain("Prueba de sonido. Quedan dos minutos.")
  await page.getByText("Configurar avisos", { exact: true }).click()
  await page.getByRole("combobox", { name: "Idioma de los avisos", exact: true }).selectOption("both")
  await page.getByRole("combobox", { name: "Sonido del aviso", exact: true }).selectOption("gong")
  const beforePreview = (await speech()).length
  await page.getByRole("button", { name: "Probar sonido" }).click()
  await expect.poll(async () => (await speech()).slice(beforePreview)).toEqual(["Sound test. Two minutes remaining.", "Prueba de sonido. Quedan dos minutos."])
  await page.getByRole("combobox", { name: "Intensidad", exact: true }).selectOption("normal")
  await page.getByText("Configurar avisos", { exact: true }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath(`audio-settings-${theme}.png`), scale: "css" })
  await page.getByText("Configurar avisos", { exact: true }).click()
  await page.getByRole("checkbox", { name: "Evitar bloqueo durante Seguimiento" }).check()
  await expect(page.getByText("Pantalla encendida mientras Seguimiento esté visible.")).toBeVisible()
  await page.screenshot({ path: testInfo.outputPath(`live-preparation-${theme}.png`), scale: "css" })
  const liveAccessibility = await new AxeBuilder({ page }).analyze()
  expect(liveAccessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.setViewportSize({ width: 320, height: 812 })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.setViewportSize(originalViewport)
  const atMinute = async (minutes: number) => { await page.clock.setFixedTime(new Date(Date.parse(data.tournament.startedAt!) + minutes * 60_000)) }
  const countdowns = () => page.evaluate(() => (window as unknown as { rapidTest: { countdowns: number } }).rapidTest.countdowns)
  const beforeCountdown = await countdowns()
  for (const [seconds, count] of [[117, 3], [118, 2], [119, 1]]) {
    await atMinute(seconds / 60)
    await expect(timer).toHaveText(`00:0${count}`)
    await expect.poll(countdowns).toBe(beforeCountdown + 4 - count)
  }
  await atMinute(2)
  await expect(page.getByRole("heading", { name: "Ronda 1", exact: true })).toBeVisible()
  await expect(timer).toHaveText("16:00")
  await expect.poll(speech).toContain("Comienza la ronda 1")
  await page.getByRole("button", { name: "Silenciar avisos", exact: true }).click()
  await expect(page.getByRole("button", { name: "Probar sonido" })).toBeDisabled()
  await page.getByRole("button", { name: "Activar avisos", exact: true }).click()
  await atMinute(16)
  await expect(timer).toHaveText("02:00")
  await expect.poll(speech).toContain("Quedan dos minutos")
  await page.screenshot({ path: testInfo.outputPath(`live-round-${theme}.png`), scale: "css" })
  await atMinute(18)
  await expect(page.getByRole("heading", { name: "Pausa", exact: true })).toBeVisible()
  await expect(timer).toHaveText("03:00")
  await expect.poll(speech).toContain("Fin de ronda. Termina el punto en juego. Tres minutos de cambio.")
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: true, configurable: true }); document.dispatchEvent(new Event("visibilitychange")) })
  await expect.poll(() => page.evaluate(() => (window as unknown as { rapidTest: { releases: number } }).rapidTest.releases)).toBe(1)
  await atMinute(21)
  await page.evaluate(() => { Object.defineProperty(document, "hidden", { value: false, configurable: true }); document.dispatchEvent(new Event("visibilitychange")) })
  await expect(page.getByRole("heading", { name: "Ronda 2", exact: true })).toBeVisible()
  await expect(page.getByText("Pantalla encendida mientras Seguimiento esté visible.")).toBeVisible()
  await page.reload()
  await expect(timer).toHaveText("16:00")
  await page.getByText("Configurar avisos", { exact: true }).click()
  await expect(page.getByRole("combobox", { name: "Idioma de los avisos", exact: true })).toHaveValue("both")
  await expect(page.getByRole("combobox", { name: "Sonido del aviso", exact: true })).toHaveValue("gong")
  await expect(page.getByRole("combobox", { name: "Intensidad", exact: true })).toHaveValue("normal")
  await page.getByText("Configurar avisos", { exact: true }).click()
  await expect(page.getByRole("button", { name: "Activar avisos", exact: true })).toBeVisible()
  await page.getByRole("link", { name: "Abrir en Ajustes", exact: true }).click()
  await expect(page).toHaveURL(/\/settings\/sounds\?returnTo=/)
  await expect(page.getByRole("combobox", { name: "Sonido del aviso", exact: true })).toHaveValue("gong")
  await expect(page.getByRole("combobox", { name: /Voz en/ })).toHaveCount(0)
  await expect(page.getByRole("combobox", { name: "Sonido del aviso", exact: true }).locator("option")).toHaveCount(8)
  await page.getByRole("combobox", { name: "Sonido del aviso", exact: true }).selectOption("horn")
  const settingsPreview = (await speech()).length
  await page.getByRole("button", { name: "Probar sonido" }).click()
  await expect.poll(async () => (await speech()).slice(settingsPreview)).toEqual(["Sound test. Two minutes remaining.", "Prueba de sonido. Quedan dos minutos."])
  await page.screenshot({ path: testInfo.outputPath(`settings-sounds-${theme}.png`), scale: "css" })
  const soundAccessibility = await new AxeBuilder({ page }).analyze()
  expect(soundAccessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.getByRole("link", { name: "Volver", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/live$`))
  await page.getByText("Configurar avisos", { exact: true }).click()
  await expect(page.getByRole("combobox", { name: "Sonido del aviso", exact: true })).toHaveValue("horn")
  await page.getByText("Configurar avisos", { exact: true }).click()
  await page.evaluate(() => { Reflect.set(window, "rapidOriginalAudio", window.AudioContext); Object.defineProperty(window, "AudioContext", { value: undefined, configurable: true }) })
  await page.getByRole("button", { name: "Activar avisos", exact: true }).click()
  await expect(page.getByRole("alert").filter({ hasText: "No se ha podido activar el sonido." })).toHaveText("No se ha podido activar el sonido. Pulsa Activar avisos para reintentarlo.")
  await page.evaluate(() => Object.defineProperty(window, "AudioContext", { value: Reflect.get(window, "rapidOriginalAudio"), configurable: true }))
  await page.getByRole("button", { name: "Activar avisos", exact: true }).click()
  await page.evaluate(() => { Reflect.set(window, "rapidOriginalWake", navigator.wakeLock); Object.defineProperty(navigator, "wakeLock", { value: undefined, configurable: true }) })
  await page.getByRole("checkbox", { name: "Evitar bloqueo durante Seguimiento" }).check()
  await expect(page.getByText("No se ha podido mantener la pantalla encendida. Revisa el ahorro de batería del dispositivo.")).toBeVisible()
  await page.getByRole("checkbox", { name: "Evitar bloqueo durante Seguimiento" }).uncheck()
  await page.evaluate(() => Object.defineProperty(navigator, "wakeLock", { value: Reflect.get(window, "rapidOriginalWake"), configurable: true }))
  await page.getByRole("checkbox", { name: "Evitar bloqueo durante Seguimiento" }).check()
  await atMinute(113)
  await expect(page.getByRole("heading", { name: "Tiempo de juego terminado" })).toBeVisible()
  await expect(timer).toHaveText("00:00")
  await expect.poll(speech).toContain("Tiempo de torneo finalizado. Termina el punto en juego.")
  await expect.poll(() => page.evaluate(() => (window as unknown as { rapidTest: { releases: number } }).rapidTest.releases)).toBe(1)
  await page.getByRole("link", { name: "Calendario", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Ronda 1 · 14:02–14:18" })).toBeVisible()

  for (const match of data.matches) {
    const card = page.locator(`[data-tournament-match="${match.id}"]`)
    await card.getByRole("button", { name: "Registrar resultado", exact: true }).click()
    await card.locator('input[type="number"]').nth(0).fill("16")
    await card.locator('input[type="number"]').nth(1).fill("12")
    await card.getByRole("button", { name: "Guardar resultado" }).click()
    await expect(card.getByText("16–12", { exact: true })).toBeVisible()
  }

  const firstMatch = page.locator(`[data-tournament-match="${data.matches[0].id}"]`)
  await firstMatch.getByRole("button", { name: "Corregir resultado" }).click()
  await firstMatch.locator('input[type="number"]').nth(0).fill("19")
  await firstMatch.locator('input[type="number"]').nth(1).fill("19")
  await firstMatch.getByRole("button", { name: "Guardar resultado" }).click()
  await expect(firstMatch.getByText("19–19", { exact: true })).toBeVisible()
  await expect(firstMatch.locator("input")).toHaveCount(0)

  await page.getByRole("link", { name: "Clasificación", exact: true }).click()
  await expect(page.getByText("Clasificación provisional")).toBeVisible()
  await expect(page.getByText("Resultados registrados · 12/12")).toBeVisible()
  await page.getByRole("link", { name: "Resumen", exact: true }).click()
  await page.getByRole("button", { name: "Finalizar torneo" }).click()
  await expect(page.getByText(/^(Campeón|Campeones)$/)).toBeVisible()
  await expect(page.getByText(/Jugador \d{2}/).first()).toBeVisible()
  await page.getByRole("link", { name: "Clasificación", exact: true }).click()
  await expect(page.getByText("Clasificación final")).toBeVisible()
  await expect(page.getByRole("row").filter({ hasText: "Jugador" })).toHaveCount(13)
  await page.getByRole("link", { name: /Mis Competiciones/ }).click()
  await page.getByRole("link", { name: "Ver todos", exact: true }).click()
  await page.getByText("Finalizados · 1", { exact: true }).click()
  await expect(page.getByRole("link", { name: /Americana de prueba/ })).toBeVisible()
  await page.getByRole("link", { name: /Americana de prueba/ }).click()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Reiniciar para pruebas", exact: true }).click()
  expect(data.tournament.status).toBe("finished")
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Reiniciar para pruebas", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/live$`))
  await expect(page.getByRole("heading", { name: "Preparación", exact: true })).toBeVisible()
  await expect(page.getByRole("timer")).toHaveText("02:00")
  expect(data.matches.every((match) => match.scoreA === null && match.scoreB === null)).toBe(true)
  await expect(page.getByRole("button", { name: "Eliminar torneo", exact: true })).toHaveCount(0)
  await page.reload()
  await expect(page.getByRole("timer")).toHaveText("02:00")
  await page.getByRole("link", { name: "Clasificación", exact: true }).click()
  await expect(page.getByText("Resultados registrados · 0/12")).toBeVisible()
  // Complete the second synthetic run so deletion is exercised only after finishing.
  data.matches.forEach((match) => { match.scoreA = 10; match.scoreB = 15 })
  data.tournament.status = "finished"
  await page.getByRole("link", { name: "Resumen", exact: true }).click()
  page.once("dialog", (dialog) => dialog.dismiss())
  await page.getByRole("button", { name: "Eliminar torneo", exact: true }).click()
  expect(deleted).toBe(false)
  page.once("dialog", (dialog) => dialog.accept())
  await page.getByRole("button", { name: "Eliminar torneo", exact: true }).click()
  await expect(page).toHaveURL(/\/leagues$/)
  await expect(page.getByRole("link", { name: /Americana de prueba/ })).toHaveCount(0)
  await page.goto("/settings")
  await page.getByRole("link", { name: /Sonidos y avisos/ }).click()
  await expect(page).toHaveURL(/\/settings\/sounds$/)
  await expect(page.getByRole("combobox", { name: "Sonido del aviso", exact: true })).toHaveValue("horn")
})
}
