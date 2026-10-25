import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { leagues, seasons, seasonPlayers, seasonRoundSettings, playerProfiles, allMatches } from "@/data/fakeData"

const leagueId="10000000-0000-4000-8000-000000000072", seasonId="20000000-0000-4000-8000-000000000072"
async function setup(page:Page,theme:string,style:string) {
  let upcoming=false,windowed=false
  const league={...leagues[0],id:leagueId,name:"Liga Azul QA",accentColor:"#26b6ce",activeSeasonId:seasonId}
  const season={...seasons.find(row=>row.id==="season-2")!,id:seasonId,leagueId,totalRounds:12,completedRounds:1}
  const profiles=playerProfiles.filter(row=>row.leagueId===leagues[0].id).map(row=>({...row,leagueId}))
  const roster=seasonPlayers.filter(row=>row.seasonId==="season-2").map(row=>({...row,seasonId}))
  const matches=allMatches.filter(row=>row.seasonId==="season-2").map(row=>({...row,leagueId,seasonId,status:row.round===1?"finished":"scheduling",sets:row.round===1?[{a:6,b:4}]:[],pointsA:row.round===1?1:null,pointsB:row.round===1?0:null,scheduledAt:null,resultRecordedAt:row.round===1?"2026-10-09T10:00:00Z":null}))
  const settings=()=>({...seasonRoundSettings[0],leagueId,seasonId,roundWindowMode:windowed?"fixed-days":"none",roundWindowDays:windowed?7:null,seasonStartsAt:windowed?"2026-10-09":null,manualActiveRound:windowed?null:2,scheduledStartAt:upcoming?"2026-10-20T08:00:00Z":null,rosterMode:"fixed",playerCapacity:8,registrationOpen:false,rosterCompletedAt:"2026-10-09T08:00:00Z",openingRoundEnabled:false,calendarVisibilityMode:"full",resultConfirmationMode:"none",registrationFee:{enabled:false,amount:0,purpose:"",payments:[],expenses:[]}})
  await page.clock.setFixedTime(new Date("2026-10-16T12:00:00Z"))
  await page.route("**/api/**",route=>route.fulfill({json:{ok:true,items:[],chats:[],locations:[]}}))
  await page.route("**/api/auth/session",route=>route.fulfill({json:{user:{name:"QA",email:"qa-experience@example.test",image:null},expires:"2099-01-01T00:00:00Z"}}))
  await page.route("**/api/account/profile",route=>route.fulfill({json:{profile:{firstName:"QA",lastName:"Experience",displayName:"QA",isComplete:true,profileCompletedAt:"2026-08-03",availabilityCompletedAt:"2026-08-03",standardAvailabilityTimezone:"Europe/Madrid",standardAvailabilityWeeklySlots:{},isSuperuser:false}}}))
  await page.route("**/api/access**",route=>route.fulfill({json:{isSuperuser:false,canCreateLeagues:true,leagues:[league],memberships:[{userId:"qa-experience@example.test",leagueId,playerId:"davo",role:upcoming?"player":"admin"}],spectatorLeagueIds:[],matches,seasonSnapshot:{seasons:[{...season,status:upcoming?"upcoming":"active"}],playerProfiles:profiles,seasonPlayers:roster,seasonSettings:[settings()],activeSeasonIds:{[leagueId]:seasonId}}}}))
  await page.route("**/api/personal-matches?**",route=>route.fulfill({json:{items:[],upcoming:[],hasMore:false,nextOffset:null}}))
  await page.route("**/api/tournaments",route=>route.fulfill({json:{tournaments:[]}}))
  await page.addInitScript(({theme,style})=>{
    localStorage.setItem("smash-lob-theme-mode",theme);localStorage.setItem("smash-lob-visual-style",style)
    localStorage.setItem("smash-lob:competition-launch-popup-v2:qa-experience@example.test","dismissed")
    localStorage.setItem("smash-lob-guided-onboarding-v1",JSON.stringify(Object.fromEntries([["app-introduction",1],["home",7],["matches",2],["match",1],["chats",1]].map(([tourKey,tourVersion])=>[tourKey,{tourKey,tourVersion,status:"completed",completedAt:"2026-08-06T00:00:00Z",skippedAt:null}]))))
  },{theme,style})
  return {setUpcoming:()=>{upcoming=true},setWindowed:()=>{windowed=true},matches,league}
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
    const action=page.locator(".app-action-button").first()
    await expect(action).toBeVisible()
    const color=await action.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundColor,text:s.color}})
    expect(color.background).not.toBe(color.text)
    if(theme==="light")expect(color.background).toBe("rgb(23, 23, 23)")
    await page.screenshot({path:info.outputPath(`pairing-${theme}-${style}.png`),scale:"css"})
    const audit=await new AxeBuilder({page}).analyze();expect(audit.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([])
  })
  test(`activity windows, hidden pairings and countdown fit the mobile home (${theme},${style})`,async({page},info)=>{
    const fixture=await setup(page,theme,style)
    await page.goto("/leagues")
    await expect(page.getByText("Te toca jugar esta jornada. Acuerda fecha con los demás.",{exact:true})).toBeVisible()
    fixture.setUpcoming();await page.reload()
    await expect(page.getByText("Emparejamientos por revelar",{exact:true})).toBeVisible()
    await page.goto("/")
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
test("global chats filter by competition and messages while distant rounds remain upcoming",async({page},info)=>{
  await setup(page,"dark","competition")
  await page.route("**/api/chats?**",route=>route.fulfill({json:{chats:[2,3,10].map(round=>({id:`chat-${round}`,round,status:"scheduling",scheduledAt:null,resultRecordedAt:null,readOnly:false,expired:false,partner:round===10?"Jugador Lejano":"Ana",rivals:["Bea","Carlos"],unread:round===2?1:0,lastMessage:round===3?null:{sender:"Ana",body:"Mensaje de prueba",createdAt:"2026-10-16T10:00:00Z"}}))}}))
  await page.goto("/personal-matches/chats")
  await expect(page.getByRole("region",{name:"Activos"}).getByText("Jornada 2",{exact:true})).toBeVisible()
  await expect(page.getByRole("region",{name:"Próximos"}).getByText("Jornada 10",{exact:true})).toBeVisible()
  await page.getByRole("combobox",{name:"Conversaciones",exact:true}).selectOption("empty")
  await expect(page.getByText("Jornada 3",{exact:true})).toBeVisible();await expect(page.getByText("Jornada 2",{exact:true})).toHaveCount(0)
  await page.getByRole("combobox",{name:"Conversaciones",exact:true}).selectOption("started")
  await page.getByRole("searchbox",{name:"Buscar conversación",exact:true}).fill("lejano")
  await expect(page.getByText("Jornada 10",{exact:true})).toBeVisible();await expect(page.getByText("Jornada 2",{exact:true})).toHaveCount(0)
  await page.getByRole("searchbox",{name:"Buscar conversación",exact:true}).fill("")
  await page.getByRole("combobox",{name:"Competición",exact:true}).selectOption("friendly")
  await expect(page.getByText("No hay conversaciones con estos filtros.",{exact:true})).toBeVisible()
  await page.getByRole("combobox",{name:"Competición",exact:true}).selectOption(leagueId)
  const badge=page.locator(".personal-match-league-origin").first();await expect(badge).toBeVisible()
  expect(await badge.evaluate(el=>el.style.getPropertyValue("--personal-league-accent").toLowerCase())).toBe("#26b6ce")
  await page.setViewportSize({width:320,height:852});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
  await page.screenshot({path:info.outputPath("global-chat-filters.png"),scale:"css"})
})
