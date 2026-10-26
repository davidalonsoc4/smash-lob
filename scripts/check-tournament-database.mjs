import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readdirSync,readFileSync,mkdirSync,writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import ts from "typescript"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { checkTraditionalDatabase,checkCanonicalTraditionalDatabase } from "./tournament-traditional-database-cases.mjs"

// Compile the actual pure application modules with the installed TypeScript
// compiler. No additional runtime or package is installed for database tests.
const domainDir=path.resolve(".quality-artifacts/tournament-test-domain")
mkdirSync(domainDir,{recursive:true})
for(const name of ["tournamentResult","rapidTournament","dynamicMexicano","fixedRapidTournament","traditionalTournament","traditionalTournamentSchedule","traditionalTournamentState"]){
  const source=readFileSync(path.resolve(`src/lib/${name}.ts`),"utf8")
  writeFileSync(path.join(domainDir,`${name}.js`),ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)
}
const require=createRequire(import.meta.url)
const engine={...require(path.join(domainDir,"rapidTournament.js")),...require(path.join(domainDir,"fixedRapidTournament.js")),...require(path.join(domainDir,"traditionalTournament.js")),...require(path.join(domainDir,"traditionalTournamentSchedule.js")),...require(path.join(domainDir,"traditionalTournamentState.js"))}

