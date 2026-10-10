# Visual audit corrections — 2026-10-09

User-authorized follow-up after completed H00–H23. Branch: `codex/visual-audit-polish`.
The starting tree includes the previous uncommitted Competition/status/chat work;
do not remove it or treat it as new audit changes. No remote operation authorized.

## V01 — Shared correctness and legibility (DONE)

Resolve the 47 findings in the visual report, keeping structural changes shared
between themes and between league/friendly equivalents. Prefer existing components.
Do not change sporting rules, permissions or stored historical data to make test
fixtures look complete. Record confirmed fixes, existing behavior and remaining
manual gates separately.

Validation: TypeScript, ESLint, i18n/typography/domain checks, relevant unit tests,
full local validation using placeholder environment in an isolated output directory
if the active development server would otherwise be affected. Repeat manual browser
review of accessible routes after local gates; do not write business data.

Restricted screens, valid invitation/spectator links and real PWA/push delivery
remain manual gates requiring appropriate test access, not bypasses.

Completed with the explicit dispositions and limits in `VISUAL_AUDIT_RESULTS.md`.
Final gates: `npm run validate` passed (217 files / 850 tests, production build
and budgets); `npm run test:e2e -- --max-failures=1` passed (70 tests).
Manual second review: 88 visits / 72 routes and variants. No commit or remote action.

## V02 — Functional acceptance on disposable PRE fixtures (DONE within documented scope)

Corrections continue locally on `codex/functional-audit-fixes`, created from the
previous branch with all pending changes preserved. No commit before user review.

Explicitly authorized by the user: create/delete test leagues and seasons through
localhost connected to PRE. Verify the environment first. Exercise actual UI
operations only on clearly named disposable fixtures, preserve existing leagues,
and verify persistence after reload plus cleanup. No access-control bypass,
Production writes, commits or deployment. Automated suites keep placeholder data;
this is the separately authorized manual PRE acceptance gate.

Validate lifecycle, calendar/results, season selection, chat/booking/payment UI,
statistics, and relevant admin saves as permissions allow. Record observed errors
and necessary changes, with visual evidence and an explicit coverage/limits list.
If code is corrected, run relevant tests and the existing local validation gates.

Closed locally on 2026-10-10: findings 1–5 corrected, native confirmations disposed
as an optional UX/tooling improvement, remaining external/manual limits explicitly
recorded in `FUNCTIONAL_PRE_ACCEPTANCE.md`. Final `npm run validate` passed:
219 files / 858 tests, TypeScript, ESLint and build budgets. Playwright 76/76 passed
without regenerating visual references. Manual and captured visual checks passed.
Changes remain uncommitted for user review; no deployment or remote operation.

## V03 — Publish audited pending changes to PRE (IN PROGRESS)

Explicit user authorization on 2026-10-10: publish all pending work to PRE only.
Includes Competition light and V01/V02 improvements. Preserve main, Production
and v1.0.0. Version 1.15.9; no migrations or business data changes.
Validation: version/source checks, local validate and Playwright results, production
dependency audit, verified remote staging SHA, Vercel READY deployment for that SHA,
and smoke:pre against the PRE alias. Record remote CI outcomes separately.
