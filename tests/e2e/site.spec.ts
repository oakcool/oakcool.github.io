import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const browserIssues = new WeakMap<object, {
  consoleErrors: string[];
  pageErrors: string[];
  failedResources: string[];
  unsuccessfulResources: string[];
  expectedFailurePaths: Set<string>;
}>();

const referenceViewports = [
  { name: "1920x1080", width: 1920, height: 1080 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "390x844", width: 390, height: 844 }
];

function isRequiredResource(url: string): boolean {
  const pathname = new URL(url).pathname;
  return pathname.startsWith("/_framework/") ||
    pathname === "/menu.json" ||
    pathname === "/css/app.css" ||
    pathname.startsWith("/content/") ||
    pathname.startsWith("/Content/");
}

test.beforeEach(async ({ page }) => {
  const issues = {
    consoleErrors: [] as string[],
    pageErrors: [] as string[],
    failedResources: [] as string[],
    unsuccessfulResources: [] as string[],
    expectedFailurePaths: new Set<string>()
  };
  browserIssues.set(page, issues);
  page.on("console", message => {
    if (message.type() === "error") {
      const expectedResourceFailure = message.text() === "Failed to load resource: net::ERR_FAILED" &&
        issues.expectedFailurePaths.size > 0;
      if (!expectedResourceFailure) {
        issues.consoleErrors.push(message.text());
      }
    }
  });
  page.on("pageerror", error => issues.pageErrors.push(error.message));
  page.on("requestfailed", request => {
    const failure = request.failure()?.errorText;
    const pathname = new URL(request.url()).pathname;
    if (isRequiredResource(request.url()) && failure !== "net::ERR_ABORTED" &&
      !issues.expectedFailurePaths.has(pathname)) {
      issues.failedResources.push(`${request.url()}: ${failure ?? "request failed"}`);
    }
  });
  page.on("response", response => {
    const pathname = new URL(response.url()).pathname;
    if (response.status() >= 400 && isRequiredResource(response.url()) &&
      !issues.expectedFailurePaths.has(pathname)) {
      issues.unsuccessfulResources.push(`${response.status()} ${response.url()}`);
    }
  });
});

test.afterEach(async ({ page }) => {
  const issues = browserIssues.get(page);
  expect(issues?.consoleErrors, "unexpected browser console errors").toEqual([]);
  expect(issues?.pageErrors, "unexpected page errors").toEqual([]);
  expect(issues?.failedResources, "required application resources failed to load").toEqual([]);
  expect(issues?.unsuccessfulResources, "required application resources returned an error").toEqual([]);
});

test("switches between the original identity and projects sections", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Oakcool's Repo");
  await expect(page.locator("#app .site-grid")).toBeVisible();
  await expect(page.locator("#app .loading")).toHaveCount(0);
  const identity = page.getByRole("button", { name: /oakcool mateus carvalho/i });
  const projects = page.getByRole("button", { name: /oakideas projects/i });

  await expect(identity).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".site-content")).toBeHidden();
  await expect(page.getByRole("img", { name: "Mateus Carvalho thoughtfully looking into the distance" })).toBeVisible();

  await projects.click();
  await expect(page.locator(".site-content")).toBeVisible();
  await expect(page.locator(".site-content")).toContainText("Here are some of the public brain dumps.");
  await expect(page.locator(".site-content a")).toHaveAttribute("href", "https://github.com/oakcool?tab=repositories");
  const projectImage = page.getByRole("img", { name: "oakideas" });
  await expect(projectImage).toBeVisible();
  await expect(page.locator(".site-content")).toHaveCSS("font-size", "14px");
  await expect(page.locator(".site-content h2")).toHaveCSS("font-size", "30px");
  expect((await projectImage.boundingBox())?.height).toBeCloseTo(360, 0);
  await page.screenshot({ path: testInfo.outputPath("desktop-projects.png"), fullPage: true });

  await identity.click();
  await expect(page.locator(".site-content")).toContainText("How to briefely describe me?");
  await expect(page.locator(".site-content del")).toContainText("thinking, observing, listening, loving,");
  await expect(page.locator(".site-content ins")).toContainText("and most importantly is a husband and a dad");
  expect((await page.getByRole("img", { name: "Mateus Carvalho thoughtfully looking into the distance" }).boundingBox())?.height)
    .toBeCloseTo(630, 0);
  await page.screenshot({ path: testInfo.outputPath("desktop-identity.png"), fullPage: true });
});

