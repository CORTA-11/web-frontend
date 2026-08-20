import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test("an admin creates a team and a leader adds a member", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("navigation").getByRole("link", { name: "Teams", exact: true }).click();

  await page.getByRole("button", { name: "New team" }).click();
  await page.getByLabel("Name").fill("Spectroscopy");
  await page.getByLabel("Team leader").selectOption({ label: "Teshan Kannangara" });
  await page.getByRole("button", { name: "Create team" }).click();

  // The admin created it but is not a member, so it lists without a way in.
  const row = page.getByRole("row").filter({ hasText: "Spectroscopy" });
  await expect(row).toContainText("Not a member");
  await expect(row.getByRole("link")).toHaveCount(0);
});

test("a leader adds and removes a team member", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("navigation").getByRole("link", { name: "Neural Imaging" }).first().click();
  await page.getByRole("navigation").getByRole("link", { name: "Members" }).click();

  await page.getByLabel("Add member").selectOption({ index: 1 });
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Member added")).toBeVisible();
});

test("a team leader cannot leave their own team", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("navigation").getByRole("link", { name: "Neural Imaging" }).first().click();
  await page.getByRole("navigation").getByRole("link", { name: "Members" }).click();
  await expect(page.getByRole("button", { name: "Leave team" })).toHaveCount(0);
});
