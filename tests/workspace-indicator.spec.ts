import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

async function navigation(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  return page.getByRole("navigation", { name: "Main" });
}

for (const width of [1440, 390]) {
  test(`${width}px: current organisation and team remain visible as workspace context changes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, ACCOUNTS.member);
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
    const header = page.getByRole("banner");
    const org = header.getByRole("group", { name: "Current organisation", exact: true });
    const team = header.getByRole("group", { name: "Current team", exact: true });
    await expect(org).toContainText("Aratuwa Research Lab");
    await expect(team).toContainText("No team selected");
    await (await navigation(page)).getByRole("link", { name: "Neural Imaging" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Board");
    await expect(team).toContainText("Neural Imaging");
    await expect(team).toBeVisible();
    await expect(org).toBeVisible();
    await (await navigation(page)).getByRole("link", { name: "Back to organisation" }).click();
    await expect(team).toContainText("No team selected");
    await (await navigation(page)).getByRole("link", { name: "Protein Dynamics" }).click();
    await expect(team).toContainText("Protein Dynamics");
    await page.reload();
    await expect(team).toContainText("Protein Dynamics");
    await expect(org).toContainText("Aratuwa Research Lab");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/workspace-indicator-${width}.png` });
  });
}

test("long team names update in the indicator without overflowing a narrow header", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await (await navigation(page)).getByRole("link", { name: "Neural Imaging" }).click();
  await (await navigation(page)).getByRole("link", { name: "Team settings", exact: true }).click();
  const name = "Neural Imaging and Advanced Multidisciplinary Research Collaboration";
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  const team = page.getByRole("banner").getByRole("group", { name: "Current team", exact: true });
  await expect(team.getByText(name, { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(team.getByText(name, { exact: true })).toHaveAttribute("title", name);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  const bounds = await team.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
});

test("an inaccessible team does not expose a team name in the workspace indicator", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.goto("/orgs/8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40/teams/b21c7f04-3e58-4a19-8d6c-2f9a01e4c773/board");
  const team = page.getByRole("banner").getByRole("group", { name: "Current team", exact: true });
  await expect(team).toContainText("Team unavailable");
  await expect(team).not.toContainText("Neural Imaging");
  await team.getByRole("button", { name: /Select team/ }).click();
  await expect(page.getByRole("menuitem", { name: "Neural Imaging", exact: true })).toHaveCount(0);
  await expect(page.getByText("You are not in a team yet.", { exact: true })).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`${width}px: teams can be selected from the adjacent header dropdown`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await signIn(page, ACCOUNTS.member);
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
    const header = page.getByRole("banner");
    const team = header.getByRole("group", { name: "Current team", exact: true });
    const trigger = team.getByRole("button", { name: /Select team/ });
    await trigger.click();
    await page.getByRole("menuitem", { name: "Neural Imaging", exact: true }).click();
    await expect(page).toHaveURL(/\/teams\/b21c7f04-3e58-4a19-8d6c-2f9a01e4c773\/board$/);
    await expect(team).toContainText("Neural Imaging");
    if (width >= 640) {
      const orgBounds = await header.getByRole("group", { name: "Current organisation", exact: true }).boundingBox();
      const teamBounds = await team.boundingBox();
      if (!orgBounds || !teamBounds) throw new Error("Workspace indicators are not visible");
      expect(teamBounds.x - orgBounds.x - orgBounds.width).toBeLessThanOrEqual(24);
    }
    await trigger.click();
    await expect(page.getByRole("menuitem", { name: "Neural Imaging", exact: true })).toHaveAttribute("aria-disabled", "true");
    const option = page.getByRole("menuitem", { name: "Protein Dynamics", exact: true });
    await option.hover();
    await expect(option).toHaveCSS("background-color", "rgb(15, 102, 104)");
    await expect(option.locator("span").first()).toHaveCSS("color", "rgb(255, 255, 255)");
    await option.press("Enter");
    await expect(page).toHaveURL(/\/teams\/c93a5d18-7b26-4e30-91af-6c04d2b85e19\/board$/);
    await expect(team).toContainText("Protein Dynamics");
    await trigger.click();
    await page.getByRole("menuitem", { name: "Organisation overview", exact: true }).click();
    await expect(team).toContainText("No team selected");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `test-results/workspace-switcher-${width}.png` });
  });
}
