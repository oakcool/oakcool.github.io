---
agent: agent
description: Run the documented OakIdeas restore, build, tests, publish, and artifact validation.
---

Validate the current website change with the commands in `README.md` and `website-validation`. Run focused checks first, then the full .NET suite, Playwright, static publish/artifact checks, and HTTP smoke test when available. Fix failures, rerun affected checks, and report unrun checks as limitations. Do not dispatch production workflows.
