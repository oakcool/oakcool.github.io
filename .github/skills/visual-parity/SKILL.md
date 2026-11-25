---
name: visual-parity
description: Use when checking OakIdeas desktop/mobile layout, original appearance, responsive flow, or accessibility.
---

# Visual parity

## Triggers

Use for layout/CSS changes, screenshot requests, design reviews, viewport sizing, or focus/accessibility changes.

## Inputs and outputs

- Inputs: the relevant legacy source rules, target viewport(s), and the section being checked.
- Outputs: Playwright pass/failure evidence, desktop/mobile screenshots in `test-results`, and any documented mismatch or environment limitation.

## Commands

```sh
npm ci
npm run build:css
npx playwright install chromium
npm run test:e2e
```

The browser suite emits full-page desktop-projects, desktop-identity, and 375px mobile-projects screenshots under Playwright's `test-results` output directory.

## Safe boundaries

Compare against `docs/design-baseline.md`; do not “improve” the brand by introducing a navbar, dark mode, changed copy, or JavaScript viewport measurements. Do not commit generated screenshots unless explicitly requested.
