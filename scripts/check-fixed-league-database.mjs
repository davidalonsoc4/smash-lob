import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { randomUUID } from "node:crypto"
import { createRequire } from "node:module"
import path from "node:path"
import ts from "typescript"

// Isolated fixtures only. Never reads application credentials or remote URLs.
const binary = path.resolve(".quality-artifacts/postgres-tools/pgsql/bin/psql.exe")
const expectedData = path.resolve(".quality-artifacts/postgres-tournaments-data").replaceAll("\\", "/").toLowerCase()
const database = `league_pairs_quality_${randomUUID().replaceAll("-", "").slice(0, 12)}`
const env = { ...process.env, PGPASSWORD: "", PGSSLMODE: "disable", PGCLIENTENCODING: "UTF8" }
function sql(input, db = database) {
  return execFileSync(binary, ["-X", "--no-password", "-h", "127.0.0.1", "-p", "55439", "-U", "postgres", "-d", db, "-v", "ON_ERROR_STOP=1", "-t", "-A", "-f", "-"], { encoding: "utf8", env, input, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] }).trim()
}
assert.equal(sql("SHOW data_directory", "postgres").replaceAll("\\", "/").toLowerCase(), expectedData)
const dir = path.resolve(".quality-artifacts/league-pairs-test-domain")
mkdirSync(dir, { recursive: true })
writeFileSync(path.join(dir, "fixedPairLeague.js"), ts.transpileModule(readFileSync("src/lib/fixedPairLeague.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)
const require = createRequire(import.meta.url)
const { generateFixedPairLeagueCalendar } = require(path.join(dir, "fixedPairLeague.js"))
const quote = value => `'${String(value).replaceAll("'", "''")}'`
const rejects = (statement, code) => assert.throws(() => sql(statement), error => String(error.stderr).includes(code), code)
sql(`CREATE DATABASE ${database}`, "postgres")
try {
  sql(`CREATE TABLE leagues(id uuid PRIMARY KEY, name text NOT NULL);
    CREATE TABLE seasons(id uuid PRIMARY KEY, league_id uuid REFERENCES leagues, status text NOT NULL DEFAULT 'upcoming');
    CREATE TABLE season_players(season_id uuid REFERENCES seasons, player_id uuid, status text NOT NULL DEFAULT 'active', replaces_player_id uuid, PRIMARY KEY(season_id,player_id));
    CREATE TABLE season_substitutes(season_id uuid REFERENCES seasons, player_id uuid, active boolean NOT NULL DEFAULT true);
    CREATE TABLE matches(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), league_id uuid REFERENCES leagues, season_id uuid REFERENCES seasons, round integer, team_a uuid[], team_b uuid[], points_a integer, points_b integer);
    ALTER TABLE leagues ENABLE ROW LEVEL SECURITY; ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
    ALTER TABLE season_players ENABLE ROW LEVEL SECURITY; ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
    INSERT INTO leagues VALUES ('10000000-0000-4000-8000-000000000001','Existing individual fixture');`)
  sql(readFileSync("supabase/migrations/20261024195529_fixed_pair_leagues.sql", "utf8"))
  assert.equal(sql("SELECT modality FROM leagues"), "individual")
  for (const role of ["anon", "authenticated"]) {
    rejects(`SET ROLE ${role}; INSERT INTO leagues(id,name) VALUES(gen_random_uuid(),'Unauthorized')`, "permission denied")
    rejects(`SET ROLE ${role}; UPDATE season_players SET pair_number=1`, "permission denied")
    rejects(`SET ROLE ${role}; UPDATE matches SET points_a=2`, "permission denied")
  }
  for (const count of [2, 3, 4, 7, 15, 16]) {
    const leagueId = randomUUID(), seasonId = randomUUID(), ids = Array.from({ length: count * 2 }, () => randomUUID())
    const pairs = Array.from({ length: count }, (_, i) => ids.slice(i * 2, i * 2 + 2))
    const calendar = generateFixedPairLeagueCalendar({ leagueId, seasonId, pairs, scheduleMode: "double" })
    sql(`SET ROLE service_role; INSERT INTO leagues(id,name,modality) VALUES(${quote(leagueId)},'Synthetic pair fixture','fixed_pairs');
      INSERT INTO seasons(id,league_id) VALUES(${quote(seasonId)},${quote(leagueId)});
      INSERT INTO season_players(season_id,player_id,pair_number) VALUES ${ids.map((id, i) => `(${quote(seasonId)},${quote(id)},${Math.floor(i / 2) + 1})`).join(",")};
      INSERT INTO matches(league_id,season_id,round,team_a,team_b) VALUES ${calendar.map(match => `(${quote(leagueId)},${quote(seasonId)},${match.round},ARRAY[${match.teamA.map(quote).join(",")}]::uuid[],ARRAY[${match.teamB.map(quote).join(",")}]::uuid[])`).join(",")};
      UPDATE seasons SET status='active' WHERE id=${quote(seasonId)};`)
    assert.equal(Number(sql(`SELECT count(*) FROM matches WHERE season_id=${quote(seasonId)}`)), calendar.length)
    rejects(`UPDATE leagues SET modality='individual' WHERE id=${quote(leagueId)}`, "league_modality_immutable")
    rejects(`UPDATE season_players SET pair_number=17 WHERE season_id=${quote(seasonId)}`, "season_pair_identity_immutable")
    rejects(`INSERT INTO matches(league_id,season_id,round,team_a,team_b) VALUES(${quote(leagueId)},${quote(seasonId)},1,ARRAY[${quote(ids[0])},${quote(ids[2])}]::uuid[],ARRAY[${quote(ids[1])},${quote(ids[3])}]::uuid[])`, "invalid_fixed_pair_match")
    rejects(`UPDATE matches SET team_a=ARRAY[gen_random_uuid(),gen_random_uuid()] WHERE season_id=${quote(seasonId)}`, "invalid_fixed_pair_match")
    const temporaryMatch = sql(`SELECT id FROM matches WHERE season_id=${quote(seasonId)} AND team_a @> ARRAY[${quote(ids[0])}]::uuid[] ORDER BY round LIMIT 1`)
    const temporaryIds = [randomUUID(), randomUUID()]
    sql(`INSERT INTO season_substitutes VALUES ${temporaryIds.map(id => `(${quote(seasonId)},${quote(id)},true)`).join(",")};
      UPDATE matches SET team_a=ARRAY[${temporaryIds.map(quote).join(",")}]::uuid[] WHERE id=${quote(temporaryMatch)};
      UPDATE matches SET team_a=ARRAY[${pairs[0].map(quote).join(",")}]::uuid[] WHERE id=${quote(temporaryMatch)};`)
    const incoming = randomUUID()
    sql(`BEGIN; INSERT INTO season_players(season_id,player_id,replaces_player_id) VALUES(${quote(seasonId)},${quote(incoming)},${quote(ids[0])});
      UPDATE matches SET team_a=array_replace(team_a,${quote(ids[0])}::uuid,${quote(incoming)}::uuid),team_b=array_replace(team_b,${quote(ids[0])}::uuid,${quote(incoming)}::uuid) WHERE season_id=${quote(seasonId)} AND round>1;
      UPDATE season_players SET status='withdrawn' WHERE season_id=${quote(seasonId)} AND player_id=${quote(ids[0])}; COMMIT;`)
    assert.equal(sql(`SELECT pair_number FROM season_players WHERE season_id=${quote(seasonId)} AND player_id=${quote(incoming)}`), "1")
    const finishedId = sql(`SELECT id FROM matches WHERE season_id=${quote(seasonId)} ORDER BY round,id LIMIT 1`)
    sql(`SET ROLE service_role; UPDATE matches SET points_a=2,points_b=1 WHERE id=${quote(finishedId)}`)
    assert.equal(sql(`SELECT points_a||':'||points_b FROM matches WHERE id=${quote(finishedId)}`), "2:1")
    sql(`SET ROLE service_role; UPDATE matches SET points_a=1,points_b=2 WHERE id=${quote(finishedId)}`)
    assert.equal(sql(`SELECT points_a||':'||points_b FROM matches WHERE id=${quote(finishedId)}`), "1:2")
  }
  const league = randomUUID(), season = randomUUID()
  sql(`INSERT INTO leagues(id,name,modality) VALUES(${quote(league)},'Incomplete fixture','fixed_pairs'); INSERT INTO seasons(id,league_id) VALUES(${quote(season)},${quote(league)});`)
  rejects(`UPDATE seasons SET status='active' WHERE id=${quote(season)}`, "invalid_fixed_pairs")
  assert.equal(sql("SELECT count(*) FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN('leagues','seasons','season_players','matches') AND relrowsecurity"), "4")
  assert.equal(sql("SELECT count(*) FROM pg_proc WHERE proname IN('guard_league_modality','guard_season_pair_number','guard_fixed_pair_season_start','guard_fixed_league_match') AND NOT prosecdef AND 'search_path=public, pg_temp'=ANY(proconfig)"), "4")
  console.log("PASS: fixed pair league migration, legacy default, 2–16 pairs, persisted draws/results/corrections, replacement identity, RLS and unauthorized writes.")
} finally { sql(`DROP DATABASE ${database}`, "postgres") }
