import { expect, test, type Page } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

async function navigation(page: Page) {
  if ((page.viewportSize()?.width ?? 1280) < 1024) {
    await page.getByRole("button", { name: "Open navigation" }).click();
  }
  return page.getByRole("navigation", { name: "Main" });
}

for (const viewport of [
  { name: "desktop", width: 1280, height: 600 },
  { name: "mobile", width: 390, height: 650 },
]) {
  test(`${viewport.name}: organisation and team tours are replayable and do not navigate`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await signIn(page, ACCOUNTS.leader);
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
    let nav = await navigation(page);
    await expect(page).toHaveURL(/\/orgs\/[^/]+$/);
    const url = page.url();
    await nav.getByRole("button", { name: "Guided tour" }).click();
    const tour = page.getByTestId("guided-tour");
    await expect(tour.getByText("Step 1 of 4")).toBeVisible();
    const firstTarget = viewport.name === "desktop"
      ? page.getByRole("button", { name: /^Select organisation:/ })
      : nav.locator('[data-tour="workspace"]');
    await expect(firstTarget).toHaveAttribute("data-tour-active", "true");
    if (viewport.name === "desktop") {
      await expect(nav.locator('[data-tour="workspace"]')).not.toHaveAttribute("data-tour-active", "true");
      const bounds = await tour.boundingBox();
      const targetBounds = await firstTarget.boundingBox();
      expect(bounds!.y).toBeGreaterThan(targetBounds!.y + targetBounds!.height);
    }
    await expect(tour.getByRole("button", { name: "Back", exact: true })).toBeDisabled();
    await tour.getByRole("button", { name: "Next", exact: true }).click();
    await expect(nav.getByRole("link", { name: "Overview", exact: true })).toHaveAttribute("data-tour-active", "true");
    await tour.getByRole("button", { name: "Back", exact: true }).click();
    await expect(tour.getByText("Step 1 of 4")).toBeVisible();
    await tour.getByRole("button", { name: "Skip", exact: true }).click();
    await expect(tour).toHaveCount(0);
    await expect(nav.locator('[data-tour-active]')).toHaveCount(0);
    await nav.getByRole("button", { name: "Guided tour" }).click();
    await expect(tour.getByText("Step 1 of 4")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(tour).toHaveCount(0);
    await expect(page).toHaveURL(url);
    await nav.getByRole("link", { name: /Neural Imaging/ }).click();
    nav = await navigation(page);
    await expect(page).toHaveURL(/\/board$/);
    const teamUrl = page.url();
    await nav.getByRole("button", { name: "Guided tour" }).click();
    await expect(tour.getByText("Step 1 of 8")).toBeVisible();
    for (const label of ["Board", "Chat", "Documents", "Files", "Members", "AI inbox", "Team settings"]) {
      await tour.getByRole("button", { name: "Next", exact: true }).click();
      await expect(nav.getByRole("link", { name: label, exact: true })).toHaveAttribute("data-tour-active", "true");
    }
    await tour.getByRole("button", { name: "Finish", exact: true }).click();
    await expect(tour.getByText("You're ready", { exact: true })).toBeVisible();
    await expect(tour.getByText(/Replay this tour anytime/)).toBeVisible();
    await tour.getByRole("button", { name: "Done", exact: true }).click();
    await expect(nav.locator('[data-tour-active]')).toHaveCount(0);
    await expect(page).toHaveURL(teamUrl);
  });
}

test("organisation administrators see administration steps", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  const nav = await navigation(page);
  await nav.getByRole("button", { name: "Guided tour" }).click();
  const tour = page.getByTestId("guided-tour");
  await expect(tour.getByText("Step 1 of 6")).toBeVisible();
  for (let i = 0; i < 4; i++) await tour.getByRole("button", { name: "Next", exact: true }).click();
  await expect(nav.getByRole("link", { name: "People", exact: true })).toHaveAttribute("data-tour-active", "true");
  await tour.getByRole("button", { name: "Next", exact: true }).click();
  await expect(nav.getByRole("link", { name: "Settings", exact: true })).toHaveAttribute("data-tour-active", "true");
});

test("members do not see team settings in their tour", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  const nav = await navigation(page);
  await nav.getByRole("link", { name: /Neural Imaging/ }).click();
  await expect(nav.getByRole("link", { name: "Board", exact: true })).toBeVisible();
  await nav.getByRole("button", { name: "Guided tour" }).click();
  await expect(page.getByTestId("guided-tour").getByText("Step 1 of 7")).toBeVisible();
  await expect(nav.getByRole("link", { name: "Team settings", exact: true })).toHaveCount(0);
});

test("non-members are guided back rather than shown private team features", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.goto("/orgs/8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40/teams/b21c7f04-3e58-4a19-8d6c-2f9a01e4c773/board");
  await expect(page.getByText(/This team.*workspace is private/)).toBeVisible();
  const nav = await navigation(page);
  await nav.getByRole("button", { name: "Guided tour" }).click();
  const tour = page.getByTestId("guided-tour");
  await expect(tour.getByText("Step 1 of 2")).toBeVisible();
  await tour.getByRole("button", { name: "Next", exact: true }).click();
  await expect(tour.getByText("A members-only workspace", { exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Back to organisation" })).toHaveAttribute("data-tour-active", "true");
});
