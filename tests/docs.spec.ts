import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("creates a document and returns to the catalog", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");

  await page.getByRole("button", { name: "New document" }).click();
  await expect(page).toHaveURL(/\/docs\/d-/);

  await expect(page.getByLabel("Document title")).toBeEditable();

  await page.getByRole("link", { name: "All documents" }).click();
  await expect(page.getByRole("link", { name: "Untitled document" }).first()).toBeVisible();
});

test("only a team leader can delete a document", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");
  await expect(page.getByRole("button", { name: /^Delete / })).toHaveCount(0);

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();

  await signIn(page, ACCOUNTS.leader);
  await openTeam(page, "Neural Imaging", "Documents");
  await expect(page.getByRole("button", { name: /^Delete / }).first()).toBeVisible();
});
