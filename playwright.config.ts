import { defineConfig, devices } from "@playwright/test"

const testPort = 3100
const testAppUrl = `http://127.0.0.1:${testPort}`

const testEnvironment = {
  AUTH_SECRET: "playwright-only-secret-playwright-only",
  AUTH_GOOGLE_ID: "playwright-google-client",
  AUTH_GOOGLE_SECRET: "playwright-google-secret",
  NEXT_PUBLIC_APP_URL: testAppUrl,
  NEXT_DIST_DIR: ".next-playwright",
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "playwright-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "playwright-service-role-key",
  NEXT_PUBLIC_ENABLE_DEMO_DATA: "true",
  NEXT_PUBLIC_LOCAL_DEV_AUTO_LOGIN: "0",
  LOCAL_DEV_USER_EMAIL: "",
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: testAppUrl,
    locale: "es-ES",
    serviceWorkers: "block",
    timezoneId: "Europe/Madrid",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "mobile-chromium",
      testIgnore: ["**/pwa-offline.spec.ts", "**/qa-pre.spec.ts"],
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "desktop-chromium",
      testIgnore: ["**/pwa-offline.spec.ts", "**/qa-pre.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "pwa-chromium",
      testMatch: "**/pwa-offline.spec.ts",
      use: {
        ...devices["Pixel 7"],
        serviceWorkers: "allow",
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --port ${testPort}`,
    url: testAppUrl,
    reuseExistingServer: false,
    env: testEnvironment,
    timeout: 120_000,
  },
})
