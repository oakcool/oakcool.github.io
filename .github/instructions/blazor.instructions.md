---
applyTo: "src/**/*.razor,src/**/*.cs"
---

# Blazor client rules

- Keep the client standalone WebAssembly: no API, server runtime, authentication, persistence, or global state framework.
- Keep menu data typed and validate it before rendering. HTML fragments are trusted checked-in assets only; never render menu-provided or user-provided HTML.
- Cancel superseded content requests and ensure older responses cannot overwrite the current selection.
- Preserve the initially selected identity and its intentionally hidden content until an item is activated.
- Keep keyboard semantics, explicit accessible names/alt text, focus indicators, and visible loading failures.
- Use the framework's built-in viewport/grid/flex CSS; do not add JavaScript measurements.
