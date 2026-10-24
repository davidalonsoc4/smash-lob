import assert from "node:assert/strict"

// Independent synthetic fixtures exercise PostgreSQL, not a mocked RPC client.
export function checkTraditionalDatabase({ sql, quote, creator, other }) {
  const json = value => `${quote(JSON.stringify(value))}::jsonb`
  const team = number => ({ kind: "team", teamId: `pair-${number}` })
  const source = (matchId, kind = "winner") => ({ kind, matchId })
  const group = (groupId, position) => ({ kind: "group", groupId, position })
  const node = (id, stage, round, a, b, groupId = null) => ({ id, stage, round, a, b, groupId })
  const teams = Array.from({ length: 4 }, (_, i) => ({ id: `pair-${i + 1}`, playerIds: [`slot-${i*2}`,`slot-${i*2+1}`] }))
  const fixtures = format => {
    const groups = format === "knockout" ? [] : format === "groups" ? [{ id:"group-1",teamIds:teams.map(team=>team.id) }]
      : [{id:"group-1",teamIds:["pair-1","pair-4"]},{id:"group-2",teamIds:["pair-2","pair-3"]}]
    const matches = groups.flatMap(g => g.teamIds.flatMap((a, i) => g.teamIds.slice(i+1).map((b,j) => node(`${g.id}-${i}-${j}`,"group",i+j+1,{kind:"team",teamId:a},{kind:"team",teamId:b},g.id))))
    if (format === "knockout") matches.push(node("main-1-1","main",1,team(1),team(4)),node("main-1-2","main",1,team(2),team(3)),node("main-2-1","main",2,source("main-1-1"),source("main-1-2")),node("third-place","third_place",2,source("main-1-1","loser"),source("main-1-2","loser")))
    if (format === "groups_knockout") matches.push(node("main-1-1","main",1,group("group-1",1),group("group-2",1)),node("consolation-1-1","consolation",1,group("group-1",2),group("group-2",2)))
    return { configuration:{format,groupCount:groups.length,qualifiersPerGroup:format==="groups_knockout"?1:0,thirdPlace:format==="knockout",consolation:format==="groups_knockout"},teams,seedOrder:teams.map(t=>t.id),groups,matches }
  }
  const startsAt = new Date(Date.now()+86400000).toISOString()
  const schedule = draw => draw.matches.map((match,i) => ({matchId:match.id,court:i%2+1,startsAt:new Date(Date.parse(startsAt)+i*35*60000).toISOString(),endsAt:new Date(Date.parse(startsAt)+(i*35+30)*60000).toISOString()}))
  const create = (draw, calendar=schedule(draw)) => `SELECT public.create_traditional_tournament('${creator}','Synthetic traditional','',${quote(startsAt)}::timestamptz,ARRAY['Court 1','Court 2'],ARRAY[${Array.from({length:draw.teams.length*2},(_,i)=>quote(`Traditional ${i}`)).join(",")}],ARRAY[${Array(draw.teams.length*2).fill("NULL").join(",")}]::uuid[],ARRAY[${draw.teams.flatMap((_,i)=>[i+1,i+1]).join(",")}]::smallint[],${json(draw)},${json(calendar)},30,5)`
  const rejects = (statement, message) => assert.throws(()=>sql(statement),error=>String(error.stderr).includes(message),message)
  const value = statement => sql(`SET ROLE service_role; ${statement}`).split(/\r?\n/).at(-1)
  for (const role of ["anon","authenticated"]) rejects(`SET ROLE ${role}; SELECT * FROM public.traditional_tournament_state`,"permission denied")
  rejects(`SET ROLE authenticated; ${create(fixtures("knockout"))}`,"permission denied")
  for (const format of ["knockout","groups","groups_knockout"]) {
    const draw = fixtures(format), id = value(create(draw))
    assert.match(id,/^[a-f0-9-]{36}$/)
    assert.equal(sql(`SELECT tournament_mode||'/'||format||'/'||pairing FROM rapid_tournaments WHERE id='${id}'`),`traditional/${format}/fixed`)
    assert.equal(sql(`SELECT count(*) FROM rapid_tournament_rounds WHERE tournament_id='${id}'`),"0","traditional byes must not create fake rapid rounds")
    const stored = JSON.parse(sql(`SELECT draw FROM traditional_tournament_state WHERE tournament_id='${id}'`))
    assert.equal(stored.teams.flatMap(t=>t.playerIds).every(player=>/^[a-f0-9-]{36}$/.test(player)),true)
    let revision=0, results=[]
    const update = (action, {actor=creator, expected=revision, nextResults=null,nextSchedule=null,nextOrders=null,nextDraw=null}={}) =>
      `SELECT public.update_traditional_tournament('${id}','${actor}',${expected},${quote(action)},${nextDraw?json(nextDraw):"NULL"},${nextResults?json(nextResults):"NULL"},${nextSchedule?json(nextSchedule):"NULL"},${nextOrders?json(nextOrders):"NULL"})`
    assert.equal(value(update("start",{actor:other})),"-1")
    rejects(`SELECT public.start_rapid_tournament('${id}','${creator}')`,"use_traditional_tournament_management")
    assert.equal(value(update("start")),String(++revision))
    assert.equal(value(update("start",{expected:0})),"-1","optimistic revision rejects a second stale mutation")
    rejects(update("draw",{nextDraw:stored}),"invalid_traditional_action")
    rejects(update("finish"),"traditional_tournament_incomplete")
    assert.equal(sql(`SELECT revision FROM traditional_tournament_state WHERE tournament_id='${id}'`),String(revision))
    const sourceTeam = sourceValue => sql(`SELECT public.traditional_source_team(${json(stored)},${json(results)},'{}',${json(sourceValue)})`)
    for (const match of stored.matches) {
      const result={matchId:match.id,teamAId:sourceTeam(match.a),teamBId:sourceTeam(match.b),scoreA:20,scoreB:10}
      assert.ok(result.teamAId && result.teamBId,"the source must be known before saving a result")
      if (!results.length) {
        rejects(update("result",{nextResults:[{...result,scoreA:0,scoreB:0}]}),"invalid_traditional_results")
        rejects(update("result",{nextResults:[{...result,teamAId:result.teamBId}]}),"invalid_traditional_results")
        if (format==="knockout") rejects(update("result",{nextResults:[{...result,scoreA:10,scoreB:10}]}),"invalid_traditional_results")
      }
      results.push(result)
      assert.equal(value(update("result",{nextResults:results})),String(++revision))
      assert.equal(JSON.parse(sql(`SELECT results FROM traditional_tournament_state WHERE tournament_id='${id}'`)).length,results.length)
    }
    if (format!=="groups") {
      const changed=results.map((r,i)=>i? r:{...r,scoreA:r.scoreB,scoreB:r.scoreA})
      rejects(update("result",{nextResults:changed}),"invalid_traditional_results")
      assert.equal(sourceTeam({kind:"winner",matchId:format==="knockout"?"main-2-1":"main-1-1"}),"pair-1")
    } else {
      assert.equal(sourceTeam(group("group-1",1)),"pair-1")
      assert.equal(sourceTeam(group("group-1",4)),"pair-4")
    }
    rejects(update("schedule",{nextSchedule:[]}),"played_traditional_schedule_locked")
    assert.equal(value(update("finish")),String(++revision))
    assert.equal(sql(`SELECT status FROM rapid_tournaments WHERE id='${id}'`),"finished")
    assert.equal(value(update("result",{nextResults:results})),"-1")
  }
  const draw=fixtures("knockout"), calendar=schedule(draw), count=sql("SELECT count(*) FROM rapid_tournaments")
  const collision=calendar.map((entry,i)=>i===1?{...entry,court:calendar[0].court,startsAt:calendar[0].startsAt,endsAt:calendar[0].endsAt}:entry)
  rejects(create(draw,collision),"traditional_schedule_overlap")
  rejects(create(draw,[calendar.at(-1)]),"traditional_schedule_dependency_conflict")
  const cycle=structuredClone(draw); cycle.matches[0].a=source(cycle.matches.at(-1).id)
  rejects(create(cycle),"invalid_traditional_source")
  assert.equal(sql("SELECT count(*) FROM rapid_tournaments"),count,"failed traditional creation must roll back common identity and roster")
  const byeDraw={configuration:{format:"knockout",groupCount:0,qualifiersPerGroup:0,thirdPlace:false,consolation:false},
    teams:[...teams,{id:"pair-5",playerIds:["slot-8","slot-9"]}],seedOrder:["pair-1","pair-2","pair-3","pair-4","pair-5"],groups:[],
    matches:[node("main-1-1","main",1,team(1),null),node("main-1-2","main",1,team(4),team(5)),node("main-1-3","main",1,team(2),null),node("main-1-4","main",1,team(3),null),
      node("main-2-1","main",2,source("main-1-1"),source("main-1-2")),node("main-2-2","main",2,source("main-1-3"),source("main-1-4")),node("main-3-1","main",3,source("main-2-1"),source("main-2-2"))]}
  const byeId=value(create(byeDraw,[]))
  assert.equal(sql(`SELECT public.traditional_source_team(draw,results,tie_orders,${json(source("main-1-1"))}) FROM traditional_tournament_state WHERE tournament_id='${byeId}'`),"pair-1")
  assert.equal(sql(`SELECT public.traditional_source_team(draw,results,tie_orders,${json(source("main-1-1","loser"))}) FROM traditional_tournament_state WHERE tournament_id='${byeId}'`),"")
  const roster24=Array.from({length:12},(_,i)=>({id:`pair-${i+1}`,playerIds:[`slot-${i*2}`,`slot-${i*2+1}`]}))
  const bigGroup={id:"group-1",teamIds:roster24.map(t=>t.id)}
  const bigDraw={configuration:{format:"groups",groupCount:1,qualifiersPerGroup:0,thirdPlace:false,consolation:false},teams:roster24,seedOrder:bigGroup.teamIds,groups:[bigGroup],
    matches:roster24.flatMap((a,i)=>roster24.slice(i+1).map((b,j)=>node(`group-1-${i}-${j}`,"group",i+j+1,team(i+1),{kind:"team",teamId:b.id},"group-1")))}
  const bigId=value(create(bigDraw,[]))
  assert.equal(sql(`SELECT jsonb_array_length(draw->'matches') FROM traditional_tournament_state WHERE tournament_id='${bigId}'`),"66")
  const grouped=fixtures("groups_knockout"), id=value(create(grouped,[])), stored=JSON.parse(sql(`SELECT draw FROM traditional_tournament_state WHERE tournament_id='${id}'`))
  let revision=Number(value(`SELECT public.update_traditional_tournament('${id}','${creator}',0,'start')`)), results=[]
  for(const match of stored.matches.filter(m=>m.stage==="group")){
    results.push({matchId:match.id,teamAId:match.a.teamId,teamBId:match.b.teamId,scoreA:10,scoreB:10})
    revision=Number(value(`SELECT public.update_traditional_tournament('${id}','${creator}',${revision},'result',NULL,${json(results)})`))
  }
  assert.equal(sql(`SELECT public.traditional_source_team(${json(stored)},${json(results)},'{}',${json(group("group-1",1))})`),"","a tied qualifier must not be selected by ID")
  const orders=Object.fromEntries(stored.groups.map(g=>[g.id,g.teamIds]))
  assert.equal(value(`SELECT public.update_traditional_tournament('${id}','${creator}',${revision},'ties',NULL,NULL,NULL,${json(orders)})`),String(revision+1))
  assert.equal(sql(`SELECT public.traditional_source_team(${json(stored)},${json(results)},${json(orders)},${json(group("group-1",1))})`),"pair-1")
  assert.equal(sql(`SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('create_traditional_tournament','update_traditional_tournament') AND NOT prosecdef AND 'search_path=public, pg_temp'=ANY(proconfig)`),"2")
  assert.equal(sql(`SELECT relrowsecurity FROM pg_class WHERE oid='public.traditional_tournament_state'::regclass`),"t")
}

