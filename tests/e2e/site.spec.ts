import { expect, test } from "@playwright/test";

const browserIssues = new WeakMap<object, {
  consoleErrors: string[];
  pageErrors: string[];
  failedResources: string[];
  unsuccessfulResources: string[];
}>();

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
    unsuccessfulResources: [] as string[]
  };
  browserIssues.set(page, issues);
  page.on("console", message => {
    if (message.type() === "error") {
      issues.consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", error => issues.pageErrors.push(error.message));
  page.on("requestfailed", request => {
    const failure = request.failure()?.errorText;
    if (isRequiredResource(request.url()) && failure !== "net::ERR_ABORTED") {
      issues.failedResources.push(`${request.url()}: ${failure ?? "request failed"}`);
    }
  });
  page.on("response", response => {
    if (response.status() >= 400 && isRequiredResource(response.url())) {
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
