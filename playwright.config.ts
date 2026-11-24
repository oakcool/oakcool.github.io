import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:5014",
    viewport: { width: 1440, height: 900 },
    trace: "retain-on-failure"
  },
  webServer: {
    command: "dotnet run --project src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj --launch-profile http --no-restore",
    url: "http://127.0.0.1:5014",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