export function checkCanonicalTraditionalDatabase({sql,quote,creator,engine}){
  const json=value=>`${quote(JSON.stringify(value))}::jsonb`
  for(const [count,format] of [[2,"knockout"],[3,"groups"],[5,"knockout"],[6,"groups_knockout"],[12,"knockout"]]){
    const teams=Array.from({length:count},(_,i)=>({id:`pair-${i+1}`,playerIds:[`p${i*2}`,`p${i*2+1}`]}))
    const configuration={format,groupCount:format==="knockout"?0:format==="groups"?1:2,qualifiersPerGroup:format==="groups_knockout"?2:0,thirdPlace:format==="groups_knockout",consolation:format==="groups_knockout"}
    const draw=engine.buildTraditionalDraw({teams,configuration,seed:19,seededTeamIds:["pair-1"]})
    const startsAt=new Date(Date.now()+86400000).toISOString(),options={startsAt,courts:2,matchMinutes:30,transitionMinutes:5}
    const schedule=engine.buildTraditionalSchedule(draw,options)
    const id=sql(`SELECT public.create_traditional_tournament('${creator}','Canonical ${format}','',${quote(startsAt)}::timestamptz,ARRAY['Court 1','Court 2'],ARRAY[${teams.flatMap((_,i)=>[quote(`Canonical ${i*2}`),quote(`Canonical ${i*2+1}`)]).join(",")}],ARRAY[${Array(count*2).fill("NULL").join(",")}]::uuid[],ARRAY[${teams.flatMap((_,i)=>[i+1,i+1]).join(",")}]::smallint[],${json(draw)},${json(schedule)},30,5)`)
    const read=()=>engine.readTraditionalStoredState(JSON.parse(sql(`SELECT jsonb_build_object('draw',draw,'results',results,'schedule',schedule,'tie_orders',tie_orders,'revision',revision) FROM traditional_tournament_state WHERE tournament_id='${id}'`)),options)
    let current=read()
    assert.deepEqual(current.draw.matches,draw.matches,"the canonical application draw must round-trip through SQL")
    assert.equal(sql(`SELECT public.update_traditional_tournament('${id}','${creator}',0,'start')`),"1")
    let steps=0
    for(;;){
      current=read();const resolved=engine.resolveTraditionalTournament(current.draw,current.results,current.tieOrders)
      if(resolved.complete){assert.ok(resolved.championIds.includes("pair-1"));break}
      assert.ok(++steps<100,"canonical tournament must make progress")
      const match=resolved.matches.find(match=>match.state==="ready")
      assert.ok(match,"unambiguous canonical results must unlock another match")
      const winA=Number(match.teamAId.split("-")[1])<Number(match.teamBId.split("-")[1])
      const result={matchId:match.id,teamAId:match.teamAId,teamBId:match.teamBId,scoreA:winA?20:10,scoreB:winA?10:20}
      const next=[...current.results,result]
      assert.equal(sql(`SET ROLE service_role; SELECT public.update_traditional_tournament('${id}','${creator}',${current.revision},'result',NULL,${json(next)})`).split(/\r?\n/).at(-1),String(current.revision+1))
    }
    assert.equal(sql(`SELECT public.update_traditional_tournament('${id}','${creator}',${current.revision},'finish')`),String(current.revision+1))
    assert.equal(sql(`SELECT status FROM rapid_tournaments WHERE id='${id}'`),"finished")
  }
}
