Read `docs/production-hardening/PLAN.md` and `docs/production-hardening/STATUS.md` before starting any work.

Work only on the first incomplete milestone. `docs/production-hardening/PLAN.md`
is ordered newest-first, so the current milestone is the topmost one not marked
complete. As of 2026-11-16 all milestones (including MC173) are closed; new work
starts as a new milestone from an up-to-date `staging`.

Update `docs/production-hardening/STATUS.md` after each significant change.

Run the milestone validation commands before marking it complete.

Do not assume a remote operation succeeded; verify it explicitly.

Do not print secrets.

Do not modify already applied migrations.

Do not use `git reset --hard`, `git clean -fd`, `git checkout --` on modified files, `force push`, or `npm audit fix --force`.

Do not continue past a critical validation failure.

Prefer small commits grouped by domain.

Keep the repository resumable at all times.

## Environments and branches (mandatory)

- `staging` = PREproduction (PRE, `https://pre.smashandlob.com`), with its own
  test database. `main` = Production (PROD, `https://smashandlob.com`).
- Every change goes through `staging`/PRE before it can reach `main`. Work
  branches start from an up-to-date `staging` and their PRs target `staging`.
- Promoting `staging` to `main` is a separate step: it needs its own explicit
  authorization and an exact diff of what was approved. Production and the
  `v1.0.0` tag stay untouched otherwise.
- Never run tests, migrations or data changes against Production. Remote
  actions on PRE also need explicit authorization and must be verified.
- Project skills live in `.claude/skills/` (`smash-lob-context`,
  `smash-lob-ui`, `smash-lob-pre`, `smash-lob-video`); see `CLAUDE.md`.
- `docs/V1_1_*.md` are historical (v1.1); the current version is in
  `package.json`.

Never use personal accounts or Production data in automated tests. Browser tests
use the placeholder environment declared in `playwright.config.ts`; real Google
OAuth and PRE data checks remain explicit manual gates.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
