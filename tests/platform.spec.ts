import { expect, test } from "@playwright/test";
import { signIn } from "./helpers";

const OPERATOR = "platform@corta.dev";
const ORG = "8f1d2a60-4c7e-4f1a-9b23-0d5e6a7c1b40";

test("an operator lands on the platform console", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OPERATOR);
  await page.getByLabel("Password").fill("synodus-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Organisations");
});

test("an operator approves a pending organisation", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OPERATOR);
  await page.getByLabel("Password").fill("synodus-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin/);

  const row = page.getByRole("row").filter({ hasText: "Kelaniya Materials Lab" });
  await expect(row).toContainText("pending");
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(row).toContainText("active");
});

test("an operator cannot browse into a tenant", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(OPERATOR);
  await page.getByLabel("Password").fill("synodus-demo-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin/);

  await page.goto(`/orgs/${ORG}/teams`);
  await expect(page).toHaveURL(/\/admin/);
});

test("a member cannot open the platform console", async ({ page }) => {
  await signIn(page, "member@aratuwa.edu");
  await page.goto("/admin");
  await expect(page.getByText("This console is for platform operators")).toBeVisible();
});

test("a new organisation waits for approval before it can be used", async ({ page }) => {
  await page.goto("/register");
  await page.getByRole("tab", { name: "Create organisation" }).click();
  await page.getByLabel("Organisation name").fill("Jaffna Coastal Lab");
  await page.getByLabel("Full name").fill("Anusha Selvarajah");
  await page.getByLabel("Email").fill("anusha@jfn.ac.lk");
  await page.getByLabel("Password").fill("synodus-demo-password");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page.getByText("Waiting for platform approval")).toBeVisible();
});
