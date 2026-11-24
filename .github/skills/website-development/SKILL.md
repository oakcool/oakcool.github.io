---
name: website-development
description: Use when implementing or locally running OakIdeas Blazor UI, styling, or build changes.
---

# Website development

## Triggers

Use for a scoped website issue involving Razor components, CSS, the local Aspire AppHost, or static publishing.

## Inputs and outputs

- Inputs: one self-contained issue, affected files, and any parity requirements.
- Outputs: minimal code/test changes plus actual local validation results or clearly stated environment limitations.

## Commands

```sh
dotnet tool install --global Aspire.Cli --version 13.6.5
npm ci
npm run build:css
dotnet restore OakIdeas.Github.Website.slnx --locked-mode
dotnet test OakIdeas.Github.Website.slnx --no-restore
npm run test:e2e
aspire run --apphost src/OakIdeas.Github.Website.AppHost/OakIdeas.Github.Website.AppHost.csproj
```

For iterative styles, run `npm run watch:css` in a second terminal. The stable AppHost project API runs the built-in standalone WASM development server; do not introduce a production server or preview Aspire Blazor integration.

## Safe boundaries

Follow `/AGENTS.md`; preserve copy, assets, design, and static-only production. Do not edit Pages settings, initiate deployment, add secrets, or claim unrun checks passed.