test("reflows on a narrow viewport without horizontal overflow", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator("#app .site-grid")).toBeVisible();
  await page.getByRole("button", { name: /oakideas projects/i }).click();

  await expect(page.locator(".site-content")).toBeVisible();
  await expect(page.getByRole("img", { name: "oakideas" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
  await page.screenshot({ path: testInfo.outputPath("mobile-projects.png"), fullPage: true });
});

test("captures both states at every reference viewport", async ({ page }, testInfo) => {
  for (const viewport of referenceViewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/");

    const navigation = page.getByRole("navigation", { name: "site sections" });
    const identity = page.getByRole("button", { name: /oakcool mateus carvalho/i });
    const projects = page.getByRole("button", { name: /oakideas projects/i });
    const content = page.locator(".site-content");
    const identityImage = page.getByRole("img", { name: "Mateus Carvalho thoughtfully looking into the distance" });

    await expect(navigation).toBeVisible();
    await expect(identity).toHaveAttribute("aria-current", "page");
    await expect(identity).toHaveAttribute("aria-pressed", "true");
    await expect(identity).toHaveCSS("border-right-color", "rgb(0, 0, 0)");
    await expect(projects).toHaveAttribute("aria-pressed", "false");
    await expect(content).toBeHidden();
    await expect(identityImage).toBeVisible();
    await expect(identityImage).toHaveAttribute("alt", "Mateus Carvalho thoughtfully looking into the distance");
    await expect(page.locator(".site-content")).toHaveAttribute("aria-live", "polite");
    await expectNoAccessibilityViolations(page);

    const gridColumns = await page.locator(".site-grid").evaluate(element =>
      getComputedStyle(element).gridTemplateColumns.split(" ").length);
    expect(gridColumns).toBe(viewport.width <= 760 ? 1 : 5);
    const menuListBounds = await page.locator(".menu-list").boundingBox();
    expect(menuListBounds).not.toBeNull();
    if (viewport.width > 760) {
      expect(Math.abs(menuListBounds!.y - viewport.height * 0.6)).toBeLessThanOrEqual(2);
      const columnWidths = await page.locator(".site-grid").evaluate(element =>
        getComputedStyle(element).gridTemplateColumns.split(" ").map(width => Number.parseFloat(width)));
      expect(Math.abs(columnWidths[1] - columnWidths[0] * 2)).toBeLessThanOrEqual(1);
      expect(columnWidths.slice(2).every(width => Math.abs(width - columnWidths[0]) <= 1)).toBe(true);
    } else {
      expect(menuListBounds!.y).toBeLessThan(viewport.height * 0.1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );

    const identityFigure = await page.locator(".site-image").boundingBox();
    const identityBounds = await identityImage.boundingBox();
    expect(identityFigure).not.toBeNull();
    expect(identityBounds).not.toBeNull();
    expect(Math.abs(identityFigure!.y + identityFigure!.height - identityBounds!.y - identityBounds!.height))
      .toBeLessThanOrEqual(2);
    expect(identityBounds!.height).toBeLessThanOrEqual(viewport.height * 0.7 + 2);
    if (viewport.width > 760) {
      expect(Math.abs(identityBounds!.height - viewport.height * 0.7)).toBeLessThanOrEqual(2);
    }

    await assertContrastAtLeast(identity.locator(".menu-subtitle"), 4.5);
    await projects.hover();
    await expect(projects).toHaveCSS("border-right-color", "rgb(0, 0, 0)");
    await page.mouse.move(0, 0);
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-identity.png`),
      fullPage: true,
      animations: "disabled"
    });

    await projects.click();
    await expect(projects).toHaveAttribute("aria-pressed", "true");
    await expect(projects).toHaveAttribute("aria-current", "page");
    await expect(content).toBeVisible();
    await expect(page.getByRole("img", { name: "oakideas" })).toBeVisible();
    const contentBounds = await content.boundingBox();
    expect(contentBounds).not.toBeNull();
    if (viewport.width > 760) {
      expect(Math.abs(contentBounds!.y - viewport.height * 0.6)).toBeLessThanOrEqual(2);
    }
    await expectNoAccessibilityViolations(page);
    await assertContrastAtLeast(content.locator("p").first(), 4.5);

    const projectImage = page.getByRole("img", { name: "oakideas" });
    const projectFigure = await page.locator(".site-image").boundingBox();
    const projectBounds = await projectImage.boundingBox();
    expect(projectFigure).not.toBeNull();
    expect(projectBounds).not.toBeNull();
    expect(Math.abs(projectFigure!.y + projectFigure!.height - projectBounds!.y - projectBounds!.height))
      .toBeLessThanOrEqual(2);
    expect(projectBounds!.height).toBeLessThanOrEqual(viewport.height * 0.4 + 2);
    if (viewport.width > 760) {
      expect(Math.abs(projectBounds!.height - viewport.height * 0.4)).toBeLessThanOrEqual(2);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      await page.evaluate(() => document.documentElement.clientWidth)
    );
    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-projects.png`),
      fullPage: true,
      animations: "disabled"
    });
  }
});

