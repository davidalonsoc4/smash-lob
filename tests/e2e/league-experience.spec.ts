import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { leagues, seasons, seasonPlayers, seasonRoundSettings, playerProfiles, allMatches } from "@/data/fakeData"

const leagueId="10000000-0000-4000-8000-000000000072", seasonId="20000000-0000-4000-8000-000000000072"
async function setup(page:Page,theme:string,style:string,canCreate=true) {
  let upcoming=false,windowed=false,advanced=false
  let role: "player" | "admin" = "admin"
  const league={...leagues[0],id:leagueId,name:"Liga Azul QA",accentColor:"#26b6ce",activeSeasonId:seasonId}
  const season={...seasons.find(row=>row.id==="season-2")!,id:seasonId,leagueId,totalRounds:12,completedRounds:1}
  const profiles=playerProfiles.filter(row=>row.leagueId===leagues[0].id).map(row=>({...row,leagueId}))
  const roster=seasonPlayers.filter(row=>row.seasonId==="season-2").map(row=>({...row,seasonId}))
  const matches=allMatches.filter(row=>row.seasonId==="season-2").map(row=>({...row,leagueId,seasonId,status:row.round===1?"finished":"scheduling",sets:row.round===1?[{a:6,b:4}]:[],pointsA:row.round===1?1:null,pointsB:row.round===1?0:null,scheduledAt:null,resultRecordedAt:row.round===1?"2026-10-09T10:00:00Z":null}))
  const settings=()=>({...seasonRoundSettings[0],leagueId,seasonId,mvpSystem:advanced?"automatic_advanced":seasonRoundSettings[0].mvpSystem,roundWindowMode:windowed?"fixed-days":"none",roundWindowDays:windowed?7:null,seasonStartsAt:windowed?"2026-10-09":null,manualActiveRound:windowed?null:2,scheduledStartAt:upcoming?"2026-10-20T08:00:00Z":null,rosterMode:"fixed",playerCapacity:8,registrationOpen:false,rosterCompletedAt:"2026-10-09T08:00:00Z",openingRoundEnabled:false,calendarVisibilityMode:"full",resultConfirmationMode:"none",registrationFee:{enabled:false,amount:0,purpose:"",payments:[],expenses:[]}})
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/**",route=>route.fulfill({json:{ok:true,items:[],chats:[],locations:[]}}))
  await page.route("**/api/auth/session",route=>route.fulfill({json:{user:{name:"QA",email:"qa-experience@example.test",image:null},expires:"2099-01-01T00:00:00Z"}}))
  await page.route("**/api/account/profile",route=>route.fulfill({json:{profile:{firstName:"QA",lastName:"Experience",displayName:"QA",isComplete:true,profileCompletedAt:"2026-08-03",availabilityCompletedAt:"2026-08-03",standardAvailabilityTimezone:"Europe/Madrid",standardAvailabilityWeeklySlots:{},isSuperuser:false}}}))
  await page.route("**/api/access**",route=>route.fulfill({json:{isSuperuser:false,canCreateLeagues:canCreate,leagues:[league],memberships:[{userId:"qa-experience@example.test",leagueId,playerId:"davo",role:upcoming?"player":role}],spectatorLeagueIds:[],matches,seasonSnapshot:{seasons:[{...season,status:upcoming?"upcoming":"active"}],playerProfiles:profiles,seasonPlayers:roster,seasonSettings:[settings()],activeSeasonIds:{[leagueId]:seasonId}}}}))
  await page.route("**/api/personal-matches?**",route=>route.fulfill({json:{items:[],upcoming:[],hasMore:false,nextOffset:null}}))
  await page.route("**/api/tournaments",route=>route.fulfill({json:{tournaments:[]}}))
  await page.addInitScript(({theme,style})=>{
    localStorage.setItem("smash-lob-theme-mode",theme);localStorage.setItem("smash-lob-visual-style",style)
    localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-experience@example.test","dismissed")
    localStorage.setItem("smash-lob-guided-onboarding-v1",JSON.stringify(Object.fromEntries([["app-introduction",1],["home",7],["matches",2],["match",1],["chats",1],["settings",1]].map(([tourKey,tourVersion])=>[tourKey,{tourKey,tourVersion,status:"completed",completedAt:"2026-08-06T00:00:00Z",skippedAt:null}]))))
  },{theme,style})
  return {setUpcoming:()=>{upcoming=true},setWindowed:()=>{windowed=true},setRole:(next: "player" | "admin")=>{role=next},setAdvanced:()=>{advanced=true},matches,league}
}

for (const scheduled of [false, true]) {
  test(`web and PWA start in Mis Competiciones with one ${scheduled ? "locked" : "active"} league`, async ({ page }) => {
    const { league, setUpcoming } = await setup(page, "dark", "classic")
    if (scheduled) setUpcoming()
    await page.addInitScript(id => localStorage.setItem("smash-lob-active-league", id), league.id)
    for (const entry of ["/", "/launch?source=pwa"]) {
      await page.goto(entry)
      await expect(page).toHaveURL("/leagues")
      await expect(page.getByRole("heading", { name: "Mis Competiciones", exact: true })).toBeVisible()
      await expect(page.locator("[data-countdown-home]")).toHaveCount(0)
    }
    await page.getByRole("button", { name: /Entrar en Liga Azul QA/ }).click()
    await expect(page).toHaveURL("/league/home")
    await expect(page.locator('[data-preseason-phase="locked"]')).toHaveCount(scheduled ? 1 : 0)
    await page.reload()
    await expect(page).toHaveURL("/league/home")
    await expect(page.locator('[data-tour="home-header"]')).toBeVisible()
    if (!scheduled) {
      await page.goto(`/open?${new URLSearchParams({ leagueId: league.id, target: "/" })}`)
      await expect(page).toHaveURL("/league/home")
    }
  })
}

