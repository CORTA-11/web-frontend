import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

async function openNavigation(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  return page.getByRole("navigation", { name: "Main" });
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 600 },
  { name: "mobile", width: 390, height: 650 },
]) {
  test(`${viewport.name}: team navigation replaces organisation navigation and supports returning`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signIn(page, ACCOUNTS.leader);
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
    let nav = await openNavigation(page);
    await expect(nav.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
    await nav.getByRole("link", { name: "Neural Imaging" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Board");
    nav = await openNavigation(page);
    await expect(nav.getByText("Neural Imaging", { exact: true })).toBeVisible();
    for (const name of ["Overview", "Teams", "Resources", "People", "Settings"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toHaveCount(0);
    }
    for (const name of ["Board", "Chat", "Documents", "Files", "Members", "AI inbox", "Team settings"]) {
      await expect(nav.getByRole("link", { name, exact: true })).toBeVisible();
    }
    await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
    expect(await nav.evaluate((element) => element.scrollHeight <= element.clientHeight)).toBe(true);
    if (viewport.name === "mobile") await page.keyboard.press("Escape");
    await page.reload();
    nav = await openNavigation(page);
    await expect(nav.getByRole("link", { name: "Back to organisation" })).toBeVisible();
    await nav.getByRole("link", { name: "Files", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Files");
    nav = await openNavigation(page);
    await expect(nav.getByRole("link", { name: "Files", exact: true })).toHaveAttribute("aria-current", "page");
    await nav.getByRole("link", { name: "Back to organisation" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Good to see you");
    nav = await openNavigation(page);
    await expect(nav.getByRole("link", { name: "Overview", exact: true })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Neural Imaging" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Chat", exact: true })).toHaveCount(0);
  });
}

test("non-members cannot gain team navigation from a direct team URL", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.goto("/orgs/8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40/teams/b21c7f04-3e58-4a19-8d6c-2f9a01e4c773/board");
  await expect(page.getByText(/This team.*workspace is private/)).toBeVisible();
  const nav = page.getByRole("navigation", { name: "Main" });
  await expect(nav.getByRole("link", { name: "Back to organisation" })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Board", exact: true })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: "Team settings", exact: true })).toHaveCount(0);
});
