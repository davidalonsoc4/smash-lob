import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { buildRapidFixtures, buildRapidRounds } from "@/lib/rapidTournament"
import { getEffectiveRapidRounds } from "@/lib/rapidTournamentTiming"
import { generateDynamicMexicanoRound, type MexicanoMatch } from "@/lib/dynamicMexicano"

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
    tournament: { id, name: "Americana de prueba", description: "", startsAt: start, startedAt: null as string | null, courtNames: [`${venue} · Pista 1`, `${venue} · Pista 2`], status: "draft" as "draft" | "in_progress" | "finished", createdByUserId: "creator", finishedAt: null, configuration: { players: 12, courts: 2, reservationMinutes: 120, rounds: 6, roundMinutes: 16, transitionMinutes: 3, preparationMinutes: 2 } },
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
  await page.route("**/api/tournaments/people", (route) => route.fulfill({ json: { people: [{ userId: "account-1", displayName: playerNames[0] }], accountLinkingAvailable: true } }))
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
      expect(route.request().postDataJSON().playerUserIds).toEqual(["account-1", ...Array(11).fill(null)])
      return route.fulfill({ status: 201, json: { id } })
    }
    return route.fulfill({ json: { tournaments: deleted ? [] : [{ id, name: data.tournament.name, startsAt: start, status: data.tournament.status }] } })
  })
  await page.route(`**/api/tournaments/${id}`, (route) => { if (route.request().method() === "DELETE") { deleted = true; return route.fulfill({ json: { ok: true } }) }; return route.fulfill({ json: { ...data, access: { role: "creator" }, players: data.players.map((player, index) => ({ ...player, ...(index === 0 ? { userId: "account-1" } : {}) })), canRestartForTesting: true, rounds: getEffectiveRapidRounds(data.rounds, data.tournament.startedAt ?? start) } }) })
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
  await page.route(`**/api/tournaments/${id}/invite`, (route) => route.fulfill({ json: { url: `http://localhost:3000/tournament-invite/${"t".repeat(43)}` } }))
  await page.route(`**/api/tournament-invites/${"t".repeat(43)}`, (route) => route.fulfill({ json: { tournament: { id, name: data.tournament.name, startsAt: start }, players: data.players.slice(1), expiresAt: "2026-11-15T00:00:00Z" } }))
  await page.route(`**/api/tournament-invites/${"t".repeat(43)}/claim`, (route) => {
    expect(route.request().postDataJSON()).toEqual({ playerId: "player-2" })
    return route.fulfill({ json: { tournamentId: id } })
  })

  await page.goto("/tournaments/new")
  const modeSelect = page.locator('select[aria-describedby="tournament-mode-help"]')
  const formatSelect = page.locator('select[aria-describedby="tournament-format-help"]')
  await expect(modeSelect).toHaveValue("rapid")
  await expect(modeSelect.locator('option[value="traditional"]')).toHaveAttribute("disabled", "")
  await expect(formatSelect).toHaveValue("balanced_americana")
  await expect(formatSelect.locator('option[value="dynamic_mexicano"]')).toBeEnabled()
  await expect(formatSelect.locator('option[value="fixed-pairs"]')).toHaveAttribute("disabled", "")
  const playerCount = page.getByLabel("Número de jugadores: 12")
  const courtCount = page.getByLabel("Número de pistas: 2")
  const reservationLength = page.getByLabel("Tiempo de reserva (minutos): 120")
  await expect(playerCount).toBeVisible()
  await expect(courtCount).toBeVisible()
  await expect(reservationLength).toBeVisible()
  await expect(page.getByLabel("Calentamiento (minutos): 2")).toBeVisible()
  await page.getByRole("button", { name: "Disminuir Número de jugadores" }).click()
  await expect(page.getByLabel("Número de jugadores: 11")).toBeVisible()
  await page.getByRole("button", { name: "Aumentar Número de jugadores" }).click()
  await page.getByRole("button", { name: "Disminuir Número de pistas" }).click()
  await expect(page.getByLabel("Número de pistas: 1")).toBeVisible()
  await page.getByRole("button", { name: "Disminuir Tiempo de reserva (minutos)" }).click()
  await expect(page.getByLabel("Tiempo de reserva (minutos): 90")).toBeVisible()
  await expect(page.locator('section[aria-labelledby="tournament-logistics"] summary')).toContainText("4 rondas")
  await expect(page.getByText("16–32 minutos", { exact: true })).toBeVisible()
  await page.getByRole("button", { name: "Aumentar Número de pistas" }).click()
  await page.getByRole("button", { name: "Aumentar Tiempo de reserva (minutos)" }).click()
  await expect(page.getByText("64 minutos", { exact: true })).toBeVisible()
  await expect(page.getByText("768 minutos", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Minutos de juego sumados de todos los jugadores", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Duración programada total del torneo", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Minutos de pista sumados en el torneo", { exact: true })).toHaveCount(0)
  const logistics = page.locator('section[aria-labelledby="tournament-logistics"]')
  await logistics.locator("summary").click()
  const tournamentSummary = page.locator('section[aria-labelledby="tournament-summary"]')
  await expect(logistics.getByText("Transición entre rondas", { exact: true })).toBeVisible()
  await expect(tournamentSummary.getByText("Transición entre rondas", { exact: true })).toBeVisible()
  await expect(tournamentSummary.getByText("3 minutos", { exact: true })).toBeVisible()
  await page.getByLabel("Nombre del torneo *").fill(data.tournament.name)
  await page.getByLabel("Fecha").fill("2026-10-17")
  await page.getByLabel("Hora de inicio").fill("09:00")
  await page.getByRole("combobox", { name: /^Ubicación/ }).selectOption("fixture-venue")
  await page.getByRole("textbox", { name: "Buscar jugador por nombre", exact: true }).fill(playerNames[0])
  await page.getByRole("button", { name: playerNames[0], exact: true }).click()
  const linkedPlayerInput = page.getByLabel("Jugador 1", { exact: true })
  await expect(linkedPlayerInput).toBeEnabled()
  await linkedPlayerInput.fill("Nombre editable")
  await expect(linkedPlayerInput).toHaveValue("Nombre editable")
  await linkedPlayerInput.fill("")
  await page.getByRole("textbox", { name: "Buscar jugador por nombre", exact: true }).fill(playerNames[0])
  await page.getByRole("button", { name: playerNames[0], exact: true }).click()
  for (let index = 1; index < playerNames.length; index += 1) await page.getByLabel(`Jugador ${index + 1}`, { exact: true }).fill(playerNames[index])
  await page.getByRole("heading", { name: "Crear torneo rápido" }).scrollIntoViewIfNeeded()
  await page.screenshot({ path: testInfo.outputPath(`create-${theme}.png`), scale: "css" })
  await page.locator('section[aria-labelledby="tournament-participants"]').screenshot({ path: testInfo.outputPath(`participants-${theme}.png`) })
  const createAccessibility = await new AxeBuilder({ page }).analyze()
  expect(createAccessibility.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.getByRole("button", { name: "Crear y generar calendario" }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/calendar$`))
  await expect(page.getByRole("heading", { name: "Ronda 6 · 10:37–10:53" })).toBeVisible()
  await expect(page.getByRole("heading", { name: "Validación del sorteo" })).toBeVisible()
  await expect(page.getByText("Todo correcto", { exact: true })).toBeVisible()
  await page.getByText("Detalle por jugador").click()
  await expect(page.getByRole("table").getByRole("row").nth(1)).toContainText("64")
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
  await page.goto(`/tournaments/${id}/players`)
  await expect(page.getByText("Los jugadores vinculados a una cuenta ya ven este torneo en Competiciones.")).toBeVisible()
  await page.goto(`/tournaments/${id}/settings`)
  await expect(page.getByRole("navigation", { name: "Navegación del torneo" })).toHaveCount(0)
  await page.getByRole("button", { name: "Compartir invitación", exact: true }).last().click()
  await page.getByRole("button", { name: "Invitar a jugar en el torneo", exact: true }).click()
  await expect(page.getByText("Un enlace para todo el torneo")).toBeVisible()
  await page.goto(`/tournament-invite/${"t".repeat(43)}`)
  await expect(page.getByRole("heading", { name: "Americana de prueba" })).toBeVisible()
  await page.getByRole("button", { name: playerNames[1], exact: true }).click()
  await page.getByRole("button", { name: "Vincular mi perfil" }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/players$`))
  await page.goto(`/tournaments/${id}/calendar`)
  await expect(page.getByRole("navigation", { name: "Navegación global" })).toHaveCount(0)
  await page.getByRole("link", { name: /Competiciones/ }).click()
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
  await expect(page.getByText("Clasificación final")).toBeVisible()
  await expect(page.getByText("Resultados registrados · 12/12")).toBeVisible()
  await page.getByRole("link", { name: "Inicio", exact: true }).click()
  await page.getByRole("button", { name: "Finalizar torneo" }).click()
  await expect(page.getByText(/^(Campeón|Campeones)$/)).toBeVisible()
  await expect(page.getByText(/Jugador \d{2}/).first()).toBeVisible()
  await page.getByRole("link", { name: "Clasificación", exact: true }).click()
  await expect(page.getByText("Clasificación final")).toBeVisible()
  await expect(page.getByRole("row").filter({ hasText: "Jugador" })).toHaveCount(13)
  await page.getByRole("link", { name: /Competiciones/ }).click()
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
  await page.getByRole("link", { name: "Inicio", exact: true }).click()
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

test("imports a season roster, keeps linked accounts, and lets the organizer choose twelve", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { user: { name: "QA Torneos", email: "qa-tournament@example.test", image: null }, expires: "2099-01-01T00:00:00Z" } }))
  await page.route("**/api/account/profile", (route) => route.fulfill({ json: { profile: { firstName: "QA", lastName: "Torneos", displayName: "QA Torneos", profileCompletedAt: "2026-08-03T00:00:00Z", availabilityCompletedAt: "2026-08-03T00:00:00Z", standardAvailabilityTimezone: "Europe/Madrid", standardAvailabilityWeeklySlots: {}, isComplete: true, isSuperuser: false } } }))
  await page.route("**/api/onboarding/progress", (route) => route.fulfill({ json: { items: [], ok: true } }))
  await page.route("**/api/locations", (route) => route.fulfill({ json: { locations: [] } }))
  await page.route("**/api/tournaments/people", (route) => route.fulfill({ json: { people: [], accountLinkingAvailable: true } }))
  const sourcePlayers = Array.from({ length: 13 }, (_, index) => ({ playerId: `player-${index + 1}`, displayName: `Jugador ${index + 1}`, userId: index === 0 ? "account-1" : null }))
  await page.route("**/api/tournaments/people?leagueId=**", (route) => route.fulfill({ json: { players: sourcePlayers } }))
  const submitted: Record<string, unknown>[] = []
  await page.route("**/api/tournaments", async (route) => {
    if (route.request().method() === "POST") { submitted.push(route.request().postDataJSON()); return route.fulfill({ status: 201, json: { id } }) }
    return route.fulfill({ json: { tournaments: [] } })
  })
  const leagueId = "b5f3b9b0-20b2-4265-9f9e-8c3129af3aa1"
  const seasonId = "a31f5097-f5be-4861-9ed0-80724c33fc0c"
  await page.goto(`/tournaments/new?sourceLeagueId=${leagueId}&sourceSeasonId=${seasonId}`)
  await expect(page.getByText("13/12", { exact: true })).toHaveCount(0)
  await expect(page.getByText("Jugador 13", { exact: true })).toBeVisible()
  await expect(page.getByText("Cuenta vinculada", { exact: true })).toBeVisible()
  await expect(page.getByText("Completa con nombres manuales las plazas restantes.", { exact: true })).toHaveCount(0)
  await page.getByRole("checkbox", { name: "Jugador 12", exact: true }).uncheck()
  await expect(page.getByText("Completa con nombres manuales las plazas restantes.", { exact: true })).toBeVisible()
  await page.locator('input[aria-label="Jugador 12"]').fill("Jugador manual")
  await page.getByLabel("Nombre del torneo *").fill("Torneo desde temporada")
  await page.getByLabel("Fecha").fill("2026-10-17")
  await page.getByLabel("Hora de inicio").fill("09:00")
  await page.getByRole("button", { name: "Crear y generar calendario" }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/calendar$`))
  expect(submitted[0]).toMatchObject({ source: { leagueId, seasonId } })
  expect((submitted[0].source as { playerIds: string[] }).playerIds).toHaveLength(11)
  expect(submitted[0].players).toContain("Jugador manual")
  expect((submitted[0].playerUserIds as Array<string | null>)[0]).toBe("account-1")
})

test("creates a dynamic Mexicano and generates only the next completed round", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 852 })
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: { user: { name: "QA Mexicano", email: "qa-mexicano@example.test", image: null }, expires: "2099-01-01T00:00:00Z" } }))
  await page.route("**/api/account/profile", (route) => route.fulfill({ json: { profile: { firstName: "QA", lastName: "Mexicano", displayName: "QA Mexicano", profileCompletedAt: "2026-08-03T00:00:00Z", availabilityCompletedAt: "2026-08-03T00:00:00Z", standardAvailabilityTimezone: "Europe/Madrid", standardAvailabilityWeeklySlots: {}, isComplete: true, isSuperuser: false } } }))
  await page.route("**/api/onboarding/progress", (route) => route.fulfill({ json: { items: [], ok: true } }))
  await page.route("**/api/locations", (route) => route.fulfill({ json: { locations: [] } }))
  await page.route("**/api/tournaments/people", (route) => route.fulfill({ json: { people: [], accountLinkingAvailable: false } }))
  const roster = playerNames.map((name, index) => ({ id: `player-${index + 1}`, slot: String.fromCharCode(65 + index), name }))
  const rounds = buildRapidRounds(start).map((round) => ({ ...round, id: `round-${round.round}` }))
  const history: MexicanoMatch[] = []
  const tournament = { id, name: "Mexicano dinámico QA", description: "", startsAt: start, startedAt: null as string | null, courtNames: ["Pista 1", "Pista 2"], status: "draft" as "draft" | "in_progress" | "finished", createdByUserId: "creator", finishedAt: null, configuration: { format: "dynamic_mexicano", generationSeed: 42, players: 12, courts: 2, reservationMinutes: 120, rounds: 6, roundMinutes: 16, transitionMinutes: 3, preparationMinutes: 2 } }
  const apiMatches: ReturnType<typeof makeTournament>["matches"] = []
  const addRound = () => {
    const round = generateDynamicMexicanoRound({ players: roster, history, courts: 2, round: history.reduce((maximum, match) => Math.max(maximum, match.round), 0) + 1, seed: 42 })
    round.matches.forEach((match, index) => {
      history.push({ ...match, round: round.round, scoreA: null, scoreB: null })
      const namesById = new Map(roster.map((player) => [player.id, player.name]))
      apiMatches.push({ id: `dynamic-${round.round}-${index + 1}`, round: round.round, court: match.court, courtName: `Pista ${match.court}`, teamA: match.teamAIds.map((playerId) => namesById.get(playerId)!) as [string, string], teamB: match.teamBIds.map((playerId) => namesById.get(playerId)!) as [string, string], teamAIds: match.teamAIds, teamBIds: match.teamBIds, scoreA: null, scoreB: null })
    })
  }
  let submittedFormat = ""
  await page.route("**/api/tournaments", async (route) => {
    if (route.request().method() === "POST") { submittedFormat = route.request().postDataJSON().format; return route.fulfill({ status: 201, json: { id } }) }
    return route.fulfill({ json: { tournaments: [{ id, name: tournament.name, startsAt: start, status: tournament.status }] } })
  })
  await page.route(`**/api/tournaments/${id}`, (route) => route.fulfill({ json: { tournament, players: roster, rounds, matches: apiMatches, access: { role: "creator" } } }))
  await page.route(`**/api/tournaments/${id}/**`, async (route) => {
    const url = new URL(route.request().url()), action = url.pathname.split("/").at(-1)
    if (action === "start") { tournament.status = "in_progress"; tournament.startedAt = "2026-10-16T12:00:00Z"; addRound() }
    if (action === "next-round") addRound()
    if (action === "result") {
      const matchId = url.pathname.split("/").at(-2), match = apiMatches.find((item) => item.id === matchId), body = route.request().postDataJSON() as { scoreA: number; scoreB: number }
      if (match) { match.scoreA = body.scoreA; match.scoreB = body.scoreB; const historical = history.find((item) => item.round === match.round && item.court === match.court); if (historical) { historical.scoreA = body.scoreA; historical.scoreB = body.scoreB } }
    }
    return route.fulfill({ json: { ok: true } })
  })

  await page.goto("/tournaments/new")
  await page.locator('select[aria-describedby="tournament-format-help"]').selectOption("dynamic_mexicano")
  await expect(page.getByText("Los enfrentamientos se generan después de cada ronda según los resultados, buscando partidos igualados y rotación de parejas.")).toBeVisible()
  await page.getByLabel("Nombre del torneo *").fill(tournament.name)
  await page.getByLabel("Fecha").fill("2026-10-17")
  await page.getByLabel("Hora de inicio").fill("09:00")
  for (let index = 0; index < playerNames.length; index += 1) await page.getByLabel(`Jugador ${index + 1}`, { exact: true }).fill(playerNames[index])
  await page.getByRole("button", { name: "Crear torneo", exact: true }).click()
  expect(submittedFormat).toBe("dynamic_mexicano")
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/calendar$`))
  await expect(page.getByText("0/6 rondas", { exact: true })).toBeVisible()
  await expect(page.locator("[data-tournament-match]")).toHaveCount(0)
  await page.getByRole("button", { name: "Iniciar torneo", exact: true }).click()
  await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/live$`))
  await page.getByRole("link", { name: "Calendario", exact: true }).click()
  await expect(page.getByText("1/6 rondas", { exact: true })).toBeVisible()
  await expect(page.locator("[data-tournament-match]")).toHaveCount(2)
  for (const match of apiMatches.slice(0, 2)) {
    const card = page.locator(`[data-tournament-match="${match.id}"]`)
    await card.getByRole("button", { name: "Registrar resultado", exact: true }).click()
    await card.locator('input[type="number"]').nth(0).fill("16")
    await card.locator('input[type="number"]').nth(1).fill("12")
    await card.getByRole("button", { name: "Guardar resultado" }).click()
  }
  await page.getByRole("link", { name: "Clasificación", exact: true }).click()
  await expect(page.getByText("Resultados registrados · 2/12", { exact: true })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Rendimiento" })).toBeVisible()
  await expect(page.getByRole("columnheader", { name: "Descansos" })).toBeVisible()
  await expect(page.getByRole("row")).toHaveCount(13)
  await page.getByRole("link", { name: "Calendario", exact: true }).click()
  await page.getByRole("button", { name: "Generar siguiente ronda", exact: true }).click()
  await expect(page.getByText("2/6 rondas", { exact: true })).toBeVisible()
  await expect(page.locator("[data-tournament-match]")).toHaveCount(4)
  await expect(page.locator(`[data-tournament-match="${apiMatches[0].id}"]`).getByRole("button", { name: "Corregir resultado" })).toHaveCount(0)
})