test("notification starts the match chat request while league access is pending", async ({ page }) => {
  const { matches } = await setup(page, "dark", "classic")
  let releaseAccess!: () => void
  const accessPending = new Promise<void>(resolve => { releaseAccess = resolve })
  await page.route("**/api/access**", async route => { await accessPending; await route.fallback() })
  const match = matches[0]
  let chatReads = 0
  await page.route("**/api/matches/*/chat", route => {
    chatReads++
    return route.fulfill({ json: { currentUserId: "qa-user", round: match.round, readOnly: false, participants: [], messages: [] } })
  })
  const target = `/match/${match.id}/chat`
  try {
    const chatResponse = page.waitForResponse(`**/api/matches/${match.id}/chat`)
    await page.goto(`/open?${new URLSearchParams({ leagueId, target })}`)
    expect((await chatResponse).ok()).toBe(true)
  } finally {
    releaseAccess()
  }
  await expect(page).toHaveURL(new RegExp(`${target}$`))
  await expect(page.getByPlaceholder("Escribe un mensaje…")).toBeVisible()
  expect(chatReads).toBe(1)
})

test("season chat loads without waiting for the league snapshot", async ({ page }) => {
  await setup(page, "dark", "classic")
  let releaseAccess!: () => void
  const accessPending = new Promise<void>(resolve => { releaseAccess = resolve })
  await page.route("**/api/access**", async route => { await accessPending; await route.fallback() })
  await page.route("**/api/league-season-chats/**", route => route.fulfill({ json: { season: { name: "Temporada 2", league_id: leagueId }, messages: [], participants: [], me: "qa-user", unread: 0, readOnly: false, realtimeTopic: null } }))
  try {
    await page.goto(`/league-chat/${seasonId}`)
    await expect(page.getByPlaceholder("Escribe un mensaje…")).toBeVisible()
  } finally {
    releaseAccess()
  }
})

test("league season chat opens from home and sends a message", async ({ page }, info) => {
  await setup(page, "dark", "classic")
  const messages: Array<{ id: string; sender_user_id: string; sender_display_name: string; body: string; created_at: string }> = []
  await page.route("**/api/league-season-chats/**", async (route) => {
    if (route.request().method() === "POST") {
      messages.push({ id: "msg-1", sender_user_id: "qa-user", sender_display_name: "QA", body: route.request().postDataJSON().body, created_at: "2026-10-16T12:00:00Z" })
      await route.fulfill({ status: 201, json: { message: messages[0] } })
    } else {
      await route.fulfill({ json: { season: { name: "Temporada 1", league_id: leagueId }, messages, participants: [{ userId: "qa-user", displayName: "QA", avatarUrl: null, lastReadAt: null }, { userId: "friend", displayName: "Ana", avatarUrl: null, lastReadAt: "2026-10-16T13:00:00Z" }], me: "qa-user", unread: 1, readOnly: false, realtimeTopic: null } })
    }
  })
  await page.goto("/league/home")
  await page.getByRole("link", { name: "Abrir chat de liga" }).click()
  await expect(page.getByRole("heading", { name: "Liga Azul QA" })).toBeVisible()
  const menu = page.getByLabel("Más opciones", { exact: true })
  await menu.click()
  await expect(page.getByRole("link", { name: "Notificaciones" })).toBeVisible()
  await expect(page.getByRole("link", { name: "Ajustes" })).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(menu).toBeFocused()
  await page.getByPlaceholder("Escribe un mensaje…").fill("¡Hola, liga!")
  await page.getByRole("button", { name: "Enviar mensaje" }).click()
  await expect(page.getByText("¡Hola, liga!")).toBeVisible()
  await expect(page.getByLabel("Leído por todos")).toBeVisible()
  await page.getByText("2 participantes", { exact: false }).click()
  await expect(page.getByText("QA · Ana")).toBeVisible()
  await expect(page.locator("[data-match-chat-route='true']").first()).toBeVisible()
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations.filter((item) => item.impact === "serious" || item.impact === "critical")).toEqual([])
  await page.screenshot({ path: info.outputPath("league-season-chat.png") })
})

test("global chats include and filter active league conversations", async ({ page }) => {
  await setup(page, "dark", "competition")
  let permitted = true
  let unread = 2
  await page.route("**/api/league-season-chats/**", route => permitted ? route.fulfill({ json: { season: { name: "Temporada 2", league_id: leagueId }, messages: [{ sender_display_name: "Ana", body: "Hola equipo", created_at: "2026-10-16T12:00:00Z" }], participants: [{ userId: "qa-user" }, { userId: "friend" }], unread, realtimeTopic: null } }) : route.fulfill({ status: 404, json: { error: "league_chat_not_found" } }))
  await page.goto("/personal-matches/chats")
  const section = page.getByRole("region", { name: "Chats de liga" })
  await expect(section.getByRole("link", { name: /Liga Azul QA/ })).toHaveAttribute("href", `/league-chat/${seasonId}`)
  await expect(section.getByText("Temporada 2 · 2 participantes")).toBeVisible()
  await expect(section.getByText("Hola equipo", { exact: false })).toBeVisible()
  await expect(section.getByLabel("Mensajes sin leer")).toHaveText("2")
  await page.getByRole("button", { name: "Buscar y filtrar chats" }).click()
  const dialog = page.getByRole("dialog", { name: "Buscar y filtrar chats" })
  await dialog.getByLabel("Competición").selectOption("friendly")
  await dialog.getByRole("button", { name: "Ver conversaciones" }).click()
  await expect(section).toHaveCount(0)
  await page.getByRole("button", { name: "Buscar y filtrar chats" }).click()
  await dialog.getByLabel("Competición").selectOption("all")
  await dialog.getByLabel("Buscar conversación").fill("Hola equipo")
  await dialog.getByRole("button", { name: "Ver conversaciones" }).click()
  await expect(section).toBeVisible()
  unread = 0
  await page.evaluate(() => window.dispatchEvent(new Event("smash-lob:chat-unread-refresh")))
  await expect(section.getByLabel("Mensajes sin leer")).toHaveCount(0)
  permitted = false
  await page.reload()
  await expect(page.getByText("Todavía no tienes chats.")).toBeVisible()
  await expect(section).toHaveCount(0)
})

