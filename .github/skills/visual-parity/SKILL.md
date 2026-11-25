---
name: visual-parity
description: Use when checking OakIdeas desktop/mobile layout, original appearance, responsive flow, or accessibility.
---

# Visual parity

## Triggers

Use for layout/CSS changes, screenshot requests, design reviews, viewport sizing, or focus/accessibility changes.

## Inputs and outputs

- Inputs: the pre-migration source revision, target viewports 1920×1080, 1440×900, 1024×768, and 390×844, and the identity/projects states.
- Outputs: Playwright pass/failure evidence, deterministic full-page screenshots for both states at every viewport in `test-results`, and any documented mismatch or environment limitation.

## Commands

```sh
npm ci
npm run build:css
npx playwright install chromium
npm run test:e2e
```

The browser suite emits full-page identity and projects screenshots for all four reference viewports under Playwright's `test-results` output directory. Chromium runs at device scale factor 1 with the local system font stack and screenshot animations disabled; geometry checks allow 2 CSS pixels of rounding variance.

## Safe boundaries

Compare against `docs/design-baseline.md`; do not “improve” the brand by introducing a navbar, dark mode, changed copy, or JavaScript viewport measurements. Every change must remove superseded code/resources in its scope, cite evidence for removals and compatibility exceptions, and avoid unnecessary duplication. Do not commit generated screenshots unless explicitly requested.
