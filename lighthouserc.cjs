module.exports = {
  ci: {
    collect: {
      startServerCommand: "npm run start",
      startServerReadyPattern: "Ready|ready",
      startServerReadyTimeout: 60000,
      numberOfRuns: 1,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/auth/error?error=Configuration",
        "http://localhost:3000/privacy",
      ],
      settings: {
        preset: "desktop",
        maxWaitForLoad: 60000,
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.65 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.85 }],
        "categories:seo": ["error", { minScore: 0.8 }],
        "first-contentful-paint": ["error", { maxNumericValue: 3500 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 5000 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.15 }],
        "total-blocking-time": ["error", { maxNumericValue: 700 }],
        "resource-summary:script:size": ["error", { maxNumericValue: 900000 }],
        "resource-summary:image:size": ["error", { maxNumericValue: 800000 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".quality-artifacts/lighthouse",
    },
  },
}
