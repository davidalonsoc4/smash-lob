import { expect, test, type Page } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { getLeaguePairGroups, generateFixedPairLeagueCalendar } from "@/lib/fixedPairLeague"
import { seasonRoundSettings, type League, type PlayerProfile, type Season, type SeasonPlayer } from "@/data/fakeData"
import type { SeasonRoundSettings, SeasonSnapshot } from "@/context/SeasonSettingsProvider"

const leagueId="10000000-0000-4000-8000-000000000061",seasonId="10000000-0000-4000-8000-000000000062"
const names=["Organizador","Bea","Cris","Dani"]
const email=(index:number)=>`qa-pairs-${index}@example.test`
const account=(index:number)=>`20000000-0000-4000-8000-${String(index+1).padStart(12,"0")}`
const playerId=(index:number)=>`30000000-0000-4000-8000-${String(index+1).padStart(12,"0")}`
async function fixture(page:Page,theme:string) {
  let viewer=0
  const league:League={id:leagueId,name:"Liga por parejas QA",description:"Fixture aislado",slug:"pairs-fixture",modality:"fixed_pairs",activeSeasonId:"",inviteCode:"PAIRQA",joinMode:"closed",locations:[],createdByUserId:account(0)}
  let seasons:Season[]=[],profiles:PlayerProfile[]=[],roster:SeasonPlayer[]=[],settings:SeasonRoundSettings[]=[],matches:ReturnType<typeof generateFixedPairLeagueCalendar>=[]
  const registered=new Map<number,string>()
  const membership=(index:number)=>({userId:email(index),leagueId,role:index===0?"creator" as const:"player" as const,playerId:registered.get(index)??""})
  const prepare=()=>{const groups=getLeaguePairGroups(roster);if(roster.length===4&&!groups.pending.length&&!matches.length)matches=generateFixedPairLeagueCalendar({leagueId,seasonId,pairs:groups.pairs.map(pair=>pair.playerIds)})}
  const snapshot=():SeasonSnapshot=>({seasons,playerProfiles:profiles,seasonPlayers:roster,seasonSettings:settings,activeSeasonIds:seasons.length?{[leagueId]:seasonId}:{}})
  function enroll(index:number,partner:string|null){const id=playerId(index);if(!registered.has(index)){profiles.push({id,leagueId,slug:`fixture-${index}`,displayName:names[index],avatarInitials:names[index].slice(0,2),userId:account(index)});roster.push({seasonId,playerId:id,pairNumber:null});registered.set(index,id)}if(partner){const target=roster.find(row=>row.playerId===partner)!;const number=Math.max(0,...roster.map(row=>row.pairNumber??0))+1;target.pairNumber=number;roster.find(row=>row.playerId===id)!.pairNumber=number}settings[0].registrationOpen=roster.length<4;settings[0].rosterCompletedAt=roster.length===4?"2026-10-15T09:00:00Z":null;prepare()}
  await page.addInitScript(({theme})=>{
    localStorage.setItem("smash-lob-theme-mode",theme);localStorage.setItem("smash-lob-visual-style","competition")
    localStorage.setItem("smash-lob-guided-onboarding-v1",JSON.stringify(Object.fromEntries([["app-introduction",1],["home",7],["season-admin",3],["matches",2],["ranking",2]].map(([tourKey,tourVersion])=>[tourKey,{tourKey,tourVersion,status:"completed",completedAt:"2026-08-06T00:00:00Z",skippedAt:null}]))))
    for(let index=0;index<4;index++)localStorage.setItem(`smash-lob:competition-launch-popup-v2:qa-pairs-${index}@example.test`,"dismissed")
  },{theme})
  await page.route("**/api/**",route=>route.fulfill({json:{ok:true,items:[],people:[],locations:[]}}))
  await page.route("**/api/auth/session",route=>route.fulfill({json:{user:{name:names[viewer],email:email(viewer),image:null},expires:"2099-01-01T00:00:00Z"}}))
  await page.route("**/api/account/profile",route=>route.fulfill({json:{profile:{firstName:names[viewer],lastName:"Prueba",displayName:names[viewer],profileCompletedAt:"2026-08-03",availabilityCompletedAt:"2026-08-03",isComplete:true,isSuperuser:false,standardAvailabilityTimezone:"Europe/Madrid",standardAvailabilityWeeklySlots:{},preferredSide:"drive",dominantHand:"right"}}}))
  await page.route("**/api/access**",route=>{prepare();return route.fulfill({json:{isSuperuser:false,canCreateLeagues:viewer===0,leagues:viewer===0||registered.has(viewer)?[league]:[],memberships:viewer===0||registered.has(viewer)?[membership(viewer)]:[],spectatorLeagueIds:[],matches:viewer===0?matches:[],seasonSnapshot:snapshot()}})})
  await page.route(`**/api/leagues/${leagueId}`,route=>route.fulfill({json:{leagueId,locations:[]}}))
  await page.route(`**/api/leagues/${leagueId}/seasons`,async route=>{
    const body=route.request().postDataJSON();expect(body.playerCapacity).toBe(4)
    league.activeSeasonId=seasonId
    seasons=[{id:seasonId,leagueId,name:body.name,status:"upcoming",totalRounds:body.targetRoundCount,completedRounds:0}]
    settings=[{...seasonRoundSettings[0],scheduleMode:"single",calendarMode:"balanced",allowPlayerIncidents:false,allowPlayerSubstitutions:false,availabilityRecommendationsEnabled:false,ballsAssignmentPriority:[],leagueId,seasonId,rosterMode:body.rosterMode,playerCapacity:4,registrationOpen:body.rosterMode==="self_registration",scheduledStartAt:body.scheduledStartAt,rosterCompletedAt:null,registrationFee:{enabled:false,amount:0,purpose:"",payments:[],expenses:[]},organizationBallsAssigned:false}]
    if(body.rosterMode==="self_registration"){expect(body.fixedPairs).toBeUndefined();enroll(0,null)}
    else {expect(body.fixedPairs).toHaveLength(2);profiles=body.newPlayerNames.map((name:string,index:number)=>({id:playerId(index),leagueId,slug:`manual-${index}`,displayName:name,avatarInitials:"QA"}));roster=profiles.map((player,index)=>({seasonId,playerId:player.id,pairNumber:body.fixedPairs.findIndex((pair:string[])=>pair.includes(`__new_player__${index}`))+1}));registered.set(0,playerId(0));prepare()}
    await route.fulfill({json:{seasonSnapshot:snapshot(),matches,linkedMembership:membership(0)}})
  })
  await page.route("**/api/invites/PAIRQA?**",route=>route.fulfill({json:{snapshot:{league,claimedMemberships:[...registered.keys()].map(membership),matches:[],seasonSnapshot:snapshot(),claimablePlayerIds:[]}}}))
  await page.route("**/api/invites/PAIRQA",route=>route.fulfill({json:{snapshot:{league,claimedMemberships:[...registered.keys()].map(membership),matches:[],seasonSnapshot:snapshot(),claimablePlayerIds:[]}}}))
  await page.route("**/api/invites/PAIRQA/claim",async route=>{const body=route.request().postDataJSON();expect(Object.hasOwn(body,"partnerPlayerId")).toBe(true);enroll(viewer,body.partnerPlayerId);await route.fulfill({json:{ok:true,membership:membership(viewer)}})})
  await page.route(`**/api/leagues/${leagueId}/seasons/${seasonId}/registration`,async route=>{const body=route.request().postDataJSON();enroll(viewer,body.partnerPlayerId);await route.fulfill({json:{ok:true,playerId:registered.get(viewer),registeredCount:roster.length,playerCapacity:4,rosterComplete:getLeaguePairGroups(roster).pending.length===0,membership:membership(viewer)}})})
  await page.route(`**/api/leagues/${leagueId}/seasons/${seasonId}/pairs`,async route=>{const body=route.request().postDataJSON();expect(body.roster).toEqual(Object.fromEntries(roster.map(row=>[row.playerId,row.pairNumber??null])));const invalidated=matches.length>0;for(const row of roster)row.pairNumber=null;body.pairs.forEach((pair:string[],index:number)=>pair.forEach(id=>{roster.find(row=>row.playerId===id)!.pairNumber=index+1}));matches=[];await route.fulfill({json:{ok:true,calendarInvalidated:invalidated}})})
  await page.route(`**/api/leagues/${leagueId}/seasons/${seasonId}/start`,route=>{expect(getLeaguePairGroups(roster).pending).toHaveLength(0);seasons[0].status="active";return route.fulfill({json:{ok:true,snapshot:snapshot(),matches}})})
  return {setViewer:(index:number)=>{viewer=index},snapshot,roster:()=>roster,matches:()=>matches,clearScheduledStart:()=>{settings[0].scheduledStartAt=null}}
}
for(const theme of ["light","dark"]){
  test(`prepared pair roster groups editable names and places cancellation at the end (${theme})`,async({page},info)=>{
    await fixture(page,theme)
    await page.goto("/admin/season")
    const reduce=page.getByRole("button",{name:"Reducir número de jugadores",exact:true})
    await expect(reduce).toBeVisible();await reduce.click();await reduce.click()
    const pairs=page.locator("[data-season-pairs]")
    await expect(pairs.getByRole("group")).toHaveCount(2)
    await expect(pairs.locator("input")).toHaveCount(4)
    for(let index=0;index<4;index++)await pairs.locator("input").nth(index).fill(`Jugador ${index+1}`)
    await pairs.getByRole("combobox",{name:"Pareja 1 · Jugador 2",exact:true}).selectOption("__new_player__2")
    await expect(pairs.getByRole("group").first().locator("input").nth(1)).toHaveValue("Jugador 3")
    const cancel=page.getByRole("button",{name:"Cancelar creación de la liga",exact:true}),submit=page.getByRole("button",{name:"Crear temporada",exact:true})
    expect(await cancel.evaluate(el=>Boolean(document.querySelector('button[type="submit"]')!.compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true)
    await pairs.screenshot({path:info.outputPath(`prepared-pairs-${theme}.png`)})
    await submit.evaluate(el=>el.scrollIntoView({block:"center"}));await submit.click()
    await expect(page).toHaveURL(/\/$/)
    await page.goto("/matches")
    await expect(page.getByText("Jugador 1",{exact:true}).first()).toBeVisible()
    await expect(page.getByText("Jugador 3",{exact:true}).first()).toBeVisible()
  })
  test(`pair self-registration links existing and later partners then lets the organizer review and start (${theme})`,async({page},info)=>{
    test.setTimeout(120000)
    const state=await fixture(page,theme)
    await page.goto("/admin/season")
    const reduce=page.getByRole("button",{name:"Reducir número de jugadores",exact:true})
    await expect(reduce).toBeVisible();await reduce.click();await reduce.click()
    await page.getByRole("button",{name:/Jugadores se registran al unirse/}).click()
    await expect(page.locator("[data-season-pairs]")).toHaveCount(0)
    await page.getByLabel("Fecha y hora de activación",{exact:true}).fill("2099-10-20T09:00")
    const create=page.getByRole("button",{name:"Crear temporada",exact:true});await expect(create).toBeEnabled();await create.evaluate(el=>el.scrollIntoView({block:"center"}));await create.click()
    await expect(page).toHaveURL(/\/$/)
    for(const [index,partner] of [[1,playerId(0)],[2,"__pending__"],[3,"__pending__"]] as const){
      state.setViewer(index);await page.goto("/invite/PAIRQA")
      await page.getByRole("checkbox",{name:"He leído y acepto el reglamento de la temporada.",exact:true}).check()
      const select=page.getByRole("combobox",{name:"Tu compañero",exact:true})
      await expect(select).toBeVisible()
      if(index===2)await expect(select.getByRole("option",{name:"Organizador",exact:true})).toHaveCount(0)
      await select.selectOption(partner)
      const join=page.getByRole("button",{name:"Aceptar y ocupar una plaza",exact:true});await join.evaluate(el=>el.scrollIntoView({block:"center"}));await join.click()
      await expect(page).toHaveURL(/\/$/)
    }
    await expect(page.getByText("Plantilla completa. Quedan parejas por confirmar.",{exact:true})).toBeVisible()
    await expect(page.locator('[data-season-start-countdown="hero"]')).toHaveCount(0)
    await page.getByRole("combobox",{name:"Tu compañero",exact:true}).selectOption(playerId(2))
    await page.getByRole("button",{name:"Vincular compañero",exact:true}).click()
    await expect(page.locator('[data-season-start-countdown="hero"]')).toBeVisible()
    expect(getLeaguePairGroups(state.roster()).pairs).toHaveLength(2)
    state.setViewer(0);await page.goto("/admin/season")
    await page.locator("summary").filter({hasText:/^Jugadores de temporada$/}).first().click()
    await page.getByRole("button",{name:"Revisar parejas",exact:true}).click()
    await page.getByRole("combobox",{name:"Pareja 1 · Jugador 2",exact:true}).selectOption(playerId(2))
    const save=page.getByRole("button",{name:"Guardar",exact:true}).filter({visible:true}).first();await save.click()
    await expect(page.getByText("Parejas guardadas. Se recalculará el calendario sin resultados.",{exact:true})).toBeVisible()
    await page.reload()
    await page.locator("summary").filter({hasText:/^Jugadores de temporada$/}).first().click()
    await expect(page.locator("[data-registered-pairs]").getByText("Cris",{exact:true})).toBeVisible()
    expect(state.roster().find(row=>row.playerId===playerId(0))!.pairNumber).toBe(state.roster().find(row=>row.playerId===playerId(2))!.pairNumber)
    for(const width of [320,393]){await page.setViewportSize({width,height:852});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)}
    await page.locator("[data-registered-pairs]").screenshot({path:info.outputPath(`registered-pairs-${theme}.png`)})
    const axe=await new AxeBuilder({page}).analyze();expect(axe.violations.filter(item=>item.impact==="serious"||item.impact==="critical")).toEqual([])
    state.clearScheduledStart();await page.reload()
    await page.locator("summary").filter({hasText:/^Comenzar temporada$/}).click()
    const start=page.getByRole("button",{name:"Comenzar temporada",exact:true})
    await expect(start).toBeEnabled();await start.evaluate(el=>el.scrollIntoView({block:"center"}));page.once("dialog",dialog=>dialog.accept());await start.click()
    await expect(page).toHaveURL(/\/$/)
    expect(state.snapshot().seasons[0].status).toBe("active")
    expect(state.matches()).toHaveLength(1)
  })
}
