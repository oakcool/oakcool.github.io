# Production deployment and cutover

## Automated path

`.github/workflows/deploy-pages.yml` runs for every push to `master` and supports owner-initiated `workflow_dispatch`; both jobs are restricted to `master`. Pull requests never publish or deploy. The workflow restores in locked mode, runs xUnit/BUnit, Node artifact and deployment-smoke regressions, and Playwright against both the development server and the Release artifact served over static HTTP. It builds Tailwind, publishes the standalone client, validates and smoke-tests the exact `artifacts/site/wwwroot` directory, then uploads only that directory. Deployment runs with Pages write and OIDC permissions in the `github-pages` environment and is serialized with non-cancelling concurrency. A read-only post-deployment job then checks the live custom-domain HTTPS root, Blazor runtime and WASM, menu, content fragments, and every menu image. Requests have bounded retries and failures identify the resource and last error.

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

After merge, confirm the `Deploy GitHub Pages` run and its `verify-production` job succeed; the latter records automated HTTP status and asset availability. The owner should also confirm the environment deployment URL and check:

1. The browser shows `https://www.oakideas.com` without certificate warnings and no Blazor startup/config errors.
2. Identity is selected and its content is initially hidden. Selecting projects and identity updates the copy and image.
3. The GitHub repositories link points to `https://github.com/oakcool?tab=repositories`.
4. At a 375px viewport, both sections remain usable and there is no horizontal page overflow.
5. The published root still contains `CNAME` and `.nojekyll`; the artifact verifier and pre-deployment static HTTP smoke check cover these files.

## Rollback

Record the last known-good successful Pages run and its source commit; retain the corresponding source or artifact under the owner's normal repository retention policy. If production must be rolled back, the owner prepares and reviews a rollback commit that restores the known-good site files, then merges it to `master`. The normal build, artifact checks, deployment, and post-deployment smoke job run again. `workflow_dispatch` deploys the workflow from the selected `master` ref; it does not select or restore an older artifact, so dispatching alone is not a rollback. Use it only for owner recovery when the current `master` artifact should be deployed again. Verify HTTPS and site behavior after recovery. Do not change DNS as a rollback shortcut.
