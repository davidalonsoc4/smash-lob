Read `docs/production-hardening/PLAN.md` and `docs/production-hardening/STATUS.md` before starting any work.

Work only on the first incomplete milestone.

Update `docs/production-hardening/STATUS.md` after each significant change.

Run the milestone validation commands before marking it complete.

Do not assume a remote operation succeeded; verify it explicitly.

Do not print secrets.

Do not modify already applied migrations.

Do not use `git reset --hard`, `git clean -fd`, `git checkout --` on modified files, `force push`, or `npm audit fix --force`.

Do not continue past a critical validation failure.

Prefer small commits grouped by domain.

Keep the repository resumable at all times.

For v1.1 work, also read `docs/V1_1_PLAN.md`,
`docs/V1_1_MANUAL_ACTIONS.md`, and `docs/V1_1_ACCEPTANCE_CHECKLIST.md`.

Keep `main`, Production, and the `v1.0.0` tag untouched. v1.1 release candidates
are prepared from `staging` and may be promoted only to PRE after all local gates
pass and the remote action has been explicitly authorized.

Never use personal accounts or Production data in automated tests. Browser tests
use the placeholder environment declared in `playwright.config.ts`; real Google
OAuth and PRE data checks remain explicit manual gates.
