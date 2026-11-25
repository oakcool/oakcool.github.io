## Issue

Closes #<issue-number>

## Migration inventory

- [ ] Legacy implementation/assets replaced or intentionally retained with a documented reason
- [ ] Original prose, links, domain, and PNG bytes checked
- [ ] Menu schema/content and accessible interactions checked

## Validation evidence

- [ ] `dotnet test OakIdeas.Github.Website.slnx`
- [ ] `npm run test:e2e`
- [ ] `dotnet publish ...` and `npm run check:artifact -- artifacts/site/wwwroot`
- [ ] Desktop and mobile visual/overflow check

Screenshots/evidence:

## Deviations and remaining risks

- None, or list precise unverified items and environment limitations.

## Production cutover

- [ ] Owner confirmed the Pages source is GitHub Actions and retained the previous deployment/commit for rollback
- [ ] Owner confirmed the custom domain, HTTPS, and `github-pages` environment settings
