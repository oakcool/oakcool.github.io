# Design baseline

## Desktop

- Five-column CSS grid with `2fr 4fr 2fr 2fr 2fr` proportions.
- Menu and content begin at `60vh`; there are no JavaScript viewport measurements.
- Text is lower-case and monochrome. Menu items are right-aligned, gray by default, and gain a black 2px right border on hover/focus/selection.
- The identity item is permanently black with a 2px black right border and 60px title. Other titles are 40px; subtitles are 25px and gray.
- Content is right-aligned and gray, with black emphasis and link text.
- Images are bottom-aligned: projects use 40vh and identity uses 70vh.

## Responsive and accessibility baseline

At widths up to 760px the grid reflows into a single column, the menu/content no longer use 60vh offsets, images remain bottom-aligned, and overflow is clipped only horizontally at the page boundary. Playwright checks a 375px viewport for `scrollWidth <= clientWidth`.

The menu is a labelled navigation landmark with native buttons for content actions, `aria-current`/`aria-pressed` state, visible keyboard focus, and keyboard activation. Images have descriptive alt text. Content updates use a polite live region, failures use an alert, and reduced-motion preferences are respected.

The page has no generic header/navbar, dark mode, external font dependency, or JavaScript layout sizing.

## Visual evidence

The legacy source CSS and markup are the measured baseline. Although a screenshot was not captured before editing, the original committed revision was served from an isolated temporary directory and compared locally at 1440×900 against the new projects view; image scale, grid placement, typography, and section content were checked. Playwright also writes full-page desktop identity/projects and 375×812 mobile screenshots under ignored `test-results`; reproduce them with `npm ci`, `npm run build:css`, and `npm run test:e2e`. The browser checks assert the initially hidden panel, both section/image states, the original emphasized/struck-through text and repository link, visible keyboard focus, and no horizontal overflow.
