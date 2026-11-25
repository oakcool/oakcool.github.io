---
applyTo: ".github/**/*.yml"
---

# Workflow rules

- Pin every GitHub Action to a verified full commit SHA and grant the least permissions required.
- PR validation must never deploy; production deployment runs only from `master` and publishes only the standalone client `wwwroot`.
- Run restore in locked mode, tests, production publish, source-SHA marker generation, artifact validation, and static HTTP smoke checks before uploading Pages content.
- Preserve the custom domain and `.nojekyll`; serialize Pages deployment without cancelling an in-progress deployment.
- After successful deployment, compare the live revision marker with `github.sha` and verify resource content types/bodies, including generated native and managed WASM assets, with bounded retries, timeouts, and actionable failures.
- Agents may not dispatch production workflows or change repository/Pages administration settings.