test("competition create button opens options for creators", async ({ page }) => {
  await setup(page, "dark", "classic", true)
  await page.goto("/leagues")
  const trigger = page.getByRole("button", { name: "Crear", exact: true })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "¿Qué quieres crear?" })
  await expect(dialog.getByRole("link", { name: "Nuevo partido amistoso" })).toHaveAttribute("href", "/personal-matches/new")
  await expect(dialog.getByRole("link", { name: "Crear nueva liga" })).toHaveAttribute("href", "/league/new")
  await expect(dialog.getByRole("link", { name: "Crear torneo" })).toHaveAttribute("href", "/tournaments/new")
  await page.keyboard.press("Escape")
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test("competition create button opens friendly directly for players", async ({ page }) => {
  await setup(page, "light", "classic", false)
  await page.goto("/leagues")
  const trigger = page.getByRole("link", { name: "Nuevo partido amistoso" })
  await expect(trigger).toHaveAttribute("href", "/personal-matches/new")
  await trigger.click()
  await expect(page).toHaveURL(/\/personal-matches\/new/)
})

test("finished league chat is read-only and absent for nonparticipants", async ({ page }) => {
  await setup(page, "light", "classic")
  let permitted = true
  await page.route("**/api/league-season-chats/**", async (route) => {
    if (!permitted) { await route.fulfill({ status: 404, json: { error: "league_chat_not_found" } }); return }
    await route.fulfill({ json: { season: { name: "Temporada 1" }, messages: [], me: "qa-user", unread: 0, readOnly: true, realtimeTopic: null } })
  })
  await page.goto("/chats")
  await expect(page.getByRole("heading", { name: "Chat general" })).toBeVisible()
  await page.getByRole("link", { name: /Liga Azul QA/ }).click()
  await expect(page.getByText("Temporada finalizada · Solo lectura")).toBeVisible()
  await expect(page.getByPlaceholder("Escribe un mensaje…")).toHaveCount(0)
  permitted = false
  await page.goto("/chats")
  await expect(page.getByRole("link", { name: /Liga Azul QA/ })).toHaveCount(0)
  await expect(page.getByRole("heading", { name: "Chat general" })).toHaveCount(0)
})

test("match chat title fits without truncation on a narrow mobile", async ({ page }) => {
  const { matches } = await setup(page, "dark", "classic")
  await page.setViewportSize({ width: 320, height: 740 })
  await page.route("**/api/matches/*/chat*", route => route.fulfill({ json: { currentUserId: "qa-user", round: 1, readOnly: false, participants: [], messages: [] } }))
  await page.goto(`/match/${matches[0].id}/chat`)
  const heading = page.locator(".app-match-chat-header h1")
  await expect(heading).toContainText("Jornada")
  expect(await heading.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  expect((await page.locator("[data-compact-chat-header]").boundingBox())!.height).toBeLessThan(80)
  const back = await page.getByRole("link", { name: "Volver" }).boundingBox()
  const title = await heading.boundingBox()
  const actions = await page.getByLabel("Más opciones", { exact: true }).boundingBox()
  expect(back!.x + back!.width).toBeLessThanOrEqual(title!.x)
  expect(title!.x + title!.width).toBeLessThanOrEqual(actions!.x)
})

for (const theme of ["light", "dark"]) {
  test(`pinned match reservation is compact and opens calendar (${theme})`, async ({ page }) => {
    const { matches } = await setup(page, theme, "competition")
    await page.setViewportSize({ width: 320, height: 740 })
    await page.route("**/api/matches/*/chat*", route => route.fulfill({ json: { currentUserId: "qa-user", round: 1, readOnly: false, participants: [], messages: [], reservationSummary: { scheduledAt: "2026-10-18T18:00:00Z", locationText: "Barakaldo · Lasesarre · Pista 1" } } }))
    await page.goto(`/match/${matches[0].id}/chat`)
    const banner = page.getByRole("button", { name: /Reserva.*Guardar en calendario/ })
    await expect(banner).toBeVisible()
    await expect(banner).toContainText("Barakaldo · Lasesarre · Pista 1")
    expect((await banner.boundingBox())!.height).toBeLessThanOrEqual(56)
    await banner.click()
    await expect(page.getByRole("button", { name: "Google Calendar" })).toBeVisible()
  })
}

for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
  test(`league chat header stays compact and aligned (${theme},${style})`, async ({ page }) => {
    await setup(page, theme, style)
    await page.setViewportSize({ width: 320, height: 740 })
    await page.route("**/api/league-season-chats/**", route => route.fulfill({ json: { season: { name: "Temporada 1", league_id: leagueId }, messages: [], participants: [{ userId: "qa-user", displayName: "QA" }, { userId: "friend", displayName: "Ana" }], me: "qa-user", readOnly: false, realtimeTopic: null } }))
    await page.goto(`/league-chat/${seasonId}`)
    const header = page.locator("[data-compact-chat-header]")
    await expect(header.getByRole("heading", { name: "Liga Azul QA" })).toBeVisible()
    const back = (await header.getByRole("link", { name: "Volver" }).boundingBox())!
    const title = (await header.getByRole("heading").boundingBox())!
    const menu = (await page.getByLabel("Más opciones", { exact: true }).boundingBox())!
    expect(back.x + back.width).toBeLessThanOrEqual(title.x)
    expect(title.x + title.width).toBeLessThanOrEqual(menu.x)
    expect((await header.boundingBox())!.height).toBeLessThan(80)
    const season = (await header.getByText("Temporada 1", { exact: true }).boundingBox())!
    const participants = (await header.getByText("2 participantes", { exact: true }).boundingBox())!
    expect(participants.x - (season.x + season.width)).toBeGreaterThanOrEqual(8)
    await header.getByText("2 participantes", { exact: false }).click()
    await expect(page.getByText("QA · Ana")).toBeVisible()
  })
}

