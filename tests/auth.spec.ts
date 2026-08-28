import { expect, test } from "@playwright/test";
import { auth, json, org, problem, sessionRoute } from "./fixtures";

test("unauthenticated bootstrap redirects to login", async ({ page }) => {
  await page.route("**/api/v1/auth/session", (route) => json(route, problem(401, "Authentication is required."), 401));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("login sends the contract body and always opens the chooser", async ({ page }) => {
  let body: unknown;
  await page.route("**/api/v1/auth/session", (route) => json(route, problem(401, "Authentication is required."), 401));
  await page.route("**/api/v1/auth/login", async (route) => {
    body = route.request().postDataJSON();
    await json(route, auth);
  });
  await page.route("**/api/v1/orgs?**", (route) => json(route, { items: [org], next_cursor: null, previous_cursor: null }));
  await page.goto("/login");
  await page.getByLabel("Email").fill("researcher@example.com");
  await page.getByLabel("Password").fill("correct password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/orgs$/);
  expect(body).toEqual({ email: "researcher@example.com", password: "correct password" });
});

test("reload restores CSRF and mutations and logout send it", async ({ page }) => {
  await sessionRoute(page);
  let createHeader: string | null = null;
  let logoutHeader: string | null = null;
  await page.route("**/api/v1/orgs?**", (route) => json(route, { items: [], next_cursor: null, previous_cursor: null }));
  await page.route("**/api/v1/orgs", async (route) => {
    createHeader = route.request().headers()["x-csrf-token"] ?? null;
    await json(route, org, 201);
  });
  await page.goto("/orgs");
  await page.reload();
  await page.getByLabel("Organization name").fill("Applied Systems Lab");
  await page.getByRole("button", { name: "Create", exact: true }).click();
  await expect.poll(() => createHeader).toBe("csrf-test-token");
  await page.route("**/api/v1/auth/session", async (route) => {
    if (route.request().method() === "DELETE") {
      logoutHeader = route.request().headers()["x-csrf-token"] ?? null;
      await route.fulfill({ status: 204 });
    } else await json(route, auth);
  });
  await page.getByRole("button", { name: "Open profile menu" }).click();
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect(logoutHeader).toBe("csrf-test-token");
});
