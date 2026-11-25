---
agent: agent
description: Add one OakIdeas section using the existing schema-v1 menu and trusted static assets.
argument-hint: Section content, image, alt text, appearance, and viewport ratio
---

Add exactly one menu item for the requested content: `${input:request}`. Follow `docs/menu-authoring.md`, preserve all existing content/design, validate safe relative paths, HTTPS-only URLs, unique IDs, image alt/ratio/appearance, and do not add component code unless the schema cannot represent the request. Run the focused .NET tests and artifact verification, then report actual results.
