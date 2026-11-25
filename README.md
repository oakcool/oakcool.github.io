# OakIdeas website

The public website is a standalone .NET 10 Blazor WebAssembly client. The original OakIdeas copy, two PNG images, GitHub repositories link, and `www.oakideas.com` domain are preserved. Production is static files only: no API, server runtime, authentication, or database is published.

## Quickstart

Requirements: .NET SDK `10.0.404` (pinned by `global.json`), Node.js 20 or later, and the pinned Aspire CLI for local orchestration.

```sh
dotnet tool install --global Aspire.Cli --version 13.6.5
npm ci
npm run build:css
npm run test:artifact
npm run test:deployment
dotnet restore OakIdeas.Github.Website.slnx --locked-mode
dotnet test OakIdeas.Github.Website.slnx --no-restore
npm run test:e2e
```

To run the client under Aspire, start the `website` resource shown in the Aspire dashboard:

```sh
aspire run --apphost src/OakIdeas.Github.Website.AppHost/OakIdeas.Github.Website.AppHost.csproj
```

The Blazor WebAssembly development server is the only web host, and it runs locally under Aspire. The official `Aspire.Hosting.Blazor` hosting integration is currently prerelease; this project intentionally uses Aspire's stable standard project resource instead of depending on preview APIs. Tailwind is rebuilt with `npm run watch:css` while editing styles.

Build and verify the production site:

```sh
npm run build:css
dotnet publish src/OakIdeas.Github.Website.Client/OakIdeas.Github.Website.Client.csproj \
  --configuration Release --output artifacts/site
printf '%s\n' "$(git rev-parse HEAD)" > artifacts/site/wwwroot/deployment-revision.txt
npm run check:artifact -- artifacts/site/wwwroot
E2E_TARGET=production npm run test:e2e
```

The production browser check serves and tests the published `artifacts/site/wwwroot` artifact over static HTTP; regular `npm run test:e2e` continues to use the local Blazor development server. The deployable site is `artifacts/site/wwwroot` only. Do not publish the outer directory, AppHost, tests, repository instructions, or source files.

The Pages workflow writes the deploying source commit to `deployment-revision.txt` in the published `wwwroot` and verifies that the live marker matches the expected commit. Post-deployment checks validate response content types and bodies—not only HTTP status—for the root, Blazor bootstrap and .NET loader, native runtime and main managed WebAssembly assembly, menu, content, and PNG images. Checks retry HTTP/body/validation failures up to four times with request timeouts; unsafe paths and off-domain redirects fail immediately with resource-specific diagnostics. See [deployment and rollback](docs/deployment.md) for owner verification and recovery steps.

## Project map

- `src/OakIdeas.Github.Website.Client`: standalone Blazor UI, menu validation/loader, and static `wwwroot` assets.
- `src/OakIdeas.Github.Website.AppHost`: stable Aspire local orchestration for the client's development server.
- `tests/OakIdeas.Github.Website.Tests`: xUnit and BUnit tests.
- `tests/e2e` and `playwright.config.ts`: Playwright browser checks for selection, responsive layout, and keyboard focus.
- `styles/site.css` and `package-lock.json`: Tailwind CSS 4 input and exact npm dependency lock.
- `docs`: architecture, design baseline, menu authoring, deployment, and AI resources.

See [architecture](docs/architecture.md), [design baseline](docs/design-baseline.md), [menu authoring](docs/menu-authoring.md), [deployment and cutover](docs/deployment.md), and the [AI guide](docs/ai-guide.md).
