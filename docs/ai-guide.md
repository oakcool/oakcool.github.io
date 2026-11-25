# AI repository guide

`/AGENTS.md` is the canonical repository instruction set. `.github/copilot-instructions.md` points contributors and agents to it. Scoped `.github/instructions/*.instructions.md` files cover Blazor, styling, testing, content, and workflows.

## Discoverability

- Agents: `.github/agents/website-maintainer.agent.md`, `website-reviewer.agent.md`, and `content-editor.agent.md`.
- Skills: `.github/skills/website-development`, `menu-and-content`, `visual-parity`, `website-validation`, and `website-deployment`.
- Prompts: `.github/prompts/add-menu-item.prompt.md`, `review-website-change.prompt.md`, and `validate-website.prompt.md`.
- PR template: `.github/pull_request_template.md`.

These resources describe this repository's actual commands and boundaries; they do not import external skills. Keep `AGENTS.md` canonical, link to it instead of copying policy into every agent, and update the scoped instructions/skills when a verified command or code path changes. Reviewer agents remain read-only.

## Safe use

Work on one self-contained issue per PR. Never ask an agent to reveal secrets, edit Pages administration settings, dispatch a production deployment, or bypass owner/reviewer controls. Agents report only checks that actually ran and any environment limitation. CI remains the owner/reviewer validation signal; missing local tools should be reported, not invented or used to create unrelated work.
