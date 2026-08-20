import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("creates a task, edits it and deletes it", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");

  await page.getByRole("button", { name: "New task" }).click();
  await page.getByLabel("Title").fill("Verify z-offset on batch 05");
  await page.getByLabel("Priority").selectOption("high");
  await page.getByRole("button", { name: "Create task" }).click();

  const card = page.getByText("Verify z-offset on batch 05");
  await expect(card).toBeVisible();

  await card.click();
  await page.getByLabel("Title").fill("Verify z-offset on batch 06");
  await page.getByRole("button", { name: "Save task" }).click();
  await expect(page.getByText("Verify z-offset on batch 06")).toBeVisible();

  await page.getByText("Verify z-offset on batch 06").click();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Verify z-offset on batch 06")).toHaveCount(0);
});

test("moves a card between columns with the keyboard", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");

  const card = page.getByRole("button", { name: /Calibrate LSM900/ });
  await expect(card).toBeVisible();

  const inProgress = page.getByRole("region", { name: "In progress" });
  await expect(inProgress.getByRole("button", { name: /Calibrate LSM900/ })).toBeVisible();

  // dnd-kit needs a frame between pick-up, move and drop.
  await card.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowRight");
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");

  const review = page.getByRole("region", { name: "Review" });
  await expect(review.getByRole("button", { name: /Calibrate LSM900/ })).toBeVisible();
});

test("filters the board by assignee", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Board");

  await page.getByLabel("Assignee").selectOption({ label: "Assigned to me" });
  await expect(page.getByText("Calibrate LSM900 after objective swap")).toHaveCount(0);
  await expect(page.getByText("Re-run segmentation on 12 Aug stack")).toBeVisible();
});
