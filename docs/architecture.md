# Architecture

## Runtime shape

The deployable application is a standalone Blazor WebAssembly client targeting `net10.0`. It loads `menu.json`, the two trusted HTML fragments, and images from its own static origin. It has no server-side runtime, API, database, authentication, CMS, analytics, routing framework, or state framework. Menu selection and current content are local component state.

The application starts with the identity item selected and its image visible, while the content panel is deliberately hidden until a visitor selects an item. This preserves the original site's initial visibility behavior.

Aspire runs the standalone project's existing Blazor WebAssembly development server as a standard Aspire project resource. Aspire's official `Aspire.Hosting.Blazor` integration is marked prerelease, so the repository uses the stable Aspire AppHost SDK project API instead of relying on that preview integration. The production pipeline publishes only the client `wwwroot`; it never publishes an Aspire gateway or server.

## Configuration and trusted content

`wwwroot/menu.json` is schema version 1. `MenuConfigurationValidator` rejects unsupported schema versions/actions/appearances, duplicate IDs, disabled defaults, invalid relative paths, non-HTTPS external URLs, missing labels/alt text, invalid image ratios, and unsupported alignment. The runtime loader also requests every configured static image and content file and reports a visible error if a resource is unavailable.

Content actions load only relative `.html` files checked into `wwwroot/content`. The component displays these trusted repository assets as markup; menu JSON is never treated as HTML and no user-supplied HTML or executable configuration is supported. URLs are absolute HTTPS links and do not accept internal application routes.

Paths are same-origin relative to the published site base. The original public image paths remain `Content/oakideasnew.png` and `Content/mateusthoughtful.png`. The custom domain is preserved in `wwwroot/CNAME`; `.nojekyll` ensures GitHub Pages serves the `_framework` tree.

## Build graph

- `global.json` pins the .NET 10 SDK feature band and `Directory.Packages.props` centralizes NuGet versions.
- Each .NET project has a committed `packages.lock.json`; CI restores in locked mode.
- `package.json` and `package-lock.json` pin Tailwind CSS 4.3.5, its CLI, and Playwright.
- Tailwind scans the Razor client and writes the production stylesheet to `Client/wwwroot/css/app.css`.
- `dotnet publish ... --output artifacts/site` places the GitHub Pages payload under `artifacts/site/wwwroot`.

The artifact verifier checks the base URL, CNAME, `.nojekyll`, runtime files, schema/path safety, static references, and exclusion of source/development files before upload.
