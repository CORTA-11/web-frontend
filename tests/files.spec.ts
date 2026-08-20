import { expect, test } from "@playwright/test";
import { ACCOUNTS, openTeam, signIn } from "./helpers";

test("uploads a file and lists it", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");

  await page.setInputFiles('input[type="file"]', {
    name: "batch05-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("z-offset corrected at slice 60"),
  });

  await expect(page.getByText("1 file uploaded")).toBeVisible();
  await expect(page.getByRole("cell", { name: "batch05-notes.txt", exact: true })).toBeVisible();
});

test("a member cannot delete someone else's upload", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");

  const theirs = page.getByRole("row").filter({ hasText: "lsm900-calibration-2026-08.pdf" });
  await expect(theirs.getByRole("button", { name: /^Delete/ })).toHaveCount(0);

  const mine = page.getByRole("row").filter({ hasText: "segmentation-params.json" });
  await expect(mine.getByRole("button", { name: /^Delete/ })).toHaveCount(1);
});
