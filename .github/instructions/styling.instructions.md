---
applyTo: "styles/**/*.css,src/**/*.razor.css"
---

# Styling rules

- Build styles with the pinned Tailwind CSS 4 CLI (`npm run build:css`); keep custom CSS limited to OakIdeas-specific layout and visual parity.
- Preserve the 2/4/2/2/2 desktop grid, 60vh menu/content placement, lower-case monochrome typography, gray labels, and 2px permanent black identity border.
- Preserve 40px menu/25px subtitle/60px identity sizing and bottom-aligned 40vh project / 70vh identity images.
- Reflow on narrow screens without horizontal overflow. Keep visible keyboard focus and respect reduced-motion preferences.
- Do not add a generic navbar or dark mode.
