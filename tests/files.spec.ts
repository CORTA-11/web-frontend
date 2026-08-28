import { readFileSync } from "node:fs";
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
  await expect(
    page.getByRole("cell", { name: "Encrypted, batch05-notes.txt", exact: true })
  ).toBeVisible();
});

test("seals a file on upload and opens it again on download", async ({ page }) => {
  const contents = "z-offset corrected at slice 60";
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");

  await page.setInputFiles('input[type="file"]', {
    name: "sealed-notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(contents),
  });
  await expect(page.getByText("1 file uploaded")).toBeVisible();

  const row = page.getByRole("row").filter({ hasText: "sealed-notes.txt" });
  await expect(row.getByRole("cell", { name: /^Encrypted/ })).toBeVisible();
  // What the shelf holds is the envelope, not the 30 plaintext bytes: 7 header
  // + 10 for "text/plain" + 12 IV + 30 contents + 16 GCM tag.
  await expect(row).toContainText("75 B");

  const started = page.waitForEvent("download");
  await row.getByRole("button", { name: /^Download/ }).click();
  const download = await started;
  expect(readFileSync(await download.path(), "utf8")).toBe(contents);
});

test("downloads a file that was stored before encryption existed", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");

  const row = page.getByRole("row").filter({ hasText: "segmentation-params.json" });
  const started = page.waitForEvent("download");
  await row.getByRole("button", { name: /^Download/ }).click();
  const download = await started;

  expect(readFileSync(await download.path(), "utf8")).toContain("segmentation-params.json");
});

test("a member cannot delete someone else's upload", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await openTeam(page, "Neural Imaging", "Files");

  const theirs = page.getByRole("row").filter({ hasText: "lsm900-calibration-2026-08.pdf" });
  await expect(theirs.getByRole("button", { name: /^Delete/ })).toHaveCount(0);

  const mine = page.getByRole("row").filter({ hasText: "segmentation-params.json" });
  await expect(mine.getByRole("button", { name: /^Delete/ })).toHaveCount(1);
});
