import { expect, type Page } from "@playwright/test";

export const ACCOUNTS = {
  admin: "admin@aratuwa.edu",
  leader: "leader@aratuwa.edu",
  member: "member@aratuwa.edu",
  platform: "platform@corta.dev",
};

export async function signIn(page: Page, email: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("synodus-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/orgs(?:\/|$)/);
}

export async function openTeam(page: Page, team: string, section: string) {
  if (page.url().endsWith("/orgs")) {
    await page.getByRole("link", { name: /Aratuwa Research Lab/ }).click();
  }
  await page.getByRole("navigation").getByRole("link", { name: team }).first().click();
  await page.getByRole("navigation").getByRole("link", { name: section, exact: true }).click();
}
