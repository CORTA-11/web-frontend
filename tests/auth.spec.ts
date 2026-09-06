import { expect, test } from "@playwright/test";
import { ACCOUNTS, signIn } from "./helpers";

test("signs a member in and out", async ({ page }) => {
  await signIn(page, ACCOUNTS.member);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Your organisations");

  await page.getByRole("button", { name: "Account menu" }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("rejects a wrong password with a readable message", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ACCOUNTS.admin);
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Invalid email or password")).toBeVisible();
});

test("sends a signed-out visitor to sign in", async ({ page }) => {
  await page.goto("/orgs/8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40/teams");
  await expect(page).toHaveURL(/\/login/);
});
