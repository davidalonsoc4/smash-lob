import assert from "node:assert/strict"
import { execFileSync, execFile } from "node:child_process"
import { readFileSync, mkdirSync, writeFileSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { promisify } from "node:util"
import { createRequire } from "node:module"
import path from "node:path"
import ts from "typescript"

// Disposable local fixtures only; never read app credentials or remote URLs.
const binary = path.resolve(".quality-artifacts/postgres-tools/pgsql/bin/psql.exe")
const database = `pair_registration_${randomUUID().replaceAll("-", "").slice(0,12)}`
const env = { ...process.env, PGPASSWORD: "", PGSSLMODE: "disable", PGCONNECT_TIMEOUT: "3", PGCLIENTENCODING: "UTF8" }
const args = db => ["-X","-q","--no-password","-h","127.0.0.1","-p","55439","-U","postgres","-d",db,"-v","ON_ERROR_STOP=1","-t","-A"]
const sql = (input,db=database) => execFileSync(binary,[...args(db),"-f","-"],{input,encoding:"utf8",env,windowsHide:true,stdio:["pipe","pipe","pipe"]}).trim()
const quote = value => `'${String(value).replaceAll("'","''")}'`
const rejects = (input,code) => assert.throws(()=>sql(input),error=>String(error.stderr).includes(code),code)
const definition = (file,name) => { const source=readFileSync(file,"utf8"),start=source.indexOf(`CREATE OR REPLACE FUNCTION public.${name}(`); assert(start>=0); return source.slice(start,source.indexOf("$$;",start)+3) }
assert.equal(sql("SHOW data_directory","postgres").replaceAll("\\","/").toLowerCase(),path.resolve(".quality-artifacts/postgres-tournaments-data").replaceAll("\\","/").toLowerCase())
const directory=path.resolve(".quality-artifacts/pair-registration-domain")
mkdirSync(directory,{recursive:true})
writeFileSync(path.join(directory,"fixedPairLeague.js"),ts.transpileModule(readFileSync("src/lib/fixedPairLeague.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)
const {generateFixedPairLeagueCalendar}=createRequire(import.meta.url)(path.join(directory,"fixedPairLeague.js"))
sql(`CREATE DATABASE ${database}`,"postgres")
try {
  sql(`CREATE TABLE app_users(id uuid PRIMARY KEY,email text,first_name text,last_name text,display_name text,profile_completed_at timestamptz,is_superuser boolean DEFAULT false);
    CREATE TABLE leagues(id uuid PRIMARY KEY,name text,active_season_id uuid);
    CREATE TABLE seasons(id uuid PRIMARY KEY,league_id uuid REFERENCES leagues,status text DEFAULT 'upcoming',total_rounds integer DEFAULT 1,completed_rounds integer DEFAULT 0);
    CREATE TABLE players(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),league_id uuid REFERENCES leagues,slug text,display_name text,avatar_initials text,avatar_url text,UNIQUE(league_id,slug));
    CREATE TABLE league_memberships(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES app_users,league_id uuid REFERENCES leagues,player_id uuid REFERENCES players,role text,UNIQUE(user_id,league_id));
    CREATE TABLE league_spectators(user_id uuid,league_id uuid);
    CREATE TABLE season_players(season_id uuid REFERENCES seasons,player_id uuid REFERENCES players,status text DEFAULT 'active',joined_from_round integer DEFAULT 1,replaces_player_id uuid,PRIMARY KEY(season_id,player_id));
    CREATE TABLE season_substitutes(season_id uuid,player_id uuid,active boolean);
    CREATE TABLE season_settings(season_id uuid PRIMARY KEY REFERENCES seasons,league_id uuid REFERENCES leagues,roster_mode text DEFAULT 'self_registration',player_capacity integer,registration_open boolean DEFAULT true,roster_completed_at timestamptz,registration_fee jsonb DEFAULT '{"enabled":false,"payments":[]}',scheduled_start_at timestamptz,round_window_mode text DEFAULT 'none',season_starts_at date,round_window_days integer);
    CREATE TABLE matches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),league_id uuid REFERENCES leagues,season_id uuid REFERENCES seasons,round integer,status text DEFAULT 'scheduling',team_a uuid[],team_b uuid[],points_a integer,points_b integer,sets jsonb DEFAULT '[]',scheduled_at timestamptz,date_label text,location text,result_recorded_at timestamptz,result_reported_by_player_id uuid,result_locked boolean DEFAULT false);
    ALTER TABLE season_players ENABLE ROW LEVEL SECURITY; ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;`)
  sql(readFileSync("supabase/migrations/20261024195529_fixed_pair_leagues.sql","utf8"))
  sql(definition("supabase/migrations/20260803160000_add_league_avatars_and_restore_unlinked_identity.sql","server_join_self_registration_season_v2"))
  sql(definition("supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql","server_remove_self_registration_player"))
  sql(definition("supabase/migrations/20260818232000_prepare_scheduled_self_registration_calendar.sql","server_start_self_registration_season"))
  sql(`REVOKE ALL ON FUNCTION server_join_self_registration_season_v2(uuid,uuid,uuid,uuid),server_remove_self_registration_player(uuid,boolean,uuid,uuid,uuid),server_start_self_registration_season(uuid,boolean,uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
    GRANT EXECUTE ON FUNCTION server_join_self_registration_season_v2(uuid,uuid,uuid,uuid),server_remove_self_registration_player(uuid,boolean,uuid,uuid,uuid),server_start_self_registration_season(uuid,boolean,uuid,uuid,jsonb) TO service_role;`)
  sql(readFileSync("supabase/migrations/20261025092147_fixed_pair_self_registration.sql","utf8"))
  const users=Array.from({length:36},()=>randomUUID()),owner=users[0]
  sql(`INSERT INTO app_users(id,email,first_name,last_name,profile_completed_at) VALUES ${users.map((id,index)=>`(${quote(id)},'fixture-${index}@example.test','Jugador','Prueba ${index}',now())`).join(",")}`)
  function setup(capacity=4,modality="fixed_pairs") {
    const league=randomUUID(),season=randomUUID()
    sql(`INSERT INTO leagues(id,name,modality) VALUES(${quote(league)},'Synthetic fixture',${quote(modality)}); INSERT INTO seasons(id,league_id) VALUES(${quote(season)},${quote(league)});
      INSERT INTO season_settings(season_id,league_id,player_capacity) VALUES(${quote(season)},${quote(league)},${capacity}); INSERT INTO league_memberships(user_id,league_id,role) VALUES(${quote(owner)},${quote(league)},'creator');`)
    return {league,season}
  }
  const join=(state,user,partner=null)=>`SET ROLE service_role; SELECT row_to_json(r) FROM server_join_pair_registration(${quote(user)},${quote(state.league)},${quote(state.season)},NULL,${partner?quote(partner):"NULL"}) r`
  const rows=state=>JSON.parse(sql(`SELECT COALESCE(json_agg(json_build_object('id',player_id,'pair',pair_number) ORDER BY player_id),'[]') FROM season_players WHERE season_id=${quote(state.season)} AND status='active'`))
  const save=(state,pairs,roster=Object.fromEntries(rows(state).map(row=>[row.id,row.pair])))=>`SET ROLE service_role; SELECT server_set_registration_pairs(${quote(owner)},${quote(state.league)},${quote(state.season)},${quote(JSON.stringify(roster))}::jsonb,${quote(JSON.stringify(pairs))}::jsonb)`
  // All supported roster sizes, including odd numbers of pairs.
  for(const capacity of [4,6,8,10,32]) {
    const state=setup(capacity),pairs=[]
    for(let i=0;i<capacity;i+=2){const first=JSON.parse(sql(join(state,users[i+1])));assert.equal(first.roster_complete,false);const second=JSON.parse(sql(join(state,users[i+2],first.player_id)));pairs.push([first.player_id,second.player_id]);assert.equal(second.roster_complete,i+2===capacity)}
    assert.equal(rows(state).length,capacity)
    assert.equal(rows(state).every(row=>row.pair!==null),true)
    assert.equal(sql(save(state,pairs)),"f")
    rejects(join(state,users[1],pairs[1][0]), "partner_unavailable")
    rejects(join(state,users[35],pairs[0][0]), "registration_closed")
  }
  // Real overlapping transactions competing for the same partner.
  const concurrent=setup(),first=JSON.parse(sql(join(concurrent,users[1])))
  const results=await Promise.allSettled([users[2],users[3]].map(user=>promisify(execFile)(binary,[...args(database),"-c",join(concurrent,user,first.player_id)],{env,encoding:"utf8",windowsHide:true})))
  assert.equal(results.filter(item=>item.status==="fulfilled").length,1)
  assert.equal(results.filter(item=>item.status==="rejected"&&String(item.reason.stderr).includes("partner_unavailable")).length,1)
  assert.equal(rows(concurrent).length,2,"failed registration rolls back its roster and identity")
  assert.equal(Number(sql(`SELECT count(*) FROM players WHERE league_id=${quote(concurrent.league)}`)),2)
  // Pending players can pair later; stale or duplicate organizer edits never win.
  const pending=setup(),ids=users.slice(1,5).map(user=>JSON.parse(sql(join(pending,user))).player_id)
  const roster=Object.fromEntries(rows(pending).map(row=>[row.id,row.pair]))
  rejects(`UPDATE seasons SET status='active' WHERE id=${quote(pending.season)}`,"invalid_fixed_pairs")
  rejects(save(pending,[[ids[0],ids[0]]]),"invalid_fixed_pairs")
  rejects(save(pending,[[ids[0],randomUUID()]]),"invalid_fixed_pairs")
  sql(join(pending,users[1],ids[1]))
  rejects(save(pending,[[ids[0],ids[2]],[ids[1],ids[3]]],roster),"roster_changed")
  sql(save(pending,[[ids[0],ids[1]],[ids[2],ids[3]]]))
  function calendar(state,pairs) {return generateFixedPairLeagueCalendar({leagueId:state.league,seasonId:state.season,pairs})}
  function insertCalendar(state,pairs){const matches=calendar(state,pairs);sql(`INSERT INTO matches(league_id,season_id,round,team_a,team_b) VALUES ${matches.map(m=>`(${quote(state.league)},${quote(state.season)},${m.round},ARRAY[${m.teamA.map(quote)}]::uuid[],ARRAY[${m.teamB.map(quote)}]::uuid[])`).join(",")}`);return matches}
  insertCalendar(pending,[[ids[0],ids[1]],[ids[2],ids[3]]])
  sql(`UPDATE matches SET points_a=2 WHERE season_id=${quote(pending.season)}`)
  rejects(save(pending,[[ids[0],ids[2]],[ids[1],ids[3]]]),"played_calendar_immutable")
  assert.equal(sql(`SELECT count(*) FROM matches WHERE season_id=${quote(pending.season)}`),"1")
  sql(`UPDATE matches SET points_a=NULL WHERE season_id=${quote(pending.season)}`)
  assert.equal(sql(save(pending,[[ids[0],ids[2]],[ids[1],ids[3]]])),"t")
  const planned=calendar(pending,[[ids[0],ids[2]],[ids[1],ids[3]]])
  sql(`SET ROLE service_role; SELECT * FROM server_start_self_registration_season(${quote(owner)},false,${quote(pending.league)},${quote(pending.season)},${quote(JSON.stringify(planned))}::jsonb)`)
  assert.equal(sql(`SELECT status FROM seasons WHERE id=${quote(pending.season)}`),"active")
  rejects(save(pending,[]),"registration_closed")
  rejects(`UPDATE season_players SET pair_number=2 WHERE season_id=${quote(pending.season)} AND player_id=${quote(ids[0])}`,"season_pair_identity_immutable")
  // Removing a player leaves their mate available for a later registration.
  const removed=setup(),rA=JSON.parse(sql(join(removed,users[1]))).player_id,rB=JSON.parse(sql(join(removed,users[2],rA))).player_id
  sql(`SET ROLE service_role; SELECT * FROM server_remove_self_registration_player(${quote(owner)},false,${quote(removed.league)},${quote(removed.season)},${quote(rB)})`)
  const rC=JSON.parse(sql(join(removed,users[3],rA))).player_id
  assert.equal(rows(removed).find(row=>row.id===rA).pair,rows(removed).find(row=>row.id===rC).pair)
  // Individual registration remains unchanged.
  const individual=setup(8,"individual")
  sql(`SET ROLE service_role; SELECT * FROM server_join_self_registration_season_v2(${quote(users[1])},${quote(individual.league)},${quote(individual.season)},NULL)`)
  assert.equal(rows(individual)[0].pair,null)
  // No direct client access to either server-only RPC or writes.
  for(const role of ["anon","authenticated"]){rejects(`SET ROLE ${role}; SELECT * FROM server_join_pair_registration(${quote(users[1])},${quote(individual.league)},${quote(individual.season)},NULL,NULL)`,"permission denied");rejects(`SET ROLE ${role}; SELECT server_set_registration_pairs(${quote(owner)},${quote(individual.league)},${quote(individual.season)},'{}','[]')`,"permission denied");rejects(`SET ROLE ${role}; UPDATE season_players SET pair_number=1`,"permission denied")}
  rejects(`SET ROLE service_role; SELECT server_set_registration_pairs(${quote(users[35])},${quote(individual.league)},${quote(individual.season)},'{}','[]')`,"forbidden")
  console.log("PASS: pair enrollment 4/6/8/10/32, pending/later partners, actual concurrent conflict rollback, stale edits, safe calendar invalidation/start, individual regression, server-only RPCs and RLS.")
} finally { sql(`DROP DATABASE ${database}`,"postgres") }
