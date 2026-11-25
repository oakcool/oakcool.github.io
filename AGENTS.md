# Repository rules

## Work and scope

- Treat each issue as a self-contained work item. Keep changes limited to that issue, use one issue per pull request, and link it with `Closes`.
- Follow trunk-based development: work in the assigned branch and merge through review to `master`; do not create unrelated branches or repositories.
- Do not reopen closed issues. Ask the owner if a closed issue appears to need new work.
- Preserve OakIdeas' original design, public content, links, domain, and image bytes unless an issue explicitly authorizes a change.
- Do not add APIs, databases, authentication, a CMS, server hosting, state frameworks, analytics, dark mode, or unrelated projects.

## Security and production

- Never put secrets, credentials, personal data, or deployment tokens in source/configuration. Do not copy secrets into prompts or tool output.
- Treat checked-in HTML fragments as trusted reviewed code; never render menu/user-supplied HTML or executable configuration.
- Keep static paths same-origin and traversal-safe; external links must be HTTPS.
- Agents must not change Pages/repository administration, initiate a production deployment, or manually dispatch `deploy-pages.yml`. An authorized merge to `master` is the production deployment trigger; the owner alone may use the recovery dispatch.
- CI must never deploy from pull requests. Publish only the standalone client `wwwroot`.
- Keep Pages rollback guidance tied to the actual workflow: a rollback commit merged to `master` rebuilds and redeploys; `workflow_dispatch` only rebuilds the selected `master` ref. Verify live HTTPS and required static assets after deployment.

## Engineering and validation

- Use .NET 10, centrally pinned NuGet versions and lock files, Node dependencies pinned by `package-lock.json`, and the repository's existing Tailwind/Blazor/xUnit/BUnit/Playwright stack.
- Keep the client standalone WebAssembly and use responsive CSS layout, not JavaScript viewport measurements.
- Every change removes superseded code and resources within its scope. Reviewers require repository evidence for removals and retained compatibility files, and changes must not introduce unnecessary duplicates.
- Add focused tests for behavior/configuration changes. Run and fix local tests/builds before reporting results when the environment supports them.
- Use the exact commands in `README.md` and `docs`; if a command cannot run, report its actual error/limitation. Never claim an unexecuted CI check passed.
- CI execution is the owner/reviewer responsibility, not grounds to invent checks, block otherwise complete engineering, or create a separate prerequisite issue.
- Keep documentation aligned with the actual scripts, workflows, supported package versions, and published artifact path.