test("supports keyboard selection and visible focus", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#app .site-grid")).toBeVisible();
  await page.getByRole("button").first().waitFor();
  await page.keyboard.press("Tab");

  const focusedControl = page.locator(":focus");
  await expect(focusedControl).toHaveRole("button");
  await expect(focusedControl).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator(".site-content")).toBeVisible();
});

test("reflows at a two-times-zoom-equivalent viewport", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 450 });
  await page.goto("/");

  const gridColumns = await page.locator(".site-grid").evaluate(element =>
    getComputedStyle(element).gridTemplateColumns.split(" ").length);
  expect(gridColumns).toBe(1);
  await page.getByRole("button", { name: /oakideas projects/i }).click();
  await expect(page.locator(".site-content")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    await page.evaluate(() => document.documentElement.clientWidth)
  );
});

test("respects the reduced-motion preference", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.addStyleTag({ content: "html { scroll-behavior: smooth; }" });

  await expect(page.locator("html")).toHaveCSS("scroll-behavior", "auto");
});

test("shows a visible error when menu JSON is invalid", async ({ page }) => {
  await page.route("**/menu.json", route => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: "{"
  }));
  await page.goto("/");

  await expect(page.getByRole("alert")).toHaveText("The site menu could not be loaded. Please try again later.");
});

test("shows a visible error when a required image is unavailable", async ({ page }) => {
  browserIssues.get(page)?.expectedFailurePaths.add("/Content/oakideasnew.png");
  await page.route("**/Content/oakideasnew.png", route => route.abort());
  await page.goto("/");

  await expect(page.getByRole("alert")).toHaveText("The site menu could not be loaded. Please try again later.");
});

test("reports a selected-content request failure", async ({ page }) => {
  browserIssues.get(page)?.expectedFailurePaths.add("/content/projects.html");
  let projectRequests = 0;
  await page.route("**/content/projects.html", async route => {
    projectRequests++;
    if (projectRequests === 1) {
      await route.fulfill({ status: 200, body: "" });
    } else {
      await route.abort();
    }
  });
  await page.goto("/");
  await page.getByRole("button", { name: /oakideas projects/i }).click();

  await expect(page.getByRole("alert")).toHaveText("The selected content could not be loaded. Please try again.");
});

test("keeps the latest content after a slower earlier selection resolves", async ({ page }) => {
  let projectRequests = 0;
  let signalProjectRequest: (() => void) | undefined;
  const projectRequestStarted = new Promise<void>(resolve => {
    signalProjectRequest = resolve;
  });
  await page.route("**/content/projects.html", async route => {
    projectRequests++;
    if (projectRequests === 1) {
      await route.fulfill({ status: 200, body: "" });
      return;
    }

    signalProjectRequest?.();
    await new Promise(resolve => setTimeout(resolve, 200));
    await route.fulfill({ status: 200, body: "<p>stale projects response</p>" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: /oakideas projects/i }).click();
  await projectRequestStarted;
  await page.getByRole("button", { name: /oakcool mateus carvalho/i }).click();

  await expect(page.locator(".site-content")).toContainText("How to briefely describe me?");
  await page.waitForTimeout(250);
  await expect(page.locator(".site-content")).not.toContainText("stale projects response");
});

async function assertContrastAtLeast(element: import("@playwright/test").Locator, minimum: number) {
  const contrast = await element.evaluate(node => {
    const parseColor = (color: string) => color.match(/[\d.]+/g)!.slice(0, 3).map(Number);
    const luminance = (color: number[]) => color
      .map(channel => channel / 255)
      .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
      .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
    const foreground = luminance(parseColor(getComputedStyle(node).color));
    const background = luminance(parseColor(getComputedStyle(document.documentElement).backgroundColor));
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(contrast).toBeGreaterThanOrEqual(minimum);
}

async function expectNoAccessibilityViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.map(({ id, impact, nodes }) => ({
      id,
      impact,
      targets: nodes.map(node => node.target)
    })),
    "axe accessibility violations"
  ).toEqual([]);
}
