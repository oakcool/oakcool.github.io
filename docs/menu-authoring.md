# Menu authoring

The menu is `src/OakIdeas.Github.Website.Client/wwwroot/menu.json`, schema version 1. A section needs one JSON item, a trusted HTML fragment, and an image. Ordinary additions require no Razor/C# changes.

```json
{
  "id": "new-section",
  "title": "section",
  "subtitle": "oakideas",
  "order": 3,
  "enabled": true,
  "appearance": "standard",
  "action": {
    "type": "content",
    "contentPath": "content/new-section.html"
  },
  "image": {
    "src": "Content/new-section.png",
    "alt": "Description of the image",
    "viewportHeightRatio": 0.4,
    "alignment": "bottom"
  }
}
```

Add the item to `items`, keep every ID unique, and ensure the enabled `defaultItemId` refers to an item. Supported appearances are `standard` and `identity`. Content actions accept only safe relative `.html` paths. External-link actions use `{ "type": "url", "url": "https://example.com/" }`; only HTTPS is allowed. Internal deep links are deferred.

Images use safe relative `.png` paths, non-empty alt text, and a finite ratio greater than 0 and at most 1. `alignment` is currently `bottom`. Paths must exist in `wwwroot`; traversal, absolute paths, backslashes, and encoded path segments are rejected.

Content fragments are trusted static HTML reviewed with the same care as application code. Do not put user-authored or arbitrary fetched HTML, scripts, event handlers, secrets, or executable configuration in these files. The loader displays fragments only after selecting the matching menu item; the initial identity selection intentionally leaves content hidden.

Validate changes with:

```sh
dotnet test tests/OakIdeas.Github.Website.Tests/OakIdeas.Github.Website.Tests.csproj
npm run build:css
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj -c Release -o artifacts/site
npm run check:artifact -- artifacts/site/wwwroot
npm run test:e2e
```

The original asset URLs under `Content/` are retained in the static site to avoid breaking public links.
