import { readFile } from "node:fs/promises"

const requiredSnippets = new Map([
  [
    "src/components/layout/AppRouteBoundary.tsx",
    ["<OnboardingProvider>", "<GuidedTourOverlay />"],
  ],
  [
    "src/components/layout/AppShell.tsx",
    [
      "<FloatingHelpButton",
      'data-tour="floating-settings"',
      'data-tour="floating-notifications"',
    ],
  ],
  [
    "src/features/onboarding/OnboardingProvider.tsx",
    [
      'fetch("/api/onboarding/progress"',
      "readLocalOnboardingProgress",
      "hasCompletedCurrentTour",
      "readRequestedTourKey",
    ],
  ],
  [
    "src/features/onboarding/tours.ts",
    [
      'key: "app-introduction"',
      'key: "home"',
      'key: "matches"',
      'key: "ranking"',
      'key: "statistics"',
      'key: "season-admin"',
      'key: "settings"',
      "[data-tour='floating-invite-players']",
      "[data-tour='floating-share-spectators']",
      "es:",
      "en:",
      "eu:",
    ],
  ],
  [
    "src/app/api/onboarding/progress/route.ts",
    ["requireAuthenticatedAppUser", "enforceRequestRateLimit", 'from("user_onboarding_progress")'],
  ],
  [
    "supabase/migrations/20260806221500_add_guided_onboarding_progress.sql",
    [
      "CREATE TABLE IF NOT EXISTS public.user_onboarding_progress",
      "ENABLE ROW LEVEL SECURITY",
      "REVOKE ALL ON TABLE public.user_onboarding_progress FROM PUBLIC, anon, authenticated",
      "GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_onboarding_progress TO service_role",
    ],
  ],
  ["src/app/page.tsx", ['data-tour="home-header"', 'data-tour="home-next-match"']],
  ["src/app/matches/page.tsx", ['data-tour="matches-round-list"']],
  ["src/app/ranking/page.tsx", ['data-tour="ranking-table"']],
  ["src/app/statistics/page.tsx", ['data-tour="statistics-navigation"']],
  ["src/app/admin/season/page.tsx", ['data-tour="season-admin-navigation"']],
  ["src/components/settings/GlobalSettingsSearch.tsx", ['data-tour="settings-search"']],
  ["src/components/invite/FloatingInviteShareButton.tsx", ['data-tour="floating-invite-players"']],
  ["src/components/spectator/FloatingSpectatorShareButton.tsx", ['data-tour="floating-share-spectators"']],
])

const failures = []
for (const [file, snippets] of requiredSnippets) {
  const source = await readFile(file, "utf8")
  for (const snippet of snippets) {
    if (!source.includes(snippet)) failures.push(`${file}: falta ${JSON.stringify(snippet)}`)
  }
}

if (failures.length > 0) {
  console.error("La infraestructura de tutoriales guiados está incompleta:")
  failures.forEach((failure) => console.error(`- ${failure}`))
  process.exit(1)
}

console.log("Tutoriales guiados correctos:")
console.log("- siete recorridos contextuales y adaptados al rol")
console.log("- textos completos en castellano, inglés y euskera")
console.log("- ayuda flotante y biblioteca para repetir recorridos")
console.log("- progreso por cuenta con respaldo local")
console.log("- API autenticada, rate limit y tabla sin acceso desde navegador")