// Dedicated disposable PostgreSQL, never environment database URLs or Supabase credentials.
const binary = process.env.TOURNAMENT_TEST_PSQL ?? path.resolve(".quality-artifacts/postgres-tools/pgsql/bin/psql.exe")
const expectedData = path.resolve(".quality-artifacts/postgres-tournaments-data").replaceAll("\\", "/").toLowerCase()
const database = `tournament_quality_${randomUUID().replaceAll("-", "").slice(0, 12)}`
const env = { ...process.env, PGPASSWORD: "", PGSSLMODE: "disable", PGCLIENTENCODING: "UTF8" }
function sql(query, db = database) {
  // Large draws exceed Windows' command-line limit; pass SQL through stdin.
  return execFileSync(binary, ["-X", "--no-password", "-h", "127.0.0.1", "-p", "55439", "-U", "postgres", "-d", db, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-f", "-"], { encoding: "utf8", env, input: query, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim()
}
const actualData = sql("SHOW data_directory", "postgres").replaceAll("\\", "/").toLowerCase()
assert.equal(actualData, expectedData, "Refusing to test a server outside the dedicated workspace cluster")
sql(`CREATE DATABASE ${database}`, "postgres")
const quote = value => `'${String(value).replaceAll("'", "''")}'`
const creator = "10000000-0000-4000-8000-000000000001"
const invited = "10000000-0000-4000-8000-000000000002"
const other = "10000000-0000-4000-8000-000000000003"
function create({ players = 4, configuration = {}, matches, accounts, duplicateOf = null, owner = creator, sourceLeague = null, sourceSeason = null, fixed = false, pairNumbers } = {}) {
  const config = { format: "balanced_americana", pairing:fixed?"fixed":"rotating", rounds: 2, roundMinutes: 10, transitionMinutes: 3, preparationMinutes: 2, reservationMinutes: 60, ...configuration }
  const schedule = matches ?? [1, 2].map(round => ({ round_number: round, court_number: 1, team_a: ["A", "B"], team_b: ["C", "D"] }))
  const pairArgument = fixed ? `ARRAY[${(pairNumbers ?? Array.from({length:players},(_,i)=>Math.floor(i/2)+1)).join(",")}]::smallint[],` : config.breakMinutes ? "NULL::smallint[]," : ""
  return `SELECT public.${config.breakMinutes ? "create_planned_rapid_tournament" : fixed ? "create_fixed_rapid_tournament" : "create_configurable_rapid_tournament"}(${quote(owner)}::uuid,'Fixture only','',now()+interval '1 day',ARRAY['Court 1'],ARRAY[${Array.from({length:players},(_,i)=>quote(`Fixture ${i}`)).join(",")}],ARRAY[${(accounts ?? Array(players).fill(null)).map(id=>id?quote(id):"NULL").join(",")}]::uuid[],${pairArgument}${quote(JSON.stringify(config))}::jsonb,${quote(JSON.stringify(schedule))}::jsonb,${duplicateOf?quote(duplicateOf):"NULL"}::uuid,${sourceLeague?quote(sourceLeague):"NULL"}::uuid,${sourceSeason?quote(sourceSeason):"NULL"}::uuid)`
}
function rejects(statement, message) {
  assert.throws(() => sql(statement), error => String(error.stderr).includes(message), message)
}
try {
  sql(`DO $$ BEGIN
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
    IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role BYPASSRLS; END IF;
  END $$;
  CREATE TABLE public.app_users(id uuid PRIMARY KEY, suspended_at timestamptz, is_superuser boolean NOT NULL DEFAULT false);
  CREATE TABLE public.leagues(id uuid PRIMARY KEY);
  CREATE TABLE public.seasons(id uuid PRIMARY KEY, league_id uuid REFERENCES public.leagues);
  CREATE TABLE public.league_memberships(league_id uuid, user_id uuid, player_id uuid, role text);
  CREATE TABLE public.season_players(season_id uuid, player_id uuid);
  GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
  INSERT INTO public.app_users(id) VALUES ('${creator}'),('${invited}'),('${other}');`)
  const migrationDir = path.resolve("supabase/migrations")
  const files = readdirSync(migrationDir).filter(name => name.endsWith(".sql") && (name.includes("tournament") || name.endsWith("_competition_capacity_32.sql"))).sort()
  for (const file of files) {
    execFileSync(binary, ["-X", "--no-password", "-h", "127.0.0.1", "-p", "55439", "-U", "postgres", "-d", database, "-v", "ON_ERROR_STOP=1", "-f", path.join(migrationDir, file)], { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] })
  }
  const tables = ["rapid_tournaments", "rapid_tournament_players", "rapid_tournament_rounds", "rapid_tournament_matches", "rapid_tournament_invites", "rapid_tournament_join_invites"]
  assert.equal(sql(`SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN (${tables.map(quote).join(",")}) AND relrowsecurity`), "6", "all tournament tables retain RLS")
  assert.equal(sql("SELECT count(*) FROM pg_proc WHERE pronamespace='public'::regnamespace AND proname IN ('create_configurable_rapid_tournament','redraw_configurable_rapid_tournament') AND NOT prosecdef AND 'search_path=public, pg_temp'=ANY(proconfig)"), "2", "RPCs must use invoker rights and a fixed search path")
  for (const table of tables) for (const role of ["anon", "authenticated"]) rejects(`SET ROLE ${role}; SELECT * FROM public.${table}`, "permission denied")
  const id = sql(`SET ROLE service_role; ${create()}`).split(/\r?\n/).at(-1)
  assert.match(id, /^[0-9a-f-]{36}$/)
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${id}'`), "4")
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_matches WHERE tournament_id='${id}' AND score_a IS NULL AND score_b IS NULL`), "2")
  const dynamicId = sql(create({ players:24, configuration:{format:"dynamic_mexicano",rounds:8,roundMinutes:10,transitionMinutes:2,preparationMinutes:4,reservationMinutes:120}, matches:[] }))
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${dynamicId}'`), "24")
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_rounds WHERE tournament_id='${dynamicId}' AND ends_at-starts_at=interval '10 minutes'`), "8")
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_matches WHERE tournament_id='${dynamicId}'`), "0")
  const fixedId = sql(`SET ROLE service_role; ${create({fixed:true})}`).split(/\r?\n/).at(-1)
  assert.equal(sql(`SELECT pairing FROM rapid_tournaments WHERE id='${fixedId}'`), "fixed")
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${fixedId}' AND pair_number IS NOT NULL`), "4")
  sql(`UPDATE rapid_tournament_players SET pair_number=CASE WHEN slot IN ('A','C') THEN 1 ELSE 2 END WHERE tournament_id='${fixedId}'`)
  rejects(`SELECT public.start_rapid_tournament('${fixedId}','${creator}')`, "invalid_fixed_teams")
  assert.equal(sql(`SELECT status FROM rapid_tournaments WHERE id='${fixedId}'`), "draft")
  sql(`UPDATE rapid_tournament_players SET pair_number=CASE WHEN slot IN ('A','B') THEN 1 ELSE 2 END WHERE tournament_id='${fixedId}'`)
  assert.equal(sql(`SELECT public.start_rapid_tournament('${fixedId}','${creator}')`), "t")
  rejects(create({fixed:true,players:5}), "invalid_fixed_teams")
  rejects(create({fixed:true,pairNumbers:[1,1,1,2]}), "invalid_fixed_teams")
  const mixedPairs = [1,2].map(round=>({round_number:round,court_number:1,team_a:["A","C"],team_b:["B","D"]}))
  rejects(create({fixed:true,matches:mixedPairs}), "invalid_fixed_match")
  const fixedDynamicId = sql(create({fixed:true,configuration:{format:"dynamic_mexicano"},matches:[]}))
  const fixedPlayers = JSON.parse(sql(`SELECT json_agg(row_to_json(p) ORDER BY slot) FROM rapid_tournament_players p WHERE tournament_id='${fixedDynamicId}'`))
  const roundMatch = [{court_number:1,team_a:[fixedPlayers[0].id,fixedPlayers[1].id],team_b:[fixedPlayers[2].id,fixedPlayers[3].id]}]
  const dynamicRoundCall = (round, matches=roundMatch) => `SELECT public.generate_dynamic_mexicano_round('${fixedDynamicId}','${creator}',${round}::smallint,${quote(JSON.stringify(matches))}::jsonb)`
  assert.equal(sql(dynamicRoundCall(1)), "t")
  assert.equal(sql(dynamicRoundCall(2)), "f", "cannot generate fixed dynamic rounds before results")
  rejects(`UPDATE rapid_tournament_players SET pair_number=2 WHERE id='${fixedPlayers[0].id}'`, "tournament_pairing_locked")
  rejects(`UPDATE rapid_tournaments SET pairing='rotating' WHERE id='${fixedDynamicId}'`, "tournament_pairing_locked")
  const fixedMatchId = sql(`SELECT id FROM rapid_tournament_matches WHERE tournament_id='${fixedDynamicId}'`)
  assert.equal(sql(`SELECT public.record_rapid_tournament_result('${fixedDynamicId}','${fixedMatchId}','${creator}',16,12)`), "t")
  const mixedDynamic = [{court_number:1,team_a:[fixedPlayers[0].id,fixedPlayers[2].id],team_b:[fixedPlayers[1].id,fixedPlayers[3].id]}]
  rejects(dynamicRoundCall(2,mixedDynamic), "invalid_fixed_match")
  assert.equal(sql(dynamicRoundCall(2)), "t")
  assert.equal(sql(dynamicRoundCall(2)), "t", "round generation is idempotent")
  for(const fixed of [false,true])for(const format of ["balanced_americana","dynamic_mexicano"]){
    const breakId=sql(`SET ROLE service_role; ${create({fixed,configuration:{format,breakMinutes:20,breakEveryRounds:1},matches:format==="dynamic_mexicano"?[]:undefined})}`).split(/\r?\n/).at(-1)
    assert.equal(sql(`SELECT starts_at-(SELECT ends_at FROM rapid_tournament_rounds WHERE tournament_id='${breakId}' AND round_number=1) FROM rapid_tournament_rounds WHERE tournament_id='${breakId}' AND round_number=2`),"00:23:00")
    assert.equal(sql(`SELECT safety_margin_minutes-preparation_minutes FROM rapid_tournaments WHERE id='${breakId}'`),"15")
  }
  rejects(create({configuration:{breakMinutes:40,breakEveryRounds:1}}),"invalid_tournament_configuration")
  rejects(`SET ROLE authenticated; ${create({configuration:{breakMinutes:20,breakEveryRounds:1}})}`,"permission denied")
  rejects(`SET ROLE authenticated; ${create({fixed:true})}`, "permission denied")
  const originalCount = sql("SELECT count(*) FROM rapid_tournaments")
  rejects(create({ players:25 }), "invalid_tournament_configuration")
  rejects(create({ configuration:{roundMinutes:40} }), "invalid_tournament_configuration")
  rejects(create({ configuration:{rounds:0} }), "invalid_tournament_configuration")
  rejects(create({ accounts:[invited,null,null,null] }), "invalid_player_accounts")
  const sameCourt = [1,1].map(round=>({round_number:round,court_number:1,team_a:["A","B"],team_b:["C","D"]}))
  rejects(create({ matches:sameCourt }), "invalid_tournament_schedule")
  assert.equal(sql("SELECT count(*) FROM rapid_tournaments"), originalCount, "failed RPCs must roll back all rows")
  sql(`UPDATE rapid_tournament_players SET user_id='${invited}' WHERE tournament_id='${id}' AND slot='A'`)
  const copyId = sql(create({ duplicateOf:id, accounts:[invited,null,null,null] }))
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${copyId}' AND user_id='${invited}'`), "1")
  const identities = sql(`SELECT json_agg(row_to_json(p) ORDER BY slot) FROM rapid_tournament_players p WHERE tournament_id='${copyId}'`)
  const roster = JSON.parse(identities)
  const redraw = [1,2].map(round=>({round_number:round,court_number:1,team_a:[roster[0].id,roster[2].id],team_b:[roster[1].id,roster[3].id]}))
  const redrawCall = actor => `SELECT public.redraw_configurable_rapid_tournament('${copyId}','${actor}',${quote(JSON.stringify(redraw))}::jsonb)`
  assert.equal(sql(`SET ROLE service_role; ${redrawCall(creator)}`).split(/\r?\n/).at(-1), "t")
  assert.equal(sql(`SELECT json_agg(row_to_json(p) ORDER BY slot) FROM rapid_tournament_players p WHERE tournament_id='${copyId}'`), identities)
  assert.equal(sql(redrawCall(other)), "f")
  assert.equal(sql(`SELECT public.start_rapid_tournament('${copyId}','${creator}')`), "t")
  assert.equal(sql(redrawCall(creator)), "f")
  const matchId = sql(`SELECT id FROM rapid_tournament_matches WHERE tournament_id='${copyId}' ORDER BY round_number LIMIT 1`)
  const record = (actor, a, b) => `SELECT public.record_rapid_tournament_result('${copyId}','${matchId}','${actor}',${a},${b})`
  assert.equal(sql(`SET ROLE service_role; ${record(creator,16,12)}`).split(/\r?\n/).at(-1), "t")
  assert.equal(sql(`SELECT score_a||'/'||score_b FROM rapid_tournament_matches WHERE id='${matchId}'`), "16/12")
  assert.equal(sql(record(other,0,28)), "f")
  rejects(record(creator,0,0), "invalid_score")
  assert.equal(sql(`SELECT score_a||'/'||score_b FROM rapid_tournament_matches WHERE id='${matchId}'`), "16/12")
  assert.equal(sql(record(creator,19,19)), "t")
  assert.equal(sql(`SELECT score_a||'/'||score_b FROM rapid_tournament_matches WHERE id='${matchId}'`), "19/19")
  assert.equal(sql(`SELECT public.finish_rapid_tournament('${copyId}','${creator}')`), "f")
  rejects(create({ duplicateOf:id,owner:other }), "invalid_tournament_source")
  const league = "20000000-0000-4000-8000-000000000001", season = "30000000-0000-4000-8000-000000000001", member = "40000000-0000-4000-8000-000000000001"
  sql(`INSERT INTO leagues VALUES ('${league}'); INSERT INTO seasons VALUES ('${season}','${league}');
    INSERT INTO league_memberships VALUES ('${league}','${creator}',NULL,'admin'),('${league}','${invited}','${member}','player');
    INSERT INTO season_players VALUES ('${season}','${member}');`)
  const sourceId = sql(`SET ROLE service_role; ${create({ sourceLeague:league, sourceSeason:season, accounts:[invited,null,null,null] })}`).split(/\r?\n/).at(-1)
  assert.equal(sql(`SELECT source_league_id||'/'||source_season_id FROM rapid_tournaments WHERE id='${sourceId}'`), `${league}/${season}`)
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${sourceId}' AND user_id='${invited}'`), "1")
  rejects(create({ owner:other, sourceLeague:league, sourceSeason:season }), "invalid_tournament_source")
  rejects(create({ sourceLeague:league, sourceSeason:other }), "invalid_tournament_source")
  rejects(create({ duplicateOf:id, sourceLeague:league, sourceSeason:season }), "invalid_tournament_source")
  // Import is a snapshot. Later league membership changes cannot rewrite tournament players.
  sql(`DELETE FROM league_memberships WHERE user_id='${invited}'`)
  assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${sourceId}' AND user_id='${invited}'`), "1")
  sql(`UPDATE app_users SET suspended_at=now() WHERE id='${invited}'`)
  rejects(create({ duplicateOf:id,accounts:[invited,null,null,null] }), "invalid_player_accounts")
  rejects(`SET ROLE authenticated; ${create()}`, "permission denied")
  rejects(`SET ROLE anon; SELECT * FROM rapid_tournaments`, "permission denied")
  // Boundary creation, fixed-pair identity and result persistence with all 32
  // slots, including lowercase positions beyond Z. No real app data is used.
  for(const fixed of [false,true]){
    const teams=Array.from({length:16},(_,i)=>({id:`pair-${i+1}`,playerIds:engine.RAPID_TOURNAMENT_SLOTS.slice(i*2,i*2+2)}))
    const games=fixed?engine.generateFixedAmericanaFixtures(teams,1,8,17).map(m=>({round_number:m.round,court_number:m.court,team_a:m.teamAIds,team_b:m.teamBIds}))
      :engine.generateBalancedAmericanaFixtures(32,1,8).map(m=>({round_number:m.round,court_number:m.court,team_a:m.teamA,team_b:m.teamB}))
    const id32=sql(`SET ROLE service_role; ${create({players:32,fixed,configuration:{rounds:8,reservationMinutes:120},matches:games})}`).split(/\r?\n/).at(-1)
    assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${id32}'`),"32")
    assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${id32}' AND slot IN ('a','b','c','d','e','f')`),"6")
    assert.equal(sql(`SELECT public.start_rapid_tournament('${id32}','${creator}')`),"t")
    const ids=sql(`SELECT id FROM rapid_tournament_matches WHERE tournament_id='${id32}' ORDER BY round_number`).split(/\r?\n/)
    for(const matchId of ids)assert.equal(sql(`SELECT public.record_rapid_tournament_result('${id32}','${matchId}','${creator}',16,12)`),"t")
    assert.equal(sql(`SELECT count(*) FROM rapid_tournament_matches WHERE tournament_id='${id32}' AND score_a=16 AND score_b=12`),"8")
    const copied32=sql(create({players:32,fixed,configuration:{rounds:8,reservationMinutes:120},matches:games,duplicateOf:id32}))
    assert.equal(sql(`SELECT count(*) FROM rapid_tournament_players WHERE tournament_id='${copied32}'`),"32")
  }
  rejects(create({players:33,configuration:{format:"dynamic_mexicano",rounds:9},matches:[]}),"invalid_tournament_configuration")
  checkTraditionalDatabase({ sql, quote, creator, other })
  checkCanonicalTraditionalDatabase({sql,quote,creator,engine})
  console.log(`Tournament PostgreSQL checks PASS: ${files.length} migrations, rapid and traditional creation/results, byes/groups/qualification, 32 players, revision conflicts, fixed pairs, timing, copy, source snapshot, suspension and role isolation.`)
} finally {
  // Only this freshly generated database, on the cluster verified above.
  sql(`DROP DATABASE ${database}`, "postgres")
}
