import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("creates a document, writes in it and autosaves", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Documents");

  await page.getByRole("button", { name: "New document" }).click();
  await expect(page).toHaveURL(/\/docs\/d-/);

  await page.getByLabel("Document title").fill("Calibration log — week 34");
  await page.getByLabel("Document title").blur();

  const body = page.locator(".doc-body");
  await body.click();
  await body.pressSequentially("Objective swapped on Tuesday, recalibrated Wednesday morning.");

  await expect(page.getByText(/Saved at/)).toBeVisible();

  await page.getByRole("link", { name: "All documents" }).click();
  await expect(page.getByRole("link", { name: "Calibration log — week 34" })).toBeVisible();
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
