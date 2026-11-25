---
applyTo: "tests/**/*,playwright.config.ts"
---

# Testing rules

- Put configuration and component regression tests in the xUnit/BUnit project and browser interaction checks in Playwright.
- Run `dotnet test OakIdeas.Github.Website.slnx` and `npm run test:e2e` for relevant changes; fix failures before reporting results.
- For release validation, run `npm run build:css`, publish the standalone client, run the static artifact verifier, then exercise the published `wwwroot` over HTTP.
- Do not describe checks as passing unless they ran in this environment or CI.
