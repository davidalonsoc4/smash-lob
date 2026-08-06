import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { spawnSync } from "node:child_process"

const SUPABASE_VERSION = "2.111.0"
const ARTIFACTS = path.resolve(".quality-artifacts/database")
const RESTORE_DATABASE = "smash_lob_restore_test"
const PRE_IDENTITY_VERSION = "20260802233000"

await mkdir(ARTIFACTS, { recursive: true })

function executable(name) {
  return process.platform === "win32" ? `${name}.cmd` : name
}

function run(command, args, options = {}) {
  console.log(`\n==> ${options.label ?? `${command} ${args.join(" ")}`}`)
  const useShell =
    process.platform === "win32" && /\.(?:cmd|bat)$/i.test(command)
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: options.capture
      ? ["ignore", "pipe", "pipe"]
      : options.input
        ? ["pipe", "inherit", "inherit"]
        : "inherit",
    input: options.input,
    env: process.env,
    shell: useShell,
    windowsHide: false,
  })

  if (options.capture) {
    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
  }

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${options.label ?? command} failed with code ${result.status}`)
  }

  return result.stdout?.trim() ?? ""
}

function supabase(args, options = {}) {
  return run(
    executable("npx"),
    ["--yes", `supabase@${SUPABASE_VERSION}`, ...args],
    options,
  )
}

function docker(args, options = {}) {
  return run("docker", args, options)
}

function findDatabaseContainer() {
  const output = docker(
    ["ps", "--filter", "name=supabase_db_", "--format", "{{.Names}}"],
    { capture: true, label: "locate local Supabase database container" },
  )
  const candidates = output
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean)
  const exact = candidates.find((value) => value === "supabase_db_smash-lob")
  const fallback = candidates.find((value) => value.startsWith("supabase_db_"))
  const container = exact ?? fallback

  if (!container) {
    throw new Error("Local Supabase database container was not found")
  }

  return container
}

async function runSqlFile(container, file, database = "postgres") {
  const sql = await readFile(file)
  docker(
    [
      "exec",
      "-i",
      container,
      "psql",
      "--set",
      "ON_ERROR_STOP=1",
      "--username",
      "postgres",
      "--dbname",
      database,
    ],
    { input: sql, label: `execute ${path.relative(process.cwd(), file)}` },
  )
}

function query(container, sql, database = "postgres") {
  return docker(
    [
      "exec",
      container,
      "psql",
      "--tuples-only",
      "--no-align",
      "--set",
      "ON_ERROR_STOP=1",
      "--username",
      "postgres",
      "--dbname",
      database,
      "--command",
      sql,
    ],
    { capture: true, label: `query ${database}` },
  )
}

function resetFullDatabase() {
  supabase(["db", "reset", "--local", "--no-seed"], {
    label: "rebuild database from every migration",
  })
}

function runDatabaseChecks() {
  supabase(
    [
      "db",
      "lint",
      "--local",
      "--schema",
      "public",
      "--level",
      "error",
      "--fail-on",
      "error",
    ],
    { label: "lint PostgreSQL functions and schema" },
  )
  supabase(["test", "db"], { label: "run pgTAP database tests" })
}

async function verifyLogicalRestore(container) {
  const schemaDump = path.join(ARTIFACTS, "public-schema.sql")
  const dataDump = path.join(ARTIFACTS, "public-data.sql")

  await runSqlFile(container, path.resolve("supabase/quality/restore/seed.sql"))
  supabase(["db", "dump", "--local", "--schema", "public", "--file", schemaDump], {
    label: "create local schema backup",
  })
  supabase(
    [
      "db",
      "dump",
      "--local",
      "--data-only",
      "--schema",
      "public",
      "--use-copy",
      "--file",
      dataDump,
    ],
    { label: "create local public data backup" },
  )

  const dataSql = await readFile(dataDump, "utf8")
  if (/\"(?:auth|storage|realtime|supabase_migrations)\"\./i.test(dataSql)) {
    throw new Error("Public data backup unexpectedly references a managed Supabase schema")
  }

  docker(
    [
      "exec",
      container,
      "dropdb",
      "--if-exists",
      "--username",
      "postgres",
      RESTORE_DATABASE,
    ],
    { label: "remove previous restore-test database" },
  )
  docker(
    ["exec", container, "createdb", "--username", "postgres", RESTORE_DATABASE],
    { label: "create restore-test database" },
  )

  try {
    await runSqlFile(container, schemaDump, RESTORE_DATABASE)
    await runSqlFile(container, dataDump, RESTORE_DATABASE)
    const sentinel = query(
      container,
      "select count(*) from public.app_users where email = 'restore-sentinel@smashandlob.invalid';",
      RESTORE_DATABASE,
    )
    if (sentinel.trim() !== "1") {
      throw new Error("Logical restore did not recover the sentinel record")
    }
  } finally {
    docker(
      [
        "exec",
        container,
        "dropdb",
        "--if-exists",
        "--username",
        "postgres",
        RESTORE_DATABASE,
      ],
      { label: "remove restore-test database" },
    )
  }
}

async function verifyUpgradePath(container) {
  supabase(
    [
      "db",
      "reset",
      "--local",
      `--version=${PRE_IDENTITY_VERSION}`,
      "--no-seed",
    ],
    { label: `rebuild database up to ${PRE_IDENTITY_VERSION}` },
  )
  await runSqlFile(container, path.resolve("supabase/quality/upgrade/identity-before.sql"))
  supabase(["migration", "up", "--local"], {
    label: "apply pending migrations over legacy fixture",
  })
  await runSqlFile(container, path.resolve("supabase/quality/upgrade/identity-after.sql"))
  runDatabaseChecks()
}

const startedAt = new Date().toISOString()
supabase(["db", "start"], { label: "start local Supabase database" })
const container = findDatabaseContainer()

resetFullDatabase()
runDatabaseChecks()
await verifyLogicalRestore(container)
await verifyUpgradePath(container)

const summary = {
  ok: true,
  startedAt,
  completedAt: new Date().toISOString(),
  supabaseCli: SUPABASE_VERSION,
  fullMigrationReplay: true,
  pgTap: true,
  schemaLint: true,
  logicalBackupRestore: true,
  upgradeFrom: PRE_IDENTITY_VERSION,
}

await writeFile(
  path.join(ARTIFACTS, "summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
  "utf8",
)
console.log("\nDatabase quality checks completed successfully.")