test("future match result entry is not highlighted", async ({ page }) => {
  const { matches } = await setup(page, "dark", "classic")
  const match = matches.find(item => item.teamA.includes("davo") || item.teamB.includes("davo"))! as { id: string; status: string; sets: { a: number; b: number }[]; pointsA: number | null; pointsB: number | null; resultRecordedAt: string | null; scheduledAt: string | null }
  match.status = "scheduled"; match.sets = []; match.pointsA = null; match.pointsB = null; match.resultRecordedAt = null; match.scheduledAt = "2026-10-17T11:30:00Z"
  await page.goto(`/match/${match.id}`)
  await expect(page.getByText("Registrar resultado", { exact: true })).toBeVisible()
  await expect(page.locator('[data-result-highlight="true"]')).toHaveCount(0)
})

for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
  test(`result entry is highlighted only while the match is in progress (${theme},${style})`, async ({ page }) => {
    const { matches } = await setup(page, theme, style)
    const match = matches.find(item => item.teamA.includes("davo") || item.teamB.includes("davo"))! as { id: string; status: string; sets: { a: number; b: number }[]; pointsA: number | null; pointsB: number | null; resultRecordedAt: string | null; scheduledAt: string | null }
    match.status = "scheduled"
    match.sets = []
    match.pointsA = null
    match.pointsB = null
    match.resultRecordedAt = null
    match.scheduledAt = "2026-10-16T11:30:00Z"
    await page.goto(`/match/${match.id}`)
    await expect(page.locator('[data-result-highlight="true"]')).toHaveCount(1)
    await expect(page.locator('[data-result-highlight="true"]')).toContainText("Registrar resultado")
  })
  test(`home personal result matches competitions activity styling (${theme},${style})`, async ({ page }) => {
    await setup(page, theme, style)
    await page.setViewportSize({ width: 320, height: 740 })
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const staticStyles = document.createElement("style")
        staticStyles.textContent = "*, *::before, *::after { transition: none !important; }"
        document.head.appendChild(staticStyles)
      }, { once: true })
    })
    await page.goto("/leagues")
    const hubResult = page.locator('[data-activity-accent] .app-card').filter({ has: page.locator('[data-match-preview="result"]') }).first()
    await expect(hubResult).toBeAttached()
    const styles = (element: Element) => { const css = getComputedStyle(element); return { background: css.backgroundColor, borderTop: css.borderTopColor, borderWidth: css.borderTopWidth, shadow: css.boxShadow, padding: css.paddingTop } }
    const expected = await hubResult.evaluate(styles)
    const hubAccent = await hubResult.evaluate(element => getComputedStyle(element).getPropertyValue("--app-accent"))
    await page.goto("/league/home")
    const homeResult = page.locator(".home-personal-result").first()
    await expect(homeResult).toBeVisible()
    const homeAccent = await homeResult.evaluate(element => getComputedStyle(element).getPropertyValue("--app-accent"))
    expect(homeAccent).toBe(hubAccent)
    await expect(homeResult.locator("[data-match-card-header]")).toContainText("Jornada 1")
    const labelStyle = (element: Element) => { const css = getComputedStyle(element); return { color: css.color, fontSize: css.fontSize, fontWeight: css.fontWeight, textTransform: css.textTransform, letterSpacing: css.letterSpacing } }
    const homeLabel = await homeResult.locator("[data-match-card-header] p").evaluate(labelStyle)
    expect(await homeResult.evaluate(styles)).toEqual(expected)
    await expect(homeResult.locator("[data-match-event-meta]")).toHaveCount(0)
    await expect(homeResult.getByRole("button", { name: "Victoria", exact: true })).toBeVisible()
    expect(await homeResult.locator(".match-preview-total").first().evaluate(element => getComputedStyle(element).color)).toBe("rgb(17, 17, 17)")
    await page.goto("/matches")
    const calendarLabel = page.locator("[data-match-card-header] p").first()
    await expect(calendarLabel).toContainText("Jornada 1")
    expect(await calendarLabel.evaluate(labelStyle)).toEqual(homeLabel)
  })
  test(`calendar cards show round and use unboxed results (${theme},${style})`, async ({ page }, info) => {
    const { matches } = await setup(page, theme, style)
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto("/league/home")
    const homeResult = page.locator('[data-home-match-carousel] [data-match-preview="result"]').first()
    await expect(homeResult).toBeVisible()
    expect(await homeResult.locator('[data-preview-team]').evaluateAll(rows => rows.every(row => getComputedStyle(row).backgroundColor === "rgba(0, 0, 0, 0)"))).toBe(true)
    await page.goto("/matches")
    const finished = page.locator("section.app-card").filter({ has: page.locator(`a[href="/match/${matches[0].id}"]`) })
    await expect(finished).toBeVisible()
    await expect(finished.locator("[data-match-card-header]")).toContainText("Jornada")
    await expect(finished.locator('[data-match-preview="result"] [data-preview-team]')).toHaveCount(2)
    expect(await finished.locator('[data-preview-team]').evaluateAll(rows => rows.every(row => getComputedStyle(row).backgroundColor === "rgba(0, 0, 0, 0)"))).toBe(true)
    expect(await finished.locator('[data-preview-team]').nth(1).evaluate(row => getComputedStyle(row).borderTopWidth)).toBe("1px")
    const pending = page.locator("section.app-card").filter({ has: page.locator(`a[href="/match/${matches.find(match => match.status === "scheduling")!.id}"]`) })
    await expect(pending.locator("[data-match-card-header]")).toContainText("Jornada")
    await finished.screenshot({ path: info.outputPath(`calendar-result-${theme}-${style}.png`) })
    const victory = finished.getByRole("button", { name: "Victoria", exact: true })
    await expect(victory).toBeVisible()
    expect(await victory.evaluate(element => [getComputedStyle(element).backgroundColor, getComputedStyle(element).color])).toEqual(["rgb(22, 101, 52)", "rgb(255, 255, 255)"])
  })
  test(`calendar defeat badge is intense (${theme},${style})`, async ({ page }) => {
    const { matches } = await setup(page, theme, style)
    matches[0].sets = matches[0].teamA.includes("davo") ? [{ a: 2, b: 6 }] : [{ a: 6, b: 2 }]
    matches[0].pointsA = matches[0].teamA.includes("davo") ? 0 : 1
    matches[0].pointsB = matches[0].teamA.includes("davo") ? 1 : 0
    await page.goto("/matches")
    const defeat = page.getByRole("button", { name: "Derrota", exact: true }).first()
    await expect(defeat).toBeVisible()
    expect(await defeat.evaluate(element => [getComputedStyle(element).backgroundColor, getComputedStyle(element).color])).toEqual(["rgb(185, 28, 28)", "rgb(255, 255, 255)"])
  })
}

