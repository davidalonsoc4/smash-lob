import {expect,type Page} from "@playwright/test"
import {buildTraditionalDraw,resolveTraditionalTournament,type TraditionalFormat,type TraditionalPlan,type TraditionalResult} from "@/lib/traditionalTournament"
import {buildTraditionalSchedule,validateTraditionalSchedule,type TraditionalScheduleEntry} from "@/lib/traditionalTournamentSchedule"
import {fixedTeamsFromPlayers} from "@/lib/fixedRapidTournament"
export const traditionalFixtureId="d8daab08-38c8-48a3-8cbc-92e2dca30a00"
export async function installTraditionalFixture(page:Page,format:TraditionalFormat,theme="light",role="creator"){
  const id=traditionalFixtureId
  await page.clock.setFixedTime(new Date("2027-01-01T12:00:00Z"))
  await page.addInitScript(mode=>{localStorage.setItem("smash-lob-theme-mode",mode);localStorage.setItem("smash-lob-visual-style",mode==="dark"?"competition":"classic");localStorage.setItem("smash-lob:competition-launch-popup-v2:traditional@example.test","dismissed")},theme)
  await page.route("**/api/auth/session",route=>route.fulfill({json:{user:{name:"QA Traditional",email:"traditional@example.test",image:null},expires:"2099-01-01T00:00:00Z"}}))
  await page.route("**/api/account/profile",route=>route.fulfill({json:{profile:{firstName:"QA",lastName:"Traditional",displayName:"QA Traditional",profileCompletedAt:"2026-08-03T00:00:00Z",availabilityCompletedAt:"2026-08-03T00:00:00Z",standardAvailabilityTimezone:"Europe/Madrid",standardAvailabilityWeeklySlots:{},isComplete:true,isSuperuser:true}}}))
  await page.route("**/api/onboarding/progress",route=>route.fulfill({json:{items:[],ok:true}}))
  await page.route("**/api/locations",route=>route.fulfill({json:{locations:[]}}))
  await page.route("**/api/tournaments/sources",route=>route.fulfill({json:{sources:[]}}))
  await page.route("**/api/tournaments/people",route=>route.fulfill({json:{people:[],accountLinkingAvailable:true}}))
  let name="Traditional fixture",startsAt="2027-01-02T09:00:00Z",status="draft",revision=0,results:TraditionalResult[]=[],schedule:TraditionalScheduleEntry[]=[],tieOrders:Record<string,string[]>={},draws=0,created=0
  let players=Array.from({length:8},(_,i)=>({id:`p-${i}`,slot:String.fromCharCode(65+i),name:`Tradicional ${i+1}`,pairNumber:Math.floor(i/2)+1,userId:null}))
  let draw:TraditionalPlan=buildTraditionalDraw({teams:fixedTeamsFromPlayers(players),configuration:{format,groupCount:format==="knockout"?0:2,qualifiersPerGroup:format==="groups_knockout"?1:0,thirdPlace:false,consolation:false},seed:17})
  let options={startsAt,courts:2,matchMinutes:30,transitionMinutes:5}
  const data=()=>({access:{role},tournament:{id,name,description:"Traditional test",startsAt,startedAt:status==="draft"?null:startsAt,status,createdByUserId:"creator",finishedAt:status==="finished"?startsAt:null,courtNames:Array.from({length:options.courts},(_,i)=>`Pista ${i+1}`),configuration:{format,pairing:"fixed",roundMinutes:options.matchMinutes,transitionMinutes:options.transitionMinutes}},players,rounds:[],matches:[],traditional:{draw,results,schedule,tieOrders,revision}})
  await page.route("**/api/tournaments",route=>{
    if(route.request().method()!=="POST")return route.fulfill({json:{tournaments:[]}})
    const body=route.request().postDataJSON();expect(body).toMatchObject({pairing:"fixed",format});created++
    name=body.name;startsAt=body.startsAt;status="draft";revision=0;results=[];tieOrders={}
    players=body.players.map((name:string,i:number)=>({id:`p-${i}`,slot:String.fromCharCode(65+i),name,pairNumber:body.pairNumbers[i],userId:body.playerUserIds[i]}))
    options={startsAt,courts:body.courtNames.length,matchMinutes:body.roundMinutes,transitionMinutes:body.transitionMinutes}
    draw=buildTraditionalDraw({teams:fixedTeamsFromPlayers(players),configuration:{format,groupCount:body.traditional.groupCount,qualifiersPerGroup:body.traditional.qualifiersPerGroup,thirdPlace:body.traditional.thirdPlace,consolation:body.traditional.consolation},seed:17,seededTeamIds:body.traditional.seededTeamIds,manualOrder:body.traditional.manualOrder,manualGroups:Array.isArray(body.traditional.manualGroups)?body.traditional.manualGroups:undefined})
    schedule=body.traditional.scheduleMode==="manual"?[]:buildTraditionalSchedule(draw,options)
    return route.fulfill({status:201,json:{id}})
  })
  await page.route(`**/api/tournaments/${id}`,route=>route.fulfill({json:data()}))
  await page.route(`**/api/tournaments/${id}/traditional`,route=>{
    const body=route.request().postDataJSON()
    if(role!=="creator")return route.fulfill({status:403,json:{error:"forbidden"}})
    if(body.revision!==revision)return route.fulfill({status:409,json:{error:"traditional_tournament_changed_refresh"}})
    try{
      if(body.action==="start")status="in_progress"
      if(body.action==="draw"){
        expect(status).toBe("draft");draws++
        draw=buildTraditionalDraw({teams:draw.teams,configuration:draw.configuration,seed:19,seededTeamIds:body.seededTeamIds,manualOrder:body.manualOrder,manualGroups:body.manualGroups})
        schedule=schedule.length?buildTraditionalSchedule(draw,options):[]
      }
      if(body.action==="result"){
        expect(status).toBe("in_progress")
        const match=resolveTraditionalTournament(draw,results,tieOrders).matches.find(match=>match.id===body.matchId)!
        if(match.stage!=="group"&&body.scoreA===body.scoreB)return route.fulfill({status:400,json:{error:"traditional_knockout_requires_winner"}})
        const next=[...results.filter(r=>r.matchId!==match.id),{matchId:match.id,teamAId:match.teamAId!,teamBId:match.teamBId!,scoreA:body.scoreA,scoreB:body.scoreB}]
        resolveTraditionalTournament(draw,next,tieOrders);results=next
      }
      if(body.action==="schedule"){validateTraditionalSchedule(draw,body.schedule,options);schedule=body.schedule}
      if(body.action==="ties"){resolveTraditionalTournament(draw,results,body.tieOrders);tieOrders=body.tieOrders}
      if(body.action==="finish"){expect(resolveTraditionalTournament(draw,results,tieOrders).complete).toBe(true);status="finished"}
      return route.fulfill({json:{ok:true,revision:++revision}})
    }catch{return route.fulfill({status:409,json:{error:"played_traditional_match_changed"}})}
  })
  return {data,options:()=>options,created:()=>created,draws:()=>draws,begin:()=>{status="in_progress"},prepareSchedule:()=>{schedule=buildTraditionalSchedule(draw,options)},results:()=>results,state:()=>resolveTraditionalTournament(draw,results,tieOrders)}
}
