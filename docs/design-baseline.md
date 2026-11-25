# Design baseline

## Desktop

- Five-column CSS grid with `2fr 4fr 2fr 2fr 2fr` proportions.
- Menu and content begin at `60vh`; there are no JavaScript viewport measurements.
- Text is lower-case and monochrome. Menu items are right-aligned, gray by default, and gain a black 2px right border on hover/focus/selection.
- The identity item is permanently black with a 2px black right border and 60px title. Other titles are 40px; subtitles are 25px and gray.
- Content is right-aligned and gray, with black emphasis and link text.
- Images are bottom-aligned: projects use 40vh and identity uses 70vh.

## Responsive and accessibility baseline

At widths up to 760px the grid reflows into a single column, the menu/content no longer use 60vh offsets, images remain bottom-aligned, and overflow is clipped only horizontally at the page boundary. Playwright checks all four reference viewports for `scrollWidth <= clientWidth`.

The menu is a labelled navigation landmark with native buttons for content actions, `aria-current`/`aria-pressed` state, visible keyboard focus, and keyboard activation. Images have descriptive alt text. Content updates use a polite live region, failures use an alert, and reduced-motion preferences are respected.

The page has no generic header/navbar, dark mode, external font dependency, or JavaScript layout sizing.

## Visual evidence

The legacy source CSS and markup are the measured baseline at pre-migration commit `244159a77aebe920489c360482fb53c180434c63`. Playwright captures full-page screenshots for both identity and projects states at 1920×1080, 1440×900, 1024×768, and 390×844 under ignored `test-results`. The deterministic browser setup uses Chromium at device scale factor 1, the local system font stack (`Helvetica Neue`, Helvetica, Arial, sans-serif), and disabled screenshot animations; geometry assertions allow at most 2 CSS pixels of rounding variance. Reproduce captures with `npm ci`, `npm run build:css`, and `npm run test:e2e`. The browser checks also assert initial panel visibility, image sizing, original emphasized/struck-through text and repository link, accessible navigation and controls, visible keyboard focus, minimum text contrast, reduced-motion handling, reflow at a 200%-zoom-equivalent viewport, failed-resource messaging, rapid selection handling, and no horizontal overflow. Axe checks both content states at every reference viewport; no exceptions are recorded.

Legacy and current screenshots were manually compared for both states at all four viewports after serving the pre-migration tree from an isolated temporary directory. The responsive difference at 390×844 is intentional and matches the existing mobile baseline: the legacy page retained its 60vh offsets after stacking, while the current layout removes those offsets to avoid large blank spaces. The gray text tone is slightly darker (`#767676`) than legacy `gray`/`darkgray`, meeting WCAG AA text contrast; other desktop placement, original imagery, and image-height ratios remain aligned. Temporary legacy screenshots are not committed.

## Repository cleanup inventory

The migration in PR #8 removed the legacy root `index.html`, `app.js` and source maps, `Scripts/` JavaScript/TypeScript/view models and typings, Bootstrap CSS/LESS and glyphicons, old `Content/site.css`/`site.less` and `Thumbs.db`, the legacy `.csproj`/`.sln`, NuGet `packages.config`, IIS `web.config`/transforms, and compilerconfig/WebEssentials settings. Obsolete ignore and attribute rules were removed or narrowed to the active line-ending rule. This follow-up removes the unused root `CNAME`; only `wwwroot/CNAME`, which the deploy workflow publishes and smoke-tests, remains. The post-migration source tree and publish verifier are checked for legacy resources; the Pages artifact is restricted to the standalone client.

Retained files each have a current purpose: `src/` contains the Blazor client and local Aspire host; `styles/site.css` and npm lockfiles build the client stylesheet; `tests/`, `scripts/`, workflows, and docs validate, publish, and explain it; `wwwroot/CNAME` configures the custom domain and `.nojekyll` preserves the Pages framework files. The two original PNGs are byte-identical to their pre-migration versions (SHA-256 `7c65fe5acb5218d23888659114f4da7d49ab2c35d44c19adcb32af66d3ca4c8b` and `ffa1f785e564e5fbbfcc13c904bfbccce425977c1f9aa35e08a35d42e69f6f9e`) and retain their public `Content/` paths because `menu.json` references them. The original HTML copy remains in the checked-in `content/` fragments. These paths/domain files are intentional compatibility exceptions, not duplicates.
