# Production deployment and cutover

## Automated path

`.github/workflows/deploy-pages.yml` runs for every push to `master` and supports owner-initiated `workflow_dispatch`; all jobs are restricted to `master`. Pull requests never publish or deploy. The workflow restores in locked mode, runs xUnit/BUnit, Node artifact and deployment-smoke regressions, and Playwright against both the development server and the Release artifact served over static HTTP. It builds Tailwind, publishes the standalone client, writes the exact `GITHUB_SHA` to `artifacts/site/wwwroot/deployment-revision.txt`, validates and smoke-tests that `wwwroot`, then uploads only that directory. This deterministic marker lets the read-only post-deployment job compare the live revision with `${{ github.sha }}`; stale Pages responses are retried while propagation completes. Build and verification jobs have `contents: read`; only deployment receives Pages write and OIDC permissions in the `github-pages` environment. The workflow is serialized with non-cancelling concurrency. A failed post-deployment check reports a failed workflow after publication; it does not automatically roll back the site.

The production smoke check requires compatible media types and valid response bodies: JavaScript must be non-empty and not an HTML fallback; PNG images and WebAssembly assets must have their binary signatures; HTML content fragments must contain HTML and not the application root document; and JSON must parse and contain the required menu schema. It parses .NET 10's generated `dotnet.js` resource metadata to find both `wasmNative` runtime and the main managed assembly, avoiding fingerprinted filenames. Each request, body read, and content validation is retried up to four times with an eight-second request timeout. Diagnostics include the resource path, attempts used, and final error; unsafe paths and unexpected redirects fail without retry.

`wwwroot/CNAME` retains `www.oakideas.com`, `.nojekyll` preserves the Blazor `_framework` directory, and the custom-domain root uses `<base href="/">`. No DNS changes are required or authorized by this change.

## Owner operational checklist

- [ ] Record the latest successful `Deploy GitHub Pages` run and its source commit; keep the known-good source revision available for a reviewed rollback commit.
- [ ] Confirm Pages continues to use **GitHub Actions**, the custom domain remains `www.oakideas.com`, HTTPS enforcement remains enabled, and DNS is unchanged.
- [ ] Confirm the `github-pages` environment permits automatic deployment from `master` if immediate release is intended.
- [ ] Monitor the build, deploy, and `verify-production` jobs separately so failures are attributed to validation, publication, or the live site.

The agent cannot inspect/change owner Pages administration settings, remove environment protection, dispatch production workflows, or verify the production domain from this sandbox. The owner performs those steps.

## Post-merge smoke check

After merge, confirm the `Deploy GitHub Pages` run and its `verify-production` job succeed; the latter confirms that the live `deployment-revision.txt` equals the exact source commit and records whether the verified resources are available and valid. The owner should also confirm the environment deployment URL and check:

1. The browser shows `https://www.oakideas.com` without certificate warnings and no Blazor startup/config errors.
2. Identity is selected and its content is initially hidden. Selecting projects and identity updates the copy and image.
3. The GitHub repositories link points to `https://github.com/oakcool?tab=repositories`.
4. At a 375px viewport, both sections remain usable and there is no horizontal page overflow.
5. The published root still contains `CNAME` and `.nojekyll`; the artifact verifier and pre-deployment static HTTP smoke check cover these files.

## Rollback

Record the last known-good successful Pages run and its source commit. The workflow currently retains its uploaded Pages artifact for one day, so do not rely on that artifact as a durable backup; preserve the source revision and archive the artifact before expiry only if operationally needed. If production must be rolled back, the owner prepares and reviews a rollback commit that restores the known-good site files, then merges it to `master`. The normal build, artifact checks, deployment, and post-deployment smoke job run again. `workflow_dispatch` deploys the workflow from the selected `master` ref; it does not select or restore an older artifact, so dispatching alone is not a rollback. Use it only for owner recovery when the current `master` artifact should be deployed again. Verify HTTPS and site behavior after recovery. Do not change DNS as a rollback shortcut.
