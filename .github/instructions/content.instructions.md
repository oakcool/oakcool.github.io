---
applyTo: "src/**/wwwroot/menu.json,src/**/wwwroot/content/**/*.html,src/**/wwwroot/Content/**"
---

# Content and menu rules

- Preserve the original wording, punctuation, typos, emphasis, strike-through, links, and original PNG bytes unless the issue explicitly requests a content change.
- Add sections through a schema-v1 `menu.json` item, a trusted static HTML fragment, and its image asset; do not add code for ordinary menu edits.
- Use safe relative paths for local content/images and HTTPS only for external URLs. Never place executable content, secrets, or arbitrary user HTML in the menu.
- Supply useful image alt text, a supported appearance, and a finite image-height ratio in `(0, 1]`.
