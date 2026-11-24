---
name: website-validation
description: Use when preparing or reviewing OakIdeas builds, tests, static artifacts, or release readiness.
---

# Website validation

## Triggers

Use for a code change that needs build/test validation, a pre-merge review, or published-artifact verification.

## Inputs and outputs

- Inputs: changed files, the repository SDK/tool versions, and local environment capabilities.
- Outputs: actual restore/build/test/browser/artifact/HTTP results and an explicit list of any unrun checks.

## Commands

```sh
npm ci
npm run build:css
dotnet restore OakIdeas.Github.Website.slnx --locked-mode
dotnet test OakIdeas.Github.Website.slnx --no-restore
npx playwright install chromium
npm run test:e2e
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj -c Release --no-restore -o artifacts/site
npm run check:artifact -- artifacts/site/wwwroot
```

CI additionally serves `artifacts/site/wwwroot` over HTTP and requests the root page, CNAME, menu, fingerprinted Blazor runtime, and a WebAssembly file.

## Safe boundaries

Use the committed lockfiles and exact pinned tool versions. Never substitute unverified CI results for local output, publish the outer publish directory, or add unrelated test tooling.
