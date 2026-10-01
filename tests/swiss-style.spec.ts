import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

async function expectFlatSurfaces(page: Page) {
  const violations = await page.evaluate(() => {
    return [...document.querySelectorAll("body *")].flatMap((element) => {
      if (!element.getClientRects().length) return [];
      const style = getComputedStyle(element);
      const issues = [
        style.borderRadius !== "0px" && "radius",
        style.boxShadow !== "none" && "shadow",
        style.backdropFilter !== "none" && "backdrop",
        style.backgroundImage.includes("gradient") && "gradient",
      ].filter(Boolean);
      return issues.length ? [`${element.tagName}: ${issues.join(", ")}`] : [];
    });
  });
  expect(violations).toEqual([]);
}

async function openOverview(page: Page) {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Good to see you");
  await expect(page.getByText("Assigned to you", { exact: true }).first()).toBeVisible();
}

test("editorial overview and overlays use flat square surfaces", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openOverview(page);
  await expect(page.locator(".stat-strip")).toHaveCSS("border-top-width", "3px");
  await expect(page.locator(".stat-cell")).toHaveCount(4);
  await expect(page.locator(".stat-cell--highlight")).toHaveCSS("background-color", "rgb(15, 102, 104)");
  await expect(page.locator("h1")).toHaveCSS("font-weight", "900");
  await expect(page.locator("h1")).toHaveCSS("font-size", "24px");
  await expect(page.locator(".stat-cell [data-numeric]").first()).toHaveCSS("font-size", "32px");
  await expect(page.getByRole("heading", { name: "Assigned to you", exact: true })).toHaveCSS("font-size", "14px");
  await expect(page.locator("aside")).toHaveCSS("background-color", "rgb(11, 15, 20)");
  await expectFlatSurfaces(page);
  await page.screenshot({ path: "test-results/swiss-overview-desktop.png", fullPage: true });
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(page.getByRole("menuitem", { name: "Sign out" })).toBeVisible();
  await expectFlatSurfaces(page);
});

test("mobile overview stays within the viewport and navigation remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openOverview(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: "test-results/swiss-overview-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
  await expectFlatSurfaces(page);
  await page.getByRole("navigation").getByRole("link", { name: "Teams", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Teams");
});

test("populated overview lists have a complete frame and single row dividers", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  const section = page.locator("section").filter({ has: page.getByRole("heading", { name: "Assigned to you", exact: true }) });
  const list = section.locator(".overview-list");
  await expect(list.locator("li").first()).toBeVisible();
  for (const side of ["top", "right", "bottom", "left"]) {
    await expect(list).toHaveCSS(`border-${side}-width`, "1px");
    await expect(list).toHaveCSS(`border-${side}-style`, "solid");
  }
  await expect(list.locator("li").first()).toHaveCSS("border-top-width", "0px");
  await expect(list.locator("li").nth(1)).toHaveCSS("border-top-width", "1px");
  await expect(list.locator("li").last()).toHaveCSS("border-bottom-width", "0px");
  await expect(list.locator("li > a").first()).toHaveCSS("border-left-width", "0px");
});
