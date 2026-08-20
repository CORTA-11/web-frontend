import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("sends a message, mentions someone and replies", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Chat");

  const composer = page.getByRole("textbox", { name: "Message" });
  await composer.fill("Queued the segmentation run for tonight.");
  await composer.press("Enter");
  await expect(page.getByText("Queued the segmentation run for tonight.")).toBeVisible();

  await composer.pressSequentially("@Ravi");
  await page.getByRole("option", { name: /Ravindu/ }).click();
  await composer.pressSequentially("can you confirm the calibration file?");
  await composer.press("Enter");
  await expect(page.getByText("@Ravindu Jayasuriya")).toBeVisible();

  await page.getByRole("button", { name: /Reply to Teshan/ }).first().click();
  await expect(page.getByText("Replying to")).toBeVisible();
  await composer.fill("Noted, will be there.");
  await composer.press("Enter");
  await expect(page.getByText("Noted, will be there.")).toBeVisible();
});

test("a member can only delete their own messages", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Chat");

  const own = page.getByRole("article").filter({ hasText: "I will queue it on the A100 tonight" });
  await expect(own.getByRole("button", { name: "Delete message" })).toHaveCount(1);

  const other = page.getByRole("article").filter({ hasText: "Batch 04 finished overnight" });
  await expect(other.getByRole("button", { name: "Delete message" })).toHaveCount(0);
});
