import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test.use({ timezoneId: "Asia/Colombo" });

test("time zone defaults to the device, updates dates, and persists across reloads", async ({ page }) => {
  await signIn(page, ACCOUNTS.admin);
  await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  await page.getByRole("button", { name: "Account menu" }).click();
  const selector = page.getByRole("combobox", { name: "Time zone", exact: true });
  await expect(selector).toHaveValue("Asia/Colombo");
  await selector.selectOption("America/New_York");
  await expect(selector).toHaveValue("America/New_York");
  await page.keyboard.press("Escape");
  await page.getByRole("navigation").getByRole("link", { name: "Resources", exact: true }).click();
  await expect(page.getByText("Time zone: America/New_York", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Time zone: America/New_York", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Account menu" }).click();
  await expect(selector).toHaveValue("America/New_York");
  await selector.selectOption("UTC");
  await page.keyboard.press("Escape");
  await expect(page.getByText("Time zone: UTC", { exact: true })).toBeVisible();
});
