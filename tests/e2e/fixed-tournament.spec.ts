import { expect, test } from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { buildRapidRounds, RAPID_TOURNAMENT_SLOTS } from "@/lib/rapidTournament"
import { fixedTeamsFromPlayers, generateFixedAmericanaFixtures, generateFixedRapidRound } from "@/lib/fixedRapidTournament"
import type { MexicanoMatch } from "@/lib/dynamicMexicano"

const id = "1a9e5304-e44b-4d37-98e9-179f738badf4"
const startsAt = "2027-01-02T08:00:00.000Z"

for (const format of ["balanced_americana","dynamic_mexicano"] as const) for (const theme of ["light","dark"]) for (const count of [8,32]) {
  test(`completes ${format} with fixed partners and team standings (${theme}, ${count} players)`, async ({page},testInfo) => {
    test.setTimeout(180_000)
    const names=Array.from({length:count},(_,i)=>`Fija ${String(i+1).padStart(2,"0")}`), rounds=count===32?8:3
    if(testInfo.project.name==="mobile-chromium")await page.setViewportSize({width:393,height:852})
    await page.clock.setFixedTime(new Date("2027-01-01T12:00:00Z"))
    await page.addInitScript(mode => { localStorage.setItem("smash-lob-theme-mode",mode); localStorage.setItem("smash-lob:competition-launch-popup-v2:fixed@example.test","dismissed") }, theme)
    await page.route("**/api/auth/session",route=>route.fulfill({json:{user:{name:"QA Fijas",email:"fixed@example.test",image:null},expires:"2099-01-01T00:00:00Z"}}))
    await page.route("**/api/account/profile",route=>route.fulfill({json:{profile:{firstName:"QA",lastName:"Fijas",displayName:"QA Fijas",profileCompletedAt:"2026-08-03T00:00:00Z",availabilityCompletedAt:"2026-08-03T00:00:00Z",standardAvailabilityTimezone:"Europe/Madrid",standardAvailabilityWeeklySlots:{},isComplete:true,isSuperuser:false}}}))
    await page.route("**/api/onboarding/progress",route=>route.fulfill({json:{items:[],ok:true}}))
    await page.route("**/api/locations",route=>route.fulfill({json:{locations:[]}}))
    await page.route("**/api/tournaments/sources",route=>route.fulfill({json:{sources:[]}}))
    await page.route("**/api/tournaments/people",route=>route.fulfill({json:{people:[],accountLinkingAvailable:true}}))
    const players = names.map((name,i)=>({id:`p-${i}`,slot:RAPID_TOURNAMENT_SLOTS[i],name,pairNumber:Math.floor(i/2)+1}))
    let history: MexicanoMatch[] = [], status = "draft", startedAt: string | null = null, draws = 0
    const config = {format,pairing:"fixed",players:count,courts:2,reservationMinutes:120,rounds,roundMinutes:10,transitionMinutes:2,preparationMinutes:2,breakMinutes:5,breakEveryRounds:2}
    const teams = ()=>fixedTeamsFromPlayers(players)
    const matchId = (match: MexicanoMatch)=>`r${match.round}-c${match.court}`
    const data = ()=>({access:{role:"creator"},tournament:{id,name:"Fijas de prueba",description:"",startsAt,startedAt,courtNames:["Pista 1","Pista 2"],status,createdByUserId:"creator",finishedAt:status==="finished"?startsAt:null,configuration:config},players,rounds:buildRapidRounds(new Date(Date.parse(startedAt??startsAt)+config.preparationMinutes*60_000),config).map(round=>({...round,id:`round-${round.round}`})),matches:history.map(match=>({...match,id:matchId(match),courtName:`Pista ${match.court}`,teamA:match.teamAIds.map(id=>players.find(player=>player.id===id)!.name),teamB:match.teamBIds.map(id=>players.find(player=>player.id===id)!.name)}))})
    const nextRound = ()=>{
      const round = Math.max(0,...history.map(match=>match.round))+1
      const generated = generateFixedRapidRound({teams:teams(),history,courts:2,round,seed:41,format})
      history.push(...generated.matches.map(match=>({...match,round,scoreA:null,scoreB:null})))
    }
    await page.route("**/api/tournaments",route=>{
      if(route.request().method()!=="POST") return route.fulfill({json:{tournaments:[]}})
      const body=route.request().postDataJSON()
      expect(body).toMatchObject({pairing:"fixed",format,playerCount:count,roundCount:rounds,roundMinutes:10,transitionMinutes:2,breakMinutes:5,breakEveryRounds:2,pairNumbers:[2,1,1,2,...Array.from({length:count-4},(_,i)=>Math.floor(i/2)+3)]})
      players.forEach((player,i)=>{player.pairNumber=body.pairNumbers[i]})
      if(format==="balanced_americana") history=generateFixedAmericanaFixtures(teams(),2,rounds,41)
      return route.fulfill({status:201,json:{id}})
    })
    await page.route(`**/api/tournaments/${id}`,route=>route.fulfill({json:data()}))
    await page.route(`**/api/tournaments/${id}/**`,route=>{
      const action=new URL(route.request().url()).pathname.split("/").at(-1)
      if(action==="draw"){draws++;history=generateFixedAmericanaFixtures(teams(),2,rounds,79)}
      if(action==="start"){status="in_progress";startedAt="2027-01-01T12:00:00Z";if(format==="dynamic_mexicano")nextRound()}
      if(action==="next-round")nextRound()
      if(action==="finish")status="finished"
      if(action==="result"){
        const match=history.find(match=>matchId(match)===new URL(route.request().url()).pathname.split("/").at(-2))!
        const body=route.request().postDataJSON();match.scoreA=body.scoreA;match.scoreB=body.scoreB
      }
      return route.fulfill({json:{ok:true}})
    })
    await page.goto("/tournaments/new")
    await page.getByRole("combobox",{name:"Formato",exact:true}).selectOption(format)
    await page.getByRole("combobox",{name:"Parejas",exact:true}).selectOption("fixed")
    await page.getByRole("button",{name:count===8?"Disminuir Número de jugadores":"Aumentar Número de jugadores",exact:true}).click({clickCount:count===8?2:10})
    await expect(page.getByLabel(`Número de jugadores: ${count}`)).toBeVisible()
    for(let i=0;i<count;i++)await page.getByLabel(`Jugador ${i+1}`,{exact:true}).fill(names[i])
    await page.getByText("Ajustes avanzados",{exact:true}).click()
    await page.getByRole("spinbutton",{name:/^Duración de ronda/}).fill("10")
    await page.getByRole("spinbutton",{name:/^Transición entre rondas/}).fill("2")
    await page.getByRole("checkbox",{name:"Añadir descanso general"}).check()
    await page.getByRole("spinbutton",{name:/^Descanso cada/}).fill("2")
    await page.getByRole("checkbox",{name:"Rondas automáticas"}).uncheck()
    await page.getByRole("spinbutton",{name:/^Número de rondas/}).fill(String(rounds))
    await page.getByLabel("Fecha",{exact:true}).fill("2027-01-02")
    await page.getByLabel("Hora de inicio").fill("09:00")
    const create=page.getByRole("button",{name:format==="balanced_americana"?"Crear y generar calendario":"Crear torneo",exact:true})
    await page.getByRole("combobox",{name:`Pareja de ${names[0]}`,exact:true}).selectOption("2")
    await expect(create).toBeDisabled()
    await page.getByRole("combobox",{name:`Pareja de ${names[2]}`,exact:true}).selectOption("1")
    await expect(create).toBeEnabled()
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true)
    await create.click()
    await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/calendar$`))
    if(format==="balanced_americana"){
      await page.getByRole("button",{name:"Volver a sortear",exact:true}).click()
      await expect.poll(()=>draws).toBe(1)
    }
    await page.getByRole("button",{name:"Iniciar torneo",exact:true}).click()
    await expect(page).toHaveURL(new RegExp(`/tournaments/${id}/live$`))
    await page.getByRole("link",{name:"Calendario",exact:true}).click()
    for(let round=1;round<=rounds;round++){
      const section=page.locator(`section[aria-labelledby="round-${round}"]`)
      for(const match of history.filter(match=>match.round===round)){
        const card=section.locator(`[data-tournament-match="${matchId(match)}"]`)
        await card.getByRole("button",{name:"Registrar resultado",exact:true}).click()
        await card.locator('input[type="number"]').nth(1).fill("12")
        if(round===1){
          await card.getByRole("button",{name:"Guardar resultado",exact:true}).click()
          await expect(card.getByRole("alert")).toBeVisible()
        }
        await card.locator('input[type="number"]').nth(0).fill("16")
        await card.getByRole("button",{name:"Guardar resultado",exact:true}).click()
        await expect(card.getByText("16–12",{exact:true})).toBeVisible()
      }
      if(format==="dynamic_mexicano"&&round<rounds){
        const next=page.getByRole("button",{name:"Generar siguiente ronda",exact:true})
        // Center the control above the fixed navbar. Chromium's minimal
        // autoscroll can leave its click point on the navbar's top boundary.
        await next.evaluate(button=>button.scrollIntoView({block:"center"}))
        const buttonBox=await next.boundingBox(),navBox=await page.getByRole("navigation",{name:"Navegación del torneo"}).boundingBox()
        expect(buttonBox!.y+buttonBox!.height).toBeLessThanOrEqual(navBox!.y)
        await next.click()
        // Wait for persistence and the new round before reading fixture history.
        // A fast desktop click can finish before the mocked request is handled.
        await expect.poll(()=>history.filter(match=>match.round===round+1).length).toBe(2)
        await expect(page.locator(`section[aria-labelledby="round-${round+1}"]`).getByRole("button",{name:"Registrar resultado",exact:true}).first()).toBeVisible()
      }
      if(round===2){
        await page.clock.setFixedTime(new Date("2027-01-01T12:24:00Z"))
        await page.getByRole("link",{name:"Inicio",exact:true}).click()
        await expect(page.getByText(/Ronda actual 3/)).toBeVisible()
        await page.getByRole("navigation",{name:"Navegación del torneo",exact:true}).getByRole("link",{name:"Seguimiento",exact:true}).click()
        await expect(page.getByRole("heading",{name:"Descanso general",exact:true})).toBeVisible()
        await expect(page.getByRole("timer")).toHaveText("07:00")
        await page.getByRole("link",{name:"Calendario",exact:true}).click()
      }
    }
    await page.getByRole("link",{name:"Clasificación",exact:true}).click()
    await expect(page.getByText("Clasificación final",{exact:true})).toBeVisible()
    await expect(page.getByRole("columnheader",{name:"Pareja",exact:true})).toBeVisible()
    await expect(page.locator("tbody tr")).toHaveCount(count/2)
    const axe=await new AxeBuilder({page}).include("main table").analyze()
    expect(axe.violations.filter(item=>["serious","critical"].includes(item.impact??""))).toEqual([])
    await page.screenshot({path:testInfo.outputPath(`fixed-${format}-${theme}-${count}.png`),scale:"css"})
    await page.getByRole("link",{name:"Inicio",exact:true}).click()
    await page.getByRole("button",{name:"Finalizar torneo",exact:true}).click()
    await expect(page.getByText(/^(Campeón|Campeones)$/).first()).toBeVisible()
    await page.goto(`/tournaments/${id}/settings`)
    await page.getByRole("link",{name:"Duplicar torneo",exact:true}).click()
    await expect(page.getByRole("combobox",{name:"Parejas",exact:true})).toHaveValue("fixed")
    await expect(page.getByRole("combobox",{name:`Pareja de ${names[0]}`,exact:true})).toHaveValue("2")
    await page.getByText("Ajustes avanzados",{exact:true}).click()
    await expect(page.getByRole("checkbox",{name:"Añadir descanso general"})).toBeChecked()
    await expect(page.getByRole("spinbutton",{name:/^Descanso cada/})).toHaveValue("2")
  })
}
