import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

const TEAM_SETTINGS = "/orgs/8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40/teams/b21c7f04-3e58-4a19-8d6c-2f9a01e4c773/settings";

test("team details are managed in settings, not in the member roster", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await openTeam(page, "Neural Imaging", "Members");
  await expect(page.getByLabel("Add member", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Description", { exact: true })).toHaveCount(0);
  await page.getByRole("navigation").getByRole("link", { name: "Team settings", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Team details", exact: true })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Neural Imaging");
  await expect(page.getByLabel("Endpoint", { exact: true })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Imaging Research");
  await page.getByLabel("Description", { exact: true }).fill("Updated team description");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("Team updated", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Save changes", exact: true })).toBeDisabled();
  await expect(page.getByRole("navigation").getByText("Imaging Research", { exact: true })).toBeVisible();
  await page.getByRole("navigation").getByRole("link", { name: "Members", exact: true }).click();
  await expect(page.getByLabel("Add member", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Description", { exact: true })).toHaveCount(0);
  await page.getByRole("navigation").getByRole("link", { name: "Team settings", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Imaging Research");
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue("Updated team description");
});

for (const role of ["member", "admin"] as const) {
  test(`${role} cannot access team details through the settings URL`, async ({ page }) => {
    await signIn(page, ACCOUNTS[role]);
    await page.goto(TEAM_SETTINGS);
    await expect(page.getByText("Only the team admin can access these settings.")).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Description", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("API token", { exact: true })).toHaveCount(0);
  });
}
