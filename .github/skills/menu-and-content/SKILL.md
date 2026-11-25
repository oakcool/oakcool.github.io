---
name: menu-and-content
description: Use when adding or editing a menu entry, trusted HTML fragment, or image in the OakIdeas static site.
---

# Menu and content

## Triggers

Use for schema-v1 menu configuration, copy/formatting, local assets, or content-path validation.

## Inputs and outputs

- Inputs: requested item copy, action (trusted content or external HTTPS URL), image/alt text, and appearance/ratio.
- Outputs: the smallest changes to `menu.json`, a trusted content fragment, and required image; validation results.

## Commands

```sh
dotnet test tests/OakIdeas.Github.Website.Tests/OakIdeas.Github.Website.Tests.csproj
npm run build:css
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj -c Release -o artifacts/site
printf '%s\n' "$(git rev-parse HEAD)" > artifacts/site/wwwroot/deployment-revision.txt
npm run check:artifact -- artifacts/site/wwwroot
```

## Safe boundaries

Follow `docs/menu-authoring.md` and `.github/instructions/content.instructions.md`. IDs are unique; paths are relative and traversal-safe; external URLs are HTTPS only; content is checked-in trusted HTML, never user-supplied. Keep `Content/` asset URLs stable and preserve original copy unless requested.
