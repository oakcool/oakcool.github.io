import { expect, test } from "@playwright/test";

test("switches between the original identity and projects sections", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Oakcool's Repo");
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
  await page.getByRole("button").first().waitFor();
  await page.keyboard.press("Tab");

  const focusedControl = page.locator(":focus");
  await expect(focusedControl).toHaveRole("button");
  await expect(focusedControl).toHaveCSS("outline-style", "solid");
  await page.keyboard.press("Enter");
  await expect(page.locator(".site-content")).toBeVisible();
});
