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
npm run test:artifact
npm run test:deployment
npx playwright install chromium
npm run test:e2e
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj -c Release --no-restore -o artifacts/site
printf '%s\n' "$(git rev-parse HEAD)" > artifacts/site/wwwroot/deployment-revision.txt
npm run check:artifact -- artifacts/site/wwwroot
E2E_TARGET=production npm run test:e2e
```

Regular Playwright tests use the development server. Before artifact validation, write the checked-out commit SHA to `deployment-revision.txt`; the production workflow writes `GITHUB_SHA` instead. The production-target command serves the exact published `artifacts/site/wwwroot` over static HTTP before browser validation. The artifact verifier checks the marker, generated .NET native runtime and managed assembly metadata/resources, and excludes known legacy Bootstrap/LESS/Knockout-era resources and development files. For parity evidence, `npm run test:e2e` captures identity and projects at 1920×1080, 1440×900, 1024×768, and 390×844; see `docs/design-baseline.md` for deterministic capture settings and tolerances.

## Safe boundaries

Use the committed lockfiles and exact pinned tool versions. Never substitute unverified CI results for local output, publish the outer publish directory, or add unrelated test tooling. Every change removes superseded code/resources in its scope; retain compatibility files only with repository evidence and avoid unnecessary duplication.