for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
  test(`personal match league label is plain and readable (${theme},${style})`, async ({ page }) => {
    await setup(page, theme, style)
    const match = { id: "match-label-test", origin: "league", status: "finished", leagueId, leagueName: "Liga Azul QA", seasonId, seasonName: "Temporada 1", round: 1, scheduledAt: "2026-10-15T18:00:00Z", resultRecordedAt: "2026-10-15T20:00:00Z", sets: [{ a: 6, b: 2 }], participants: [{ team: 1, slot: 1, displayName: "QA", isCurrentUser: true }, { team: 1, slot: 2, displayName: "Ana" }, { team: 2, slot: 1, displayName: "Bea" }, { team: 2, slot: 2, displayName: "Carlos" }] }
    await page.route("**/api/personal-matches?**", route => route.fulfill({ json: { items: [match], upcoming: [], hasMore: false, nextOffset: null } }))
    await page.goto("/personal-matches")
    const label = page.locator('[data-personal-match-origin="league"]').first()
    await expect(label).toContainText("Liga Azul QA")
    const computed = await label.evaluate(element => { const css = getComputedStyle(element); return { background: css.backgroundColor, border: css.borderTopWidth, color: css.color, foreground: getComputedStyle(document.documentElement).getPropertyValue("--foreground").trim() } })
    expect(computed.background).toBe("rgba(0, 0, 0, 0)")
    expect(computed.border).toBe("0px")
    expect(await label.evaluate(element => getComputedStyle(element).color === getComputedStyle(document.body).color)).toBe(true)
    const victory = page.getByRole("button", { name: "Victoria", exact: true })
    await expect(victory).toBeVisible()
    expect(await victory.evaluate(element => [getComputedStyle(element).backgroundColor, getComputedStyle(element).color])).toEqual(["rgb(22, 101, 52)", "rgb(255, 255, 255)"])
    match.sets = [{ a: 2, b: 6 }]
    await page.reload()
    const defeat = page.getByRole("button", { name: "Derrota", exact: true })
    await expect(defeat).toBeVisible()
    expect(await defeat.evaluate(element => [getComputedStyle(element).backgroundColor, getComputedStyle(element).color])).toEqual(["rgb(185, 28, 28)", "rgb(255, 255, 255)"])
  })
}

