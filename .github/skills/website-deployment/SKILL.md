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
```

Read `docs/deployment.md` for the HTTP smoke sequence, owner pre-merge checks, domain/HTTPS verification, and rollback.

## Safe boundaries

Only an authorized merge to `master` may trigger automatic production deployment. Agents do not dispatch the workflow, edit GitHub Pages/environment administration, change DNS, or deploy PR branches.
