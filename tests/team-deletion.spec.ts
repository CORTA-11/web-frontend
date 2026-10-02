import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test.setTimeout(90_000);

test("team admin confirms deletion in settings and returns to teams", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await openTeam(page, "Neural Imaging", "Team settings");
  await page.getByRole("button", { name: "Delete team", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Delete Neural Imaging?" })).toBeVisible();
  await expect(dialog).not.toContainText(/soft.delete/i);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole("button", { name: "Delete team", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete team", exact: true }).click();
  await expect(page).toHaveURL(/\/teams$/);
  await expect(page.getByRole("row").filter({ hasText: "Neural Imaging" })).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("link", { name: "Neural Imaging", exact: true })).toHaveCount(0);
});

test("org admin deletes a team from the teams tab without joining it", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Teams", exact: true }).click();
  const row = page.getByRole("row").filter({ hasText: "Neural Imaging" });
  await expect(row).toContainText("Not a member");
  await row.getByRole("button", { name: "Actions for Neural Imaging" }).click();
  await page.getByRole("menuitem", { name: "Delete team" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete team", exact: true }).click();
  await expect(row).toHaveCount(0);
});

test("ordinary member has no deletion controls and cannot delete through the API", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Chat");
  await expect(page).toHaveURL(/\/chat$/);
  const teamId = page.url().split("/teams/")[1].split("/")[0];
  const status = await page.evaluate(async (id) => {
    const response = await fetch(`/api/teams/${id}`, { method: "DELETE", credentials: "include" });
    return response.status;
  }, teamId);
  expect(status).toBe(403);
  await page.goto(page.url().replace(/\/chat$/, "/settings"));
  await expect(page.getByText("Only the team admin can access these settings.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Delete team" })).toHaveCount(0);
});