for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
  test(`league chat list has a single border and separated rounds (${theme},${style})`, async ({ page }) => {
    await setup(page, theme, style)
    await page.route("**/api/league-season-chats/**", route => route.fulfill({ json: { season: { name: "Temporada 2" }, messages: [], participants: [], me: "qa-user", unread: 0, readOnly: false, realtimeTopic: null } }))
    await page.route("**/api/chats?**", route => route.fulfill({ json: { chats: [1, 2, 10].map(round => ({ id: `chat-${round}`, round, status: "scheduling", coordinationStatus: null, scheduledAt: null, readOnly: false, partner: "Ana", rivals: ["Bea", "Carlos"], unread: 0, lastMessage: null })) } }))
    await page.goto("/chats")
    const general = page.getByRole("link", { name: /Liga Azul QA/ }).locator(".app-card")
    const stack = page.locator(".chat-list-stack").first()
    const cards = stack.locator(".app-card")
    await expect(cards).toHaveCount(2)
    const geometry = await stack.evaluate(element => {
      const rows = [...element.querySelectorAll<HTMLElement>(".app-card")]
      return { outer: getComputedStyle(element).borderTopWidth, borders: rows.map(row => getComputedStyle(row).borderTopWidth), bounds: rows.map(row => ({ top: row.getBoundingClientRect().top, bottom: row.getBoundingClientRect().bottom })) }
    })
    expect(geometry.outer).toBe("0px")
    expect(geometry.borders).toEqual([await general.evaluate(element => getComputedStyle(element).borderTopWidth), "1px"])
    expect(Math.abs(geometry.bounds[0].bottom - geometry.bounds[1].top)).toBeLessThanOrEqual(1)
    await expect(page.getByRole("link", { name: /^Jornada 1\s/ })).toBeVisible()
    await expect(page.getByRole("link", { name: /Jornada 2/ })).toBeVisible()
    const colors = await Promise.all(["Chat general", "Activos", "Próximos"].map(name => page.getByRole("heading", { name, exact: true }).evaluate(element => getComputedStyle(element).color)))
    expect(new Set(colors).size).toBe(1)
  })

  test(`league chat preview presents participants, last message and unread (${theme},${style})`, async ({ page }) => {
    await setup(page, theme, style)
    await page.route("**/api/league-season-chats/**", route => route.fulfill({ json: { season: { name: "Temporada 1" }, messages: [{ id: "msg-1", sender_user_id: "friend", sender_display_name: "Ana", body: "Nos vemos pronto", created_at: "2026-10-16T12:00:00Z" }], participants: [{ userId: "qa-user", displayName: "QA", avatarUrl: null, lastReadAt: null }, { userId: "friend", displayName: "Ana", avatarUrl: null, lastReadAt: null }], me: "qa-user", unread: 1, readOnly: false, realtimeTopic: null } }))
    await page.goto("/chats")
    const card = page.getByRole("link", { name: /Liga Azul QA/ })
    await expect(card.getByText("Temporada 2 · 2 participantes")).toBeVisible()
    await expect(card.getByText("Nos vemos pronto", { exact: false })).toBeVisible()
    await expect(card.getByLabel("Mensajes sin leer")).toBeVisible()
    expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true)
  })
}
for(const theme of ["light","dark"]){
  test(`MVP help and result visibility respect participant and admin roles (${theme})`,async({page},info)=>{
    const fixture=await setup(page,theme,"competition")
    fixture.setAdvanced();fixture.setRole("player")
    await page.goto("/league/home")
    const homeMvp = page.locator("[data-mvp-recognition]").first()
    await expect(homeMvp).toBeVisible()
    await expect(homeMvp.locator(".app-match-mvp-star")).toBeVisible()
    await expect(homeMvp.locator(".app-match-mvp-name")).toBeVisible()
    const homeHelp = homeMvp.getByRole("button", { name: "Información sobre el índice ajustado" })
    if (await homeHelp.count()) { await homeHelp.click(); await expect(page.getByRole("tooltip")).toContainText("no es un porcentaje"); await page.keyboard.press("Escape") }
    const own=fixture.matches.find(match=>match.round===1&&[...match.teamA,...match.teamB].includes("davo"))!
    const other=fixture.matches.find(match=>match.round===1&&![...match.teamA,...match.teamB].includes("davo"))!
    await page.goto(`/match/${own.id}`)
    await expect(page.getByRole("heading",{name:"Resultado registrado",exact:true})).toBeVisible()
    const recognition=page.locator("[data-mvp-recognition]").first()
    await expect(recognition.locator("p").first()).toHaveText("MVP de la jornada · Empate técnico")
    await expect(recognition.locator("p").last()).not.toContainText("empate técnico")
    for(const width of [320,393]){
      await page.setViewportSize({width,height:800})
      const trigger=page.getByRole("button",{name:"Información sobre el índice ajustado",exact:true})
      await trigger.click()
      const tooltip=page.getByRole("tooltip")
      await expect(tooltip).toContainText("no es un porcentaje")
      await expect(tooltip).toContainText("3 puntos o menos")
      const bounds=await tooltip.boundingBox()
      expect(bounds!.x).toBeGreaterThanOrEqual(0)
      expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(width)
      expect(bounds!.y+bounds!.height).toBeLessThanOrEqual(800)
      const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([])
      await page.screenshot({path:info.outputPath(`mvp-help-${theme}-${width}.png`),scale:"css"})
      await page.keyboard.press("Escape")
      await expect(tooltip).toHaveCount(0)
    }
    await page.goto(`/match/${other.id}`)
    await expect(page.locator(".app-match-result-row")).toHaveCount(2)
    await expect(page.locator("[data-mvp-recognition]")).toBeVisible()
    await expect(page.getByRole("heading",{name:"Resultado registrado",exact:true})).toHaveCount(0)
    await expect(page.getByRole("region",{name:"Resultado del partido",exact:true})).toHaveCount(0)
    fixture.setRole("admin");await page.reload()
    await expect(page.getByRole("heading",{name:"Resultado registrado",exact:true})).toBeVisible()
  })
}
for(const theme of ["light","dark"])for(const style of ["classic","competition"]){
  test(`calendar and match share compact states, readable actions and equal gaps (${theme},${style})`,async({page},info)=>{
    const fixture=await setup(page,theme,style)
    await page.goto("/matches")
    await expect(page.getByRole("heading",{name:"Jornada 2",exact:true})).toBeVisible()
    await expect(page.getByText("Próxima",{exact:true})).toHaveCount(0)
    await expect(page.getByText("En curso",{exact:true}).first()).toBeVisible()
    fixture.setWindowed();await page.reload()
    await expect(page.getByText("Próxima",{exact:true})).toHaveCount(0)
    await expect(page.getByText(/Hasta 22 oct/)).toBeVisible()
    const pending=fixture.matches.find(match=>match.round===2)!
    await page.goto(`/match/${pending.id}`)
    const panels=page.locator(".app-match-pair-surface")
    await expect(panels).toHaveCount(2)
    for(const width of [320,393]){
      await page.setViewportSize({width,height:852})
      const boxes=await panels.evaluateAll(elements=>elements.map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,w:r.width,h:r.height,border:parseFloat(s.borderTopWidth),background:s.backgroundColor}}))
      expect(Math.abs(boxes[0].w-boxes[1].w)).toBeLessThan(.6)
      expect(Math.abs(boxes[1].x-boxes[0].x-boxes[0].w-12)).toBeLessThan(.6)
      expect(boxes.every(box=>box.border>=1)).toBe(true)
      if(theme==="light")expect(boxes.every(box=>box.background==="rgb(255, 255, 255)")).toBe(true)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    }
    const action=page.locator(".app-action-primary").first()
    await expect(action).toBeVisible()
    const color=await action.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,text:s.color}})
    expect(color.background).not.toBe(color.text)
    expect(color.background).not.toBe("rgba(0, 0, 0, 0)")
    expect(await action.evaluate(el => parseFloat(getComputedStyle(el).borderTopWidth))).toBe(1)
    await page.screenshot({path:info.outputPath(`pairing-${theme}-${style}.png`),scale:"css"})
    const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([])
    const finished=fixture.matches.find(match=>match.round===1)!
    await page.goto(`/match/${finished.id}`)
    await expect(page.locator(".app-match-result-row")).toHaveCount(2)
    await expect(page.locator(".app-match-result-row[data-winner]")).toHaveCount(1)
    for(const width of [320,393]){
      await page.setViewportSize({width,height:852})
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      const rows=await page.locator(".app-match-result-row").evaluateAll(elements=>elements.map(el=>el.getBoundingClientRect().width))
      expect(Math.abs(rows[0]-rows[1])).toBeLessThan(.6)
    }
    const resultAudit=await new AxeBuilder({page}).analyze();expect(resultAudit.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([])
    await page.screenshot({path:info.outputPath(`finished-${theme}-${style}.png`),scale:"css"})
  })
  test(`activity windows, hidden pairings and countdown fit the mobile home (${theme},${style})`,async({page},info)=>{
    const fixture=await setup(page,theme,style)
    await page.goto("/leagues")
    await expect(page.getByText("Te toca jugar esta jornada. Acuerda fecha con los demás.",{exact:true})).toBeVisible()
    fixture.setUpcoming();await page.reload()
    await expect(page.getByText("Emparejamientos por revelar",{exact:true})).toBeVisible()
    await page.goto("/league/home")
    await expect(page.locator('[data-season-start-countdown="hero"]')).toBeVisible()
    await expect(page.getByText("Los controles de esta liga se activarán al comenzar. Puedes seguir usando Competiciones y Mis partidos.",{exact:true})).toBeVisible()
    for(const width of [320,393]){
      await page.setViewportSize({width,height:852})
      await expect.poll(()=>page.evaluate(()=>Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-innerHeight)).toBeLessThanOrEqual(1)
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
    }
    await page.screenshot({path:info.outputPath(`countdown-${theme}-${style}.png`),scale:"css"})
  })
}
for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
test(`global chats filter by competition and messages while distant rounds remain upcoming (${theme},${style})`,async({page},info)=>{
  await setup(page,theme,style)
  await page.route("**/api/chats?**",route=>route.fulfill({json:{chats:[2,3,10].map(round=>({id:`chat-${round}`,round,status:"scheduling",scheduledAt:null,resultRecordedAt:null,readOnly:false,expired:false,partner:round===10?"Jugador Lejano":"Ana",rivals:["Bea","Carlos"],unread:round===2?1:0,lastMessage:round===3?null:{sender:"Ana",body:"Mensaje de prueba",createdAt:"2026-10-16T10:00:00Z"}}))}}))
  await page.goto("/personal-matches/chats")
  await expect(page.getByRole("region",{name:"Activos"}).getByText("Jornada 2",{exact:true})).toBeVisible()
  await expect(page.getByRole("region",{name:"Próximos"}).getByText("Jornada 10",{exact:true})).toBeVisible()
  const activeHeading = page.getByRole("heading", { name: /^Activos/ })
  const upcomingHeading = page.getByRole("heading", { name: /^Próximos/ })
  expect(await activeHeading.evaluate(el => [getComputedStyle(el).color, getComputedStyle(el).fontSize, getComputedStyle(el, "::before").display])).toEqual(await upcomingHeading.evaluate(el => [getComputedStyle(el).color, getComputedStyle(el).fontSize, getComputedStyle(el, "::before").display]))
  await expect(activeHeading).toHaveClass(/type-section-title/)
  const trigger = page.getByRole("button", { name: "Buscar y filtrar chats", exact: true })
  const panel = page.getByRole("dialog", { name: "Buscar y filtrar chats", exact: true })
  await expect(page.getByRole("searchbox")).toHaveCount(0)
  const show = async () => { await trigger.click(); await expect(panel).toBeVisible() }
  const apply = async () => { await panel.getByRole("button", { name: "Ver conversaciones", exact: true }).click(); await expect(panel).not.toBeVisible(); await expect(trigger).toBeFocused() }
  await show()
  await expect(panel.getByRole("searchbox")).toBeFocused()
  await panel.getByRole("combobox",{name:"Conversaciones",exact:true}).selectOption("empty")
  await apply()
  await expect(trigger.locator(".app-search-active")).toBeVisible()
  await expect(page.getByText("Jornada 3",{exact:true})).toBeVisible();await expect(page.getByText("Jornada 2",{exact:true})).toHaveCount(0)
  await show()
  await expect(panel.getByRole("combobox",{name:"Conversaciones",exact:true})).toHaveValue("empty")
  await panel.getByRole("combobox",{name:"Conversaciones",exact:true}).selectOption("started")
  await panel.getByRole("searchbox",{name:"Buscar conversación",exact:true}).fill("lejano")
  await page.keyboard.press("Escape")
  await expect(panel).not.toBeVisible()
  await expect(page.getByText("Jornada 10",{exact:true})).toBeVisible();await expect(page.getByText("Jornada 2",{exact:true})).toHaveCount(0)
  await show()
  await expect(panel.getByRole("searchbox")).toHaveValue("lejano")
  await panel.getByRole("searchbox").fill("")
  await panel.getByRole("combobox",{name:"Competición",exact:true}).selectOption("friendly")
  await apply()
  await expect(page.getByText("No hay conversaciones con estos filtros.",{exact:true})).toBeVisible()
  await page.getByRole("button", {name:"Limpiar filtros",exact:true}).click()
  await expect(trigger.locator(".app-search-active")).toHaveCount(0)
  await show()
  await panel.getByRole("combobox",{name:"Competición",exact:true}).selectOption(leagueId)
  await panel.getByRole("combobox",{name:"Estado",exact:true}).selectOption("upcoming")
  for (const width of [320,393]) {
    await page.setViewportSize({width,height:852})
    const box = await panel.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x+box!.width).toBeLessThanOrEqual(width)
    expect(await panel.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
  }
  const axe = await new AxeBuilder({page}).analyze()
  expect(axe.violations.filter(v=>v.impact==="serious"||v.impact==="critical")).toEqual([])
  await page.keyboard.press("Tab")
  expect(await panel.evaluate(el=>el.contains(document.activeElement))).toBe(true)
  await page.screenshot({path:info.outputPath(`global-chat-panel-${theme}-${style}.png`),scale:"css"})
  await apply()
  await expect(page.getByRole("region",{name:"Activos"})).toHaveCount(0)
  await expect(page.getByText("Jornada 10",{exact:true})).toBeVisible()
  const badge=page.locator(".personal-match-league-origin").first();await expect(badge).toBeVisible()
  expect(await badge.evaluate(el=>el.style.getPropertyValue("--personal-league-accent").toLowerCase())).toBe("#26b6ce")
  await page.setViewportSize({width:320,height:852});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:info.outputPath("global-chat-filters.png"),scale:"css"})
})
}
for (const theme of ["light", "dark"]) for (const style of ["classic", "competition"]) {
  test(`floating surfaces share search, dismissal and crop protection (${theme},${style})`, async ({ page }, info) => {
    await setup(page,theme,style)
    await page.goto("/settings")
    const search = page.locator('[data-tour="settings-search"]')
    await search.click()
    let modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()
    await expect(modal.getByRole("combobox")).toBeFocused()
    await modal.getByRole("combobox").fill("tema")
    await page.keyboard.press("Tab")
    expect(await modal.evaluate(el=>el.contains(document.activeElement))).toBe(true)
    const close = modal.getByRole("button",{name:"Cerrar",exact:true})
    const closeBox = await close.boundingBox()
    expect(closeBox!.width).toBeGreaterThanOrEqual(44)
    expect(closeBox!.height).toBeGreaterThanOrEqual(44)
    const axe = await new AxeBuilder({page}).analyze()
    expect(axe.violations.filter(v=>v.impact==="serious"||v.impact==="critical")).toEqual([])
    await page.keyboard.press("Escape")
    await expect(modal).not.toBeVisible()
    await expect(search).toBeFocused()
    await search.click()
    await page.mouse.click(2,2)
    await expect(modal).not.toBeVisible()
    await expect(search).toBeFocused()
    await page.getByRole("button",{name:"Ayuda de esta pantalla",exact:true}).click()
    modal = page.getByRole("dialog")
    await expect(modal).toBeVisible()
    await modal.getByRole("button",{name:"Cerrar",exact:true}).click()
    await expect(modal).not.toBeVisible()
    await page.goto("/league/new")
    await page.locator("summary").filter({hasText:"Personalizar liga"}).click()
    await page.locator('input[type="file"]').setInputFiles("public/icon-192.png")
    const crop = page.getByRole("dialog",{name:"Recortar logo de la liga",exact:true})
    await expect(crop).toBeVisible()
    await crop.getByRole("button",{name:"Girar a la derecha",exact:true}).click()
    page.once("dialog",dialog=>dialog.dismiss())
    await page.keyboard.press("Escape")
    await expect(crop).toBeVisible()
    await page.setViewportSize({width:320,height:700})
    expect(await crop.evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
    await page.screenshot({path:info.outputPath(`floating-crop-${theme}-${style}.png`),scale:"css"})
    page.once("dialog",dialog=>dialog.accept())
    await crop.getByRole("button",{name:"Cancelar",exact:true}).click()
    await expect(crop).not.toBeVisible()
    expect(await page.evaluate(()=>document.body.style.overflow)).not.toBe("hidden")
  })
}
