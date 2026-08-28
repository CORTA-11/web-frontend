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

test("registration sends only the contract body, authenticates, and opens the chooser", async ({ page }) => {
  let body: unknown;
  await page.route("**/api/v1/auth/session", (route) => json(route, problem(401, "Authentication is required."), 401));
  await page.route("**/api/v1/auth/register", async (route) => {
    body = route.request().postDataJSON();
    await json(route, auth, 201);
  });
  await page.route("**/api/v1/orgs?**", (route) => json(route, { items: [], next_cursor: null, previous_cursor: null }));
  await page.goto("/register");
  await page.getByLabel("Display name").fill(" Researcher ");
  await page.getByLabel("Email").fill(" researcher@example.com ");
  await page.getByLabel("Password", { exact: true }).fill("correct password value");
  await page.getByLabel("Confirm password").fill("correct password value");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/orgs$/);
  expect(body).toEqual({ display_name: "Researcher", email: "researcher@example.com", password: "correct password value" });
});

test("registration rejects mismatched passwords without an API request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/v1/auth/session", (route) => json(route, problem(401, "Authentication is required."), 401));
  await page.route("**/api/v1/auth/register", (route) => { calls += 1; return route.abort(); });
  await page.goto("/register");
  await page.getByLabel("Display name").fill("Researcher");
  await page.getByLabel("Email").fill("researcher@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correct password value");
  await page.getByLabel("Confirm password").fill("different password value");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("Passwords do not match.")).toBeVisible();
  expect(calls).toBe(0);
});

test("registration shows backend field violations and auth pages cross-link", async ({ page }) => {
  await page.route("**/api/v1/auth/session", (route) => json(route, problem(401, "Authentication is required."), 401));
  await page.route("**/api/v1/auth/register", (route) => json(route, {
    ...problem(409, "The request conflicts with current state."),
    violations: [{ field: "email", code: "already_exists", message: "An account with this email already exists." }],
  }, 409));
  await page.goto("/register");
  await expect(page.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
  await page.getByLabel("Display name").fill("Researcher");
  await page.getByLabel("Email").fill("researcher@example.com");
  await page.getByLabel("Password", { exact: true }).fill("correct password value");
  await page.getByLabel("Confirm password").fill("correct password value");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByText("An account with this email already exists.")).toBeVisible();
  await page.goto("/login");
  await expect(page.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/register");
});

test("authenticated visitors are redirected away from registration", async ({ page }) => {
  await sessionRoute(page);
  await page.route("**/api/v1/orgs?**", (route) => json(route, { items: [], next_cursor: null, previous_cursor: null }));
  await page.goto("/register");
  await expect(page).toHaveURL(/\/orgs$/);
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
