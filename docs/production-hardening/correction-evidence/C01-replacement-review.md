# C01: scoped lint glob dependency replacement

The installed @next/eslint-plugin-next 16.3.8 has exactly one fast-glob import, in dist/utils/get-root-dirs.js. It calls globSync with a string pattern and onlyDirectories:true, normalizing Windows separators. The default root uses context.cwd without globbing. Array settings are processed one by one and flattened.

The override applies only to that plugin's dependency through the local tools/next-eslint-glob adapter. tinyglobby 0.2.17 exports CommonJS globSync and supports onlyDirectories; it uses fdir/picomatch rather than braces/micromatch. The adapter sets expandDirectories:false to retain fast-glob's exact-directory behavior: the initial direct-alias experiment failed the brace-pattern regression by returning child directories as well. This is not a general replacement for every fast-glob API. Do not broaden the override. A future plugin update must rerun the contract test and review new consumers.

Primary documentation: https://github.com/SuperchupuDev/tinyglobby and https://superchupu.dev/tinyglobby . npm registry metadata and local plugin source were checked on 2026-10-10. Runtime and application source remain unchanged.

Validation completed on 2026-10-10: clean npm ci; prepared-lockfile and installed-tree full audits zero vulnerabilities; runtime audit zero; 3/3 compatibility regressions; full validate 220 files / 861 tests plus lint, TypeScript and production build; Playwright 76/76 including unchanged visual baselines, accessibility and PWA. Logs and JSON are saved alongside this review. C01 is complete locally; localhost:3000 dependencies were not replaced and no remote publication occurred.
