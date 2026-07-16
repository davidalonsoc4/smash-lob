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
