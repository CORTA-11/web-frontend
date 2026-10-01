import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

const inputTime = (date: Date) =>
  new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);

const nextUtcMondayAt = (hour: number) => {
  const now = new Date();
  const daysUntilMonday = ((8 - now.getUTCDay()) % 7) || 7;
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, hour));
  return inputTime(date);
};

test("an admin approves a pending resource request", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: /Requests/ }).click();

  const row = page.getByRole("row", { name: /Batch 05 acquisition/ });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row).toContainText("Approved");
});

test("a team leader requests a slot", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: "Inventory" }).click();

  await page
    .getByRole("row", { name: /A100 node 2/ })
    .getByRole("button", { name: "Request" })
    .click();
  await page.getByLabel("From").fill(nextUtcMondayAt(10));
  await page.getByRole("textbox", { name: "To" }).fill(nextUtcMondayAt(12));
  await page.getByLabel("Purpose").fill("Overnight segmentation batch 05");
  await page.getByRole("button", { name: "Send request" }).click();

  await expect(page.getByText("Request submitted for approval")).toBeVisible();
});

test("schedule shows only the resource selected by its inventory tag", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await expect(page.locator(".rbc-calendar")).toHaveCount(0);
  await page.getByRole("tab", { name: "Inventory" }).click();
  const row = page.getByRole("row", { name: /A100 node 2/ });
  const tag = (await row.getByRole("cell").nth(2).innerText()).trim();
  await page.getByRole("tab", { name: "Schedule" }).click();
  await page.getByLabel("Resource tag").selectOption(tag);
  await expect(page.locator(".rbc-calendar")).toBeVisible();
  await expect(page.getByText("A100 node 2", { exact: true })).toBeVisible();
  await expect(page.locator(".rbc-time-header-content .rbc-header")).toHaveCount(1);
  await expect(page.locator(".rbc-background-event").first()).toBeVisible();
});

test("organisation settings offer a display-only timezone preference", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Time zone", { exact: true }).selectOption("Asia/Colombo");
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await expect(page.getByText("Asia/Colombo", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Asia/Colombo", { exact: true })).toBeVisible();
});

test("inventory reveals availability only after clicking Available times", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Time zone", { exact: true }).selectOption("Asia/Colombo");
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: "Inventory" }).click();
  const row = page.getByRole("row", { name: /A100 node 2/ });
  await expect(row).not.toContainText("2:30");
  await row.getByRole("button", { name: "Available times for A100 node 2" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Asia/Colombo");
  await expect(dialog.getByRole("listitem")).toHaveCount(5);
  await expect(dialog.getByRole("listitem").first()).toContainText("Mon 1:30 PM–Tue 3:30 AM");
  await expect(dialog).not.toContainText("UTC");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
});

test("a disabled resource cannot be requested", async ({ page }) => {
  await signIn(page, ACCOUNTS.leader);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("navigation").getByRole("link", { name: "Resources" }).click();
  await page.getByRole("tab", { name: "Inventory" }).click();

  const row = page.getByRole("row", { name: /Seminar room 2.14/ });
  await expect(row).toContainText("Disabled");
  await expect(row.getByRole("button", { name: "Request" })).toHaveCount(0);
});
