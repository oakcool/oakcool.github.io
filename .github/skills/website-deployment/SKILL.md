---
name: website-deployment
description: Use when checking the GitHub Pages pipeline, first-release cutover, owner checklist, or rollback plan.
---

# Website deployment

## Triggers

Use for Pages workflow changes, custom-domain/static artifact questions, cutover planning, post-merge smoke checks, or rollback.

## Inputs and outputs

- Inputs: workflow diff, master-triggered run result, `wwwroot` artifact validation, and owner-confirmed Pages settings.
- Outputs: deployment-safety findings, owner checklist, post-merge verification steps, and known-good rollback path.

## Commands

```sh
npm run build:css
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj -c Release --no-restore -o artifacts/site
npm run check:artifact -- artifacts/site/wwwroot
npm run test:deployment
```

The deployment workflow writes the source SHA to `deployment-revision.txt` in the uploaded `wwwroot`, then runs `node scripts/smoke-production.mjs` with `EXPECTED_DEPLOYMENT_REVISION` set to that SHA. The check compares the live marker and validates content types and bodies for JavaScript, the native WebAssembly runtime, the main managed assembly, PNG images, HTML fragments, JSON, and the root document. It reads native runtime and assembly names from the published .NET resource manifest rather than relying on fingerprinted names. HTTP, body-read, and validation failures retry up to four times with request timeouts; errors identify the path, attempt count, and cause, while unsafe paths and cross-origin redirects fail without retry. Read `docs/deployment.md` for owner verification and the rollback path.

## Safe boundaries

Only an authorized merge to `master` may trigger automatic production deployment. Agents do not dispatch the workflow, edit GitHub Pages/environment administration, change DNS, or deploy PR branches.
