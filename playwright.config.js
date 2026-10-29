const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  use: {
    baseURL: "http://localhost:4173",
    headless: true,
    screenshot: "only-on-failure",
  },
  webServer: {
    command:
      "pnpm exec vite --host 127.0.0.1 --port 4173 --strictPort --config tests/serve.config.mjs",
    url: "http://localhost:4173/newtab.html",
    reuseExistingServer: false,
  },
});
