import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test("an admin approves a pending resource request", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: /Requests/ }).click();

  const row = page.getByRole("row", { name: /Batch 05 acquisition/ });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row).toContainText("approved");
});

test("a team leader requests a slot", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: "Inventory" }).click();

  await page
    .getByRole("row", { name: /A100 node 2/ })
    .getByRole("button", { name: "Request" })
    .click();
  await page.getByLabel("Purpose").fill("Overnight segmentation batch 05");
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(page.getByText("Request submitted for approval")).toBeVisible();
});

test("a disabled resource cannot be requested", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: "Inventory" }).click();

  const row = page.getByRole("row", { name: /Seminar room 2.14/ });
  await expect(row).toContainText("Disabled");
  await expect(row.getByRole("button", { name: "Request" })).toHaveCount(0);
});
