import { expect, test } from "@playwright/test";
import { ACCOUNTS } from "./helpers";

test("signup only offers normal account registration without organisation fields", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create an account", exact: true })).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(0);
  await expect(page.getByText("Join organisation", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Create organisation", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Organisation ID", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Organisation name", { exact: true })).toHaveCount(0);
  await expect(page.locator("input")).toHaveCount(3);
  await page.getByLabel("Full name", { exact: true }).fill("Normal Signup User");
  await page.getByLabel("Email", { exact: true }).fill("signup@example.com");
  await page.getByLabel("Password", { exact: true }).fill("synodus-demo-password");
  const request = page.waitForRequest((request) => request.method() === "POST" && request.url().endsWith("/auth/register"));
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  expect((await request).postDataJSON()).toEqual({
    name: "Normal Signup User", email: "signup@example.com", password: "synodus-demo-password", mode: "individual",
  });
  await expect(page).toHaveURL(/\/orgs$/);
  await expect(page.getByText("No organisations yet", { exact: true })).toBeVisible();
});

test("normal signup retains name and password validation", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("A");
  await page.getByLabel("Email", { exact: true }).fill("signup@example.com");
  await page.getByLabel("Password", { exact: true }).fill("short");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByText("Enter your full name", { exact: true })).toBeVisible();
  await expect(page.getByText("Use at least 8 characters", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/register$/);
});

test("normal signup shows duplicate-account errors and keeps sign-in available", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel("Full name", { exact: true }).fill("Existing User");
  await page.getByLabel("Email", { exact: true }).fill(ACCOUNTS.member);
  await page.getByLabel("Password", { exact: true }).fill("synodus-demo-password");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.locator("form").getByRole("alert")).toContainText("That email is already registered");
  await page.getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
});
