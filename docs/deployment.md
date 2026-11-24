# Production deployment and cutover

## Automated path

`.github/workflows/deploy-pages.yml` runs for every push to `master`, including the first merge, and supports owner-initiated `workflow_dispatch` recovery from `master`. Pull requests never publish or deploy. The workflow restores in locked mode, runs xUnit/BUnit and Playwright, builds Tailwind, publishes the standalone client, validates the static artifact, smoke-tests it over HTTP, and uploads only `artifacts/site/wwwroot`. Deployment runs with Pages write and OIDC permissions in the `github-pages` environment and is serialized with non-cancelling concurrency.

`wwwroot/CNAME` retains `www.oakideas.com`, `.nojekyll` preserves the Blazor `_framework` directory, and the custom-domain root uses `<base href="/">`. No DNS changes are required or authorized by this change.

## Owner pre-merge checklist

- [ ] Record the currently live deployment, its source commit, and a known-good artifact or rollback path before changing Pages settings.
- [ ] In repository Pages settings, switch the publishing source to **GitHub Actions**. Confirm that no branch-source workflow can publish a missing root entrypoint during the transition.
- [ ] Confirm the custom domain remains `www.oakideas.com`, HTTPS enforcement remains enabled, and DNS is unchanged.
- [ ] Confirm the `github-pages` environment permits the `master` deployment without an additional approval gate if immediate release is desired.
- [ ] Confirm the PR CI run is green and the reviewed deployment workflow uploads only the standalone client `wwwroot`.
- [ ] Do not merge while Pages still uses branch publishing or if the previous deployment/rollback information was not recorded.

The agent cannot inspect/change owner Pages administration settings, remove environment protection, dispatch production workflows, or verify the production domain. The owner performs those steps.

## Post-merge smoke check

Immediately after merge, the owner verifies the `Deploy GitHub Pages` run succeeded and the environment deployment URL is recorded. Then check:

1. `https://www.oakideas.com` returns the page over HTTPS without certificate warnings.
2. The browser network panel loads `menu.json`, both original image URLs, and `_framework` files successfully; the console has no Blazor startup/config errors.
3. Identity is selected and its content is initially hidden. Selecting projects and identity updates the copy and image.
4. The GitHub repositories link points to `https://github.com/oakcool?tab=repositories`.
5. At a 375px viewport, both sections remain usable and there is no horizontal page overflow.
6. The published root still contains `CNAME` and `.nojekyll`.

## Rollback

Before cutover, retain the previous known-good Pages deployment/commit and an artifact if available. If the new deployment fails, the owner stops further production dispatches, restores the recorded known-good site/deployment using GitHub Pages deployment history or a reviewed rollback commit, and verifies the custom domain and HTTPS again. A corrected commit merged to `master` triggers the normal validated deployment; `workflow_dispatch` is reserved for owner recovery from `master`, never PR branches. Do not change DNS as a rollback shortcut.
